const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const PANEL_H = 50;
const SPAWN_RADIUS = 150;
const WEB_STUCK_TIME = 5000;
const MIN_DISTANCE = 150;

const ant = {
    x: 0, y: 0, size: 32, speed: 4, angle: 0,
    stuckUntil: 0, isStuck: false, isInitialized: false 
};

const antImage = new Image();  
antImage.src = 'images/ant.png';

const FOOD_COUNTS = { berry: 5, sugar: 3 };
const WEB_COUNT   = 2;

const ITEM_TYPES = {
    berry: { image: new Image(), size: 32,  edible: true,  eaten: 0, total: FOOD_COUNTS.berry, color: '#ff3333' },
    sugar: { image: new Image(), size: 32,  edible: true,  eaten: 0, total: FOOD_COUNTS.sugar, color: '#ffffff' },
    web:   { image: new Image(), size: 128, edible: false, eaten: 0, total: WEB_COUNT, color: '#aaaaaa' }
};
ITEM_TYPES.berry.image.src = 'images/berry.png';
ITEM_TYPES.sugar.image.src = 'images/sugar.png';
ITEM_TYPES.web.image.src   = 'images/web.png';

// Ждем загрузки всех картинок перед запуском (чтобы не рисовать квадраты)
let imagesLoaded = 0;
const totalImages = 4; // ant + berry + sugar + web

function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        spawnAll();
        loop();
    }
}

antImage.onload = onImageLoad;
antImage.onerror = onImageLoad; // даже если ошибка - продолжаем
ITEM_TYPES.berry.image.onload = onImageLoad;
ITEM_TYPES.berry.image.onerror = onImageLoad;
ITEM_TYPES.sugar.image.onload = onImageLoad;
ITEM_TYPES.sugar.image.onerror = onImageLoad;
ITEM_TYPES.web.image.onload = onImageLoad;
ITEM_TYPES.web.image.onerror = onImageLoad;

function isLoaded(img) { return img.complete && img.naturalWidth !== 0; }

const items = [];

function getArea() {
    return {
        top: PANEL_H, bottom: canvas.height, left: 0, right: canvas.width,
        width: canvas.width, height: canvas.height - PANEL_H
    };
}

function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const a = getArea();

    if (!ant.isInitialized) {
        ant.x = a.width / 2;
        ant.y = a.top + a.height / 2;
        ant.isInitialized = true;
    } else {
        ant.x = Math.max(a.left + ant.size / 2, Math.min(a.right - ant.size / 2, ant.x));
        ant.y = Math.max(a.top + ant.size / 2, Math.min(a.bottom - ant.size / 2, ant.y));
    }
}
window.addEventListener('resize', resize);
resize();

function spawnItem(type) {
    const t = ITEM_TYPES[type];
    const area = getArea();
    const half = t.size / 2;
    
    for (let tries = 0; tries < 3000; tries++) {
        const x = area.left + half + Math.random() * (area.width - t.size);
        const y = area.top + half + Math.random() * (area.height - t.size);

        if (Math.hypot(x - ant.x, y - ant.y) < SPAWN_RADIUS) continue;

        let overlaps = false;
        for (const it of items) {
            if (Math.hypot(x - it.x, y - it.y) < (t.size / 2) + (it.size / 2) + MIN_DISTANCE) {
                overlaps = true; break;
            }
        }

        if (!overlaps) {
            items.push({ type, x, y, size: t.size, eaten: false });
            return;
        }
    }
}

function spawnAll() {
    items.length = 0;
    for (let i = 0; i < WEB_COUNT; i++) spawnItem('web');
    for (const [type, n] of Object.entries(FOOD_COUNTS))
        for (let i = 0; i < n; i++) spawnItem(type);
    for (const t of Object.values(ITEM_TYPES)) t.eaten = 0;
    ant.isStuck = false;
}

// Управление
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup',   e => keys[e.key] = false);

const stick = { active: false, baseX: 0, baseY: 0, dx: 0, dy: 0 };
const STICK_RADIUS = 60, DEAD_ZONE = 12;

canvas.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    stick.active = true; stick.baseX = t.clientX; stick.baseY = t.clientY; stick.dx = 0; stick.dy = 0;
}, { passive: true });
canvas.addEventListener('touchmove', e => {
    if (!stick.active) return;
    const t = e.changedTouches[0];
    let dx = t.clientX - stick.baseX, dy = t.clientY - stick.baseY;
    const d = Math.hypot(dx, dy);
    if (d > STICK_RADIUS) { dx = dx / d * STICK_RADIUS; dy = dy / d * STICK_RADIUS; }
    stick.dx = dx; stick.dy = dy;
}, { passive: true });
canvas.addEventListener('touchend', () => { stick.active = false; stick.dx = 0; stick.dy = 0; });
canvas.addEventListener('touchcancel', () => { stick.active = false; stick.dx = 0; stick.dy = 0; });

