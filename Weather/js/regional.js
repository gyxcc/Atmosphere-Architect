/* ========================================
   模塊 2: 中國季風系統
   ======================================== */

// Canvas 和上下文
let regionalCanvas, regionalCtx;
let regionalAnimationId;

// 風粒子
let monsoonParticles = [];

// 地圖圖片
let chinaMapImage = null;
let mapImageLoaded = false;

// 根據月份計算季風強度
// 返回: { intensity: 0-1, particleCount: 數量, speedMultiplier: 速度倍率 }
function getMonsoonIntensity(month) {
    // 季風強度曲線（基於真實氣候數據）
    const intensityByMonth = {
        1:  0.7,   // 1月 - 冬季季風較強
        2:  0.6,   // 2月 - 冬季季風減弱
        3:  0.3,   // 3月 - 春季過渡，風力弱
        4:  0.35,  // 4月 - 春季過渡
        5:  0.5,   // 5月 - 夏季風開始建立
        6:  0.8,   // 6月 - 夏季風增強，梅雨季
        7:  1.0,   // 7月 - 夏季風最強
        8:  0.9,   // 8月 - 夏季風仍強
        9:  0.5,   // 9月 - 秋季過渡
        10: 0.4,   // 10月 - 秋季過渡
        11: 0.5,   // 11月 - 冬季風開始
        12: 0.65   // 12月 - 冬季季風
    };
    
    const intensity = intensityByMonth[month] || 0.5;
    
    return {
        intensity: intensity,
        particleCount: Math.floor(30 + intensity * 70),  // 30-100 個粒子
        speedMultiplier: 0.5 + intensity * 0.8           // 0.5-1.3 倍速度
    };
}

// 青藏高原區域定義 (相對坐標 0-1)
// 你可以調整這些坐標點來精調高原位置
const PLATEAU_REGION = {
    name: '青藏高原',
    // points: [[x, y], ...] - 相對坐標，0-1 範圍
    // 左上角為 (0,0)，右下角為 (1,1)
    points: [
        [0.10, 0.44],  // 左上
        [0.38, 0.44],  // 右上
        [0.40, 0.56],  // 右
        [0.32, 0.72],  // 右下
        [0.10, 0.54]   // 左下
    ],
    color: 'rgba(139, 90, 43, 0.4)',      // 填充顏色
    borderColor: 'rgba(205, 133, 63, 0.8)', // 邊框顏色
    elevation: 4500
};


// 季風粒子類
class MonsoonParticle {
    constructor(canvasWidth, canvasHeight, windDir, fromOcean, speedMultiplier = 1) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.fromOcean = fromOcean;
        this.speedMultiplier = speedMultiplier;
        this.reset(windDir);
    }
    
    reset(windDir) {
        const spd = this.speedMultiplier;
        
        // 根據風向設置起始位置
        if (windDir === 'SE') {
            // 夏季：從海洋（右下）吹向陸地（左上）
            this.x = this.canvasWidth * (0.7 + Math.random() * 0.3);
            this.y = this.canvasHeight * (0.5 + Math.random() * 0.5);
            this.vx = (-2 - Math.random()) * spd;
            this.vy = (-1 - Math.random() * 0.5) * spd;
        } else {
            // 冬季：從陸地（左上）吹向海洋（右下）
            this.x = this.canvasWidth * Math.random() * 0.4;
            this.y = this.canvasHeight * Math.random() * 0.5;
            this.vx = (2 + Math.random()) * spd;
            this.vy = (1 + Math.random() * 0.5) * spd;
        }
        
        this.life = 1;
        this.maxLife = 100 + Math.random() * 50;
        this.age = 0;
        this.size = 2 + Math.random() * 2;
        // 新增：風向角度
        this.windAngle = Math.atan2(this.vy, this.vx);
    }
    
    update(windDir, plateauActive) {
        // 基本移動
        this.x += this.vx;
        this.y += this.vy;
        
        // 更新風向角度
        this.windAngle = Math.atan2(this.vy, this.vx);
        
        // 青藏高原阻擋效果
        if (plateauActive) {
            const px = this.x / this.canvasWidth;
            const py = this.y / this.canvasHeight;
            
            // 檢測是否接近高原區域
            if (px > 0.15 && px < 0.45 && py > 0.3 && py < 0.65) {
                if (windDir === 'SE') {
                    // 夏季季風被高原阻擋/分流
                    this.vy -= 0.3; // 向上偏轉
                    this.vx *= 0.95;
                }
            }
        }
        
        this.age++;
        this.life = 1 - (this.age / this.maxLife);
        
        // 邊界檢測
        const outOfBounds = this.x < 0 || this.x > this.canvasWidth || 
                          this.y < 0 || this.y > this.canvasHeight;
        
        return !outOfBounds && this.age < this.maxLife;
    }
}

