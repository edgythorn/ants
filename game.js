const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- адаптивный размер ---
function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const ant = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 32,
    speed: 6,
    angle: 0
};

const antImage = new Image();
antImage.src = 'ant.png';

// --- ввод с клавиатуры ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup',   e => keys[e.key] = false);

// --- виртуальный джойстик ---
const stick = { active: false, baseX: 0, baseY: 0, dx: 0, dy: 0 };
const STICK_RADIUS = 60;   // максимальное отклонение пальца
const DEAD_ZONE    = 12;   // мёртвая зона (лёгкие касания игнорим)

function touchStart(e) {
    const t = e.changedTouches[0];
    stick.active = true;
    stick.baseX = t.clientX;
    stick.baseY = t.clientY;
    stick.dx = 0;
    stick.dy = 0;
}
function touchMove(e) {
    if (!stick.active) return;
    const t = e.changedTouches[0];
    let dx = t.clientX - stick.baseX;
    let dy = t.clientY - stick.baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
        dx = dx / dist * STICK_RADIUS;
        dy = dy / dist * STICK_RADIUS;
    }
    stick.dx = dx;
    stick.dy = dy;
}
function touchEnd() {
    stick.active = false;
    stick.dx = 0;
    stick.dy = 0;
}
canvas.addEventListener('touchstart', touchStart, { passive: true });
canvas.addEventListener('touchmove',  touchMove,  { passive: true });
canvas.addEventListener('touchend',   touchEnd);
canvas.addEventListener('touchcancel',touchEnd);

// --- мышь (на компьютере тоже удобно) ---
let mouseDown = false;
canvas.addEventListener('mousedown', e => {
    mouseDown = true;
    stick.active = true;
    stick.baseX = e.clientX;
    stick.baseY = e.clientY;
});
canvas.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    let dx = e.clientX - stick.baseX;
    let dy = e.clientY - stick.baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
        dx = dx / dist * STICK_RADIUS;
        dy = dy / dist * STICK_RADIUS;
    }
    stick.dx = dx;
    stick.dy = dy;
});
window.addEventListener('mouseup', () => {
    mouseDown = false;
    stick.active = false;
    stick.dx = 0;
    stick.dy = 0;
});

// --- движение ---
function update() {
    let dx = 0, dy = 0;

    // клавиатура
    if (keys['ArrowLeft'])  dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    if (keys['ArrowUp'])    dy -= 1;
    if (keys['ArrowDown'])  dy += 1;

    // джойстик (если палец реально сдвинулся)
    if (stick.active && Math.hypot(stick.dx, stick.dy) > DEAD_ZONE) {
        dx = stick.dx / STICK_RADIUS;
        dy = stick.dy / STICK_RADIUS;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
        // нормализуем: скорость одинаковая в любом направлении
        const nx = dx / len;
        const ny = dy / len;
        ant.x += nx * ant.speed;
        ant.y += ny * ant.speed;
        ant.angle = Math.atan2(nx, -ny);
    }

    // телепорт через края
    if (ant.x < 0) ant.x = canvas.width;
    if (ant.x > canvas.width) ant.x = 0;
    if (ant.y < 0) ant.y = canvas.height;
    if (ant.y > canvas.height) ant.y = 0;
}

// --- рисование ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // муравей
    ctx.save();
    ctx.translate(ant.x, ant.y);
    ctx.rotate(ant.angle);
    ctx.drawImage(antImage, -ant.size / 2, -ant.size / 2, ant.size, ant.size);
    ctx.restore();

    // джойстик (виден только когда палец на экране)
    if (stick.active) {
        ctx.beginPath();
        ctx.arc(stick.baseX, stick.baseY, STICK_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(stick.baseX + stick.dx, stick.baseY + stick.dy, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();