let mouseDown = false;
canvas.addEventListener('mousedown', e => {
    mouseDown = true; stick.active = true; stick.baseX = e.clientX; stick.baseY = e.clientY;
});
canvas.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    let dx = e.clientX - stick.baseX, dy = e.clientY - stick.baseY;
    const d = Math.hypot(dx, dy);
    if (d > STICK_RADIUS) { dx = dx / d * STICK_RADIUS; dy = dy / d * STICK_RADIUS; }
    stick.dx = dx; stick.dy = dy;
});
window.addEventListener('mouseup', () => { mouseDown = false; stick.active = false; stick.dx = 0; stick.dy = 0; });

function hit(a, b) {
    return Math.abs(a.x - b.x) < (a.size + b.size) / 2 && Math.abs(a.y - b.y) < (a.size + b.size) / 2;
}

function update() {
    const now = performance.now();
    const area = getArea();

    if (ant.isStuck && now > ant.stuckUntil) ant.isStuck = false; 

    let dx = 0, dy = 0;
    if (!ant.isStuck) {
        if (keys['ArrowLeft'])  dx -= 1;
        if (keys['ArrowRight']) dx += 1;
        if (keys['ArrowUp'])    dy -= 1;
        if (keys['ArrowDown'])  dy += 1;
        if (stick.active && Math.hypot(stick.dx, stick.dy) > DEAD_ZONE) {
            dx = stick.dx / STICK_RADIUS; dy = stick.dy / STICK_RADIUS;
        }
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
        const nx = dx / len, ny = dy / len;
        ant.x += nx * ant.speed; ant.y += ny * ant.speed;
        ant.angle = Math.atan2(nx, -ny);
    }

    if (ant.x < area.left) ant.x = area.right;
    if (ant.x > area.right) ant.x = area.left;
    if (ant.y < area.top + ant.size / 2) ant.y = area.bottom;
    if (ant.y > area.bottom) ant.y = area.top + ant.size / 2;

    for (const it of items) {
        if (it.eaten) continue;
        if (!hit(ant, it)) continue;
        if (ITEM_TYPES[it.type].edible) {
            it.eaten = true;
            ITEM_TYPES[it.type].eaten++;
        } else if (it.type === 'web' && !ant.isStuck) {
            ant.isStuck = true;
            ant.stuckUntil = now + WEB_STUCK_TIME; 
        }
    }
}

function drawSafeImage(img, x, y, w, h, fallbackColor) {
    if (isLoaded(img)) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, w, h);
    }
}

function drawPanel() {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, PANEL_H);

    ctx.font = '20px sans-serif';
    ctx.textBaseline = 'middle';

    let x = 16;
    const y = PANEL_H / 2;

    for (const [type, t] of Object.entries(ITEM_TYPES)) {
        if (!t.edible) continue;
        drawSafeImage(t.image, x, y - 12, 24, 24, t.color);
        x += 30;
        ctx.fillStyle = '#fff';
        const text = `${t.eaten}/${t.total}`;
        ctx.fillText(text, x, y);
        x += ctx.measureText(text).width + 24;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const it of items) {
        if (it.eaten) continue;
        const t = ITEM_TYPES[it.type];
        drawSafeImage(t.image, it.x - it.size / 2, it.y - it.size / 2, it.size, it.size, t.color);
    }

    ctx.save();
    ctx.translate(ant.x, ant.y);
    ctx.rotate(ant.angle);
    if (ant.isStuck) ctx.globalAlpha = 0.5;
    drawSafeImage(antImage, -ant.size / 2, -ant.size / 2, ant.size, ant.size, '#000000');
    ctx.restore();
    ctx.globalAlpha = 1;

    drawPanel();

    if (ant.isStuck) {
        const left = Math.max(0, (ant.stuckUntil - performance.now()) / 1000).toFixed(1);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`В паутине! ${left} с`, canvas.width / 2, PANEL_H + 40);
        ctx.textAlign = 'start';
    }

    if (stick.active) {
        ctx.beginPath(); ctx.arc(stick.baseX, stick.baseY, STICK_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(stick.baseX + stick.dx, stick.baseY + stick.dy, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Не вызываем spawnAll() и loop() здесь — они запустятся, когда картинки загрузятся