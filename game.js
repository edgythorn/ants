const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ant = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 32,
  speed: 3
};

const antImage = new Image();
antImage.src = 'ant.png';

const keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup',   e => keys[e.key] = false);

function update() {
  if (keys['ArrowLeft'])  ant.x -= ant.speed;
  if (keys['ArrowRight']) ant.x += ant.speed;
  if (keys['ArrowUp'])    ant.y -= ant.speed;
  if (keys['ArrowDown'])  ant.y += ant.speed;

  if (ant.x < 0) ant.x = canvas.width;
  if (ant.x > canvas.width) ant.x = 0;
  if (ant.y < 0) ant.y = canvas.height;
  if (ant.y > canvas.height) ant.y = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    antImage,
    ant.x - ant.size / 2,   // левый верхний угол картинки
    ant.y - ant.size / 2,
    ant.size,
    ant.size
  );
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();