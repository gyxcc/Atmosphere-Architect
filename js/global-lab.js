/* ========================================
   模塊 1: 全球氣候實驗室
   ======================================== */

// 全局變量
let globeCanvas, globeCtx;
let globeAnimationId;
let globeRotation = 0;
let windParticles = [];

// 地球參數
const GLOBE = {
    radius: 230,
    centerX: 0,
    centerY: 0,
    // 緯度線位置 (角度)
    latitudes: {
        arcticCircle: 66.5,
        tropicCancer: 23.5,
        equator: 0,
        tropicCapricorn: -23.5,
        antarcticCircle: -66.5
    }
};

// 風粒子類
class WindParticle {
    constructor(lat, isUpper) {
        this.lat = lat;
        this.lon = Math.random() * 360;
        this.isUpper = isUpper;
        this.speed = 0;
        this.life = 1;
        this.maxLife = 200 + Math.random() * 100;
        this.age = 0;
        
        // 修改 1: 我們不再需要在 update 裡儲存 lonChange 來算角度
        // 而是儲存這個粒子 "下一幀要去哪裡"，用來在屏幕上算角度
        this.nextLon = this.lon;
        this.nextLat = this.lat;
    }
    
    update(rotationSpeed, solarRadiation) {
        const coriolisEffect = rotationSpeed / 100;
        const pressureDrive = solarRadiation / 100;
        
        let lonChange = 0;
        let latChange = 0;
        
        // --- 風帶邏輯 (保持不變) ---
        if (this.lat > 60) {
            lonChange = -0.5 * coriolisEffect;
            latChange = -0.1 * pressureDrive;
        } else if (this.lat > 30) {
            lonChange = 1.5 * coriolisEffect;
            latChange = 0.05 * pressureDrive;
        } else if (this.lat > 0) {
            lonChange = -1 * coriolisEffect;
            latChange = -0.15 * pressureDrive;
        } else if (this.lat > -30) {
            lonChange = -1 * coriolisEffect;
            latChange = 0.15 * pressureDrive;
        } else if (this.lat > -60) {
            lonChange = 1.5 * coriolisEffect;
            latChange = -0.05 * pressureDrive;
        } else {
            lonChange = -0.5 * coriolisEffect;
            latChange = 0.1 * pressureDrive;
        }
        
        if (rotationSpeed < 10) {
            lonChange = 0;
            latChange = (this.lat > 0 ? -1 : 1) * 0.3 * pressureDrive;
        }
        // ---------------------------
        
        // 修改 2: 計算當前位置和 "預測的下一步位置"
        // 我們不直接存 windAngle，因為那是 2D 的，而地球是 3D 旋轉的
        this.lonChange = lonChange; // 存起來備用（計算速度用）
        
        this.lon += lonChange;
        this.lat += latChange;
        
        // 計算下一步的位置 (用於稍後計算屏幕上的向量方向)
        this.nextLon = this.lon + lonChange * 5; // *5 是為了放大向量，讓計算更精準
        this.nextLat = this.lat + latChange * 5;

        // 邊界處理
        if (this.lon > 360) this.lon -= 360;
        if (this.lon < 0) this.lon += 360;
        if (this.lat > 85) this.lat = 85;
        if (this.lat < -85) this.lat = -85;
        
        this.age++;
        this.life = 1 - (this.age / this.maxLife);
        
        return this.age < this.maxLife;
    }
    
    // 修改 3: toScreenPos 現在負責計算正確的屏幕角度
    toScreenPos(rotation) {
        // A. 計算當前點的屏幕坐標
        const currentPos = this.calculateProjection(this.lat, this.lon, rotation);
        
        // B. 計算"未來點"的屏幕坐標 (用來確定箭頭指向)
        const nextPos = this.calculateProjection(this.nextLat, this.nextLon, rotation);

        // C. 計算兩點在屏幕上的角度 (這是最準確的方法，解決了反向和球體變形問題)
        // Math.atan2(dy, dx)
        const dx = nextPos.x - currentPos.x;
        const dy = nextPos.y - currentPos.y;
        
        let angle = Math.atan2(dy, dx);
        
        // 如果你覺得還是反了，可以在這裡加 Math.PI (180度)
        // angle += Math.PI; 

        return { 
            x: currentPos.x, 
            y: currentPos.y, 
            visible: currentPos.visible, 
            depth: currentPos.depth,
            angle: angle // 返回計算好的屏幕角度
        };
    }

