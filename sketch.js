let objs = [];
// 使用半透明顏色，讓背景更具層次感
let colors = ['rgba(247, 23, 53, 0.8)', 'rgba(247, 208, 2, 0.8)', 'rgba(26, 83, 192, 0.8)', 'rgba(35, 35, 35, 0.8)'];

// ===== 標題動畫變數 =====
let titleAnimT = 0; // 動畫計時器
let titleAnimDuration = 120; // 動畫總時長 (影格數)

// 新增選單物件
let menu; 

function setup() {
    // 1. 關鍵修改：使用 windowWidth 和 windowHeight 創建全螢幕畫布
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    objs.push(new DynamicShape());

    // 實例化選單
    // ***** 修改：將選單項目改為物件陣列，以支援子選單和 URL *****
    let menuItems = [
        { label: "第一單元作品", url: 'https://diegohsieh0609-art.github.io/20251020/' },
        { label: "第一單元講義", url: 'https://hackmd.io/@bnL4ivPZRWiV3KHVjCq51Q/S17n8QCixg' },
        { label: "測驗區", url: 'https://diegohsieh0609-art.github.io/20251103/' },
        { label: "回到首頁", url: null }, // url: null 表示點擊後無動作
        {
            label: "淡江大學",
            url: 'https://www.tku.edu.tw/',
            submenu: [
                { label: "教育科技學系", url: 'https://hackmd.io/@bnL4ivPZRWiV3KHVjCq51Q/rkUCg-zxbx' }
            ]
        }
    ];
    menu = new SideMenu(menuItems);

    // 設置關閉按鈕和遮罩的事件監聽
    let closeButton = document.getElementById('closeButton');
    let overlay = document.getElementById('overlay');
    let container = document.getElementById('iframeContainer');
    
    // 關閉按鈕點擊事件
    closeButton.addEventListener('click', function() {
        container.style.display = 'none';
        overlay.style.display = 'none';
    });
    
    // 點擊遮罩時也關閉 iframe
    overlay.addEventListener('click', function() {
        container.style.display = 'none';
        overlay.style.display = 'none';
    });
}

function draw() {
    // 設置背景為黑色 (0) 並帶有拖影效果 (30)
    background(0, 30); 
    
    // 正常的圖形更新和繪製
    for (let i of objs) {
        i.run();
    }

    // 控制圖形的生成速度和數量
    if (frameCount % int(random([10, 25])) == 0) {
        let addNum = int(random(1, 5)); // 減少單次添加的數量以優化效能
        for (let i = 0; i < addNum; i++) {
            objs.push(new DynamicShape());
        }
    }
    
    // 刪除死亡的圖形
    for (let i = objs.length - 1; i >= 0; i--) {
        if (objs[i].isDead) {
            objs.splice(i, 1);
        }
    }

    // =========================================================================
    // 繪製中央標題文字
    // =========================================================================
    let titleSize = windowHeight / 10; // 設定文字大小為畫面高度的 1/10
    let startY = -titleSize; // 起始 Y 座標 (畫面頂部外)
    let endY = windowHeight / 2; // 結束 Y 座標 (畫面中央)

    // 計算動畫進度
    let animProgress = 0;
    if (titleAnimT < titleAnimDuration) {
        animProgress = easeOutBounce(titleAnimT / titleAnimDuration);
        titleAnimT++;
    } else {
        animProgress = 1;
    }
    let currentY = lerp(startY, endY, animProgress); // 使用 lerp 和 easing function 計算目前 Y 座標

    push();
    textAlign(CENTER, CENTER);
    textSize(titleSize);
    fill(255, 255, 0); // 使用鮮豔的黃色
    noStroke();
    text("謝智軒", windowWidth / 2, currentY - titleSize / 2); // 姓名文字
    text("414730886", windowWidth / 2, currentY + titleSize / 2); // 學號文字
    pop();

    // 更新和繪製側邊選單
    menu.update();
    menu.display();
}

// 2. 當視窗大小改變時，重新調整畫布大小以保持全螢幕
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// 3. 處理滑鼠點擊 (用於選單選項)
function mouseClicked() {
    // 僅在選單展開時處理點擊
    if (menu) {
        menu.mouseClicked();
    }
}

// =========================================================================
// Easing 緩動函式
// =========================================================================

