/* ========================================
   模塊 3: 災害應對工程
   ======================================== */

// Canvas 和上下文
let disasterCanvas, disasterCtx;
let disasterAnimationId;

// 拖放狀態
let draggedTool = null;
let deployedTools = [];

// 工具定義
const TOOLS = {
    'water-transfer': {
        id: 'water-transfer',
        name: '南水北調',
        icon: '🚰',
        cost: 40,
        moistureEffect: 30,
        ecoEffect: -5,
        description: '跨區域水資源調配'
    },
    'groundwater': {
        id: 'groundwater',
        name: '地下水井',
        icon: '🕳️',
        cost: 10,
        moistureEffect: 15,
        ecoEffect: -20,
        description: '快速但不可持續'
    },
    'cloud-seeding': {
        id: 'cloud-seeding',
        name: '人工增雨',
        icon: '🚀',
        cost: 5,
        moistureEffect: 10,
        ecoEffect: 0,
        description: '需要濕度>40%'
    },
    'drought-crops': {
        id: 'drought-crops',
        name: '抗旱作物',
        icon: '🌾',
        cost: 20,
        moistureEffect: 0,
        ecoEffect: 5,
        reduceMoistureNeed: 10,  // 降低濕度需求
        description: '降低需水量'
    },
    'drip-irrigation': {
        id: 'drip-irrigation',
        name: '節水灌溉',
        icon: '💧',
        cost: 25,
        moistureEffect: 15,
        ecoEffect: 5,
        description: '滴灌/噴灌技術'
    },
    'reforestation': {
        id: 'reforestation',
        name: '退耕還林',
        icon: '🌲',
        cost: 30,
        moistureEffect: 5,
        ecoEffect: 15,
        description: '長期生態恢復'
    },
    'reservoir': {
        id: 'reservoir',
        name: '水庫蓄水',
        icon: '🌊',
        cost: 50,
        moistureEffect: 25,
        ecoEffect: -10,
        description: '大型基礎設施'
    },
    'crop-rotation': {
        id: 'crop-rotation',
        name: '輪作休耕',
        icon: '🌱',
        cost: 15,
        moistureEffect: 5,
        ecoEffect: 10,
        description: '土地休養生息'
    }
};

// 初始化模塊
function initDisasterModule() {
    console.log('🚨 初始化災害應對工程');
    
    disasterCanvas = document.getElementById('disaster-canvas');
    if (!disasterCanvas) {
        console.error('找不到 disaster-canvas');
        return;
    }
    
    disasterCtx = disasterCanvas.getContext('2d');
    
    // 設置 Canvas 大小
    resizeDisasterCanvas();
    window.addEventListener('resize', resizeDisasterCanvas);
    
    // 重置狀態
    resetDisasterState();
    
    // 設置拖放
    setupDragAndDrop();
    
    // 設置提交按鈕
    setupSubmitButton();
    
    // 開始動畫
    startDisasterAnimation();
    
    // 更新顯示
    updateDisasterDisplay();
    
    console.log('✅ 災害應對工程初始化完成');
}

// 調整 Canvas 大小
function resizeDisasterCanvas() {
    if (!disasterCanvas) return;
    
    const container = document.querySelector('.disaster-map-container');
    if (!container) return;
    
    // 獲取容器大小，減去工具箱和警報的空間
    const rect = container.getBoundingClientRect();
    disasterCanvas.width = Math.min(rect.width - 40, 600);
    disasterCanvas.height = Math.min(rect.height - 180, 400);
}

// 重置災害狀態
function resetDisasterState() {
    ClimateState.disaster.budget = 100;
    ClimateState.disaster.moisture = 20;
    ClimateState.disaster.ecoScore = 100;
    ClimateState.disaster.tools = [];
    ClimateState.disaster.submitted = false;
    deployedTools = [];
}