// 初始化模塊
function initRegionalModule() {
    console.log('🌏 初始化中國季風系統');
    
    regionalCanvas = document.getElementById('regional-canvas');
    if (!regionalCanvas) {
        console.error('找不到 regional-canvas');
        return;
    }
    
    regionalCtx = regionalCanvas.getContext('2d');
    
    // 設置 Canvas 大小
    regionalCanvas.width = 550;
    regionalCanvas.height = 450;
    
    // 載入地圖圖片
    loadMapImage();
    
    // 初始化粒子
    initMonsoonParticles();
    
    // 設置控制事件
    setupRegionalControls();
    
    // 設置懸浮提示
    setupTooltip();
    
    // 開始動畫
    startRegionalAnimation();
    
    // 更新數據
    updateRegionalData();
    
    console.log('✅ 中國季風系統初始化完成');
}

// 初始化季風粒子
function initMonsoonParticles() {
    monsoonParticles = [];
    const windDir = ClimateState.regional.windDirection;
    const month = ClimateState.regional.month;
    const { particleCount, speedMultiplier } = getMonsoonIntensity(month);
    
    for (let i = 0; i < particleCount; i++) {
        monsoonParticles.push(
            new MonsoonParticle(
                regionalCanvas.width, 
                regionalCanvas.height,
                windDir,
                Math.random() > 0.5,
                speedMultiplier
            )
        );
    }
}

// 設置控制面板
function setupRegionalControls() {
    const monthSlider = document.getElementById('month-slider');
    const plateauToggle = document.getElementById('plateau-toggle');
    
    if (monthSlider) {
        monthSlider.addEventListener('input', (e) => {
            ClimateState.regional.month = parseInt(e.target.value);
            // 更新滑桿旁的數值
            const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                               '7月', '8月', '9月', '10月', '11月', '12月'];
            const sliderValue = document.getElementById('month-slider-value');
            if (sliderValue) {
                sliderValue.textContent = monthNames[ClimateState.regional.month - 1];
            }
            updateRegionalData();
            updateMonthDisplay();
            // 重新初始化粒子（根據新月份調整數量和速度）
            initMonsoonParticles();
        });
    }
    
    if (plateauToggle) {
        plateauToggle.addEventListener('click', () => {
            ClimateState.regional.plateauActive = !ClimateState.regional.plateauActive;
            plateauToggle.classList.toggle('active', ClimateState.regional.plateauActive);
            updatePlateauEffect();
        });
    }
}

// 設置懸浮提示
function setupTooltip() {
    const tooltip = document.getElementById('map-tooltip');
    if (!tooltip || !regionalCanvas) return;
    
    regionalCanvas.addEventListener('mousemove', (e) => {
        const rect = regionalCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / regionalCanvas.width;
        const y = (e.clientY - rect.top) / regionalCanvas.height;
        
        // 找到懸停的區域
        const region = getRegionAtPoint(x, y);
        
        if (region) {
            const data = getRegionData(region, x, y);
            
            tooltip.innerHTML = `
                <div class="tooltip-title">${data.name}</div>
                <div class="tooltip-row">
                    <span class="tooltip-label">溫度</span>
                    <span class="tooltip-value ${data.tempClass}">${data.temp}°C</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">濕度</span>
                    <span class="tooltip-value ${data.humidClass}">${data.humidity}%</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">氣壓</span>
                    <span class="tooltip-value">${data.pressure}</span>
                </div>
            `;
            
            tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
            tooltip.classList.add('visible');
        } else {
            tooltip.classList.remove('visible');
        }
    });
    
    regionalCanvas.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });
}