    // 輔助函數：投影計算 (把重複代碼抽離)
    calculateProjection(lat, lon, rotation) {
        const lonRad = (lon + rotation) * Math.PI / 180;
        const latRad = lat * Math.PI / 180;
        
        const x = GLOBE.centerX + GLOBE.radius * Math.cos(latRad) * Math.sin(lonRad);
        const y = GLOBE.centerY - GLOBE.radius * Math.sin(latRad);
        
        // 判斷是否可見 (簡單背面剔除)
        const visible = Math.cos(lonRad) > -0.2;
        const depth = Math.cos(lonRad);

        return { x, y, visible, depth };
    }
}
// 初始化模塊
function initGlobalLab() {
    console.log('🌍 初始化全球氣候實驗室');
    
    globeCanvas = document.getElementById('globe-canvas');
    if (!globeCanvas) {
        console.error('找不到 globe-canvas 元素');
        return;
    }
    
    globeCtx = globeCanvas.getContext('2d');
    
    // 設置 Canvas 大小 - 使用固定大小確保顯示
    globeCanvas.width = 580;
    globeCanvas.height = 580;
    GLOBE.centerX = 290;
    GLOBE.centerY = 290;
    GLOBE.radius = 230;
    
    // 監聽視窗大小變化
    window.addEventListener('resize', resizeGlobeCanvas);
    
    // 初始化風粒子
    initWindParticles();
    
    // 設置控制面板事件
    setupGlobalLabControls();
    
    // 開始動畫循環
    startGlobeAnimation();
    
    // 更新數據顯示
    updateGlobalLabData();
    
    console.log('✅ 全球氣候實驗室初始化完成');
}

// 調整 Canvas 大小
function resizeGlobeCanvas() {
    if (!globeCanvas) return;
    
    const container = document.querySelector('.globe-container');
    if (!container) return;
    
    const containerWidth = container.clientWidth || 600;
    const containerHeight = container.clientHeight || 600;
    const size = Math.min(containerWidth - 40, containerHeight - 80, 620);
    
    // 確保最小尺寸
    const finalSize = Math.max(size, 400);
    
    globeCanvas.width = finalSize;
    globeCanvas.height = finalSize;
    
    GLOBE.centerX = finalSize / 2;
    GLOBE.centerY = finalSize / 2;
    GLOBE.radius = finalSize * 0.42;
}

// 初始化風粒子
function initWindParticles() {
    windParticles = [];
    
    // 在不同緯度帶生成粒子
    for (let i = 0; i < 150; i++) {
        const lat = (Math.random() - 0.5) * 170; // -85 到 85
        windParticles.push(new WindParticle(lat, Math.random() > 0.5));
    }
}

// 設置控制面板
function setupGlobalLabControls() {
    const solarSlider = document.getElementById('solar-radiation');
    const rotationSlider = document.getElementById('rotation-speed');
    
    if (solarSlider) {
        solarSlider.addEventListener('input', (e) => {
            ClimateState.global.solarRadiation = parseFloat(e.target.value);
            document.getElementById('solar-value').textContent = e.target.value + '%';
            updateGlobalLabData();
        });
    }
    
    if (rotationSlider) {
        rotationSlider.addEventListener('input', (e) => {
            ClimateState.global.rotationSpeed = parseFloat(e.target.value);
            document.getElementById('rotation-value').textContent = e.target.value;
            updateGlobalLabData();
        });
    }
}

// 更新數據顯示
function updateGlobalLabData() {
    // 計算溫度
    const temp = calculateGlobalTemperature();
    const tempEl = document.getElementById('global-temp-value');
    if (tempEl) {
        tempEl.textContent = temp.toFixed(1);
        tempEl.className = 'data-card-value' + (temp > 20 ? ' hot' : temp < 10 ? ' cold' : '');
    }
    
    // 更新溫度條
    const tempBar = document.getElementById('temp-bar-fill');
    if (tempBar) {
        const tempPercent = Math.max(0, Math.min(100, (temp + 20) / 60 * 100));
        tempBar.style.width = tempPercent + '%';
    }
    
    // 計算環流穩定度
    const stability = calculateCirculationStability();
    const stabilityEl = document.getElementById('stability-value');
    if (stabilityEl) {
        stabilityEl.textContent = stability;
    }
    
    // 更新穩定度條
    const stabilityBar = document.getElementById('stability-bar-fill');
    if (stabilityBar) {
        stabilityBar.style.width = stability + '%';
    }
    
    // 更新環流狀態
    updateCirculationStatus();
    
    // 更新氣壓指示
    updatePressureIndicators();
}

