// Global object to share player movement data with p5.js sketch
window.playerMovementData = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0
};

// Global object to share player movement data with p5.js sketch
window.playerMovementData = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0
};
// --- 音效與音樂引擎 (使用 Web Audio API) ---
const AudioEngine = {
    ctx: null,
    bgmInterval: null,
    isMuted: false,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playLaser() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },
    playExplosion() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    },
    playPowerUp() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },
    startBGM() {
        this.stopBGM();
        let beat = 0;
        this.bgmInterval = setInterval(() => {
            if (this.isMuted) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            // 簡單的電子節奏
            const freq = beat % 4 === 0 ? 55 : (beat % 2 === 0 ? 110 : 82);
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
            beat++;
        }, 200);
    },
    stopBGM() {
        if (this.bgmInterval) clearInterval(this.bgmInterval);
    }
};

// --- 視覺效果實體 ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 4 + 2;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.alpha -= this.decay;
        this.speed *= 0.98;
    }
}

// --- 遊戲實體類別 ---

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#00ffff';
        this.speed = 5;
        this.hp = 100;
        this.maxHp = 100;
        this.shield = 0;
        this.powerUpLevel = 1;
        this.angle = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -15);
        ctx.lineTo(-10, 15);
        ctx.closePath();
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();

        if (this.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
        }
        ctx.restore();
    }

    update(keys, mouse, canvas) {
        let prevX = this.x;
        let prevY = this.y;

        if (keys['w'] || keys['ArrowUp']) this.y -= this.speed;
        if (keys['s'] || keys['ArrowDown']) this.y += this.speed;
        if (keys['a'] || keys['ArrowLeft']) this.x -= this.speed;
        if (keys['d'] || keys['ArrowRight']) this.x += this.speed;

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // Update global player movement data
        window.playerMovementData.x = this.x;
        window.playerMovementData.y = this.y;
        window.playerMovementData.dx = this.x - prevX;
        window.playerMovementData.dy = this.y - prevY;
    }
}

class Bullet {
    constructor(x, y, angle, color = '#00ffff', speed = 10, damage = 1, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = 3;
        this.color = color;
        this.damage = damage;
        this.isEnemy = isEnemy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
}

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.speed = 2;
        this.hp = 1;
        this.maxHp = 1;
        this.color = '#ff0055';
        this.points = 10;
        this.lastShoot = 0;

        if (type === 'fast') {
            this.speed = 4;
            this.color = '#ffaa00';
            this.radius = 12;
        } else if (type === 'tank') {
            this.speed = 1;
            this.hp = 6;
            this.maxHp = 6;
            this.radius = 25;
            this.color = '#8800ff';
            this.points = 50;
        } else if (type === 'boss') {
            this.speed = 1.2;
            this.hp = 60;
            this.maxHp = 60;
            this.radius = 60;
            this.color = '#ffffff';
            this.points = 1000;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        if (this.type === 'tank') {
            ctx.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();
        
        if (this.type === 'boss') {
            // BOSS 血條背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(this.x - 50, this.y - 85, 100, 8);
            // BOSS 當前血條
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - 50, this.y - 85, (this.hp / this.maxHp) * 100, 8);
        }
        ctx.restore();
    }

    update(playerX, playerY, game) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // BOSS 射擊邏輯
        if (this.type === 'boss') {
            const now = Date.now();
            if (now - this.lastShoot > 1500) {
                // 發射圓周彈幕
                for (let i = 0; i < 8; i++) {
                    const shotAngle = (Math.PI * 2 / 8) * i;
                    game.bullets.push(new Bullet(this.x, this.y, shotAngle, '#ff0000', 5, 1, true));
                }
                this.lastShoot = now;
            }
        }
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; 
        this.radius = 18;
        this.color = type === 'multi' ? '#00ff00' : (type === 'shield' ? '#ffff00' : '#ff00ff');
        this.pulse = 0;
    }

    draw(ctx) {
        this.pulse += 0.1;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulse) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), this.x, this.y + 5);
        ctx.restore();
    }
}

// --- 遊戲主引擎 ---

