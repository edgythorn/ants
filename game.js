const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ant = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 32,
    speed: 6,
    angle: 0   // в радианах, 0 = смотрит вправо
};

const antImage = new Image();
antImage.src = 'ant.png';

const keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'])  dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    if (keys['ArrowUp'])    dy -= 1;
    if (keys['ArrowDown'])  dy += 1;

    if (dx !== 0 || dy !== 0) {
        ant.x += dx * ant.speed;
        ant.y += dy * ant.speed;

        // угол: картинка нарисована головой ВВЕРХ (0 = вверх по экрану)
        // atan2(dx, -dy): вверх → 0, вправо → +90°, вниз → 180°, влево → -90°
        ant.angle = Math.atan2(dx, -dy);
    }

    // телепорт через края
    if (ant.x < 0) ant.x = canvas.width;
    if (ant.x > canvas.width) ant.x = 0;
    if (ant.y < 0) ant.y = canvas.height;
    if (ant.y > canvas.height) ant.y = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(ant.x, ant.y);
    ctx.rotate(ant.angle);            // поворачиваем "кисть" на угол
    ctx.drawImage(antImage, -ant.size / 2, -ant.size / 2, ant.size, ant.size);
    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();