function easeInOutExpo(x) {
  return x === 0 ? 0 :
    x === 1 ?
    1 :
    x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 :
    (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.9375;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

// =========================================================================
// 動態圖形類別 (DynamicShape Class)
// =========================================================================

class DynamicShape {
  constructor() {
    // 關鍵修改：讓圖形可以在整個視窗範圍內隨機生成
    this.x = random(width); 
    this.y = random(height);
    this.reductionRatio = 1;
    this.shapeType = int(random(4));
    this.animationType = 0;
    this.maxActionPoints = int(random(3, 7)); // 增加壽命，讓動畫更明顯
    this.actionPoints = this.maxActionPoints;
    this.elapsedT = 0;
    this.size = 0;
    this.sizeMax = min(width, height) * random(0.01, 0.04); // 根據最小邊長設置最大尺寸
    this.fromSize = 0;
    this.init();
    this.isDead = false;
    // 顏色使用 CSS 顏色字串
    this.clr = random(colors); 
    this.changeShape = true;
    this.ang = int(random(2)) * PI * 0.25;
    this.lineSW = 0;
  }

  show() {
    push();
    translate(this.x, this.y);
    if (this.animationType == 1) scale(1, this.reductionRatio);
    if (this.animationType == 2) scale(this.reductionRatio, 1);
    
    // 由於顏色是 rgba 字串，p5.js 會正確處理
    fill(this.clr); 
    stroke(this.clr);
    strokeWeight(this.size * 0.05);
        
    if (this.shapeType == 0) {
      noStroke();
      circle(0, 0, this.size);
    } else if (this.shapeType == 1) {
      noFill();
      circle(0, 0, this.size);
    } else if (this.shapeType == 2) {
      noStroke();
      rect(0, 0, this.size, this.size);
    } else if (this.shapeType == 3) {
      noFill();
      rect(0, 0, this.size * 0.9, this.size * 0.9);
    } else if (this.shapeType == 4) {
      line(0, -this.size * 0.45, 0, this.size * 0.45);
      line(-this.size * 0.45, 0, this.size * 0.45, 0);
    }
    pop();
        
    strokeWeight(this.lineSW);
    stroke(this.clr);
    // 繪製線條 (只在移動動畫中顯示)
    line(this.x, this.y, this.fromX, this.fromY); 
  }

  move() {
    let n = easeInOutExpo(norm(this.elapsedT, 0, this.duration));
    if (0 < this.elapsedT && this.elapsedT < this.duration) {
      if (this.actionPoints == this.maxActionPoints) {
        this.size = lerp(0, this.sizeMax, n); // 首次出現：放大
      } else if (this.actionPoints > 0) {
        // 中間過程：移動、形狀改變或大小改變
        if (this.animationType == 0) {
          this.size = lerp(this.fromSize, this.toSize, n);
        } else if (this.animationType == 1) {
          this.x = lerp(this.fromX, this.toX, n); // 水平移動
          this.lineSW = lerp(0, this.size / 5, sin(n * PI));
        } else if (this.animationType == 2) {
          this.y = lerp(this.fromY, this.toY, n); // 垂直移動
          this.lineSW = lerp(0, this.size / 5, sin(n * PI));
        } else if (this.animationType == 3) {
          if (this.changeShape == true) {
            this.shapeType = int(random(5));
            this.changeShape = false;
          }
        }
        this.reductionRatio = lerp(1, 0.3, sin(n * PI)); // 擠壓/縮小效果
      } else {
        this.size = lerp(this.fromSize, 0, n); // 死亡前：縮小消失
      }
    }

    this.elapsedT++;
    if (this.elapsedT > this.duration) {
      this.actionPoints--;
      this.init();
    }
    if (this.actionPoints < 0) {
      this.isDead = true;
    }
  }

  run() {
    this.show();
    this.move();
  }

  init() {
    this.elapsedT = 0;
    this.fromSize = this.size;
    this.toSize = this.sizeMax * random(0.5, 1.5);
    this.fromX = this.x;
    // 放大移動範圍，使圖形可以向外擴散
    this.toX = this.fromX + (width / 5) * random([-1, 1]) * int(random(1, 3)); 
    this.fromY = this.y;
    // 放大移動範圍，使圖形可以向外擴散
    this.toY = this.fromY + (height / 5) * random([-1, 1]) * int(random(1, 3)); 
    this.animationType = int(random(4)); // 從 3 改為 4，包含形狀改變
    this.duration = random(30, 80); // 增加持續時間，使移動更慢、更平滑
    this.changeShape = true; // 確保每次 init 時都可以改變形狀
  }
}

// =========================================================================
// 側邊隱藏式選單類別 (SideMenu Class)
// =========================================================================

class SideMenu {
    constructor(items) {
        this.items = items;
        this.w = 250; // 選單寬度增加，以容納更大的字體
        this.h_item = 60; // ***** 修改：選項高度增加 *****
        this.x_hidden = -this.w; // 隱藏時的 X 座標
        this.x_visible = 0; // 顯示時的 X 座標
        this.currentX = this.x_hidden; // 當前 X 座標 (初始為隱藏)
        this.targetX = this.x_hidden; // 目標 X 座標
        this.hover_area = 20; // 觸發選單出現的左側區域寬度
        this.bgColor = color(35, 35, 35, 0); // ***** 修改：背景顏色透明 (alpha=0) *****
        this.itemColor = color(255); // 選項文字顏色 (白色)
        this.hoverColor = color(247, 23, 53, 180); // 懸停色 (稍微半透明，讓背景略微透出)
        this.easing = 0.1; // 緩動值

        // ***** 新增：子選單相關變數 *****
        this.activeSubmenu = null; // 當前顯示的子選單
        this.submenuVisible = false; // 子選單是否可見
        this.submenuFade = 0; // 用於子選單淡入淡出
        this.submenuTargetFade = 0; // 目標淡入值
        this.hoveredItemIndex = -1; // 當前懸停的主選單項目索引
        // ***** 新增：用於延遲隱藏子選單的計時器 *****
        this.hideSubmenuTimer = null;
        this.hideDelay = 100; // 100 毫秒的延遲
    }

    checkHover() {
        let isHoveringMenu = false;
        // 擴大懸停偵測區域，使其包含展開的子選單
        const menuWidth = this.submenuVisible ? this.w * 2 : this.w;
        if (mouseX < this.hover_area || mouseX < this.currentX + menuWidth) {
            this.targetX = this.x_visible;
            isHoveringMenu = true;
        } else {
            this.targetX = this.x_hidden;
            // 如果滑鼠完全離開選單區域，立即準備隱藏子選單
            this.submenuTargetFade = 0;
        }

        let wasHoveringSubmenuItem = this.hoveredItemIndex !== -1 && this.items[this.hoveredItemIndex]?.submenu;
        let isCurrentlyHoveringMainItem = false;

        if (isHoveringMenu && this.currentX > this.x_hidden + 1) {
            for (let i = 0; i < this.items.length; i++) {
                if (this.checkItemHover(i)) {
                    this.hoveredItemIndex = i;
                    isCurrentlyHoveringMainItem = true;
                    const item = this.items[i];
                    if (item.submenu) {
                        this.activeSubmenu = item.submenu;
                        this.submenuTargetFade = 255;
                        // 當滑鼠懸停在有子選單的主項目上時，清除隱藏計時器
                        clearTimeout(this.hideSubmenuTimer);
                    }
                    break;
                }
            }
            // 如果滑鼠不在任何主項目上
            if (!isCurrentlyHoveringMainItem) {
                // 但之前懸停的項目有子選單，且滑鼠目前也不在子選單上
                if (wasHoveringSubmenuItem && !this.isMouseOverSubmenu()) {
                    // 啟動計時器延遲隱藏
                    this.hideSubmenuTimer = setTimeout(() => {
                        this.submenuTargetFade = 0;
                    }, this.hideDelay);
                }
            }
        }
    }

    // ***** 新增：檢查滑鼠是否在子選單上 *****
    isMouseOverSubmenu() {
        if (!this.activeSubmenu || this.hoveredItemIndex === -1) {
            return false;
        }
        const itemY = this.hoveredItemIndex * this.h_item + 80;
        const submenuX = this.currentX + this.w;
        const submenuW = this.w;
        const submenuH = this.activeSubmenu.length * this.h_item;

        return (
            mouseX > submenuX &&
            mouseX < submenuX + submenuW &&
            mouseY > itemY &&
            mouseY < itemY + submenuH
        )
        if (isOver) {
            // 如果滑鼠在子選單上，清除隱藏計時器
            clearTimeout(this.hideSubmenuTimer);
        }
        return isOver;
    }

    update() {
        this.checkHover();
        // 使用 lerp 實現平滑的滑入/滑出動畫
        this.currentX = lerp(this.currentX, this.targetX, this.easing);
        // ***** 新增：更新子選單的淡入淡出效果 *****
        this.submenuFade = lerp(this.submenuFade, this.submenuTargetFade, this.easing * 2);
        this.submenuVisible = this.submenuFade > 1;
    }

    display() {
        push();
        translate(this.currentX, 0); // 移動整個選單

        // ***** 刪除：移除繪製選單背景的程式碼，使其透明 *****
        // noStroke();
        // fill(this.bgColor);
        // rect(0, 0, this.w, height);

        // 繪製選單選項
        textSize(32); // ***** 修改：文字大小改為 32 *****
        textAlign(LEFT, CENTER);
        
        for (let i = 0; i < this.items.length; i++) {
            let itemY = i * this.h_item + 80;
            let isHovering = this.checkItemHover(i);

            // 繪製選項背景 (滑鼠懸停效果)
            if (isHovering) {
                fill(this.hoverColor);
                // 為了讓懸停背景填滿整個選單寬度，我們將其繪製在這裡
                rect(0, itemY, this.w, this.h_item); 
                fill(255); // 懸停時文字保持白色，或改為 (0) 黑色，但這裡保持白色在半透明紅色上更清晰
            } else {
                noFill(); // 確保沒有填充顏色
            }
            
            // 繪製文字前的填充顏色
            fill(this.itemColor); 

            // 繪製選項文字
            text(this.items[i].label, 20, itemY + this.h_item / 2);
        }

        // ***** 新增：繪製子選單 *****
        if (this.activeSubmenu && this.submenuVisible && this.hoveredItemIndex !== -1) {
            const itemY = this.hoveredItemIndex * this.h_item + 80;
            const submenuX = this.w;

            push();
            translate(submenuX, itemY);

            // 繪製子選單選項
            for (let i = 0; i < this.activeSubmenu.length; i++) {
                const submenuItemY = i * this.h_item;
                const isHovering = this.checkSubmenuItemHover(i);

                // 懸停效果
                if (isHovering) {
                    fill(this.hoverColor);
                    rect(0, submenuItemY, this.w, this.h_item);
                }

                // 文字
                fill(this.itemColor.levels[0], this.itemColor.levels[1], this.itemColor.levels[2], this.submenuFade);
                text(this.activeSubmenu[i].label, 20, submenuItemY + this.h_item / 2);
            }

            pop();
        }

        pop();
    }
    
    // 檢查滑鼠是否在單個選項上
    checkItemHover(index) {
        // 考慮選單當前的位置
        let relativeMouseX = mouseX - this.currentX; 
        let itemY = index * this.h_item + 80;

        return (
            relativeMouseX > 0 &&
            relativeMouseX < this.w &&
            mouseY > itemY &&
            mouseY < itemY + this.h_item
        );
    }

    // ***** 新增：檢查滑鼠是否在子選單項目上 *****
    checkSubmenuItemHover(index) {
        if (!this.activeSubmenu || this.hoveredItemIndex === -1) {
            return false;
        }
        const itemY = this.hoveredItemIndex * this.h_item + 80;
        const submenuItemY = itemY + index * this.h_item;
        const submenuX = this.currentX + this.w;

        return (
            mouseX > submenuX &&
            mouseX < submenuX + this.w &&
            mouseY > submenuItemY &&
            mouseY < submenuItemY + this.h_item
        );
    }
    
    // 處理滑鼠點擊 (可選功能)
    mouseClicked() {
        let urlToOpen = null;

        // 檢查選單是否已展開 (currentX > 隱藏位置)
        if (this.currentX > this.x_hidden + 1) { 
            // 檢查主選單點擊
            for (let i = 0; i < this.items.length; i++) {
                if (this.checkItemHover(i)) {
                    const item = this.items[i];
                    if (item.url) {
                        urlToOpen = item.url;
                    } else if (!item.submenu) {
                        // 如果沒有 URL 且沒有子選單，則點擊後隱藏
                        this.targetX = this.x_hidden;
                    }
                    break;
                }
            }

            // ***** 新增：檢查子選單點擊 *****
            if (this.submenuVisible && this.activeSubmenu) {
                for (let i = 0; i < this.activeSubmenu.length; i++) {
                    if (this.checkSubmenuItemHover(i)) {
                        urlToOpen = this.activeSubmenu[i].url;
                        break;
                    }
                }
            }

            if (urlToOpen) {
                this.targetX = this.x_hidden; // 點擊後隱藏選單
                let container = document.getElementById('iframeContainer');
                let overlay = document.getElementById('overlay');
                let iframe = document.getElementById('contentFrame');
                iframe.src = urlToOpen;
                container.style.display = 'block';
                overlay.style.display = 'block';
            }
        }
    }
}