/* ========================================
   全局狀態管理 - Atmosphere Architect
   ======================================== */

// 氣候系統狀態機
const ClimateState = {
    // 當前模塊
    currentModule: 'onboarding', // 'onboarding', 'global', 'regional', 'disaster'
    
    // 是否已完成引導
    onboardingComplete: false,
    
    // 模塊 1: 全球實驗室
    global: {
        solarRadiation: 100,    // 太陽輻射強度 0-150
        rotationSpeed: 50,      // 地球自轉速度 0-100
        avgTemperature: 15,     // 全球平均氣溫 (計算值)
        circulationStability: 50 // 大氣環流穩定度 (計算值)
    },
    
    // 模塊 2: 區域季風
    regional: {
        month: 1,               // 當前月份 1-12
        plateauActive: false,    // 青藏高原是否存在
        landTemp: 0,            // 陸地溫度 (計算值)
        seaTemp: 15,            // 海洋溫度 (計算值)
        windDirection: 'NW',    // 風向
        humidity: 30            // 濕度
    },
    
    // 模塊 3: 災害應對
    disaster: {
        budget: 100,            // 預算 (百萬美元)
        moisture: 20,           // 土壤濕度
        ecoScore: 100,          // 環境健康度
        tools: [],              // 已部署的工具
        submitted: false        // 是否已提交方案
    },
    
    // 任務系統
    tasks: {
        global: {
            completed: [],      // 已完成的任務ID
            allCompleted: false // 是否全部完成
        },
        regional: {
            completed: [],
            allCompleted: false
        },
        disaster: {
            completed: [],
            allCompleted: false
        }
    }
};

// 任務定義
const ModuleTasks = {
    global: {
        name: '全球氣候實驗室',
        tasks: [
            { id: 'solar_adjust', text: '調整太陽輻射強度至 120% 以上', check: () => ClimateState.global.solarRadiation >= 120 },
            { id: 'rotation_adjust', text: '調整地球自轉速度至 60 以上', check: () => ClimateState.global.rotationSpeed >= 60 },
            { id: 'hadley_active', text: '激活哈德里環流', check: () => ClimateState.global.rotationSpeed >= 20 && ClimateState.global.solarRadiation >= 50 }
        ],
        summary: {
            title: '全球氣候原理',
            content: `
                <p><strong>🌞 太陽輻射</strong>是地球氣候系統的能量來源，加熱赤道形成<strong>低氣壓</strong>（空氣上升），極地冷卻形成<strong>高氣壓</strong>（空氣下沉）。</p>
                <p><strong>🌍 地球自轉</strong>產生科氏力，使風向發生偏轉，形成穩定的三圈環流系統：哈德里環流、費雷爾環流、極地環流。</p>
                <p><strong>💨 大氣環流</strong>決定了全球氣候帶的分布，影響降水和氣溫模式。</p>
            `
        },
        nextModule: 'regional'
    },
    regional: {
        name: '中國季風系統',
        tasks: [
            { id: 'summer_monsoon', text: '調整月份觀察夏季季風（6-8月）', check: () => ClimateState.regional.month >= 6 && ClimateState.regional.month <= 8 },
            { id: 'winter_monsoon', text: '調整月份觀察冬季季風（12月或1-2月）', check: () => ClimateState.regional.month === 12 || ClimateState.regional.month === 1 || ClimateState.regional.month === 2 },
            { id: 'plateau_effect', text: '開啟青藏高原觀察地形影響', check: () => ClimateState.regional.plateauActive === true }
        ],
        summary: {
            title: '季風原理',
            content: `
                <p><strong>🌡️ 海陸熱力差異</strong>：陸地比熱容小，升溫快降溫也快；海洋比熱容大，溫度穩定。</p>
                <p><strong>❄️ 冬季季風</strong>：陸地冷 → 高壓，風從陸地吹向海洋（西北風，乾燥）</p>
                <p><strong>☀️ 夏季季風</strong>：陸地熱 → 低壓，風從海洋吹向陸地（東南風，濕潤）</p>
                <p><strong>🏔️ 青藏高原</strong>阻擋季風，使氣流抬升，在迎風坡產生降水。</p>
            `
        },
        nextModule: 'disaster'
    },
    disaster: {
        name: '災害應對工程',
        tasks: [
            { id: 'deploy_tool', text: '部署至少一個應對工具', check: () => ClimateState.disaster.tools.length >= 1 },
            { id: 'moisture_goal', text: '將土壤濕度提升至 60% 以上', check: () => ClimateState.disaster.moisture >= 60 },
            { id: 'eco_balance', text: '保持環境健康度在 50 以上', check: () => ClimateState.disaster.ecoScore >= 50 }
        ],
        summary: {
            title: '災害應對策略',
            content: `
                <p><strong>💧 水資源管理</strong>：南水北調等跨區域調水工程可有效緩解旱情，但成本高昂。</p>
                <p><strong>🌱 生態工程</strong>：退耕還林、節水灌溉等措施可長期改善生態環境。</p>
                <p><strong>⚖️ 權衡與決策</strong>：應對災害需要平衡經濟成本、效果和環境影響。</p>
                <p><strong>🎯 恭喜完成</strong>：你已經學習了全球氣候、區域季風和災害應對的基本知識！</p>
            `
        },
        nextModule: null // 最後一個模塊
    }
};