// 更新環流狀態顯示
function updateCirculationStatus() {
    const rotation = ClimateState.global.rotationSpeed;
    const solar = ClimateState.global.solarRadiation;
    
    const cells = [
        { id: 'hadley-cell', name: '哈德里環流', threshold: 20 },
        { id: 'ferrel-cell', name: '費雷爾環流', threshold: 40 },
        { id: 'polar-cell', name: '極地環流', threshold: 60 }
    ];
    
    cells.forEach(cell => {
        const el = document.getElementById(cell.id);
        const statusEl = el?.querySelector('.circulation-cell-status');
        
        if (el && statusEl) {
            const isActive = rotation >= cell.threshold && solar >= 50;
            el.classList.toggle('active', isActive);
            statusEl.textContent = isActive ? 'ACTIVE' : 'INACTIVE';
            statusEl.classList.toggle('on', isActive);
            statusEl.classList.toggle('off', !isActive);
        }
    });
}

// 更新氣壓指示器
function updatePressureIndicators() {
    const solar = ClimateState.global.solarRadiation;
    
    // 赤道低壓強度
    const equatorPressure = document.getElementById('equator-pressure');
    if (equatorPressure) {
        const intensity = solar > 100 ? '極低' : solar > 70 ? '低' : '中';
        equatorPressure.textContent = intensity;
    }
    
    // 極地高壓強度
    const polarPressure = document.getElementById('polar-pressure');
    if (polarPressure) {
        const intensity = solar > 100 ? '極高' : solar > 70 ? '高' : '中';
        polarPressure.textContent = intensity;
    }
}

// 開始動畫循環
function startGlobeAnimation() {
    if (globeAnimationId) {
        cancelAnimationFrame(globeAnimationId);
    }
    
    function animate() {
        updateGlobe();
        drawGlobe();
        globeAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 更新地球狀態
function updateGlobe() {
    const rotationSpeed = ClimateState.global.rotationSpeed;
    const solarRadiation = ClimateState.global.solarRadiation;
    
    // 地球自轉
    globeRotation += rotationSpeed * 0.02;
    if (globeRotation > 360) globeRotation -= 360;
    
    // 更新風粒子
    windParticles = windParticles.filter(p => 
        p.update(rotationSpeed, solarRadiation)
    );
    
    // 補充粒子
    while (windParticles.length < 150) {
        const lat = (Math.random() - 0.5) * 170;
        windParticles.push(new WindParticle(lat, Math.random() > 0.5));
    }
}

// 繪製地球
function drawGlobe() {
    if (!globeCtx) return;
    
    const ctx = globeCtx;
    const { centerX, centerY, radius } = GLOBE;
    const solar = ClimateState.global.solarRadiation;
    
    // 清空畫布
    ctx.clearRect(0, 0, globeCanvas.width, globeCanvas.height);
    
    // 繪製太陽光效果 (左側)
    drawSunEffect(ctx, solar);
    
    // 繪製地球本體 (漸變球體)
    drawEarthBody(ctx, centerX, centerY, radius, solar);
    
    // 繪製緯度線
    drawLatitudeLines(ctx, centerX, centerY, radius);
    
    // 繪製經度線
    drawLongitudeLines(ctx, centerX, centerY, radius);
    
    // 繪製風粒子
    drawWindParticles(ctx);
    
    // 繪製氣壓箭頭
    drawPressureArrows(ctx, centerX, centerY, radius, solar);
}

// 繪製太陽效果
function drawSunEffect(ctx, solar) {
    const intensity = solar / 150;
    const gradient = ctx.createRadialGradient(
        0, globeCanvas.height / 2, 0,
        0, globeCanvas.height / 2, 150
    );
    gradient.addColorStop(0, `rgba(255, 200, 100, ${0.3 * intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.1 * intensity})`);
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 150, globeCanvas.height);
}

// 繪製地球本體
function drawEarthBody(ctx, cx, cy, r, solar) {
    // 溫度漸變 (根據太陽輻射)
    const tempFactor = (solar - 50) / 100; // -0.5 to 1
    
    // 主體漸變
    const gradient = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    
    // 極地 (冷)
    const coldColor = `rgba(0, ${100 + tempFactor * 50}, ${200 - tempFactor * 50}, 0.3)`;
    // 赤道 (熱)
    const hotColor = `rgba(${200 + tempFactor * 55}, ${100 - tempFactor * 50}, ${50 - tempFactor * 30}, 0.4)`;
    
    gradient.addColorStop(0, coldColor);
    gradient.addColorStop(0.3, coldColor);
    gradient.addColorStop(0.5, hotColor);
    gradient.addColorStop(0.7, coldColor);
    gradient.addColorStop(1, coldColor);
    
    // 繪製球體
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 邊框
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 大氣層光暈
    const glowGradient = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 20);
    glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    glowGradient.addColorStop(0.8, 'rgba(0, 255, 255, 0.1)');
    glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
}