const Game = {
    canvas: null,
    ctx: null,
    player: null,
    bullets: [],
    enemies: [],
    powerups: [],
    particles: [],
    score: 0,
    keys: {},
    mouse: { x: 0, y: 0 },
    gameState: 'menu',
    spawnRate: 1500,
    lastSpawn: 0,
    bossSpawned: false,
    shakeTime: 0,
    introducedEnemies: new Set(), // New: To track introduced enemy types
    enemyData: { // New: Enemy information for display
        'normal': {
            name: '普通敵人',
            description: '最基本的敵人，移動速度一般，血量低。',
            visual: '●', // Circle
            color: '#ff0055'
        },
        'fast': {
            name: '快速敵人',
            description: '移動速度快，但血量依然很低，體型較小。',
            visual: '▲', // Triangle (or smaller circle)
            color: '#ffaa00'
        },
        'tank': {
            name: '坦克敵人',
            description: '移動緩慢，但血量非常高，體型較大，外形為方形。',
            visual: '■', // Square
            color: '#8800ff'
        },
        'boss': {
            name: '頭目敵人',
            description: '巨大且血量極高，會發射彈幕攻擊玩家。',
            visual: '★', // Star (or large circle)
            color: '#ffffff'
        }
    },
    stageCleared200: false, // New: To track if 200 score clearance screen has been shown
    stageCleared500: false, // New: To track if 500 score clearance screen has been shown

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
        window.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        window.addEventListener('mousedown', () => this.shoot());
        
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());

        this.loop();
    },

    resize() {
        this.canvas.width = window.innerWidth * 0.9;
        this.canvas.height = window.innerHeight * 0.9;
    },

    start() {
        AudioEngine.init();
        AudioEngine.startBGM();
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.particles = [];
        this.score = 0;
        this.spawnRate = 1500;
        this.bossSpawned = false;
        this.introducedEnemies.clear(); // Reset introduced enemies
        this.stageCleared200 = false; // Reset stage clearance flag
        this.stageCleared500 = false; // Reset stage clearance flag for 500 points
        this.gameState = 'playing';
        
        document.getElementById('menu-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('enemy-info-overlay').classList.add('hidden'); // Hide enemy info overlay
        document.getElementById('stage-clear-overlay').classList.add('hidden'); // Hide stage clear overlay
        document.getElementById('score').innerText = '0';
        document.getElementById('health-bar').style.width = '100%';
    },

    shoot() {
        if (this.gameState !== 'playing') return;
        AudioEngine.playLaser();
        
        const p = this.player;
        if (p.powerUpLevel === 1) {
            this.bullets.push(new Bullet(p.x, p.y, p.angle));
        } else if (p.powerUpLevel === 2) {
            this.bullets.push(new Bullet(p.x, p.y, p.angle - 0.15));
            this.bullets.push(new Bullet(p.x, p.y, p.angle + 0.15));
        } else {
            this.bullets.push(new Bullet(p.x, p.y, p.angle));
            this.bullets.push(new Bullet(p.x, p.y, p.angle - 0.3));
            this.bullets.push(new Bullet(p.x, p.y, p.angle + 0.3));
        }
    },

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    },

    shake(intensity) {
        this.shakeTime = intensity;
    },

    showEnemyInfo(enemyType) {
        const infoOverlay = document.getElementById('enemy-info-overlay');
        const infoName = document.getElementById('enemy-info-name');
        const infoDescription = document.getElementById('enemy-info-description');
        const infoVisual = document.getElementById('enemy-info-visual');

        const enemyData = this.enemyData[enemyType];
        if (!enemyData) return;

        infoName.innerText = enemyData.name;
        infoDescription.innerText = enemyData.description;
        infoVisual.innerText = enemyData.visual;
        infoVisual.style.borderColor = enemyData.color;
        infoVisual.style.boxShadow = `0 0 20px ${enemyData.color}`;
        infoVisual.style.color = enemyData.color;

        infoOverlay.classList.remove('hidden');
        this.gameState = 'paused'; // Pause the game

        setTimeout(() => {
            infoOverlay.classList.add('hidden');
            this.gameState = 'playing'; // Resume the game
        }, 4000); // Display for 4 seconds
    },

    showClearanceScreen(message = "階段完成！", subMessage = "準備好迎接新的挑戰！") {
        const clearanceOverlay = document.getElementById('stage-clear-overlay');
        clearanceOverlay.querySelector('h1').innerText = message;
        clearanceOverlay.querySelector('p').innerText = subMessage;
        clearanceOverlay.classList.remove('hidden');
        this.gameState = 'paused'; // Pause the game

        setTimeout(() => {
            clearanceOverlay.classList.add('hidden');
            this.gameState = 'playing'; // Resume the game
        }, 3000); // Display for 3 seconds
    },

    spawnEnemy() {
        const now = Date.now();
        if (now - this.lastSpawn > this.spawnRate) {
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -50 : this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
            } else {
                x = Math.random() * this.canvas.width;
                y = Math.random() < 0.5 ? -50 : this.canvas.height + 50;
            }

            let type = 'normal';
            const r = Math.random();
            // 每 800 分生成一個 BOSS
            if (this.score >= 800 && !this.bossSpawned) {
                type = 'boss';
                this.bossSpawned = true;
            } else if (this.score >= 500 && r < 0.25) {
                type = 'tank';
            } else if (this.score >= 200 && r < 0.4) { // Fast enemy appears after 200 score
                type = 'fast';
            }
            // If score is less than 200, type remains 'normal'

            // Check if this enemy type has been introduced
            if (!this.introducedEnemies.has(type)) {
                this.showEnemyInfo(type);
                this.introducedEnemies.add(type);
            }

            this.enemies.push(new Enemy(x, y, type));
            this.lastSpawn = now;
            if (this.spawnRate > 350) this.spawnRate -= 8;
        }
    },

    update() {
        if (this.gameState !== 'playing') return;

        // Check for 200 score clearance
        if (this.score >= 200 && !this.stageCleared200) {
            this.showClearanceScreen("恭喜通關！", "快速敵人將加入戰場！");
            this.stageCleared200 = true;
            this.introducedEnemies.add('fast'); // Mark 'fast' enemy as introduced
        }

        // Check for 500 score clearance
        if (this.score >= 500 && !this.stageCleared500) {
            this.showClearanceScreen("恭喜通關！", "坦克敵人將加入戰場！");
            this.stageCleared500 = true;
            this.introducedEnemies.add('tank'); // Mark 'tank' enemy as introduced
        }

        // Check for 500 score clearance
        if (this.score >= 500 && !this.stageCleared500) {
            this.showClearanceScreen("恭喜通關！", "坦克敵人將加入戰場！");
            this.stageCleared500 = true;
            this.introducedEnemies.add('tank'); // Mark 'tank' enemy as introduced
        }

        this.player.update(this.keys, this.mouse, this.canvas);
        this.spawnEnemy();

        // 更新粒子
        this.particles.forEach((p, i) => {
            p.update();
            if (p.alpha <= 0) this.particles.splice(i, 1);
        });

        // 更新子彈
        this.bullets.forEach((b, i) => {
            b.update();
            
            // 子彈擊中判定
            if (!b.isEnemy) {
                // 玩家子彈擊中敵人
                this.enemies.forEach((e, ei) => {
                    const dist = Math.hypot(e.x - b.x, e.y - b.y);
                    if (dist < e.radius + b.radius) {
                        e.hp -= b.damage;
                        this.bullets.splice(i, 1);
                        this.createExplosion(b.x, b.y, e.color, 3);
                        if (e.hp <= 0) {
                            this.score += e.points;
                            this.shake(e.type === 'boss' ? 20 : 5);
                            this.createExplosion(e.x, e.y, e.color, e.type === 'boss' ? 50 : 15);
                            AudioEngine.playExplosion();
                            
                            if (Math.random() < 0.12) {
                                const types = ['multi', 'shield', 'heal'];
                                this.powerups.push(new PowerUp(e.x, e.y, types[Math.floor(Math.random() * types.length)]));
                            }
                            
                            if (e.type === 'boss') this.bossSpawned = false;
                            this.enemies.splice(ei, 1);
                            document.getElementById('score').innerText = this.score;
                        }
                    }
                });
            } else {
                // 敵人子彈擊中玩家
                const distToPlayer = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                if (distToPlayer < b.radius + this.player.radius) {
                    this.bullets.splice(i, 1);
                    this.hitPlayer(10);
                }
            }

            if (b.x < -100 || b.x > this.canvas.width + 100 || b.y < -100 || b.y > this.canvas.height + 100) {
                this.bullets.splice(i, 1);
            }
        });

        // 更新敵人與玩家碰撞
        this.enemies.forEach((e, ei) => {
            e.update(this.player.x, this.player.y, this);
            const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            if (dist < e.radius + this.player.radius) {
                this.hitPlayer(e.type === 'boss' ? 30 : 15);
                if (e.type !== 'boss') {
                    this.createExplosion(e.x, e.y, e.color, 15);
                    this.enemies.splice(ei, 1);
                }
            }
        });

        // 更新道具
        this.powerups.forEach((p, i) => {
            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist < p.radius + this.player.radius) {
                AudioEngine.playPowerUp();
                if (p.type === 'multi') this.player.powerUpLevel = Math.min(3, this.player.powerUpLevel + 1);
                if (p.type === 'shield') this.player.shield += 1;
                if (p.type === 'heal') this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
                this.powerups.splice(i, 1);
                document.getElementById('health-bar').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
            }
        });
    },

    hitPlayer(damage) {
        if (this.player.shield > 0) {
            this.player.shield--;
            this.shake(5);
            AudioEngine.playExplosion();
        } else {
            this.player.hp -= damage;
            this.shake(10);
            AudioEngine.playExplosion();
            document.getElementById('health-bar').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
            if (this.player.hp <= 0) this.gameOver();
        }
    },

    draw() {
        this.ctx.save();
        
        // 畫面震動
        if (this.shakeTime > 0) {
            const sx = (Math.random() - 0.5) * this.shakeTime;
            const sy = (Math.random() - 0.5) * this.shakeTime;
            this.ctx.translate(sx, sy);
            this.shakeTime *= 0.9;
            if (this.shakeTime < 0.5) this.shakeTime = 0;
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing') {
            this.particles.forEach(p => p.draw(this.ctx));
            this.player.draw(this.ctx);
            this.bullets.forEach(b => b.draw(this.ctx));
            this.enemies.forEach(e => e.draw(this.ctx));
            this.powerups.forEach(p => p.draw(this.ctx));
        }
        
        this.ctx.restore();
    },

    gameOver() {
        this.gameState = 'gameover';
        AudioEngine.stopBGM();
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
        document.getElementById('enemy-info-overlay').classList.add('hidden'); // Hide enemy info overlay
        document.getElementById('stage-clear-overlay').classList.add('hidden'); // Hide stage clear overlay
    },

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};

Game.init();