// 設置拖放功能
function setupDragAndDrop() {
    const toolItems = document.querySelectorAll('.tool-item');
    const mapContainer = document.querySelector('.disaster-map-container');
    
    toolItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        
        // 點擊部署（移動端備用）
        item.addEventListener('click', () => handleToolClick(item.dataset.tool));
    });
    
    if (disasterCanvas) {
        disasterCanvas.addEventListener('dragover', handleDragOver);
        disasterCanvas.addEventListener('drop', handleDrop);
        disasterCanvas.addEventListener('dragleave', handleDragLeave);
    }
}

// 拖動開始
function handleDragStart(e) {
    draggedTool = e.target.dataset.tool;
    e.target.classList.add('dragging');
    document.querySelector('.disaster-map-container')?.classList.add('dragging');
}

// 拖動結束
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelector('.disaster-map-container')?.classList.remove('dragging');
    draggedTool = null;
}

// 拖動經過
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

// 離開放置區
function handleDragLeave(e) {
    // 可以添加視覺反饋
}

// 放置工具
function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedTool) return;
    
    const rect = disasterCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    deployTool(draggedTool, x, y);
    
    document.querySelector('.disaster-map-container')?.classList.remove('dragging');
    draggedTool = null;
}

// 點擊部署（備用方式）
function handleToolClick(toolId) {
    if (!toolId) return;
    
    // 隨機位置
    const x = 100 + Math.random() * (disasterCanvas.width - 200);
    const y = 100 + Math.random() * (disasterCanvas.height - 200);
    
    deployTool(toolId, x, y);
}

// 部署工具
function deployTool(toolId, x, y) {
    const tool = TOOLS[toolId];
    if (!tool) return;
    
    // 檢查預算
    if (ClimateState.disaster.budget < tool.cost) {
        showAlert('預算不足！', 'error');
        return;
    }
    
    // 人工增雨特殊判定
    if (toolId === 'cloud-seeding' && ClimateState.disaster.moisture < 40) {
        showAlert('濕度不足，人工增雨無效！需要濕度 > 40%', 'warning');
        // 仍然扣錢但效果減半
        tool.moistureEffect = 5;
    } else if (toolId === 'cloud-seeding') {
        tool.moistureEffect = 10;
    }
    
    // 應用效果
    ClimateState.disaster.budget -= tool.cost;
    ClimateState.disaster.moisture = Math.min(100, ClimateState.disaster.moisture + tool.moistureEffect);
    ClimateState.disaster.ecoScore = Math.max(0, Math.min(100, ClimateState.disaster.ecoScore + tool.ecoEffect));
    ClimateState.disaster.tools.push(toolId);
    
    // 記錄部署位置
    deployedTools.push({
        ...tool,
        x: x,
        y: y,
        deployTime: Date.now()
    });
    
    // 更新顯示
    updateDisasterDisplay();
    updateDeployedList();
    updateToolAvailability();
}

