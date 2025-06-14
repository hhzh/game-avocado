// 牛油果生存游戏 - 能量与繁殖新逻辑 + 牛油果数量折线图 + 零时停止
let AVOCADO_COUNT = 20;
let FOOD_COUNT = 30;
const CANVAS_SIZE = 600;
const RADIUS = 280;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
let avocados = [];
let foods = [];
let running = false;
let day = 0;
let animationTimer = null;
let speedFps = 30;
let avocadoHistory = [];

const ENERGY_PER_FOOD = 10; // 每吃1个食物获得10能量
const ENERGY_PER_STEP = 1;  // 每移动1步消耗1能量
const FOOD_FOR_REPRODUCE = 2; // 每吃2个食物可繁殖

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
const chartCanvas = document.getElementById('chartCanvas');
const chartCtx = chartCanvas.getContext('2d');

function randomInDisk() {
  const t = 2 * Math.PI * Math.random();
  const r = Math.sqrt(Math.random()) * RADIUS;
  return {
    x: CENTER_X + r * Math.cos(t),
    y: CENTER_Y + r * Math.sin(t)
  };
}
function randomOnCircleEdge() {
  const t = 2 * Math.PI * Math.random();
  return {
    x: CENTER_X + RADIUS * Math.cos(t),
    y: CENTER_Y + RADIUS * Math.sin(t),
    angle: t
  };
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

class Avocado {
  constructor(home) {
    this.home = home;
    this.x = home.x;
    this.y = home.y;
    this.energy = 0;
    this.foodEatenToday = 0;
    this.foodEatenForReproduce = 0;
    this.target = null;
    this.isAtHome = true;
    this.wantReproduce = false;
  }
  resetForNewDay(isFirstDay) {
    if (isFirstDay) {
      this.energy = 20; // 只有第一天初始能量为20
    }
    this.foodEatenToday = 0;
    this.wantReproduce = false;
    this.x = this.home.x;
    this.y = this.home.y;
    this.target = null;
    this.isAtHome = true;
  }
  goForage() {
    this.target = randomInDisk();
    this.isAtHome = false;
  }
  moveToTarget() {
    if (!this.target) return;
    let dx = this.target.x - this.x;
    let dy = this.target.y - this.y;
    let dist = Math.hypot(dx, dy);
    let step = Math.min(22, dist);
    if (dist < 2) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.target = null;
    } else {
      this.x += dx / dist * step;
      this.y += dy / dist * step;
      this.energy -= ENERGY_PER_STEP;
    }
  }
  goHome() {
    this.target = {x: this.home.x, y: this.home.y};
  }
  atHome() {
    return distance(this, this.home) < 2;
  }
}

class Food {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function spawnAvocados() {
  avocados = [];
  for (let i = 0; i < AVOCADO_COUNT; i++) {
    const home = randomOnCircleEdge();
    avocados.push(new Avocado(home));
  }
}
function spawnFoods() {
  foods = [];
  for (let i = 0; i < FOOD_COUNT; i++) {
    const pos = randomInDisk();
    foods.push(new Food(pos.x, pos.y));
  }
}
function drawDisk() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#eee';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
}
function drawAvocado(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 14, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#7ed957';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 4, 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#a0522d';
  ctx.fill();
  ctx.restore();
}
function drawFood(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffe066';
  ctx.fill();
}

