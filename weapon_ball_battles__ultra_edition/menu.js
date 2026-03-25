import { Player } from './player.js';
import { Sword, Dagger, Spear, Unarmed, Bow, Shuriken, Scythe, Crusher, Grower, Shrinker, Axe, Staff, SpeedBall, Duplicator, AK47, DummyBall, Lance } from './weapon.js';
import { handleCollision } from './collision.js';
import { playMenuMusic, fadeMenuMusicOut } from './audio.js';

let menuBalls = [];
let menuAnimationId = null;
let menuCanvas = null;
let menuCtx = null;
let rainbowAnimationFrameId = null;
let hue = 0;
let gameTitleElement = null;
let mainMenuElement = null;
let menuPaused = false;
window.gameFrameNumber = 0;

function menuAnimationLoop() {
    if (!menuCtx || !menuCanvas || menuPaused) return;
    
    window.gameFrameNumber++;
    
    menuCtx.fillStyle = '#fff4ec';
    menuCtx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);
    
    menuBalls.forEach(ball => {
        ball.update(menuCanvas.width, menuCanvas.height, true, false); 
        ball.drawWeapon(menuCtx);
        ball.draw(menuCtx);
    });
    
    const dummyGameOver = () => {};
    for (let i = 0; i < menuBalls.length; i++) {
        for (let j = i + 1; j < menuBalls.length; j++) {
            handleCollision(menuBalls[i], menuBalls[j], dummyGameOver, [menuBalls[i], menuBalls[j]], true);
        }
    }
    
    menuBalls = menuBalls.filter(ball => ball.isAlive || ball.fragments.length > 0);

    if (menuBalls.length === 0) {
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * (menuCanvas.width - 100) + 50;
            const y = Math.random() * (menuCanvas.height - 100) + 50;
            const types = ['basic', 'sword', 'dagger', 'spear', 'unarmed', 'bow', 'scythe', 'shuriken', 'crusher', 'grower', 'shrinker', 'axe', 'staff', 'speedball', 'duplicator', 'lance', 'ak47'];
            const type = types[Math.floor(Math.random() * types.length)];
            const radius = (type === 'crusher') ? 55 : 35;
            let color;
            if (type === 'sword') {
                color = Sword.color;
            } else if (type === 'dagger') {
                color = Dagger.color;
            } else if (type === 'spear') {
                color = Spear.color;
            } else if (type === 'bow') {
                color = Bow.color;
            } else if (type === 'scythe') {
                color = Scythe.color;
            } else if (type === 'shuriken') {
                color = Shuriken.color;
            } else if (type === 'crusher') {
                color = Crusher.color;
            } else if (type === 'grower') {
                color = Grower.color;
            } else if (type === 'shrinker') {
                color = Shrinker.color;
            } else if (type === 'speedball') {
                color = SpeedBall.color;
            } else if (type === 'duplicator') {
                color = Duplicator.color;
            } else if (type === 'dummyball') {
                color = DummyBall.color;
            }
            else {
                color = 'white';
            }
            
            const speed = 4; 
            const angle = Math.random() * 2 * Math.PI;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const ball = new Player(x, y, radius, color, vx, vy, type);
            ball.weapon.spinDirection = Math.random() > 0.5 ? 1 : -1;
            if (type === 'spear') {
                ball.weapon.spearLength = 0.7 + Math.random() * 0.5;
            }
            menuBalls.push(ball);
        }
    }
    
    menuAnimationId = requestAnimationFrame(menuAnimationLoop);
}

function animateRainbowTitle() {
    if (!gameTitleElement) return;
    hue = (hue + 1) % 360;
    gameTitleElement.style.color = `hsl(${hue}, 100%, 50%)`;
    rainbowAnimationFrameId = requestAnimationFrame(animateRainbowTitle);
}

function startRainbowAnimation() {
    if (!rainbowAnimationFrameId) {
        animateRainbowTitle();
    }
}

function stopRainbowAnimation() {
    if (rainbowAnimationFrameId) {
        cancelAnimationFrame(rainbowAnimationFrameId);
        rainbowAnimationFrameId = null;
    }
}

export function setupMenu(mainMenu, gameTitle) {
    mainMenuElement = mainMenu;
    gameTitleElement = gameTitle;

    menuCanvas = document.createElement('canvas');
    menuCanvas.id = 'menu-background-canvas';
    menuCanvas.width = window.innerWidth;
    menuCanvas.height = window.innerHeight;
    menuCtx = menuCanvas.getContext('2d');
    mainMenuElement.appendChild(menuCanvas);
    
    const numBalls = 10;
    menuBalls = [];
    for (let i = 0; i < numBalls; i++) {
        const x = Math.random() * (menuCanvas.width - 100) + 50;
        const y = Math.random() * (menuCanvas.height - 100) + 50;
        const types2 = ['basic', 'sword', 'dagger', 'spear', 'unarmed', 'bow', 'scythe', 'shuriken', 'crusher', 'grower', 'shrinker', 'axe', 'staff', 'speedball', 'duplicator', 'dummyball', 'ak47'];
        const type2 = types2[Math.floor(Math.random() * types2.length)];
        const radius2 = (type2 === 'crusher') ? 55 : 35;
        let color2;
        if (type2 === 'sword') color2 = Sword.color;
        else if (type2 === 'dagger') color2 = Dagger.color;
        else if (type2 === 'spear') color2 = Spear.color;
        else if (type2 === 'bow') color2 = Bow.color;
        else if (type2 === 'scythe') color2 = Scythe.color;
        else if (type2 === 'shuriken') color2 = Shuriken.color;
        else if (type2 === 'crusher') color2 = Crusher.color;
        else if (type2 === 'grower') color2 = Grower.color;
        else if (type2 === 'shrinker') color2 = Shrinker.color;
        else if (type2 === 'speedball') color2 = SpeedBall.color;
        else if (type2 === 'duplicator') color2 = Duplicator.color;
        else if (type2 === 'dummyball') color2 = DummyBall.color;
        else color2 = 'white';
        
        const speed = 4; 
        const angle = Math.random() * 2 * Math.PI;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const ball = new Player(x, y, radius2, color2, vx, vy, type2);
        
        ball.weapon.spinDirection = Math.random() > 0.5 ? 1 : -1;
        if (type2 === 'spear') {
            ball.weapon.spearLength = 0.7 + Math.random() * 0.5;
        }
        
        menuBalls.push(ball);
    }
    
    menuAnimationLoop();
    startRainbowAnimation();
    playMenuMusic();
}

export function pauseMenu() {
    menuPaused = true;
}

export function resumeMenu() {
    if (menuPaused) {
        menuPaused = false;
        // Restart the animation loop if it was stopped.
        if (!menuAnimationId) {
            menuAnimationLoop();
        }
    }
}

export function cleanupMenu() {
    fadeMenuMusicOut();
    if (menuAnimationId) {
        cancelAnimationFrame(menuAnimationId);
        menuAnimationId = null;
    }
    
    // Immediate cleanup without waiting for slide animation
    if (menuCanvas) {
        menuCanvas.remove();
        menuCanvas = null;
        menuCtx = null;
    }
    menuBalls.length = 0;
    
    stopRainbowAnimation();
}