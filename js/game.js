/**
 * COMBA INVADERS - A fun space invaders game for kids!
 * Features colorful aliens, friendly spaceship, and lots of fun effects
 */

// ============================================
// Game Configuration
// ============================================

const CONFIG = {
    // Canvas settings
    canvasWidth: 600,
    canvasHeight: 500,

    // Player settings
    playerWidth: 60,
    playerHeight: 50,
    playerSpeed: 7,

    // Bullet settings
    bulletWidth: 6,
    bulletHeight: 15,
    bulletSpeed: 8,
    bulletCooldown: 300, // milliseconds

    // Alien settings
    alienWidth: 45,
    alienHeight: 40,
    alienRows: 4,
    alienCols: 8,
    alienPadding: 10,
    alienSpeedX: 1.5,
    alienSpeedY: 25,
    alienShootChance: 0.002,

    // Game settings
    startingLives: 3,
    pointsPerAlien: 10,
    speedIncreasePerLevel: 0.3
};

// ============================================
// Game State
// ============================================

let canvas, ctx;
let gameRunning = false;
let score = 0;
let lives = CONFIG.startingLives;
let level = 1;
let lastBulletTime = 0;

// Game objects
let player = {
    x: 0,
    y: 0,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    speed: CONFIG.playerSpeed,
    color: '#48dbfb'
};

let bullets = [];
let alienBullets = [];
let aliens = [];
let particles = [];
let stars = [];

// Input state
let keys = {
    left: false,
    right: false,
    space: false
};

// Alien direction
let alienDirection = 1;

// ============================================
// Cute Alien Designs (Emoji-style faces)
// ============================================

const ALIEN_TYPES = [
    { color: '#ff6b6b', eyes: '👀', mouth: '😊' },   // Red happy alien
    { color: '#feca57', eyes: '👁️', mouth: '😄' },  // Yellow grinning alien
    { color: '#48dbfb', eyes: '🌟', mouth: '😋' },   // Blue silly alien
    { color: '#ff9ff3', eyes: '💖', mouth: '🥰' },   // Pink lovely alien
    { color: '#54a0ff', eyes: '✨', mouth: '😎' },   // Cool blue alien
    { color: '#5f27cd', eyes: '🔮', mouth: '😜' }    // Purple winking alien
];

// ============================================
// Initialization
// ============================================

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = CONFIG.canvasWidth;
    canvas.height = CONFIG.canvasHeight;

    // Initialize player position
    player.x = (canvas.width - player.width) / 2;
    player.y = canvas.height - player.height - 20;

    // Create background stars
    createStars();

    // Set up event listeners
    setupEventListeners();

    // Start game loop (but game not running yet)
    requestAnimationFrame(gameLoop);
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
        if (e.key === ' ') {
            keys.space = true;
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
        if (e.key === ' ') keys.space = false;
    });

    // Button controls
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
}

// ============================================
// Game Flow
// ============================================

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    resetGame();
    gameRunning = true;
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    level = 1;
    resetGame();
    gameRunning = true;
}

function nextLevel() {
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    level++;
    document.getElementById('level').textContent = level;
    createAliens();
    gameRunning = true;
}

function resetGame() {
    score = 0;
    lives = CONFIG.startingLives;
    bullets = [];
    alienBullets = [];
    particles = [];
    alienDirection = 1;

    // Reset player position
    player.x = (canvas.width - player.width) / 2;

    // Update display
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = '❤️'.repeat(lives);
    document.getElementById('level').textContent = level;

    // Create aliens
    createAliens();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function levelComplete() {
    gameRunning = false;
    document.getElementById('levelCompleteScreen').classList.remove('hidden');
}

// ============================================
// Object Creation
// ============================================

function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * CONFIG.canvasWidth,
            y: Math.random() * CONFIG.canvasHeight,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.2,
            brightness: Math.random()
        });
    }
}