// 顯示提示
function showAlert(message, type = 'info') {
    // 簡單的 console 提示，可以擴展為 UI 提示
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// 更新災害顯示
function updateDisasterDisplay() {
    const { budget, moisture, ecoScore } = ClimateState.disaster;
    
    // 更新預算
    const budgetValue = document.getElementById('budget-value');
    const budgetBar = document.getElementById('budget-bar');
    if (budgetValue) {
        budgetValue.textContent = budget;
        budgetValue.className = 'resource-value' + 
            (budget < 20 ? ' danger' : budget < 50 ? ' warning' : '');
    }
    if (budgetBar) {
        budgetBar.style.width = budget + '%';
    }
    
    // 更新濕度
    const moistureValue = document.getElementById('moisture-value');
    const moistureBar = document.getElementById('moisture-bar');
    if (moistureValue) {
        moistureValue.textContent = moisture;
        moistureValue.className = 'resource-value' + 
            (moisture >= 60 ? ' success' : moisture < 30 ? ' danger' : ' warning');
    }
    if (moistureBar) {
        moistureBar.style.width = moisture + '%';
    }
    
    // 更新環境分數
    const ecoValue = document.getElementById('eco-value');
    const ecoBar = document.getElementById('eco-bar');
    if (ecoValue) {
        ecoValue.textContent = ecoScore;
        ecoValue.className = 'resource-value' + 
            (ecoScore >= 80 ? ' success' : ecoScore < 50 ? ' danger' : ' warning');
    }
    if (ecoBar) {
        ecoBar.style.width = ecoScore + '%';
    }
    
    // 更新警報
    updateAlertBanner();
    
    // 更新目標狀態
    updateObjectives();
}

// 更新警報橫幅
function updateAlertBanner() {
    const banner = document.getElementById('alert-banner');
    const alertValue = document.getElementById('alert-moisture-value');
    const moisture = ClimateState.disaster.moisture;
    
    if (banner && alertValue) {
        alertValue.textContent = moisture + '%';
        
        if (moisture >= 60) {
            banner.classList.add('success');
            banner.querySelector('.alert-title').textContent = '乾旱解除';
            banner.querySelector('.alert-desc').textContent = '土壤濕度已恢復正常';
            banner.querySelector('.alert-icon').textContent = '✅';
        } else {
            banner.classList.remove('success');
            banner.querySelector('.alert-title').textContent = '乾旱預警';
            banner.querySelector('.alert-desc').textContent = '土壤濕度嚴重不足，農作物面臨枯死風險';
            banner.querySelector('.alert-icon').textContent = '⚠️';
        }
    }
}

// 更新目標狀態
function updateObjectives() {
    const moisture = ClimateState.disaster.moisture;
    const budget = ClimateState.disaster.budget;
    const eco = ClimateState.disaster.ecoScore;
    
    // 濕度目標
    const moistureCheck = document.getElementById('obj-moisture-check');
    const moistureText = document.getElementById('obj-moisture-text');
    if (moistureCheck && moistureText) {
        const complete = moisture >= 60;
        moistureCheck.className = 'objective-check ' + (complete ? 'complete' : 'incomplete');
        moistureCheck.textContent = complete ? '✓' : '';
        moistureText.className = 'objective-text ' + (complete ? 'complete' : '');
    }
    
    // 預算目標
    const budgetCheck = document.getElementById('obj-budget-check');
    const budgetText = document.getElementById('obj-budget-text');
    if (budgetCheck && budgetText) {
        const complete = budget >= 0;
        budgetCheck.className = 'objective-check ' + (complete ? 'complete' : 'incomplete');
        budgetCheck.textContent = complete ? '✓' : '';
        budgetText.className = 'objective-text ' + (complete ? 'complete' : '');
    }
    
    // 環境目標
    const ecoCheck = document.getElementById('obj-eco-check');
    const ecoText = document.getElementById('obj-eco-text');
    if (ecoCheck && ecoText) {
        const complete = eco >= 50;
        ecoCheck.className = 'objective-check ' + (complete ? 'complete' : 'incomplete');
        ecoCheck.textContent = complete ? '✓' : '';
        ecoText.className = 'objective-text ' + (complete ? 'complete' : '');
    }
}

// 更新已部署列表
function updateDeployedList() {
    const listContainer = document.getElementById('deployed-list-items');
    if (!listContainer) return;
    
    if (deployedTools.length === 0) {
        listContainer.innerHTML = '<div class="deployed-empty">尚未部署任何工具</div>';
        return;
    }
    
    listContainer.innerHTML = deployedTools.map(tool => `
        <div class="deployed-item">
            <span class="deployed-item-icon">${tool.icon}</span>
            <div class="deployed-item-info">
                <div class="deployed-item-name">${tool.name}</div>
                <div class="deployed-item-effect">
                    濕度 +${tool.moistureEffect}%
                    ${tool.ecoEffect !== 0 ? 
                        `<span class="${tool.ecoEffect < 0 ? 'negative' : ''}">
                            環境 ${tool.ecoEffect > 0 ? '+' : ''}${tool.ecoEffect}
                        </span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// 更新工具可用性
function updateToolAvailability() {
    const budget = ClimateState.disaster.budget;
    
    document.querySelectorAll('.tool-item').forEach(item => {
        const toolId = item.dataset.tool;
        const tool = TOOLS[toolId];
        
        if (tool && budget < tool.cost) {
            item.classList.add('disabled');
        } else {
            item.classList.remove('disabled');
        }
    });
}

// 設置提交按鈕
function setupSubmitButton() {
    const submitBtn = document.getElementById('submit-plan');
    const resetBtn = document.getElementById('reset-plan');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', submitPlan);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetDisasterState();
            updateDisasterDisplay();
            updateDeployedList();
            updateToolAvailability();
            hideResultModal();
        });
    }
}

