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

    // Configuración de dificultad progresiva
    initialAlienRows: 2,        // Nivel 1 empieza con 2 filas
    initialAlienCols: 5,        // Nivel 1 empieza con 5 columnas
    maxAlienRows: 5,            // Máximo de filas
    maxAlienCols: 10,           // Máximo de columnas
    initialAlienSpeedX: 0.8,    // Velocidad inicial más lenta
    initialShootChance: 0.0008, // Probabilidad de disparo inicial más baja
    speedIncreasePerLevel: 0.18, // Aumento de velocidad más gradual (18%)
    shootChanceIncreasePerLevel: 0.0002, // Aumento de probabilidad de disparo por nivel

    // Configuración del juego
    startingLives: 3,
    pointsPerAlien: 10,

    // Configuración de salud
    maxHealth: 100,
    damagePerHit: 20,
    invincibilityTime: 2000, // milisegundos

    // Configuración de power-ups
    powerupDropChance: 0.25, // 25% probabilidad de caída
    powerupSpeed: 2, // velocidad de caída
    powerupSize: 30 // tamaño del power-up
};

// ============================================
// Estado del Juego
// ============================================

let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = CONFIG.startingLives;
let health = CONFIG.maxHealth;
let invincible = false;
let invincibleTimer = 0;
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
let powerups = []; // Power-ups activos en pantalla
let activePowerups = { rapidfire: 0, tripleshot: 0, shield: 0 }; // Temporizadores de efectos activos

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
    {
        color: '#00ff88', eyes: '👁️', type: 'scout', nombre: 'Explorador de Marte',
        health: 1, speedMod: 1.3, shootMod: 0.5, points: 10, size: 0.8,
        behavior: 'zigzag'
    },
    {
        color: '#88ff00', eyes: '👀', type: 'soldier', nombre: 'Soldado de Plutón',
        health: 1, speedMod: 1.0, shootMod: 1.0, points: 15, size: 1.0,
        behavior: 'normal'
    },
    {
        color: '#00ffcc', eyes: '🔮', type: 'psychic', nombre: 'Psíquico de Neptuno',
        health: 1, speedMod: 0.8, shootMod: 1.5, points: 20, size: 1.0,
        behavior: 'tracker'
    },
    {
        color: '#ff00ff', eyes: '💜', type: 'heavy', nombre: 'Tanque Cósmico',
        health: 2, speedMod: 0.6, shootMod: 0.8, points: 30, size: 1.3,
        behavior: 'tank'
    },
    {
        color: '#ffff00', eyes: '⚡', type: 'speeder', nombre: 'Centella de Júpiter',
        health: 1, speedMod: 1.8, shootMod: 0.3, points: 25, size: 0.9,
        behavior: 'dasher'
    },
    {
        color: '#ff6600', eyes: '🔥', type: 'bomber', nombre: 'Bombardero Solar',
        health: 1, speedMod: 0.7, shootMod: 2.0, points: 25, size: 1.1,
        behavior: 'bomber'
    }
];

// ============================================
// Tipos de Power-ups
// ============================================

const POWERUP_TYPES = [
    { type: 'health', color: '#00ff00', emoji: '💚', effect: 'Restaurar 25 salud', name: 'Salud' },
    { type: 'shield', color: '#00ffff', emoji: '🛡️', effect: '5 segundos invencibilidad', name: 'Escudo', duration: 5000 },
    { type: 'rapidfire', color: '#ff8800', emoji: '⚡', effect: 'Disparo rápido por 8 segundos', name: 'Disparo Rápido', duration: 8000 },
    { type: 'tripleshot', color: '#ff00ff', emoji: '🔱', effect: 'Triple disparo por 10 segundos', name: 'Triple Disparo', duration: 10000 },
    { type: 'bomb', color: '#ff0000', emoji: '💣', effect: 'Elimina todas las balas enemigas', name: 'Bomba' },
    { type: 'points', color: '#ffff00', emoji: '⭐', effect: 'Bonus 100 puntos', name: 'Puntos' }
];