// 判斷點在哪個區域
function getRegionAtPoint(x, y) {
    // 先檢查高原
    if (ClimateState.regional.plateauActive && isPointInPolygon(x, y, PLATEAU_REGION.points)) {
        return 'plateau';
    }
    // 檢查海洋 (右側區域)
    if (x > 0.7) {
        return 'ocean';
    }
    // 陸地
    return 'land';
}

// 點是否在多邊形內
function isPointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i][0], yi = points[i][1];
        const xj = points[j][0], yj = points[j][1];
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// 獲取區域數據
function getRegionData(region, x, y) {
    const { landTemp, seaTemp, humidity, windDirection } = ClimateState.regional;
    
    let name, temp, pressure;
    
    switch (region) {
        case 'ocean':
            name = '太平洋海域';
            temp = seaTemp;
            pressure = windDirection === 'SE' ? '高壓' : '低壓';
            break;
        case 'plateau':
            name = '青藏高原';
            temp = landTemp - 20; // 高原更冷
            pressure = '高壓';
            break;
        case 'land':
        default:
            name = '歐亞大陸';
            temp = landTemp;
            pressure = windDirection === 'SE' ? '低壓' : '高壓';
            break;
    }
    
    const tempClass = temp > 25 ? 'hot' : temp > 15 ? 'warm' : temp > 5 ? 'cool' : 'cold';
    const humidClass = humidity > 60 ? 'humid' : 'dry';
    
    return {
        name,
        temp: Math.round(temp),
        tempClass,
        humidity,
        humidClass,
        pressure
    };
}

// 更新區域數據
function updateRegionalData() {
    // 計算溫度
    const temps = calculateRegionalTemperatures();
    
    // 更新陸地溫度顯示
    const landTempEl = document.getElementById('land-temp-value');
    if (landTempEl) {
        landTempEl.textContent = temps.landTemp.toFixed(1);
        landTempEl.className = 'temp-card-value ' + 
            (temps.landTemp > 25 ? 'hot' : temps.landTemp > 15 ? 'warm' : temps.landTemp > 5 ? 'cool' : 'cold');
    }
    
    // 更新海洋溫度顯示
    const seaTempEl = document.getElementById('sea-temp-value');
    if (seaTempEl) {
        seaTempEl.textContent = temps.seaTemp.toFixed(1);
        seaTempEl.className = 'temp-card-value ' + 
            (temps.seaTemp > 25 ? 'hot' : temps.seaTemp > 15 ? 'warm' : 'cool');
    }
    
    // 更新氣壓顯示
    updatePressureDisplay(temps);
    
    // 更新風向
    updateWindDirection();
    
    // 更新濕度
    const humidityFill = document.getElementById('humidity-fill');
    const humidityValue = document.getElementById('humidity-value');
    if (humidityFill) {
        humidityFill.style.width = temps.humidity + '%';
    }
    if (humidityValue) {
        humidityValue.textContent = temps.humidity + '%';
    }
    
    // 重新初始化粒子以匹配新風向
    initMonsoonParticles();
}

// 更新月份顯示
function updateMonthDisplay() {
    const month = ClimateState.regional.month;
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const monthValueEl = document.getElementById('month-value');
    const seasonTagEl = document.getElementById('season-tag');
    
    if (monthValueEl) {
        monthValueEl.textContent = monthNames[month - 1];
        
        // 設置季節樣式
        if (month >= 6 && month <= 8) {
            monthValueEl.className = 'month-value summer';
        } else if (month >= 12 || month <= 2) {
            monthValueEl.className = 'month-value winter';
        } else {
            monthValueEl.className = 'month-value';
        }
    }
    
    if (seasonTagEl) {
        let season, seasonClass;
        if (month >= 3 && month <= 5) {
            season = '春季 Spring';
            seasonClass = 'spring';
        } else if (month >= 6 && month <= 8) {
            season = '夏季 Summer';
            seasonClass = 'summer';
        } else if (month >= 9 && month <= 11) {
            season = '秋季 Autumn';
            seasonClass = 'autumn';
        } else {
            season = '冬季 Winter';
            seasonClass = 'winter';
        }
        seasonTagEl.textContent = season;
        seasonTagEl.className = 'season-tag ' + seasonClass;
    }
    
    // 更新月份刻度
    document.querySelectorAll('.month-tick').forEach((tick, i) => {
        tick.classList.toggle('active', i + 1 === month);
    });
}