function drawChart() {
  chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  // 坐标轴
  chartCtx.strokeStyle = '#bbb';
  chartCtx.lineWidth = 1;
  chartCtx.beginPath();
  chartCtx.moveTo(40, 20);
  chartCtx.lineTo(40, 580);
  chartCtx.lineTo(210, 580);
  chartCtx.stroke();

  // 画Y轴刻度和标签（牛油果数量）
  let maxY = Math.max(...avocadoHistory, 10);
  let minY = 0;
  chartCtx.fillStyle = '#444';
  chartCtx.font = '12px sans-serif';
  for (let i = 0; i <= 5; i++) {
    let val = Math.round(maxY * (i / 5));
    let y = 580 - (540 * i / 5);
    chartCtx.fillText(val, 10, y + 4);
    chartCtx.beginPath();
    chartCtx.moveTo(36, y);
    chartCtx.lineTo(44, y);
    chartCtx.strokeStyle = '#bbb';
    chartCtx.stroke();
  }

  // 画X轴刻度和标签（天数）
  let maxX = Math.max(avocadoHistory.length - 1, 10);
  for (let i = 0; i <= 5; i++) {
    let dayVal = Math.round(maxX * i / 5);
    let x = 40 + (330 * i / 5);
    chartCtx.fillText(dayVal, x - 6, 595);
    chartCtx.beginPath();
    chartCtx.moveTo(x, 576);
    chartCtx.lineTo(x, 584);
    chartCtx.strokeStyle = '#bbb';
    chartCtx.stroke();
  }

  // 画折线
  if (avocadoHistory.length > 1) {
    chartCtx.strokeStyle = '#7ed957';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    for (let i = 0; i < avocadoHistory.length; i++) {
      let x = 40 + (330 * i / maxX);
      let y = 580 - (540 * (avocadoHistory[i] - minY) / (maxY - minY + 1e-6));
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();
  }
  // 标注
  chartCtx.fillStyle = '#222';
  chartCtx.font = '13px sans-serif';
  chartCtx.fillText('牛油果数量', 60, 32);
  chartCtx.save();
  chartCtx.translate(18, 350);
  chartCtx.rotate(-Math.PI/2);
  chartCtx.fillText('数量', 0, 0);
  chartCtx.restore();
  chartCtx.fillText('天数', 120, 595);
}


// 游戏状态：0=在家，1=觅食，2=回家
let gamePhase = 0;
let phaseFrame = 0;
const PHASE_FRAMES = 40;
let reproduceQueue = [];

function update() {
  if (gamePhase === 0) {
    // 新一天，重置能量和食物计数
    for (const avo of avocados) {
      avo.resetForNewDay(day === 0);
    }
    // 前一天吃够2个食物的牛油果，今天繁殖
    for (const avo of reproduceQueue) {
      const home = randomOnCircleEdge();
      const newAvo = new Avocado(home);
      newAvo.energy = 20; // 新生成的牛油果自带20能量
      avocados.push(newAvo);
    }
    reproduceQueue = [];
    // 记录历史
    avocadoHistory.push(avocados.length);
    drawChart();
    // 如果牛油果数量为0，停止运行
    if (avocados.length === 0) {
      running = false;
      if (animationTimer) clearTimeout(animationTimer);
      return;
    }
    // 出发觅食
    for (const avo of avocados) {
      avo.goForage();
    }
    gamePhase = 1;
    phaseFrame = 0;
    return;
  }
  if (gamePhase === 1) {
    // 觅食阶段
    let allArrived = true;
    for (let i = avocados.length - 1; i >= 0; i--) {
      const avo = avocados[i];
      if (avo.target) {
        avo.moveToTarget();
        allArrived = false;
        // 能量耗尽就饿死
        if (avo.energy < 0) {
          avocados.splice(i, 1);
          continue;
        }
      }
    }
    // 吃食物
    for (const avo of avocados) {
      for (let i = foods.length - 1; i >= 0; i--) {
        if (distance(avo, foods[i]) < 14) {
          foods.splice(i, 1);
          avo.energy += ENERGY_PER_FOOD;
          avo.foodEatenToday++;
          avo.foodEatenForReproduce++;
        }
      }
    }
    phaseFrame++;
    if (allArrived || phaseFrame > PHASE_FRAMES) {
      // 觅食结束，回家
      for (const avo of avocados) {
        avo.goHome();
      }
      gamePhase = 2;
      phaseFrame = 0;
    }
    return;
  }
  if (gamePhase === 2) {
    // 回家阶段
    let allHome = true;
    for (let i = avocados.length - 1; i >= 0; i--) {
      const avo = avocados[i];
      if (!avo.atHome()) {
        avo.moveToTarget();
        allHome = false;
        // 能量耗尽就饿死
        if (avo.energy < 0) {
          avocados.splice(i, 1);
          continue;
        }
      } else {
        avo.x = avo.home.x;
        avo.y = avo.home.y;
        avo.isAtHome = true;
        avo.target = null;
      }
    }
    phaseFrame++;
    if (allHome || phaseFrame > PHASE_FRAMES) {
      // 统计可繁殖牛油果，补充食物
      reproduceQueue = [];
      for (const avo of avocados) {
        if (avo.foodEatenForReproduce >= FOOD_FOR_REPRODUCE) {
          avo.foodEatenForReproduce = 0;
          reproduceQueue.push(avo);
        }
      }
      while (foods.length < FOOD_COUNT) {
        const pos = randomInDisk();
        foods.push(new Food(pos.x, pos.y));
      }
      gamePhase = 0;
      phaseFrame = 0;
      day++;
      updateDayCounter();
    }
    return;
  }
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawDisk();
  for (const food of foods) {
    drawFood(food.x, food.y);
  }
  for (const avo of avocados) {
    drawAvocado(avo.x, avo.y);
  }
}
function updateDayCounter() {
  document.getElementById('dayCounter').textContent = `天数：${day}`;
}
function gameLoop() {
  if (!running) return;
  update();
  draw();
  animationTimer = setTimeout(gameLoop, 1000 / speedFps);
}
function startGame() {
  AVOCADO_COUNT = parseInt(document.getElementById('avocadoCount').value);
  FOOD_COUNT = parseInt(document.getElementById('foodCount').value);
  day = 0;
  avocadoHistory = [];
  updateDayCounter();
  spawnAvocados();
  spawnFoods();
  running = true;
  gamePhase = 0;
  phaseFrame = 0;
  draw();
  drawChart();
  if (animationTimer) clearTimeout(animationTimer);
  animationTimer = setTimeout(gameLoop, 1000 / speedFps);
}
document.getElementById('startBtn').onclick = function() {
  running = false;
  setTimeout(startGame, 50);
};
const pauseBtn = document.getElementById('pauseBtn');
pauseBtn.onclick = function() {
  if (running) {
    running = false;
    if (animationTimer) clearTimeout(animationTimer);
    pauseBtn.textContent = '恢复';
  } else {
    running = true;
    pauseBtn.textContent = '暂停';
    animationTimer = setTimeout(gameLoop, 1000 / speedFps);
  }
};
document.getElementById('speedSlider').oninput = function(e) {
  speedFps = parseInt(this.value);
  document.getElementById('speedLabel').textContent = speedFps;
};
draw();
drawChart();
updateDayCounter();