// Helper function to convert hex color to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
    health = CONFIG.maxHealth;
    invincible = false;
    invincibleTimer = 0;
    bullets = [];
    alienBullets = [];
    particles = [];
    powerups = [];
    activePowerups = { rapidfire: 0, tripleshot: 0, shield: 0 };
    alienDirection = 1;

    // Reiniciar posición del jugador
    resetPlayerPosition();

    // Actualizar display
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = 'x' + lives;
    document.getElementById('level').textContent = level;
    updateHealthBar();

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
    
    // Calcular dificultad progresiva
    // Velocidad: empieza en 0.8, aumenta 18% por nivel
    const speedMultiplier = 1 + (level - 1) * CONFIG.speedIncreasePerLevel;
    
    // Filas: empieza con 2, aumenta cada 3 niveles hasta máximo 5
    const rows = Math.min(CONFIG.initialAlienRows + Math.floor((level - 1) / 3), CONFIG.maxAlienRows);
    
    // Columnas: empieza con 5, aumenta cada 2 niveles hasta máximo 10
    const cols = Math.min(CONFIG.initialAlienCols + Math.floor((level - 1) / 2), CONFIG.maxAlienCols);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Strategic distribution: scouts/speeders front, soldiers/psychics middle, tanks/bombers back
            let alienType;
            if (row === 0) {
                // Front row: scouts and speeders (easier, faster targets)
                alienType = ALIEN_TYPES[col % 2 === 0 ? 0 : 4]; // scout or speeder
            } else if (row === rows - 1 && rows > 2) {
                // Back row: tanks and bombers (harder to reach)
                alienType = ALIEN_TYPES[col % 2 === 0 ? 3 : 5]; // heavy or bomber
            } else {
                // Middle rows: soldiers and psychics
                alienType = ALIEN_TYPES[col % 2 === 0 ? 1 : 2]; // soldier or psychic
            }

            const alienWidth = CONFIG.alienWidth * alienType.size;
            const alienHeight = CONFIG.alienHeight * alienType.size;

            aliens.push({
                x: startX + col * (CONFIG.alienWidth + CONFIG.alienPadding),
                y: startY + row * (CONFIG.alienHeight + CONFIG.alienPadding),
                width: alienWidth,
                height: alienHeight,
                type: alienType,
                alive: true,
                wobble: Math.random() * Math.PI * 2,
                speedMultiplier: speedMultiplier,
                pulsePhase: Math.random() * Math.PI * 2,
                health: alienType.health,
                maxHealth: alienType.health,
                behavior: alienType.behavior,
                dashTimer: 0,
                dashCooldown: Math.random() * 200 + 100,
                zigzagOffset: 0
            });
        }
    }
}

function createBullet() {
    const now = Date.now();

    // Cooldown reducido si tiene rapidfire activo
    const cooldown = activePowerups.rapidfire > 0 ? CONFIG.bulletCooldown / 2.5 : CONFIG.bulletCooldown;
    if (now - lastBulletTime < cooldown) return;

    lastBulletTime = now;

    // Si tiene tripleshot, disparar 3 balas
    if (activePowerups.tripleshot > 0) {
        // Bala central
        bullets.push({
            x: player.x + player.width / 2 - CONFIG.bulletWidth / 2,
            y: player.y,
            width: CONFIG.bulletWidth,
            height: CONFIG.bulletHeight,
            color: '#ff00ff',
            vx: 0
        });

        // Bala izquierda
        bullets.push({
            x: player.x + player.width / 2 - CONFIG.bulletWidth / 2,
            y: player.y,
            width: CONFIG.bulletWidth,
            height: CONFIG.bulletHeight,
            color: '#ff00ff',
            vx: -2
        });

        // Bala derecha
        bullets.push({
            x: player.x + player.width / 2 - CONFIG.bulletWidth / 2,
            y: player.y,
            width: CONFIG.bulletWidth,
            height: CONFIG.bulletHeight,
            color: '#ff00ff',
            vx: 2
        });

        // Partículas de disparo especiales
        createParticles(player.x + player.width / 2, player.y, '#ff00ff', 6);
    } else {
        // Disparo normal
        bullets.push({
            x: player.x + player.width / 2 - CONFIG.bulletWidth / 2,
            y: player.y,
            width: CONFIG.bulletWidth,
            height: CONFIG.bulletHeight,
            color: activePowerups.rapidfire > 0 ? '#ff8800' : '#00ffcc',
            vx: 0
        });

        // Partículas de disparo
        const particleColor = activePowerups.rapidfire > 0 ? '#ff8800' : '#00ffcc';
        createParticles(player.x + player.width / 2, player.y, particleColor, 4);
    }
}