// 繪製緯度線
function drawLatitudeLines(ctx, cx, cy, r) {
    const latLines = [
        { lat: 66.5, color: '#00ffff', label: '北極圈' },
        { lat: 23.5, color: '#ff6b35', label: '北回歸線' },
        { lat: 0, color: '#ffcc00', label: '赤道', width: 2 },
        { lat: -23.5, color: '#ff6b35', label: '南回歸線' },
        { lat: -66.5, color: '#00ffff', label: '南極圈' }
    ];
    
    latLines.forEach(line => {
        const y = cy - r * Math.sin(line.lat * Math.PI / 180);
        const xRadius = r * Math.cos(line.lat * Math.PI / 180);
        
        ctx.beginPath();
        ctx.ellipse(cx, y, xRadius, xRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width || 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    });
}

// 繪製經度線
function drawLongitudeLines(ctx, cx, cy, r) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    for (let lon = 0; lon < 360; lon += 30) {
        const adjustedLon = (lon + globeRotation) % 360;
        const lonRad = adjustedLon * Math.PI / 180;
        
        // 只繪製可見的經線
        if (Math.cos(lonRad) > -0.1) {
            ctx.beginPath();
            
            for (let lat = -90; lat <= 90; lat += 5) {
                const latRad = lat * Math.PI / 180;
                const x = cx + r * Math.cos(latRad) * Math.sin(lonRad);
                const y = cy - r * Math.sin(latRad);
                
                if (lat === -90) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
    }
}

// 繪製風粒子（箭頭形狀）
function drawWindParticles(ctx) {
    const rotation = ClimateState.global.rotationSpeed;
    
    windParticles.forEach(particle => {
        const pos = particle.toScreenPos(globeRotation);
        
        if (pos.visible && pos.depth > 0) {
            const alpha = particle.life * pos.depth * 0.9;
            
            // 根據緯度決定顏色
            let color;
            if (Math.abs(particle.lat) < 30) {
                // 哈德里環流 - 橙紅色
                color = { r: 255, g: 120, b: 80 };
            } else if (Math.abs(particle.lat) > 60) {
                // 極地環流 - 藍色
                color = { r: 80, g: 180, b: 255 };
            } else {
                // 費雷爾環流 - 青色
                color = { r: 100, g: 230, b: 200 };
            }
            
            // 箭頭大小根據深度調整
            const arrowSize = (6 + pos.depth * 4) * (0.7 + rotation / 150);
            
            // 繪製箭頭
            drawWindArrow(
                ctx, 
                pos.x, 
                pos.y, 
                particle.windAngle, 
                arrowSize,
                color,
                alpha
            );
        }
    });
}

// 繪製風向箭頭
function drawWindArrow(ctx, x, y, angle, size, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // 箭頭顏色
    const colorStr = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    const glowStr = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3})`;
    
    // 繪製光暈效果
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = 4;
    
    // 箭頭主體 - 三角形
    ctx.beginPath();
    ctx.moveTo(size, 0);           // 箭頭頂點
    ctx.lineTo(-size * 0.5, -size * 0.4);  // 左後
    ctx.lineTo(-size * 0.2, 0);    // 內凹
    ctx.lineTo(-size * 0.5, size * 0.4);   // 右後
    ctx.closePath();
    
    ctx.fillStyle = colorStr;
    ctx.fill();
    
    // 箭頭邊框
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    ctx.restore();
}

// 繪製氣壓箭頭
function drawPressureArrows(ctx, cx, cy, r, solar) {
    if (solar < 30) return; // 太陽輻射太低時不顯示
    
    const intensity = solar / 100;
    
    // 赤道上升氣流 (紅色向上箭頭)
    drawArrow(ctx, cx, cy, 0, -30 * intensity, '#ff6b35', intensity);
    
    // 極地下沉氣流 (藍色向下箭頭)
    drawArrow(ctx, cx, cy - r * 0.75, 0, 20 * intensity, '#00aaff', intensity);
    drawArrow(ctx, cx, cy + r * 0.75, 0, -20 * intensity, '#00aaff', intensity);
}

// 繪製箭頭
function drawArrow(ctx, x, y, dx, dy, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = 2;
    
    // 箭頭線
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    
    // 箭頭頭部
    const angle = Math.atan2(dy, dx);
    const headLen = 8;
    
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(
        x + dx - headLen * Math.cos(angle - Math.PI / 6),
        y + dy - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x + dx - headLen * Math.cos(angle + Math.PI / 6),
        y + dy - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// 停止動畫
function stopGlobeAnimation() {
    if (globeAnimationId) {
        cancelAnimationFrame(globeAnimationId);
        globeAnimationId = null;
    }
}

// 導出函數
window.initGlobalLab = initGlobalLab;
window.stopGlobeAnimation = stopGlobeAnimation;