// 更新氣壓顯示
function updatePressureDisplay(temps) {
    const landPressure = document.getElementById('land-pressure');
    const seaPressure = document.getElementById('sea-pressure');
    const pressureArrow = document.getElementById('pressure-arrow');
    
    if (temps.landTemp > temps.seaTemp) {
        // 夏季：陸地熱 = 低壓
        if (landPressure) {
            landPressure.textContent = '低壓';
            landPressure.className = 'pressure-indicator-value low';
        }
        if (seaPressure) {
            seaPressure.textContent = '高壓';
            seaPressure.className = 'pressure-indicator-value high';
        }
        if (pressureArrow) {
            pressureArrow.textContent = '←';
        }
    } else {
        // 冬季：陸地冷 = 高壓
        if (landPressure) {
            landPressure.textContent = '高壓';
            landPressure.className = 'pressure-indicator-value high';
        }
        if (seaPressure) {
            seaPressure.textContent = '低壓';
            seaPressure.className = 'pressure-indicator-value low';
        }
        if (pressureArrow) {
            pressureArrow.textContent = '→';
        }
    }
}

// 更新風向顯示
function updateWindDirection() {
    const windDir = ClimateState.regional.windDirection;
    const humidity = ClimateState.regional.humidity;
    
    const windArrow = document.getElementById('wind-arrow');
    const windType = document.getElementById('wind-type');
    
    if (windArrow) {
        windArrow.className = 'wind-arrow ' + windDir.toLowerCase() + ' ' + (humidity > 50 ? 'wet' : 'dry');
    }
    
    if (windType) {
        if (windDir === 'SE') {
            windType.textContent = '東南季風 (濕潤)';
            windType.className = 'wind-type monsoon-summer';
        } else {
            windType.textContent = '西北季風 (乾燥)';
            windType.className = 'wind-type monsoon-winter';
        }
    }
}

// 更新高原效果說明
function updatePlateauEffect() {
    const effectEl = document.getElementById('plateau-effect');
    if (!effectEl) return;
    
    if (ClimateState.regional.plateauActive) {
        effectEl.textContent = '青藏高原阻擋西南季風，使其抬升並在迎風坡產生降水。長江流域雨量增加。';
        effectEl.className = 'plateau-effect active';
    } else {
        effectEl.textContent = '若無青藏高原，氣流可直接穿越，中國內陸氣候將更加乾燥。';
        effectEl.className = 'plateau-effect inactive';
    }
}