// 檢查模塊任務完成狀態
function checkModuleTasks(moduleName) {
    const moduleTasks = ModuleTasks[moduleName];
    if (!moduleTasks) return { completed: [], total: 0, allCompleted: false };
    
    // 使用 Set 獲取已記錄的完成任務 (O(1) 查找)
    const previouslyCompleted = new Set(ClimateState.tasks[moduleName].completed || []);
    
    // 檢查當前是否有任務完成
    moduleTasks.tasks.forEach(task => {
        if (task.check()) {
            previouslyCompleted.add(task.id);
        }
    });
    
    // 轉換回數組並更新完成狀態（任務一旦完成就保持完成）
    const completed = Array.from(previouslyCompleted);
    ClimateState.tasks[moduleName].completed = completed;
    ClimateState.tasks[moduleName].allCompleted = completed.length === moduleTasks.tasks.length;
    
    return {
        completed,
        total: moduleTasks.tasks.length,
        allCompleted: ClimateState.tasks[moduleName].allCompleted
    };
}

// 保存狀態到 LocalStorage
function saveState() {
    localStorage.setItem('atmosphereArchitectState', JSON.stringify(ClimateState));
}

// 從 LocalStorage 加載狀態
function loadState() {
    const saved = localStorage.getItem('atmosphereArchitectState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(ClimateState, parsed);
        return true;
    }
    return false;
}

// 重置狀態
function resetState() {
    ClimateState.currentModule = 'onboarding';
    ClimateState.onboardingComplete = false;
    ClimateState.global = {
        solarRadiation: 100,
        rotationSpeed: 50,
        avgTemperature: 15,
        circulationStability: 50
    };
    ClimateState.regional = {
        month: 1,
        plateauActive: true,
        landTemp: 0,
        seaTemp: 15,
        windDirection: 'NW',
        humidity: 30
    };
    ClimateState.disaster = {
        budget: 100,
        moisture: 20,
        ecoScore: 100,
        tools: [],
        submitted: false
    };
    localStorage.removeItem('atmosphereArchitectState');
}

// 計算全球平均氣溫
function calculateGlobalTemperature() {
    // 基礎溫度 + 太陽輻射影響
    const baseTemp = 15;
    const radiationEffect = (ClimateState.global.solarRadiation - 100) * 0.3;
    ClimateState.global.avgTemperature = Math.round((baseTemp + radiationEffect) * 10) / 10;
    return ClimateState.global.avgTemperature;
}

// 計算大氣環流穩定度
function calculateCirculationStability() {
    // 自轉速度影響環流穩定性
    const rotation = ClimateState.global.rotationSpeed;
    // 50-100 之間最穩定
    if (rotation >= 50 && rotation <= 100) {
        ClimateState.global.circulationStability = Math.min(100, 50 + rotation * 0.5);
    } else {
        ClimateState.global.circulationStability = Math.max(0, rotation);
    }
    return Math.round(ClimateState.global.circulationStability);
}

