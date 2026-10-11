const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ant = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 12,
  speed: 3
};

const keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup',   e => keys[e.key] = false);

function update() {
  if (keys['ArrowLeft'])  ant.x -= ant.speed;
  if (keys['ArrowRight']) ant.x += ant.speed;
  if (keys['ArrowUp'])    ant.y -= ant.speed;
  if (keys['ArrowDown'])  ant.y += ant.speed;

  ant.x = Math.max(ant.size, Math.min(canvas.width  - ant.size, ant.x));
  ant.y = Math.max(ant.size, Math.min(canvas.height - ant.size, ant.y));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // тело
  ctx.fillStyle = '#3a1f0a';
  ctx.beginPath();
  ctx.arc(ant.x, ant.y, ant.size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // голова
  ctx.beginPath();
  ctx.arc(ant.x, ant.y - ant.size * 0.5, ant.size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();