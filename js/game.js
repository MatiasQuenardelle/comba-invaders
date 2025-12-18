/**
 * COMBA INVADERS - ¡Aventura Intergaláctica!
 * Un divertido juego de OVNIs, aliens, planetas y el universo
 * Optimizado para móvil y escritorio
 */

// ============================================
// Configuración del Juego
// ============================================

const CONFIG = {
    // Configuración base del canvas (se escala responsivamente)
    baseCanvasWidth: 600,
    baseCanvasHeight: 500,

    // Configuración del jugador
    playerWidth: 60,
    playerHeight: 50,
    playerSpeed: 7,

    // Configuración de disparos láser
    bulletWidth: 6,
    bulletHeight: 15,
    bulletSpeed: 8,
    bulletCooldown: 250, // milisegundos (más rápido para móvil)

    // Configuración de OVNIs enemigos
    alienWidth: 45,
    alienHeight: 40,
    alienRows: 4,
    alienCols: 8,
    alienPadding: 10,
    alienSpeedX: 1.5,
    alienSpeedY: 25,
    alienShootChance: 0.002,

    // Configuración del juego
    startingLives: 3,
    pointsPerAlien: 10,
    speedIncreasePerLevel: 0.3
};

// ============================================
// Estado del Juego
// ============================================

let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = CONFIG.startingLives;
let level = 1;
let lastBulletTime = 0;
let scale = 1;

// Objetos del juego
let player = {
    x: 0,
    y: 0,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    speed: CONFIG.playerSpeed,
    color: '#00ff88'
};

let bullets = [];
let alienBullets = [];
let aliens = [];
let particles = [];
let stars = [];
let nebulas = [];
let planets = [];

// Estado de entrada
let keys = {
    left: false,
    right: false,
    space: false
};

// Dirección de los OVNIs invasores
let alienDirection = 1;

// Detección de dispositivo móvil
let isMobile = false;

// ============================================
// Tipos de OVNIs Extraterrestres
// ============================================

const ALIEN_TYPES = [
    { color: '#00ff88', eyes: '👁️', type: 'clasico', nombre: 'Explorador de Marte' },
    { color: '#88ff00', eyes: '👀', type: 'mutante', nombre: 'Mutante de Plutón' },
    { color: '#00ffcc', eyes: '🔮', type: 'psiquico', nombre: 'Psíquico de Neptuno' },
    { color: '#ff00ff', eyes: '💜', type: 'cosmico', nombre: 'Viajero Cósmico' },
    { color: '#ffff00', eyes: '⚡', type: 'electrico', nombre: 'Centella de Júpiter' },
    { color: '#ff6600', eyes: '🔥', type: 'solar', nombre: 'Guerrero Solar' }
];

// Nombres de planetas para cada nivel
const PLANET_NAMES = [
    'Vía Láctea',
    'Nebulosa de Orión',
    'Sistema de Andrómeda',
    'Cúmulo de Perseo',
    'Galaxia del Remolino',
    'Nube de Magallanes',
    'Constelación de Sagitario',
    'Nebulosa del Cangrejo',
    'Galaxia del Sombrero',
    'Cúmulo de Virgo'
];