// 計算區域溫度 (季風模塊)
function calculateRegionalTemperatures() {
    const month = ClimateState.regional.month;
    
    // 陸地溫度: 大幅度季節變化
    // 使用 sin 函數模擬季節變化，7月最熱，1月最冷
    const landBase = 10;
    const landAmplitude = 25;
    const landTemp = landBase + Math.sin((month - 4) * Math.PI / 6) * landAmplitude;
    
    // 海洋溫度: 小幅度變化
    const seaBase = 18;
    const seaAmplitude = 5;
    const seaTemp = seaBase + Math.sin((month - 4) * Math.PI / 6) * seaAmplitude;
    
    ClimateState.regional.landTemp = Math.round(landTemp * 10) / 10;
    ClimateState.regional.seaTemp = Math.round(seaTemp * 10) / 10;
    
    // 根據溫差決定風向
    if (ClimateState.regional.landTemp < ClimateState.regional.seaTemp) {
        // 冬季: 陸冷海暖，高壓在陸地，風從陸吹向海
        ClimateState.regional.windDirection = 'NW';
        ClimateState.regional.humidity = 30;
    } else {
        // 夏季: 陸熱海冷，低壓在陸地，風從海吹向陸
        ClimateState.regional.windDirection = 'SE';
        ClimateState.regional.humidity = 75;
    }
    
    return {
        landTemp: ClimateState.regional.landTemp,
        seaTemp: ClimateState.regional.seaTemp,
        windDirection: ClimateState.regional.windDirection,
        humidity: ClimateState.regional.humidity
    };
}

// 災害模塊: 應用工具效果
function applyDisasterTool(toolId) {
    const tools = {
        'water-transfer': {
            name: '南水北調管道',
            cost: 40,
            moistureEffect: 30,
            ecoEffect: -5
        },
        'groundwater': {
            name: '深層地下水井',
            cost: 10,
            moistureEffect: 15,
            ecoEffect: -20
        },
        'cloud-seeding': {
            name: '人工增雨火箭',
            cost: 5,
            moistureEffect: ClimateState.disaster.moisture > 40 ? 10 : 0,
            ecoEffect: 0
        },
        'drought-crops': {
            name: '抗旱作物推廣',
            cost: 20,
            moistureEffect: 0, // 特殊: 降低需求閾值
            ecoEffect: 5
        }
    };
    
    const tool = tools[toolId];
    if (!tool) return { success: false, message: '未知工具' };
    
    if (ClimateState.disaster.budget < tool.cost) {
        return { success: false, message: '預算不足' };
    }
    
    // 應用效果
    ClimateState.disaster.budget -= tool.cost;
    ClimateState.disaster.moisture = Math.min(100, ClimateState.disaster.moisture + tool.moistureEffect);
    ClimateState.disaster.ecoScore = Math.max(0, Math.min(100, ClimateState.disaster.ecoScore + tool.ecoEffect));
    ClimateState.disaster.tools.push(toolId);
    
    return { 
        success: true, 
        message: `已部署: ${tool.name}`,
        tool: tool
    };
}

// 災害模塊: 計算最終分數
function calculateDisasterScore() {
    const moisture = ClimateState.disaster.moisture;
    const budget = ClimateState.disaster.budget;
    const eco = ClimateState.disaster.ecoScore;
    
    // 檢查是否使用了抗旱作物 (降低濕度需求)
    const hasdroughtCrops = ClimateState.disaster.tools.includes('drought-crops');
    const moistureThreshold = hasdroughtCrops ? 45 : 60;
    
    // 計算分數
    const finalScore = (moisture * 0.5) + (budget * 0.3) + (eco * 0.2);
    
    let result = {
        score: Math.round(finalScore),
        moisture: moisture,
        budget: budget,
        ecoScore: eco,
        grade: '',
        message: ''
    };
    
    if (moisture < moistureThreshold) {
        result.grade = 'F';
        result.message = '任務失敗：農作物枯死';
    } else if (eco < 50) {
        result.grade = 'F';
        result.message = '任務失敗：生態崩潰';
    } else if (finalScore > 80) {
        result.grade = 'S';
        result.message = '評級 S：完美的氣候工程師！';
    } else if (finalScore > 60) {
        result.grade = 'A';
        result.message = '評級 A：任務完成';
    } else {
        result.grade = 'B';
        result.message = '評級 B：勉強通過';
    }
    
    return result;
}

// 導出給其他模塊使用
window.ClimateState = ClimateState;
window.ModuleTasks = ModuleTasks;
window.saveState = saveState;
window.loadState = loadState;
window.resetState = resetState;
window.calculateGlobalTemperature = calculateGlobalTemperature;
window.calculateCirculationStability = calculateCirculationStability;
window.calculateRegionalTemperatures = calculateRegionalTemperatures;
window.applyDisasterTool = applyDisasterTool;
window.calculateDisasterScore = calculateDisasterScore;
window.checkModuleTasks = checkModuleTasks;