function createAliens() {
    aliens = [];
    const startX = 50;
    const startY = 50;
    const speedMultiplier = 1 + (level - 1) * CONFIG.speedIncreasePerLevel;

    for (let row = 0; row < CONFIG.alienRows; row++) {
        for (let col = 0; col < CONFIG.alienCols; col++) {
            const typeIndex = row % ALIEN_TYPES.length;
            aliens.push({
                x: startX + col * (CONFIG.alienWidth + CONFIG.alienPadding),
                y: startY + row * (CONFIG.alienHeight + CONFIG.alienPadding),
                width: CONFIG.alienWidth,
                height: CONFIG.alienHeight,
                type: ALIEN_TYPES[typeIndex],
                alive: true,
                wobble: Math.random() * Math.PI * 2,
                speedMultiplier: speedMultiplier
            });
        }
    }
}

function createBullet() {
    const now = Date.now();
    if (now - lastBulletTime < CONFIG.bulletCooldown) return;

    lastBulletTime = now;
    bullets.push({
        x: player.x + player.width / 2 - CONFIG.bulletWidth / 2,
        y: player.y,
        width: CONFIG.bulletWidth,
        height: CONFIG.bulletHeight,
        color: '#feca57'
    });

    // Visual feedback - small particle burst
    createParticles(player.x + player.width / 2, player.y, '#feca57', 3);
}

function createAlienBullet(alien) {
    alienBullets.push({
        x: alien.x + alien.width / 2 - 4,
        y: alien.y + alien.height,
        width: 8,
        height: 12,
        color: alien.type.color
    });
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 6 + 2,
            color: color,
            life: 1
        });
    }
}

// ============================================
// Update Functions
// ============================================

function update() {
    if (!gameRunning) return;

    updatePlayer();
    updateBullets();
    updateAliens();
    updateAlienBullets();
    updateParticles();
    updateStars();
    checkCollisions();
}

function updatePlayer() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys.space) {
        createBullet();
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= CONFIG.bulletSpeed;
        return bullet.y > -bullet.height;
    });
}

function updateAliens() {
    let shouldMoveDown = false;
    const aliveAliens = aliens.filter(a => a.alive);

    // Check if any alien hits the edge
    aliveAliens.forEach(alien => {
        if ((alien.x + alien.width >= canvas.width - 10 && alienDirection > 0) ||
            (alien.x <= 10 && alienDirection < 0)) {
            shouldMoveDown = true;
        }
    });

    // Move aliens
    if (shouldMoveDown) {
        alienDirection *= -1;
        aliveAliens.forEach(alien => {
            alien.y += CONFIG.alienSpeedY;
        });
    }

    aliveAliens.forEach(alien => {
        alien.x += CONFIG.alienSpeedX * alienDirection * alien.speedMultiplier;
        alien.wobble += 0.1;

        // Alien shooting
        if (Math.random() < CONFIG.alienShootChance * alien.speedMultiplier) {
            createAlienBullet(alien);
        }

        // Check if aliens reached the player
        if (alien.y + alien.height >= player.y) {
            gameOver();
        }
    });

    // Check if all aliens are destroyed
    if (aliveAliens.length === 0) {
        levelComplete();
    }
}

function updateAlienBullets() {
    alienBullets = alienBullets.filter(bullet => {
        bullet.y += 5;
        return bullet.y < canvas.height;
    });
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.size *= 0.98;
        return particle.life > 0;
    });
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        star.brightness = 0.5 + Math.sin(Date.now() / 500 + star.x) * 0.5;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// ============================================
// Collision Detection
// ============================================