// ============================================
// Inicialización
// ============================================

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Detectar dispositivo móvil primero
    detectMobile();

    // Configurar tamaño del canvas responsivo
    resizeCanvas();

    // Inicializar posición del jugador
    resetPlayerPosition();

    // Crear elementos del fondo espacial
    createStars();
    createNebulas();
    createBackgroundPlanets();

    // Configurar event listeners
    setupEventListeners();

    // Iniciar game loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    const maxWidth = Math.min(window.innerWidth - 20, CONFIG.baseCanvasWidth);

    // Calcular escala basada en el ancho disponible
    scale = maxWidth / CONFIG.baseCanvasWidth;

    // Ajustar el canvas interno (siempre usa las dimensiones base)
    canvas.width = CONFIG.baseCanvasWidth;
    canvas.height = CONFIG.baseCanvasHeight;

    // El CSS se encarga de escalar visualmente
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${(CONFIG.baseCanvasHeight / CONFIG.baseCanvasWidth) * maxWidth}px`;

    // Ajustar velocidades para móvil
    if (isMobile) {
        player.speed = CONFIG.playerSpeed * 1.2; // Más rápido en móvil
    }
}

function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 800) ||
               ('ontouchstart' in window);

    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        mobileControls.style.display = isMobile ? 'flex' : 'none';
    }
}

function resetPlayerPosition() {
    player.x = (CONFIG.baseCanvasWidth - player.width) / 2;
    player.y = CONFIG.baseCanvasHeight - player.height - 20;
}

function setupEventListeners() {
    // Controles de teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
        if (e.key === ' ') {
            keys.space = true;
            e.preventDefault();
        }
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        if (e.key === ' ') keys.space = false;
    });

    // Controles de botones
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', togglePause);
    }

    // Controles táctiles para móvil
    setupMobileControls();

    // Redetectar móvil y redimensionar al cambiar tamaño/orientación
    window.addEventListener('resize', () => {
        detectMobile();
        resizeCanvas();
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            detectMobile();
            resizeCanvas();
        }, 100);
    });

    // Prevenir scroll en el juego
    document.body.addEventListener('touchmove', (e) => {
        if (gameRunning) {
            e.preventDefault();
        }
    }, { passive: false });
}

function setupMobileControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const fireBtn = document.getElementById('fireBtn');

    if (!leftBtn || !rightBtn || !fireBtn) return;

    // Función helper para manejar eventos táctiles
    const handleTouch = (btn, key, isStart) => {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[key] = isStart;
            if (isStart) {
                btn.classList.add('pressed');
            } else {
                btn.classList.remove('pressed');
            }
        };
    };

    // Botón izquierdo
    leftBtn.addEventListener('touchstart', handleTouch(leftBtn, 'left', true), { passive: false });
    leftBtn.addEventListener('touchend', handleTouch(leftBtn, 'left', false), { passive: false });
    leftBtn.addEventListener('touchcancel', handleTouch(leftBtn, 'left', false), { passive: false });
    leftBtn.addEventListener('mousedown', () => { keys.left = true; leftBtn.classList.add('pressed'); });
    leftBtn.addEventListener('mouseup', () => { keys.left = false; leftBtn.classList.remove('pressed'); });
    leftBtn.addEventListener('mouseleave', () => { keys.left = false; leftBtn.classList.remove('pressed'); });

    // Botón derecho
    rightBtn.addEventListener('touchstart', handleTouch(rightBtn, 'right', true), { passive: false });
    rightBtn.addEventListener('touchend', handleTouch(rightBtn, 'right', false), { passive: false });
    rightBtn.addEventListener('touchcancel', handleTouch(rightBtn, 'right', false), { passive: false });
    rightBtn.addEventListener('mousedown', () => { keys.right = true; rightBtn.classList.add('pressed'); });
    rightBtn.addEventListener('mouseup', () => { keys.right = false; rightBtn.classList.remove('pressed'); });
    rightBtn.addEventListener('mouseleave', () => { keys.right = false; rightBtn.classList.remove('pressed'); });

    // Botón de disparo
    fireBtn.addEventListener('touchstart', handleTouch(fireBtn, 'space', true), { passive: false });
    fireBtn.addEventListener('touchend', handleTouch(fireBtn, 'space', false), { passive: false });
    fireBtn.addEventListener('touchcancel', handleTouch(fireBtn, 'space', false), { passive: false });
    fireBtn.addEventListener('mousedown', () => { keys.space = true; fireBtn.classList.add('pressed'); });
    fireBtn.addEventListener('mouseup', () => { keys.space = false; fireBtn.classList.remove('pressed'); });
    fireBtn.addEventListener('mouseleave', () => { keys.space = false; fireBtn.classList.remove('pressed'); });

    // Prevenir comportamiento por defecto del touch en controles
    const mobileControlsDiv = document.getElementById('mobileControls');
    if (mobileControlsDiv) {
        mobileControlsDiv.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
}

// ============================================
// Flujo del Juego
// ============================================

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    resetGame();
    gameRunning = true;
    gamePaused = false;
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    level = 1;
    resetGame();
    gameRunning = true;
    gamePaused = false;
}

function nextLevel() {
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    level++;
    document.getElementById('level').textContent = level;
    createAliens();
    gameRunning = true;
    gamePaused = false;
}

function togglePause() {
    if (!gameRunning) return;

    gamePaused = !gamePaused;
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        if (gamePaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
        }
    }
}

function resetGame() {
    score = 0;
    lives = CONFIG.startingLives;
    bullets = [];
    alienBullets = [];
    particles = [];
    alienDirection = 1;

    // Reiniciar posición del jugador
    resetPlayerPosition();

    // Actualizar display
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = '💚'.repeat(lives);
    document.getElementById('level').textContent = level;

    // Crear OVNIs invasores
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
// Creación de Objetos Espaciales
// ============================================

function createStars() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * CONFIG.baseCanvasWidth,
            y: Math.random() * CONFIG.baseCanvasHeight,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.2,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.05 + 0.02,
            color: Math.random() > 0.9 ? '#88ffff' : (Math.random() > 0.8 ? '#ffff88' : '#ffffff')
        });
    }
}

function createNebulas() {
    nebulas = [];
    const nebulaColors = [
        'rgba(0,255,136,0.08)',
        'rgba(136,0,255,0.08)',
        'rgba(0,136,255,0.08)',
        'rgba(255,0,136,0.06)',
        'rgba(255,136,0,0.06)',
        'rgba(0,255,255,0.07)'
    ];

    for (let i = 0; i < 6; i++) {
        nebulas.push({
            x: Math.random() * CONFIG.baseCanvasWidth,
            y: Math.random() * CONFIG.baseCanvasHeight,
            radius: Math.random() * 100 + 50,
            color: nebulaColors[i % nebulaColors.length],
            drift: Math.random() * 0.15 - 0.075
        });
    }
}

function createBackgroundPlanets() {
    planets = [];
    const planetColors = ['#ff6600', '#00aaff', '#ffcc00', '#ff00aa', '#00ffaa'];

    for (let i = 0; i < 3; i++) {
        planets.push({
            x: Math.random() * CONFIG.baseCanvasWidth,
            y: Math.random() * (CONFIG.baseCanvasHeight * 0.4),
            radius: Math.random() * 15 + 8,
            color: planetColors[Math.floor(Math.random() * planetColors.length)],
            hasRing: Math.random() > 0.6,
            drift: Math.random() * 0.05 - 0.025
        });
    }
}

function createAliens() {
    aliens = [];
    const startX = 50;
    const startY = 50;
    const speedMultiplier = 1 + (level - 1) * CONFIG.speedIncreasePerLevel;

    // Ajustar número de columnas en niveles más altos
    const cols = Math.min(CONFIG.alienCols + Math.floor(level / 3), 10);
    const rows = Math.min(CONFIG.alienRows + Math.floor(level / 4), 5);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const typeIndex = (row + level) % ALIEN_TYPES.length;
            aliens.push({
                x: startX + col * (CONFIG.alienWidth + CONFIG.alienPadding),
                y: startY + row * (CONFIG.alienHeight + CONFIG.alienPadding),
                width: CONFIG.alienWidth,
                height: CONFIG.alienHeight,
                type: ALIEN_TYPES[typeIndex],
                alive: true,
                wobble: Math.random() * Math.PI * 2,
                speedMultiplier: speedMultiplier,
                pulsePhase: Math.random() * Math.PI * 2
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
        color: '#00ffcc'
    });

    // Partículas de disparo
    createParticles(player.x + player.width / 2, player.y, '#00ffcc', 4);
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
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 6 + 2,
            color: color,
            life: 1
        });
    }
}

function createExplosion(x, y, color) {
    // Explosión más espectacular
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 8 + 3,
            color: color,
            life: 1
        });
    }

    // Añadir algunas partículas blancas brillantes
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            size: Math.random() * 4 + 2,
            color: '#ffffff',
            life: 0.8
        });
    }
}

// ============================================
// Funciones de Actualización
// ============================================

function update() {
    if (!gameRunning || gamePaused) return;

    updatePlayer();
    updateBullets();
    updateAliens();
    updateAlienBullets();
    updateParticles();
    updateStars();
    updateNebulas();
    updatePlanets();
    checkCollisions();
}

function updatePlayer() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < CONFIG.baseCanvasWidth - player.width) {
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

    // Verificar si algún OVNI toca el borde
    aliveAliens.forEach(alien => {
        if ((alien.x + alien.width >= CONFIG.baseCanvasWidth - 10 && alienDirection > 0) ||
            (alien.x <= 10 && alienDirection < 0)) {
            shouldMoveDown = true;
        }
    });

    // Mover OVNIs
    if (shouldMoveDown) {
        alienDirection *= -1;
        aliveAliens.forEach(alien => {
            alien.y += CONFIG.alienSpeedY;
        });
    }

    aliveAliens.forEach(alien => {
        alien.x += CONFIG.alienSpeedX * alienDirection * alien.speedMultiplier;
        alien.wobble += 0.1;
        alien.pulsePhase += 0.05;

        // Disparo de OVNIs
        if (Math.random() < CONFIG.alienShootChance * alien.speedMultiplier) {
            createAlienBullet(alien);
        }

        // Verificar si los OVNIs llegaron al jugador
        if (alien.y + alien.height >= player.y) {
            gameOver();
        }
    });

    // Verificar si todos los OVNIs fueron destruidos
    if (aliveAliens.length === 0) {
        levelComplete();
    }
}

function updateAlienBullets() {
    alienBullets = alienBullets.filter(bullet => {
        bullet.y += 5;
        return bullet.y < CONFIG.baseCanvasHeight;
    });
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life -= 0.025;
        particle.size *= 0.97;
        return particle.life > 0 && particle.size > 0.5;
    });
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        star.brightness = 0.4 + Math.sin(Date.now() * star.twinkleSpeed + star.x) * 0.6;
        if (star.y > CONFIG.baseCanvasHeight) {
            star.y = 0;
            star.x = Math.random() * CONFIG.baseCanvasWidth;
        }
    });
}

function updateNebulas() {
    nebulas.forEach(nebula => {
        nebula.x += nebula.drift;
        if (nebula.x < -nebula.radius) nebula.x = CONFIG.baseCanvasWidth + nebula.radius;
        if (nebula.x > CONFIG.baseCanvasWidth + nebula.radius) nebula.x = -nebula.radius;
    });
}

function updatePlanets() {
    planets.forEach(planet => {
        planet.x += planet.drift;
        if (planet.x < -planet.radius * 2) planet.x = CONFIG.baseCanvasWidth + planet.radius * 2;
        if (planet.x > CONFIG.baseCanvasWidth + planet.radius * 2) planet.x = -planet.radius * 2;
    });
}

// ============================================
// Detección de Colisiones
// ============================================

function checkCollisions() {
    // Rayos láser golpeando OVNIs
    bullets.forEach((bullet, bulletIndex) => {
        aliens.forEach(alien => {
            if (alien.alive && isColliding(bullet, alien)) {
                alien.alive = false;
                bullets.splice(bulletIndex, 1);
                score += CONFIG.pointsPerAlien * level;
                document.getElementById('score').textContent = score;

                // Explosión espectacular
                createExplosion(
                    alien.x + alien.width / 2,
                    alien.y + alien.height / 2,
                    alien.type.color
                );
            }
        });
    });

    // Disparos de OVNIs golpeando al jugador
    alienBullets.forEach((bullet, index) => {
        if (isColliding(bullet, player)) {
            alienBullets.splice(index, 1);
            lives--;
            document.getElementById('lives').textContent = '💚'.repeat(Math.max(0, lives));

            // Efecto de impacto
            createExplosion(
                player.x + player.width / 2,
                player.y + player.height / 2,
                '#ff0066'
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
// Funciones de Dibujo
// ============================================

function draw() {
    // Fondo del espacio profundo
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.baseCanvasHeight);
    gradient.addColorStop(0, '#050510');
    gradient.addColorStop(0.3, '#0a0a1a');
    gradient.addColorStop(0.6, '#0d1a2d');
    gradient.addColorStop(1, '#1a0d2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.baseCanvasWidth, CONFIG.baseCanvasHeight);

    drawNebulas();
    drawPlanets();
    drawStars();
    drawParticles();
    drawPlayer();
    drawBullets();
    drawAliens();
    drawAlienBullets();

    // Mostrar nombre del sector actual
    if (gameRunning && !gamePaused) {
        drawSectorName();
    }
}

function drawSectorName() {
    const sectorName = PLANET_NAMES[(level - 1) % PLANET_NAMES.length];
    ctx.font = '12px "Fredoka One", cursive';
    ctx.fillStyle = 'rgba(136, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`Sector: ${sectorName}`, CONFIG.baseCanvasWidth - 10, 20);
    ctx.textAlign = 'left';
}

function drawNebulas() {
    nebulas.forEach(nebula => {
        const gradient = ctx.createRadialGradient(
            nebula.x, nebula.y, 0,
            nebula.x, nebula.y, nebula.radius
        );
        gradient.addColorStop(0, nebula.color);
        gradient.addColorStop(0.5, nebula.color.replace('0.08', '0.04').replace('0.06', '0.03').replace('0.07', '0.035'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPlanets() {
    planets.forEach(planet => {
        // Resplandor del planeta
        const glowGradient = ctx.createRadialGradient(
            planet.x, planet.y, 0,
            planet.x, planet.y, planet.radius * 2
        );
        glowGradient.addColorStop(0, planet.color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', 'rgba('));
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Planeta
        const planetGradient = ctx.createRadialGradient(
            planet.x - planet.radius * 0.3, planet.y - planet.radius * 0.3, 0,
            planet.x, planet.y, planet.radius
        );
        planetGradient.addColorStop(0, '#ffffff');
        planetGradient.addColorStop(0.3, planet.color);
        planetGradient.addColorStop(1, '#000000');
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Anillo si tiene
        if (planet.hasRing) {
            ctx.strokeStyle = planet.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(planet.x, planet.y, planet.radius * 1.8, planet.radius * 0.4, Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    });
}

function drawStars() {
    stars.forEach(star => {
        ctx.beginPath();
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;

    // Resplandor del OVNI del jugador
    const glowGradient = ctx.createRadialGradient(
        x + w/2, y + h/2, 0,
        x + w/2, y + h/2, w
    );
    glowGradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.1)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2, w, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo del OVNI (platillo volador)
    const bodyGradient = ctx.createLinearGradient(x, y + h * 0.4, x, y + h * 0.8);
    bodyGradient.addColorStop(0, '#00ffcc');
    bodyGradient.addColorStop(0.5, '#00ff88');
    bodyGradient.addColorStop(1, '#00aa55');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h * 0.6, w/2, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borde metálico
    ctx.strokeStyle = '#88ffcc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cúpula del OVNI
    const domeGradient = ctx.createRadialGradient(
        x + w/2, y + h * 0.3, 0,
        x + w/2, y + h * 0.4, w * 0.3
    );
    domeGradient.addColorStop(0, '#aaffff');
    domeGradient.addColorStop(0.5, '#00ffcc');
    domeGradient.addColorStop(1, '#008866');
    ctx.fillStyle = domeGradient;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h * 0.4, w * 0.3, h * 0.35, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Reflejo en la cúpula
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.4, y + h * 0.25, w * 0.1, h * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Luces del OVNI (rotativas y parpadeantes)
    const time = Date.now() / 80;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time * 0.5;
        const lx = x + w/2 + Math.cos(angle) * (w * 0.42);
        const ly = y + h * 0.6;
        const brightness = 0.5 + Math.sin(time * 2 + i) * 0.5;

        const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff8800'];
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = brightness;
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Rayo propulsor
    const propulsorHeight = 18 + Math.sin(Date.now() / 40) * 6;
    const propulsorGradient = ctx.createLinearGradient(x + w/2, y + h * 0.7, x + w/2, y + h + propulsorHeight);
    propulsorGradient.addColorStop(0, 'rgba(0, 255, 200, 0.6)');
    propulsorGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.3)');
    propulsorGradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
    ctx.fillStyle = propulsorGradient;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.72);
    ctx.lineTo(x + w * 0.7, y + h * 0.72);
    ctx.lineTo(x + w * 0.58, y + h + propulsorHeight);
    ctx.lineTo(x + w * 0.42, y + h + propulsorHeight);
    ctx.closePath();
    ctx.fill();
}

function drawBullets() {
    bullets.forEach(bullet => {
        // Efecto de resplandor del rayo láser
        const gradient = ctx.createRadialGradient(
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 0,
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 18
        );
        gradient.addColorStop(0, 'rgba(0, 255, 204, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 204, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(bullet.x - 12, bullet.y - 12, bullet.width + 24, bullet.height + 24);

        // Núcleo del rayo
        const coreGradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, '#00ffcc');
        coreGradient.addColorStop(1, '#00aa88');
        ctx.fillStyle = coreGradient;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Estela
        ctx.fillStyle = 'rgba(0, 255, 204, 0.3)';
        ctx.fillRect(bullet.x + 1, bullet.y + bullet.height, bullet.width - 2, 10);
    });
}

function drawAliens() {
    aliens.filter(a => a.alive).forEach(alien => {
        const wobbleOffset = Math.sin(alien.wobble) * 3;
        const pulse = 1 + Math.sin(alien.pulsePhase) * 0.05;

        // Resplandor del OVNI enemigo
        const glowGradient = ctx.createRadialGradient(
            alien.x + alien.width/2, alien.y + wobbleOffset + alien.height/2, 0,
            alien.x + alien.width/2, alien.y + wobbleOffset + alien.height/2, alien.width * 0.8
        );
        glowGradient.addColorStop(0, alien.type.color.replace(')', ', 0.35)').replace('rgb', 'rgba'));
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(alien.x + alien.width/2, alien.y + wobbleOffset + alien.height/2, alien.width * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo del OVNI enemigo (platillo volador)
        const bodyGradient = ctx.createLinearGradient(
            alien.x, alien.y + wobbleOffset + alien.height * 0.35,
            alien.x, alien.y + wobbleOffset + alien.height * 0.75
        );
        bodyGradient.addColorStop(0, alien.type.color);
        bodyGradient.addColorStop(1, '#333333');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(
            alien.x + alien.width/2,
            alien.y + wobbleOffset + alien.height * 0.55,
            (alien.width/2) * pulse,
            (alien.height * 0.2) * pulse,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Borde del platillo
        ctx.strokeStyle = alien.type.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cúpula del OVNI enemigo
        const domeGradient = ctx.createRadialGradient(
            alien.x + alien.width/2, alien.y + wobbleOffset + alien.height * 0.3, 0,
            alien.x + alien.width/2, alien.y + wobbleOffset + alien.height * 0.4, alien.width * 0.25
        );
        domeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        domeGradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.7)');
        domeGradient.addColorStop(1, 'rgba(100, 100, 100, 0.5)');
        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.ellipse(
            alien.x + alien.width/2,
            alien.y + wobbleOffset + alien.height * 0.4,
            (alien.width * 0.25) * pulse,
            (alien.height * 0.25) * pulse,
            0, Math.PI, Math.PI * 2
        );
        ctx.fill();

        // Ojos del alien dentro de la cúpula
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(alien.x + alien.width * 0.38, alien.y + wobbleOffset + alien.height * 0.35, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(alien.x + alien.width * 0.62, alien.y + wobbleOffset + alien.height * 0.35, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas brillantes
        ctx.fillStyle = alien.type.color;
        ctx.beginPath();
        ctx.arc(alien.x + alien.width * 0.38, alien.y + wobbleOffset + alien.height * 0.34, 2, 0, Math.PI * 2);
        ctx.arc(alien.x + alien.width * 0.62, alien.y + wobbleOffset + alien.height * 0.34, 2, 0, Math.PI * 2);
        ctx.fill();

        // Luces rotativas del OVNI enemigo
        const lightColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI + Math.PI + (Date.now() / 200);
            const lx = alien.x + alien.width/2 + Math.cos(angle) * (alien.width * 0.38);
            const ly = alien.y + wobbleOffset + alien.height * 0.55;
            const lightPhase = (Date.now() / 150 + i * 1.5) % 4;

            ctx.fillStyle = lightColors[Math.floor(lightPhase)];
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 80 + i) * 0.4;
            ctx.beginPath();
            ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Antenas con energía
        ctx.strokeStyle = alien.type.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(alien.x + alien.width * 0.35, alien.y + wobbleOffset + alien.height * 0.18);
        ctx.lineTo(alien.x + alien.width * 0.22, alien.y + wobbleOffset - 8);
        ctx.moveTo(alien.x + alien.width * 0.65, alien.y + wobbleOffset + alien.height * 0.18);
        ctx.lineTo(alien.x + alien.width * 0.78, alien.y + wobbleOffset - 8);
        ctx.stroke();

        // Puntas de antenas con resplandor de energía
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = alien.type.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(alien.x + alien.width * 0.22, alien.y + wobbleOffset - 10, 3, 0, Math.PI * 2);
        ctx.arc(alien.x + alien.width * 0.78, alien.y + wobbleOffset - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function drawAlienBullets() {
    alienBullets.forEach(bullet => {
        // Resplandor del proyectil alienígena
        const gradient = ctx.createRadialGradient(
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 0,
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 15
        );
        gradient.addColorStop(0, bullet.color);
        gradient.addColorStop(0.5, bullet.color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 15, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Estela
        ctx.fillStyle = bullet.color.replace(')', ', 0.3)').replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.moveTo(bullet.x + bullet.width / 2 - 3, bullet.y);
        ctx.lineTo(bullet.x + bullet.width / 2 + 3, bullet.y);
        ctx.lineTo(bullet.x + bullet.width / 2, bullet.y - 10);
        ctx.closePath();
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life;

        // Resplandor de partícula
        const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo de partícula
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    });
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
// Iniciar el juego cuando carga la página
// ============================================

window.addEventListener('load', init);
