# Comba Invaders

A fun, child-friendly alien invaders game built with HTML5 Canvas and JavaScript. This game features colorful graphics, cute aliens, and special photo frames to showcase your favorite little space explorers!

## Features

- **Child-friendly design**: Bright colors, cute aliens with smiling faces, and fun animations
- **Photo integration**: Display photos of your kids/nephews alongside the game
- **Multiple levels**: Progressive difficulty with faster aliens each level
- **Particle effects**: Colorful explosions and visual feedback
- **Responsive design**: Works on desktop and tablet screens
- **No dependencies**: Pure HTML, CSS, and JavaScript

## Getting Started

### Running Locally

1. **Simple method** - Just open the HTML file:
   ```bash
   open index.html
   ```
   Or double-click `index.html` in your file browser.

2. **Using a local server** (recommended for best experience):
   ```bash
   npx serve .
   ```
   Then open `http://localhost:3000` in your browser.

### Adding Photos of Your Nephews

To add photos of your nephews to the game:

1. Add your photos to the `assets/images/` folder
2. Name them `nephew1.png` and `nephew2.png`
3. Recommended image size: 160x160 pixels (square images work best)
4. Supported formats: PNG, JPG, JPEG, GIF, WebP

The photos will appear in decorative frames on either side of the game!

## How to Play

| Action | Keys |
|--------|------|
| Move Left | `←` Arrow or `A` |
| Move Right | `→` Arrow or `D` |
| Shoot | `Spacebar` |

### Objective

- Shoot all the aliens before they reach the bottom of the screen
- Avoid getting hit by alien projectiles
- Complete levels to face faster and more challenging waves
- Get the highest score possible!

### Scoring

- Each alien destroyed: **10 points × current level**
- Complete a level to advance and increase your multiplier

## Project Structure

```
comba-invaders/
├── index.html          # Main game page
├── package.json        # Project configuration
├── README.md           # This file
├── css/
│   └── styles.css      # Game styling and animations
├── js/
│   └── game.js         # Game logic and rendering
└── assets/
    ├── images/         # Put nephew photos here
    │   ├── nephew1.png # Left photo frame
    │   └── nephew2.png # Right photo frame
    └── sounds/         # Sound effects (optional)
```

## Customization

### Changing Game Difficulty

Edit the `CONFIG` object in `js/game.js`:

```javascript
const CONFIG = {
    // Player settings
    playerSpeed: 7,        // How fast the ship moves
    bulletCooldown: 300,   // Milliseconds between shots

    // Alien settings
    alienRows: 4,          // Number of alien rows
    alienCols: 8,          // Number of aliens per row
    alienSpeedX: 1.5,      // Horizontal speed
    alienShootChance: 0.002, // Chance of alien shooting

    // Game settings
    startingLives: 3,      // Number of lives
    pointsPerAlien: 10,    // Base points per alien
    speedIncreasePerLevel: 0.3 // Speed multiplier increase
};
```

### Changing Colors and Styles

The game uses a space-themed color palette. Key colors in `css/styles.css`:

- Primary pink: `#ff6b6b`
- Yellow accent: `#feca57`
- Blue highlight: `#48dbfb`
- Purple accent: `#ff9ff3`

### Adding Custom Alien Types

Edit the `ALIEN_TYPES` array in `js/game.js` to add new alien designs:

```javascript
const ALIEN_TYPES = [
    { color: '#ff6b6b', eyes: '👀', mouth: '😊' },
    { color: '#feca57', eyes: '👁️', mouth: '😄' },
    // Add more types here
];
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - Feel free to modify and share!

---

Made with love for the little space explorers in our lives!