function checkCollisions() {
    // Bullets hitting aliens
    bullets.forEach((bullet, bulletIndex) => {
        aliens.forEach(alien => {
            if (alien.alive && isColliding(bullet, alien)) {
                alien.alive = false;
                bullets.splice(bulletIndex, 1);
                score += CONFIG.pointsPerAlien * level;
                document.getElementById('score').textContent = score;

                // Create explosion particles
                createParticles(
                    alien.x + alien.width / 2,
                    alien.y + alien.height / 2,
                    alien.type.color,
                    15
                );
            }
        });
    });

    // Alien bullets hitting player
    alienBullets.forEach((bullet, index) => {
        if (isColliding(bullet, player)) {
            alienBullets.splice(index, 1);
            lives--;
            document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));

            // Create hit effect
            createParticles(
                player.x + player.width / 2,
                player.y + player.height / 2,
                '#ff6b6b',
                20
            );

            if (lives <= 0) {
                gameOver();
            }
        }
    });
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// ============================================
// Drawing Functions
// ============================================

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars();
    drawParticles();
    drawPlayer();
    drawBullets();
    drawAliens();
    drawAlienBullets();
}

function drawStars() {
    stars.forEach(star => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;

    // Ship body
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.8, y + h);
    ctx.lineTo(x + w / 2, y + h * 0.7);
    ctx.lineTo(x + w * 0.2, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // Ship accent
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 10);
    ctx.lineTo(x + w * 0.65, y + h * 0.6);
    ctx.lineTo(x + w / 2, y + h * 0.5);
    ctx.lineTo(x + w * 0.35, y + h * 0.6);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#feca57';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow
    ctx.fillStyle = '#ff9ff3';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 5, 15, 8 + Math.sin(Date.now() / 50) * 3, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawBullets() {
    bullets.forEach(bullet => {
        // Glow effect
        const gradient = ctx.createRadialGradient(
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 0,
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 15
        );
        gradient.addColorStop(0, 'rgba(254, 202, 87, 0.8)');
        gradient.addColorStop(1, 'rgba(254, 202, 87, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(bullet.x - 10, bullet.y - 10, bullet.width + 20, bullet.height + 20);

        // Bullet body
        ctx.fillStyle = '#feca57';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawAliens() {
    aliens.filter(a => a.alive).forEach(alien => {
        const wobbleOffset = Math.sin(alien.wobble) * 3;

        // Alien body (rounded rectangle)
        ctx.fillStyle = alien.type.color;
        roundRect(
            ctx,
            alien.x,
            alien.y + wobbleOffset,
            alien.width,
            alien.height * 0.8,
            10
        );

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(alien.x + alien.width * 0.3, alien.y + wobbleOffset + alien.height * 0.3, 7, 0, Math.PI * 2);
        ctx.arc(alien.x + alien.width * 0.7, alien.y + wobbleOffset + alien.height * 0.3, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(alien.x + alien.width * 0.3, alien.y + wobbleOffset + alien.height * 0.3, 3, 0, Math.PI * 2);
        ctx.arc(alien.x + alien.width * 0.7, alien.y + wobbleOffset + alien.height * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(alien.x + alien.width / 2, alien.y + wobbleOffset + alien.height * 0.45, 10, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Antennae
        ctx.strokeStyle = alien.type.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(alien.x + alien.width * 0.3, alien.y + wobbleOffset);
        ctx.lineTo(alien.x + alien.width * 0.2, alien.y + wobbleOffset - 10);
        ctx.moveTo(alien.x + alien.width * 0.7, alien.y + wobbleOffset);
        ctx.lineTo(alien.x + alien.width * 0.8, alien.y + wobbleOffset - 10);
        ctx.stroke();

        // Antenna tips
        ctx.fillStyle = '#feca57';
        ctx.beginPath();
        ctx.arc(alien.x + alien.width * 0.2, alien.y + wobbleOffset - 12, 4, 0, Math.PI * 2);
        ctx.arc(alien.x + alien.width * 0.8, alien.y + wobbleOffset - 12, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawAlienBullets() {
    alienBullets.forEach(bullet => {
        // Glow
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// ============================================
// Game Loop
// ============================================

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// Start the game when page loads
// ============================================

window.addEventListener('load', init);
