/* ========================================
   主入口 - Atmosphere Architect
   ======================================== */

// DOM 加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Atmosphere Architect - 系統啟動');
    
    // 初始化引導模塊
    initOnboarding();
    
    // 設置導航事件
    setupNavigation();
    
    // 開發模式: 添加重置按鈕 (按 R 鍵重置)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            if (confirm('確定要重置所有進度嗎？')) {
                resetState();
                location.reload();
            }
        }
    });
});

// 設置導航欄事件
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetScreen = btn.dataset.target;
            
            // 切換畫面
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            document.getElementById(targetScreen).classList.add('active');
            
            // 更新按鈕狀態
            updateNavButtons(targetScreen);
            
            // 更新狀態
            const moduleMapping = {
                'global-lab-screen': 'global',
                'regional-screen': 'regional',
                'disaster-screen': 'disaster'
            };
            ClimateState.currentModule = moduleMapping[targetScreen];
            saveState();
            
            // 初始化對應模塊 (如果有)
            initModuleIfNeeded(targetScreen);
        });
    });
}

// 根據需要初始化模塊
function initModuleIfNeeded(screenId) {
    switch (screenId) {
        case 'global-lab-screen':
            if (typeof initGlobalLab === 'function') {
                initGlobalLab();
            }
            break;
        case 'regional-screen':
            if (typeof initRegionalModule === 'function') {
                initRegionalModule();
            }
            break;
        case 'disaster-screen':
            if (typeof initDisasterModule === 'function') {
                initDisasterModule();
            }
            break;
    }
}

// 工具函數: 數字跳動效果
function animateValue(element, start, end, duration, suffix = '') {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用 easeOutQuad 緩動
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const current = start + (end - start) * easeProgress;
        
        element.textContent = Math.round(current * 10) / 10 + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 工具函數: 創建滑桿組件
function createSlider(config) {
    const container = document.createElement('div');
    container.className = 'slider-container';
    
    const label = document.createElement('div');
    label.className = 'slider-label';
    label.innerHTML = `
        <span>${config.label}</span>
        <span class="slider-value" id="${config.id}-value">${config.value}${config.suffix || ''}</span>
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = config.id;
    slider.min = config.min;
    slider.max = config.max;
    slider.value = config.value;
    slider.step = config.step || 1;
    
    slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById(`${config.id}-value`).textContent = value + (config.suffix || '');
        if (config.onChange) config.onChange(value);
    });
    
    container.appendChild(label);
    container.appendChild(slider);
    
    return container;
}

// 工具函數: 創建開關組件
function createToggle(config) {
    const container = document.createElement('div');
    container.className = 'toggle-container';
    
    const label = document.createElement('span');
    label.className = 'toggle-label';
    label.textContent = config.label;
    
    const toggle = document.createElement('div');
    toggle.className = 'toggle-switch' + (config.active ? ' active' : '');
    toggle.id = config.id;
    
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        if (config.onChange) config.onChange(isActive);
    });
    
    container.appendChild(label);
    container.appendChild(toggle);
    
    return container;
}

// 工具函數: 創建數據面板
function createDataPanel(config) {
    const panel = document.createElement('div');
    panel.className = 'data-panel';
    
    const header = document.createElement('div');
    header.className = 'data-panel-header';
    header.textContent = config.title;
    
    panel.appendChild(header);
    
    config.rows.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'data-row';
        rowEl.innerHTML = `
            <span class="data-label">${row.label}</span>
            <span class="data-value ${row.class || ''}" id="${row.id}">${row.value}</span>
        `;
        panel.appendChild(rowEl);
    });
    
    return panel;
}

// 導出工具函數
window.animateValue = animateValue;
window.createSlider = createSlider;
window.createToggle = createToggle;
window.createDataPanel = createDataPanel;