function createAlienBullet(alien) {
    let bulletWidth = 8;
    let bulletHeight = 12;
    let bulletSpeed = 5;
    let vx = 0; // horizontal velocity

    // Different bullet types based on alien behavior
    if (alien.behavior === 'bomber') {
        // Bombers shoot larger, faster bullets
        bulletWidth = 12;
        bulletHeight = 16;
        bulletSpeed = 7;
    } else if (alien.behavior === 'tracker') {
        // Psychics shoot bullets that aim slightly toward player
        const playerCenter = player.x + player.width / 2;
        const alienCenter = alien.x + alien.width / 2;
        const dx = playerCenter - alienCenter;
        vx = dx * 0.02; // Slight tracking
    }

    alienBullets.push({
        x: alien.x + alien.width / 2 - bulletWidth / 2,
        y: alien.y + alien.height,
        width: bulletWidth,
        height: bulletHeight,
        color: alien.type.color,
        speed: bulletSpeed,
        vx: vx,
        behavior: alien.behavior
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

function spawnPowerup(x, y) {
    // Seleccionar tipo de power-up aleatorio
    const powerupType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

    powerups.push({
        x: x - CONFIG.powerupSize / 2,
        y: y,
        width: CONFIG.powerupSize,
        height: CONFIG.powerupSize,
        type: powerupType,
        pulse: 0,
        collected: false
    });
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
    updatePowerups();
    updatePowerupTimers();
    updateInvincibility();
    updateHealthBar();
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
        // Aplicar movimiento horizontal si tiene vx (tripleshot)
        if (bullet.vx) {
            bullet.x += bullet.vx;
        }
        return bullet.y > -bullet.height && bullet.x > -bullet.width && bullet.x < CONFIG.baseCanvasWidth + bullet.width;
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
        // Base horizontal movement with speed modifier
        const baseSpeed = CONFIG.initialAlienSpeedX * alienDirection * alien.speedMultiplier * alien.type.speedMod;
        alien.x += baseSpeed;
        alien.wobble += 0.1;
        alien.pulsePhase += 0.05;

        // Implement different movement behaviors
        switch (alien.behavior) {
            case 'zigzag':
                // Scouts: vertical oscillation while moving
                alien.zigzagOffset += 0.15;
                alien.y += Math.sin(alien.zigzagOffset) * 0.5;
                break;

            case 'tracker':
                // Psychics: slightly move toward player's x position
                const playerCenter = player.x + player.width / 2;
                const alienCenter = alien.x + alien.width / 2;
                if (Math.abs(playerCenter - alienCenter) > 50) {
                    alien.x += (playerCenter > alienCenter ? 0.3 : -0.3);
                }
                break;

            case 'dasher':
                // Speeders: occasionally dash down toward player
                alien.dashTimer++;
                if (alien.dashTimer > alien.dashCooldown) {
                    // Quick dash
                    alien.y += 30;
                    alien.dashTimer = 0;
                    alien.dashCooldown = Math.random() * 200 + 150;
                    createParticles(alien.x + alien.width / 2, alien.y, alien.type.color, 4);
                }
                break;

            case 'normal':
            case 'tank':
            case 'bomber':
                // No special movement behavior
                break;
        }

        // Disparo de OVNIs - use type-specific shoot modifier
        const currentShootChance = (CONFIG.initialShootChance + (level - 1) * CONFIG.shootChanceIncreasePerLevel) * alien.type.shootMod;
        if (Math.random() < currentShootChance * alien.speedMultiplier) {
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
        bullet.y += bullet.speed || 5;
        bullet.x += bullet.vx || 0; // Apply horizontal velocity for tracking bullets
        return bullet.y < CONFIG.baseCanvasHeight && bullet.x > -bullet.width && bullet.x < CONFIG.baseCanvasWidth + bullet.width;
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

function updatePowerups() {
    powerups = powerups.filter(powerup => {
        // Mover power-up hacia abajo
        powerup.y += CONFIG.powerupSpeed;
        powerup.pulse += 0.1;

        // Remover si sale de la pantalla
        return powerup.y < CONFIG.baseCanvasHeight + powerup.height;
    });
}

function updatePowerupTimers() {
    const deltaTime = 16; // approximately 60fps
    if (activePowerups.rapidfire > 0) {
        activePowerups.rapidfire = Math.max(0, activePowerups.rapidfire - deltaTime);
    }
    if (activePowerups.tripleshot > 0) {
        activePowerups.tripleshot = Math.max(0, activePowerups.tripleshot - deltaTime);
    }
    if (activePowerups.shield > 0) {
        activePowerups.shield = Math.max(0, activePowerups.shield - deltaTime);
    }
}

function updateInvincibility() {
    if (invincible && invincibleTimer > 0) {
        invincibleTimer -= 16; // approximately 60fps
        if (invincibleTimer <= 0) {
            invincible = false;
            invincibleTimer = 0;
        }
    }
}

function updateHealthBar() {
    const healthBar = document.getElementById('healthBar');
    const healthValue = document.getElementById('healthValue');

    if (healthBar && healthValue) {
        const healthPercent = (health / CONFIG.maxHealth) * 100;
        healthBar.style.width = healthPercent + '%';
        healthValue.textContent = Math.round(health);

        // Update color class based on health
        healthBar.classList.remove('high', 'medium', 'low');
        if (healthPercent > 60) {
            healthBar.classList.add('high');
        } else if (healthPercent > 30) {
            healthBar.classList.add('medium');
        } else {
            healthBar.classList.add('low');
        }
    }
}

// ============================================
// Detección de Colisiones
// ============================================

function checkCollisions() {
    // Rayos láser golpeando OVNIs
    bullets.forEach((bullet, bulletIndex) => {
        aliens.forEach(alien => {
            if (alien.alive && isColliding(bullet, alien)) {
                // Reduce alien health
                alien.health--;
                bullets.splice(bulletIndex, 1);

                if (alien.health <= 0) {
                    // Alien destroyed
                    alien.alive = false;
                    score += alien.type.points * level;
                    document.getElementById('score').textContent = score;

                    // Explosión espectacular
                    createExplosion(
                        alien.x + alien.width / 2,
                        alien.y + alien.height / 2,
                        alien.type.color
                    );

                    // Chance to drop power-up
                    if (Math.random() < CONFIG.powerupDropChance) {
                        spawnPowerup(alien.x + alien.width / 2, alien.y + alien.height / 2);
                    }
                } else {
                    // Alien hit but not destroyed - create smaller hit effect
                    createParticles(
                        alien.x + alien.width / 2,
                        alien.y + alien.height / 2,
                        alien.type.color,
                        8
                    );
                    // Visual feedback for damage
                    alien.pulsePhase = 0;
                }
            }
        });
    });

    // Disparos de OVNIs golpeando al jugador
    alienBullets.forEach((bullet, index) => {
        if (isColliding(bullet, player)) {
            // Solo aplicar daño si no está invencible y no tiene escudo activo
            if (!invincible && activePowerups.shield <= 0) {
                alienBullets.splice(index, 1);
                health -= CONFIG.damagePerHit;

                // Efecto de impacto
                createExplosion(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                    '#ff0066'
                );

                // Verificar si se acabó la salud
                if (health <= 0) {
                    lives--;

                    // Actualizar display de vidas
                    document.getElementById('lives').textContent = 'x' + Math.max(0, lives);

                    if (lives > 0) {
                        // Resetear salud y activar invencibilidad
                        health = CONFIG.maxHealth;
                        invincible = true;
                        invincibleTimer = CONFIG.invincibilityTime;
                        updateHealthBar();

                        // Explosión más grande al perder una vida
                        createExplosion(
                            player.x + player.width / 2,
                            player.y + player.height / 2,
                            '#ff0000'
                        );
                    } else {
                        gameOver();
                    }
                }

                updateHealthBar();
            } else if (activePowerups.shield > 0) {
                // Si tiene escudo, solo eliminar la bala sin causar daño
                alienBullets.splice(index, 1);
                // Efecto visual de escudo bloqueando
                createParticles(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                    '#00ffff',
                    8
                );
            }
        }
    });

    // Power-ups siendo recogidos por el jugador
    powerups.forEach((powerup, index) => {
        if (isColliding(powerup, player)) {
            powerups.splice(index, 1);

            // Aplicar efecto del power-up
            const type = powerup.type.type;
            switch(type) {
                case 'health':
                    health = Math.min(health + 25, CONFIG.maxHealth);
                    updateHealthBar();
                    break;

                case 'shield':
                    activePowerups.shield = powerup.type.duration;
                    break;

                case 'rapidfire':
                    activePowerups.rapidfire = powerup.type.duration;
                    break;

                case 'tripleshot':
                    activePowerups.tripleshot = powerup.type.duration;
                    break;

                case 'bomb':
                    alienBullets = [];
                    for (let i = 0; i < 50; i++) {
                        createParticles(
                            Math.random() * CONFIG.baseCanvasWidth,
                            Math.random() * CONFIG.baseCanvasHeight,
                            '#ff0000',
                            3
                        );
                    }
                    break;

                case 'points':
                    score += 100;
                    document.getElementById('score').textContent = score;
                    break;
            }

            // Efecto visual de recolección
            createExplosion(
                powerup.x + powerup.width / 2,
                powerup.y + powerup.height / 2,
                powerup.type.color
            );
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
    drawPowerups();
    drawPlayer();
    drawBullets();
    drawAliens();
    drawAlienBullets();
    drawActivePowerupIndicators();

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
        glowGradient.addColorStop(0, hexToRgba(planet.color, 0.3));
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

    // Efecto de parpadeo si está invencible
    if (invincible || activePowerups.shield > 0) {
        const blinkRate = invincible ? 100 : 150;
        if (Math.floor(Date.now() / blinkRate) % 2 === 0) {
            // En algunos frames no dibujamos al jugador (parpadeo)
            ctx.globalAlpha = 0.3;
        }
    }

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

    // Resetear alpha al final
    ctx.globalAlpha = 1;
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
        glowGradient.addColorStop(0, hexToRgba(alien.type.color, 0.35));
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

        // Health indicator for damaged aliens
        if (alien.maxHealth > 1 && alien.health < alien.maxHealth) {
            const healthBarWidth = alien.width * 0.8;
            const healthBarHeight = 4;
            const healthPercent = alien.health / alien.maxHealth;

            // Background (red)
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(
                alien.x + alien.width * 0.1,
                alien.y + wobbleOffset - 15,
                healthBarWidth,
                healthBarHeight
            );

            // Foreground (green)
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                alien.x + alien.width * 0.1,
                alien.y + wobbleOffset - 15,
                healthBarWidth * healthPercent,
                healthBarHeight
            );

            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                alien.x + alien.width * 0.1,
                alien.y + wobbleOffset - 15,
                healthBarWidth,
                healthBarHeight
            );
        }

        // Visual indicator for tanks (they're bigger and have special styling)
        if (alien.behavior === 'tank') {
            // Extra armor plating effect
            ctx.strokeStyle = hexToRgba(alien.type.color, 0.5);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(
                alien.x + alien.width/2,
                alien.y + wobbleOffset + alien.height * 0.55,
                (alien.width/2) * pulse * 1.1,
                (alien.height * 0.2) * pulse * 1.1,
                0, 0, Math.PI * 2
            );
            ctx.stroke();
        }

        // Visual effects for damaged aliens (flash red when hit)
        if (alien.pulsePhase < 0.5 && alien.health < alien.maxHealth) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.ellipse(
                alien.x + alien.width/2,
                alien.y + wobbleOffset + alien.height/2,
                alien.width/2,
                alien.height/2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}

function drawAlienBullets() {
    alienBullets.forEach(bullet => {
        // Adjust glow size based on bullet size
        const glowRadius = bullet.behavior === 'bomber' ? 20 : 15;
        const coreRadius = bullet.behavior === 'bomber' ? 6 : 4;

        // Resplandor del proyectil alienígena
        const gradient = ctx.createRadialGradient(
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 0,
            bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, glowRadius
        );
        gradient.addColorStop(0, bullet.color);
        gradient.addColorStop(0.5, hexToRgba(bullet.color, 0.4));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante (bigger for bomber bullets)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Estela (longer for bomber bullets)
        const trailLength = bullet.behavior === 'bomber' ? 15 : 10;
        ctx.fillStyle = hexToRgba(bullet.color, 0.3);
        ctx.beginPath();
        ctx.moveTo(bullet.x + bullet.width / 2 - (bullet.width / 2), bullet.y);
        ctx.lineTo(bullet.x + bullet.width / 2 + (bullet.width / 2), bullet.y);
        ctx.lineTo(bullet.x + bullet.width / 2, bullet.y - trailLength);
        ctx.closePath();
        ctx.fill();

        // Extra effect for tracker bullets (slight trail)
        if (bullet.behavior === 'tracker' && bullet.vx) {
            ctx.fillStyle = hexToRgba(bullet.color, 0.2);
            ctx.fillRect(bullet.x - bullet.vx * 3, bullet.y, bullet.width, bullet.height);
        }
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

function drawPowerups() {
    powerups.forEach(powerup => {
        const centerX = powerup.x + powerup.width / 2;
        const centerY = powerup.y + powerup.height / 2;
        const pulseSize = Math.sin(powerup.pulse) * 5 + powerup.width / 2;

        // Resplandor exterior pulsante
        const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize * 1.5);
        outerGlow.addColorStop(0, hexToRgba(powerup.type.color, 0.6));
        outerGlow.addColorStop(0.5, hexToRgba(powerup.type.color, 0.3));
        outerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Círculo de fondo
        const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
        bgGradient.addColorStop(0, hexToRgba(powerup.type.color, 0.9));
        bgGradient.addColorStop(0.7, hexToRgba(powerup.type.color, 0.6));
        bgGradient.addColorStop(1, hexToRgba(powerup.type.color, 0.3));
        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Borde brillante
        ctx.strokeStyle = powerup.type.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = powerup.type.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Emoji en el centro
        ctx.font = `${powerup.width * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(powerup.type.emoji, centerX, centerY);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    });
}

function drawActivePowerupIndicators() {
    if (!gameRunning || gamePaused) return;

    const indicatorY = 35;
    const indicatorSize = 22;
    let indicatorX = 10;

    if (activePowerups.shield > 0) {
        drawPowerupIndicator(indicatorX, indicatorY, indicatorSize, '🛡️', '#00ffff', activePowerups.shield, 5000);
        indicatorX += indicatorSize + 5;
    }
    if (activePowerups.rapidfire > 0) {
        drawPowerupIndicator(indicatorX, indicatorY, indicatorSize, '⚡', '#ff8800', activePowerups.rapidfire, 8000);
        indicatorX += indicatorSize + 5;
    }
    if (activePowerups.tripleshot > 0) {
        drawPowerupIndicator(indicatorX, indicatorY, indicatorSize, '🔱', '#ff00ff', activePowerups.tripleshot, 10000);
        indicatorX += indicatorSize + 5;
    }
}

function drawPowerupIndicator(x, y, size, emoji, color, timeRemaining, maxDuration) {
    // Background
    ctx.fillStyle = hexToRgba(color, 0.3);
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Emoji
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, x + size / 2, y + size / 2);

    // Timer bar
    const barHeight = 3;
    const barWidth = size * (timeRemaining / maxDuration);
    ctx.fillStyle = color;
    ctx.fillRect(x, y + size - barHeight, barWidth, barHeight);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
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