// 開始動畫
function startRegionalAnimation() {
    if (regionalAnimationId) {
        cancelAnimationFrame(regionalAnimationId);
    }
    
    function animate() {
        updateRegionalCanvas();
        drawRegionalMap();
        regionalAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 更新 Canvas 狀態
function updateRegionalCanvas() {
    const windDir = ClimateState.regional.windDirection;
    const plateauActive = ClimateState.regional.plateauActive;
    
    // 更新粒子
    monsoonParticles = monsoonParticles.filter(p => p.update(windDir, plateauActive));
    
    // 補充粒子
    while (monsoonParticles.length < 80) {
        monsoonParticles.push(
            new MonsoonParticle(
                regionalCanvas.width,
                regionalCanvas.height,
                windDir,
                Math.random() > 0.5
            )
        );
    }
}

// 載入地圖圖片
function loadMapImage() {
    chinaMapImage = new Image();
    chinaMapImage.onload = () => {
        mapImageLoaded = true;
        console.log('✅ 中國地圖圖片載入成功');
    };
    chinaMapImage.onerror = () => {
        console.warn('⚠️ 地圖圖片載入失敗，將使用備用繪製');
        mapImageLoaded = false;
    };
    chinaMapImage.src = 'china-map.png';
}

// 繪製地圖
function drawRegionalMap() {
    if (!regionalCtx) return;
    
    const ctx = regionalCtx;
    const w = regionalCanvas.width;
    const h = regionalCanvas.height;
    
    // 清空
    ctx.clearRect(0, 0, w, h);
    
    // 繪製背景
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    
    // 繪製地圖圖片
    if (mapImageLoaded && chinaMapImage) {
        // 計算圖片縮放和位置（保持比例居中）
        const imgRatio = chinaMapImage.width / chinaMapImage.height;
        const canvasRatio = w / h;
        let drawW, drawH, drawX, drawY;
        
        if (imgRatio > canvasRatio) {
            drawW = w;
            drawH = w / imgRatio;
            drawX = 0;
            drawY = (h - drawH) / 2;
        } else {
            drawH = h;
            drawW = h * imgRatio;
            drawX = (w - drawW) / 2;
            drawY = 0;
        }
        
        ctx.drawImage(chinaMapImage, drawX, drawY, drawW, drawH);
    }
    
    // 繪製青藏高原區域（如果啟用）
    if (ClimateState.regional.plateauActive) {
        drawPlateauRegion(ctx, w, h);
    }
    
    // 繪製溫度覆蓋效果
    drawTemperatureOverlay(ctx, w, h);
    
    // 繪製季風粒子
    drawMonsoonParticles(ctx);
}

// 繪製青藏高原區域
// ★★★ 你可以在這裡調整高原的位置和形狀 ★★★
function drawPlateauRegion(ctx, w, h) {
    const points = PLATEAU_REGION.points;
    
    ctx.beginPath();
    ctx.moveTo(points[0][0] * w, points[0][1] * h);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * w, points[i][1] * h);
    }
    ctx.closePath();
    
    // 半透明填充
    ctx.fillStyle = PLATEAU_REGION.color;
    ctx.fill();
    
    // 邊框
    ctx.strokeStyle = PLATEAU_REGION.borderColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 標籤
    const centerX = points.reduce((sum, p) => sum + p[0], 0) / points.length * w;
    const centerY = points.reduce((sum, p) => sum + p[1], 0) / points.length * h;
    
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('青藏高原', centerX, centerY - 5);
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
    ctx.fillText('4500m+', centerX, centerY + 10);
    ctx.textAlign = 'left';
}

// 繪製溫度覆蓋層（淡化效果，不遮擋地圖）
function drawTemperatureOverlay(ctx, w, h) {
    const { landTemp, seaTemp } = ClimateState.regional;
    
    // 夏季時加淡淡的暖色調
    if (landTemp > seaTemp) {
        const intensity = Math.min((landTemp - seaTemp) / 20, 1) * 0.08;
        ctx.fillStyle = `rgba(255, 150, 100, ${intensity})`;
        ctx.fillRect(0, 0, w, h);
    } else {
        // 冬季時加淡淡的冷色調
        const intensity = Math.min((seaTemp - landTemp) / 15, 1) * 0.08;
        ctx.fillStyle = `rgba(100, 150, 255, ${intensity})`;
        ctx.fillRect(0, 0, w, h);
    }
}

// 繪製季風粒子（箭頭形狀）
function drawMonsoonParticles(ctx) {
    const windDir = ClimateState.regional.windDirection;
    const humidity = ClimateState.regional.humidity;
    
    monsoonParticles.forEach(p => {
        const alpha = p.life * 0.9;
        
        // 使用深色箭頭（適配白色地圖）
        let color;
        if (windDir === 'SE') {
            // 夏季：深藍色
            color = { r: 20, g: 60, b: 120 };
        } else {
            // 冬季：深棕色
            color = { r: 80, g: 50, b: 20 };
        }
        
        // 繪製箭頭
        drawMonsoonArrow(ctx, p.x, p.y, p.windAngle, p.size * 2.5, color, alpha);
    });
}

// 繪製季風箭頭
function drawMonsoonArrow(ctx, x, y, angle, size, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    const colorStr = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    
    // 光暈效果
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = 3;
    
    // 箭頭主體
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.4, -size * 0.35);
    ctx.lineTo(-size * 0.15, 0);
    ctx.lineTo(-size * 0.4, size * 0.35);
    ctx.closePath();
    
    ctx.fillStyle = colorStr;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    ctx.restore();
}

// 停止動畫
function stopRegionalAnimation() {
    if (regionalAnimationId) {
        cancelAnimationFrame(regionalAnimationId);
        regionalAnimationId = null;
    }
}

// 導出
window.initRegionalModule = initRegionalModule;
window.stopRegionalAnimation = stopRegionalAnimation;
