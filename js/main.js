/* ========================================
   主入口 - Atmosphere Architect
   ======================================== */

// 任務檢查間隔
let taskCheckInterval = null;

// DOM 加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Atmosphere Architect - 系統啟動');
    
    // 初始化引導模塊
    initOnboarding();
    
    // 設置導航事件
    setupNavigation();
    
    // 設置任務系統事件
    setupTaskSystem();
    
    // 開發模式: 按鍵功能
    document.addEventListener('keydown', (e) => {
        // Ctrl+R: 重置進度
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            if (confirm('確定要重置所有進度嗎？')) {
                resetState();
                location.reload();
            }
        }
        // 按 S 鍵: 跳過引導直接進入模塊1 (開發用)
        if (e.key === 's' && e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            console.log('跳過引導，直接進入模塊1');
            ClimateState.onboardingComplete = true;
            transitionToModule('global-lab-screen');
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
            
            // 更新任務面板
            updateTaskPanel(moduleMapping[targetScreen]);
        });
    });
}

// 根據需要初始化模塊
function initModuleIfNeeded(screenId) {
    console.log('初始化模塊:', screenId);
    
    // 使用 setTimeout 確保 DOM 已更新
    setTimeout(() => {
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
        
        // 獲取模塊名並啟動任務檢查
        const moduleMapping = {
            'global-lab-screen': 'global',
            'regional-screen': 'regional',
            'disaster-screen': 'disaster'
        };
        const moduleName = moduleMapping[screenId];
        if (moduleName) {
            startTaskChecking(moduleName);
        }
    }, 150);
}

// ========================================
//   任務系統
// ========================================

// 設置任務系統事件
function setupTaskSystem() {
    // 下一步按鈕事件
    const nextStageBtn = document.getElementById('next-stage-btn');
    if (nextStageBtn) {
        nextStageBtn.addEventListener('click', handleNextStage);
    }
    
    // 總結彈窗繼續按鈕事件
    const summaryContinueBtn = document.getElementById('summary-continue-btn');
    if (summaryContinueBtn) {
        summaryContinueBtn.addEventListener('click', handleSummaryContinue);
    }
    
    // 任務面板收起/展開按鈕事件
    setupTaskPanelToggle();
}

// 任務面板元素快取
let taskPanelElements = null;

// 獲取任務面板元素 (快取以避免重複DOM查詢)
function getTaskPanelElements() {
    if (!taskPanelElements) {
        taskPanelElements = {
            taskPanel: document.getElementById('task-panel'),
            toggleBtn: document.getElementById('task-panel-toggle'),
            expandBtn: document.getElementById('task-panel-expand')
        };
    }
    return taskPanelElements;
}

// 設置任務面板收起/展開功能
function setupTaskPanelToggle() {
    const elements = getTaskPanelElements();
    
    if (!elements.taskPanel || !elements.toggleBtn || !elements.expandBtn) return;
    
    // 點擊收起按鈕 - 收起任務面板
    elements.toggleBtn.addEventListener('click', () => {
        collapseTaskPanel();
    });
    
    // 點擊展開按鈕 - 展開任務面板
    elements.expandBtn.addEventListener('click', () => {
        expandTaskPanel();
    });
}

// 收起任務面板
function collapseTaskPanel() {
    const elements = getTaskPanelElements();
    
    if (!elements.taskPanel || !elements.expandBtn) return;
    
    elements.taskPanel.classList.add('collapsed');
    elements.expandBtn.classList.remove('hidden');
}

// 展開任務面板
function expandTaskPanel() {
    const elements = getTaskPanelElements();
    
    if (!elements.taskPanel || !elements.expandBtn) return;
    
    elements.taskPanel.classList.remove('collapsed');
    elements.expandBtn.classList.add('hidden');
}

// 開始任務檢查
function startTaskChecking(moduleName) {
    // 清除之前的檢查
    if (taskCheckInterval) {
        clearInterval(taskCheckInterval);
    }
    
    // 顯示任務面板
    updateTaskPanel(moduleName);
    
    // 每秒檢查任務完成狀態
    taskCheckInterval = setInterval(() => {
        updateTaskPanel(moduleName);
    }, 1000);
}