// 提交方案
function submitPlan() {
    if (ClimateState.disaster.submitted) return;
    
    ClimateState.disaster.submitted = true;
    
    // 計算分數
    const result = calculateDisasterScore();
    
    // 顯示結果
    showResultModal(result);
}

// 顯示結果彈窗
function showResultModal(result) {
    const modal = document.getElementById('result-modal');
    if (!modal) return;
    
    const gradeEl = modal.querySelector('.result-grade');
    const messageEl = modal.querySelector('.result-message');
    const moistureStat = document.getElementById('result-moisture');
    const budgetStat = document.getElementById('result-budget');
    const ecoStat = document.getElementById('result-eco');
    
    if (gradeEl) {
        gradeEl.textContent = result.grade;
        gradeEl.className = 'result-grade ' + result.grade.toLowerCase();
    }
    
    if (messageEl) {
        messageEl.textContent = result.message;
    }
    
    if (moistureStat) moistureStat.textContent = result.moisture + '%';
    if (budgetStat) budgetStat.textContent = '$' + result.budget + 'M';
    if (ecoStat) ecoStat.textContent = result.ecoScore;
    
    modal.classList.add('visible');
}

// 隱藏結果彈窗
function hideResultModal() {
    const modal = document.getElementById('result-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

// 計算災害應對分數
function calculateDisasterScore() {
    const moisture = ClimateState.disaster.moisture;
    const budget = ClimateState.disaster.budget;
    const eco = ClimateState.disaster.ecoScore;
    const toolsUsed = deployedTools.length;
    
    // 基本目標檢查
    const moistureOK = moisture >= 60;      // 濕度達標
    const budgetOK = budget >= 0;           // 預算不超支
    const ecoOK = eco >= 50;                // 環境健康
    
    // 評分邏輯
    let grade, message;
    
    if (moistureOK && budgetOK && ecoOK) {
        // 所有目標都達成
        if (moisture >= 80 && eco >= 80 && budget >= 30) {
            grade = 'S';
            message = '評級 S：完美的氣候工程師！經濟、環境、效果全優！';
        } else if (moisture >= 70 && eco >= 60) {
            grade = 'A';
            message = '評級 A：優秀的方案！有效緩解了乾旱。';
        } else {
            grade = 'B';
            message = '評級 B：基本完成任務，但還有優化空間。';
        }
    } else {
        // 有目標未達成
        grade = 'F';
        if (!moistureOK) {
            message = '評級 F：任務失敗，濕度未能達到 60%。';
        } else if (!ecoOK) {
            message = '評級 F：任務失敗，環境破壞太嚴重。';
        } else {
            message = '評級 F：任務失敗，預算超支。';
        }
    }
    
    return {
        grade,
        message,
        moisture,
        budget,
        ecoScore: eco,
        toolsUsed
    };
}

// 開始動畫
function startDisasterAnimation() {
    if (disasterAnimationId) {
        cancelAnimationFrame(disasterAnimationId);
    }
    
    function animate() {
        drawDisasterMap();
        disasterAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 繪製災害地圖
function drawDisasterMap() {
    if (!disasterCtx) return;
    
    const ctx = disasterCtx;
    const w = disasterCanvas.width;
    const h = disasterCanvas.height;
    
    // 清空
    ctx.clearRect(0, 0, w, h);
    
    // 繪製背景（華北平原）
    drawNorthChinaPlain(ctx, w, h);
    
    // 繪製濕度覆蓋層
    drawMoistureOverlay(ctx, w, h);
    
    // 繪製已部署的工具
    drawDeployedTools(ctx);
    
    // 繪製城市
    drawCitiesOnMap(ctx, w, h);
}

// 繪製華北平原
function drawNorthChinaPlain(ctx, w, h) {
    // 土地背景
    const moisture = ClimateState.disaster.moisture;
    const dryness = 1 - moisture / 100;
    
    // 根據濕度調整顏色（乾燥=黃褐色，濕潤=綠色）
    const r = Math.round(100 + dryness * 100);
    const g = Math.round(120 - dryness * 40);
    const b = Math.round(60 - dryness * 30);
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, w, h);
    
    // 添加紋理
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 河流（黃河）
    ctx.beginPath();
    ctx.moveTo(0, h * 0.4);
    ctx.bezierCurveTo(w * 0.3, h * 0.35, w * 0.6, h * 0.5, w, h * 0.45);
    ctx.strokeStyle = '#4a6a8a';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 海岸線
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w, h);
    ctx.strokeStyle = '#2a5a8a';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // 海洋區域提示
    ctx.fillStyle = 'rgba(30, 80, 120, 0.3)';
    ctx.fillRect(w - 30, 0, 30, h);
}

// 繪製濕度覆蓋層
function drawMoistureOverlay(ctx, w, h) {
    const moisture = ClimateState.disaster.moisture;
    
    if (moisture < 40) {
        // 乾旱警告效果
        ctx.fillStyle = `rgba(255, 200, 100, ${0.2 * (1 - moisture / 40)})`;
        ctx.fillRect(0, 0, w, h);
        
        // 龜裂紋理
        ctx.strokeStyle = `rgba(80, 60, 40, ${0.3 * (1 - moisture / 40)})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
            ctx.stroke();
        }
    } else if (moisture >= 60) {
        // 濕潤效果
        ctx.fillStyle = 'rgba(100, 200, 150, 0.15)';
        ctx.fillRect(0, 0, w, h);
    }
}

// 繪製已部署工具
function drawDeployedTools(ctx) {
    deployedTools.forEach(tool => {
        // 圖標
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tool.icon, tool.x, tool.y);
        
        // 效果光環
        const time = Date.now() - tool.deployTime;
        const pulse = Math.sin(time / 500) * 0.2 + 0.8;
        
        ctx.beginPath();
        ctx.arc(tool.x, tool.y, 25 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = tool.ecoEffect >= 0 ? 
            `rgba(100, 255, 150, ${0.5 * pulse})` : 
            `rgba(255, 150, 100, ${0.5 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// 繪製城市
function drawCitiesOnMap(ctx, w, h) {
    const cities = [
        { name: '北京', x: 0.5, y: 0.3 },
        { name: '天津', x: 0.65, y: 0.35 },
        { name: '石家莊', x: 0.4, y: 0.45 },
        { name: '濟南', x: 0.55, y: 0.6 }
    ];
    
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';
    
    cities.forEach(city => {
        const x = city.x * w;
        const y = city.y * h;
        
        // 城市點
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 城市名
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(city.name, x, y - 12);
    });
}

// 停止動畫
function stopDisasterAnimation() {
    if (disasterAnimationId) {
        cancelAnimationFrame(disasterAnimationId);
        disasterAnimationId = null;
    }
}

// 導出
window.initDisasterModule = initDisasterModule;
window.stopDisasterAnimation = stopDisasterAnimation;
window.hideResultModal = hideResultModal;
