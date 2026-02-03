/* ========================================
   模塊 0: 引導教程 - Atmosphere Architect
   ======================================== */

// 打字機文本序列
const typewriterSequence = [
    { text: '> SYSTEM BOOT...', delay: 50, class: '' },
    { text: '> 初始化大氣模擬系統...', delay: 40, class: '' },
    { text: '> [警告] 大氣層狀態：', delay: 40, class: 'warning', inline: true },
    { text: '缺失', delay: 100, class: 'highlight' },
    { text: '> [警告] 全球溫度：', delay: 40, class: 'warning', inline: true },
    { text: '-273°C (絕對零度)', delay: 60, class: 'highlight' },
    { text: '> [錯誤] 無法維持生命...', delay: 50, class: 'warning' },
    { text: '> ', delay: 200, class: '', inline: true },
    { text: '請注入能量以啟動系統', delay: 80, class: 'success' }
];

// 背景粒子系統
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1
        };
    }
    
    init(count = 100) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // 邊界檢測
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製粒子
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
            this.ctx.fill();
        });
        
        // 繪製連線
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 * (1 - dist / 150)})`;
                    this.ctx.stroke();
                }
            });
        });
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// 打字機效果類
class Typewriter {
    constructor(element, cursor) {
        this.element = element;
        this.cursor = cursor;
        this.currentLine = null;
        this.isTyping = false;
    }
    
    async typeSequence(sequence, onComplete) {
        this.isTyping = true;
        
        for (const item of sequence) {
            if (!item.inline) {
                // 新建一行
                this.currentLine = document.createElement('div');
                this.currentLine.className = 'line current';
                this.element.appendChild(this.currentLine);
            }
            
            // 打字效果
            await this.typeText(item.text, item.delay, item.class);
            
            // 標記為完成
            if (!item.inline && this.currentLine) {
                this.currentLine.classList.remove('current');
                this.currentLine.classList.add('complete');
            }
            
            // 行間停頓
            await this.sleep(300);
        }
        
        this.isTyping = false;
        if (onComplete) onComplete();
    }
    
    async typeText(text, delay = 50, className = '') {
        const span = document.createElement('span');
        if (className) span.className = className;
        this.currentLine.appendChild(span);
        
        for (const char of text) {
            span.textContent += char;
            await this.sleep(delay);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 太陽啟動動畫
function playSunIgniteAnimation(callback) {
    // 創建動畫容器
    const animContainer = document.createElement('div');
    animContainer.className = 'ignite-animation';
    
    const sunBurst = document.createElement('div');
    sunBurst.className = 'sun-burst';
    animContainer.appendChild(sunBurst);
    
    document.body.appendChild(animContainer);
    
    // 動畫結束後清理並回調
    setTimeout(() => {
        animContainer.remove();
        if (callback) callback();
    }, 2000);
}

// 初始化引導模塊
function initOnboarding() {
    const canvas = document.getElementById('particle-bg');
    const typewriterEl = document.getElementById('typewriter-text');
    const cursorEl = document.getElementById('cursor');
    const igniteBtn = document.getElementById('ignite-btn');
    
    // 檢查是否已完成引導
    if (loadState() && ClimateState.onboardingComplete) {
        // 跳過引導，直接進入主界面
        skipOnboarding();
        return;
    }
    
    // 初始化粒子系統
    const particleSystem = new ParticleSystem(canvas);
    particleSystem.init(80);
    particleSystem.animate();
    
    // 初始化打字機
    const typewriter = new Typewriter(typewriterEl, cursorEl);
    
    // 開始打字序列
    setTimeout(() => {
        typewriter.typeSequence(typewriterSequence, () => {
            // 顯示啟動按鈕
            igniteBtn.classList.remove('hidden');
            setTimeout(() => {
                igniteBtn.classList.add('visible');
            }, 100);
        });
    }, 1000);
    
    // 啟動按鈕點擊事件
    igniteBtn.addEventListener('click', () => {
        igniteBtn.disabled = true;
        igniteBtn.style.pointerEvents = 'none';
        
        // 播放太陽啟動動畫
        playSunIgniteAnimation(() => {
            // 更新狀態
            ClimateState.onboardingComplete = true;
            ClimateState.currentModule = 'global';
            saveState();
            
            // 切換到模塊 1
            transitionToModule('global-lab-screen');
        });
    });
}

// 跳過引導
function skipOnboarding() {
    const onboardingScreen = document.getElementById('onboarding-screen');
    onboardingScreen.classList.remove('active');
    
    // 顯示導航欄
    document.getElementById('main-nav').classList.remove('hidden');
    
    // 進入上次的模塊
    const targetScreen = getScreenByModule(ClimateState.currentModule);
    document.getElementById(targetScreen).classList.add('active');
}

// 模塊切換
function transitionToModule(screenId) {
    // 隱藏所有畫面
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 顯示目標畫面
    setTimeout(() => {
        document.getElementById(screenId).classList.add('active');
        
        // 顯示導航欄
        document.getElementById('main-nav').classList.remove('hidden');
        
        // 更新導航按鈕狀態
        updateNavButtons(screenId);
    }, 100);
}

// 根據模塊名獲取畫面 ID
function getScreenByModule(module) {
    const mapping = {
        'onboarding': 'onboarding-screen',
        'global': 'global-lab-screen',
        'regional': 'regional-screen',
        'disaster': 'disaster-screen'
    };
    return mapping[module] || 'global-lab-screen';
}

// 更新導航按鈕狀態
function updateNavButtons(activeScreenId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.target === activeScreenId) {
            btn.classList.add('active');
        }
    });
}

// 導出
window.initOnboarding = initOnboarding;
window.transitionToModule = transitionToModule;
window.updateNavButtons = updateNavButtons;