// 更新任務面板
function updateTaskPanel(moduleName) {
    const taskPanel = document.getElementById('task-panel');
    const taskList = document.getElementById('task-list');
    const progressFill = document.getElementById('task-progress-fill');
    const progressText = document.getElementById('task-progress-text');
    const nextStageBtn = document.getElementById('next-stage-btn');
    
    if (!taskPanel || !taskList || !moduleName) return;
    
    const moduleTasks = ModuleTasks[moduleName];
    if (!moduleTasks) {
        taskPanel.classList.add('hidden');
        return;
    }
    
    // 顯示任務面板
    taskPanel.classList.remove('hidden');
    
    // 檢查任務狀態
    const status = checkModuleTasks(moduleName);
    
    // 生成任務列表HTML
    let html = '';
    moduleTasks.tasks.forEach(task => {
        const isCompleted = status.completed.includes(task.id);
        html += `
            <div class="task-item ${isCompleted ? 'completed' : ''}">
                <div class="task-check">${isCompleted ? '✓' : ''}</div>
                <div class="task-text">${task.text}</div>
            </div>
        `;
    });
    taskList.innerHTML = html;
    
    // 更新進度條
    const percentage = (status.completed.length / status.total) * 100;
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = `${status.completed.length}/${status.total}`;
    }
    
    // 顯示/隱藏下一步按鈕
    if (nextStageBtn) {
        if (status.allCompleted) {
            nextStageBtn.classList.remove('hidden');
        } else {
            nextStageBtn.classList.add('hidden');
        }
    }
}

// 處理點擊下一步
function handleNextStage() {
    const moduleName = ClimateState.currentModule;
    const moduleTasks = ModuleTasks[moduleName];
    
    if (!moduleTasks) return;
    
    // 顯示總結彈窗
    showSummaryModal(moduleTasks.summary.title, moduleTasks.summary.content, moduleTasks.nextModule);
}

// 顯示總結彈窗
function showSummaryModal(title, content, nextModule) {
    const modal = document.getElementById('summary-modal');
    const summaryTitle = document.getElementById('summary-title');
    const summaryBody = document.getElementById('summary-body');
    const continueBtn = document.getElementById('summary-continue-btn');
    
    if (!modal) return;
    
    // 設置內容
    if (summaryTitle) {
        summaryTitle.textContent = title;
    }
    if (summaryBody) {
        summaryBody.innerHTML = content;
    }
    
    // 設置按鈕文本
    if (continueBtn) {
        if (nextModule) {
            continueBtn.innerHTML = '<span class="btn-text">進入下一階段 NEXT STAGE</span>';
        } else {
            continueBtn.innerHTML = '<span class="btn-text">完成 FINISH</span>';
        }
    }
    
    // 存儲下一模塊信息
    modal.dataset.nextModule = nextModule || '';
    
    // 顯示彈窗
    modal.classList.add('visible');
}

// 處理總結彈窗繼續按鈕
function handleSummaryContinue() {
    const modal = document.getElementById('summary-modal');
    if (!modal) return;
    
    const nextModule = modal.dataset.nextModule;
    
    // 隱藏彈窗
    modal.classList.remove('visible');
    
    // 如果有下一模塊，切換到下一模塊
    if (nextModule) {
        const screenMapping = {
            'global': 'global-lab-screen',
            'regional': 'regional-screen',
            'disaster': 'disaster-screen'
        };
        const targetScreen = screenMapping[nextModule];
        
        if (targetScreen) {
            // 切換畫面
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            document.getElementById(targetScreen).classList.add('active');
            
            // 更新導航按鈕
            updateNavButtons(targetScreen);
            
            // 更新狀態
            ClimateState.currentModule = nextModule;
            saveState();
            
            // 初始化模塊
            initModuleIfNeeded(targetScreen);
            
            // 更新任務面板
            updateTaskPanel(nextModule);
        }
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
window.updateTaskPanel = updateTaskPanel;
window.startTaskChecking = startTaskChecking;
window.showSummaryModal = showSummaryModal;
window.collapseTaskPanel = collapseTaskPanel;
window.expandTaskPanel = expandTaskPanel;
