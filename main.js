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
  constructor(home, type = 'green') {
    this.home = home;
    this.x = home.x;
    this.y = home.y;
    this.type = type; // 'green' or 'red' or 'black'
    this.energy = 0;
    this.foodEatenToday = 0;
    this.foodEatenForReproduce = 0;
    this.target = null;
    this.isAtHome = true;
    this.wantReproduce = false;
    this.redDays = 0; // 红色牛油果存活天数
  }
  resetForNewDay(isFirstDay) {
    if (isFirstDay) {
      this.energy = this.type === 'red' ? 100 : 20;
    }
    this.foodEatenToday = 0;
    this.wantReproduce = false;
    this.x = this.home.x;
    this.y = this.home.y;
    this.target = null;
    this.isAtHome = true;
    if (this.type === 'red') {
      this.redDays = (this.redDays || 0) + 1;
    } else {
      this.redDays = 0;
    }
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
      if (this.type === 'black') {
        this.energy -= 5;
      } else if (this.type === 'red') {
        this.energy -= 2;
      } else {
        this.energy -= ENERGY_PER_STEP;
      }
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
  // 普通牛油果
  for (let i = 0; i < AVOCADO_COUNT; i++) {
    const home = randomOnCircleEdge();
    const avo = new Avocado(home, 'green');
    avocados.push(avo);
  }
  // 不再生成红色牛油果
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
function drawAvocado(x, y, type = 'green') {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 14, 0, 0, 2 * Math.PI);
  ctx.fillStyle = type === 'red' ? '#e74c3c' : (type === 'black' ? '#222' : '#7ed957');
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
  let maxY = Math.max(...avocadoHistory.map(h => Math.max(h.green, h.red, h.black)), 10);
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

  // 画绿色牛油果折线
  if (avocadoHistory.length > 1) {
    chartCtx.strokeStyle = '#7ed957';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    for (let i = 0; i < avocadoHistory.length; i++) {
      let x = 40 + (330 * i / maxX);
      let y = 580 - (540 * (avocadoHistory[i].green - minY) / (maxY - minY + 1e-6));
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();
    // 画红色牛油果折线
    chartCtx.strokeStyle = '#e74c3c';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    for (let i = 0; i < avocadoHistory.length; i++) {
      let x = 40 + (330 * i / maxX);
      let y = 580 - (540 * (avocadoHistory[i].red - minY) / (maxY - minY + 1e-6));
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();
    // 画黑色牛油果折线
    chartCtx.strokeStyle = '#222';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    for (let i = 0; i < avocadoHistory.length; i++) {
      let x = 40 + (330 * i / maxX);
      let y = 580 - (540 * (avocadoHistory[i].black - minY) / (maxY - minY + 1e-6));
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
  // 图例
  chartCtx.fillStyle = '#7ed957';
  chartCtx.fillRect(280, 30, 16, 8);
  chartCtx.fillStyle = '#222';
  chartCtx.fillText('绿色牛油果', 300, 38);

  chartCtx.fillStyle = '#e74c3c';
  chartCtx.fillRect(280, 55, 16, 8);
  chartCtx.fillStyle = '#222';
  chartCtx.fillText('红色牛油果', 300, 63);

  chartCtx.fillStyle = '#222';
  chartCtx.fillRect(280, 80, 16, 8);
  chartCtx.fillStyle = '#222';
  chartCtx.fillText('黑色牛油果', 300, 88);
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
    // 绿色牛油果有5%概率变成红色牛油果
    for (const avo of avocados) {
      if (avo.type === 'green' && Math.random() < 0.05) {
        avo.type = 'red';
        avo.energy = 100;
        avo.redDays = 1;
      }
    }
    // 红色牛油果存活5天后有50%概率变回绿色牛油果
    for (const avo of avocados) {
      if (avo.type === 'red' && avo.redDays >= 5 && Math.random() < 0.5) {
        avo.type = 'green';
        avo.energy = 20;
        avo.redDays = 0;
      }
    }
    // 黑色牛油果每天有5%概率死亡
    for (let i = avocados.length - 1; i >= 0; i--) {
      const avo = avocados[i];
      if (avo.type === 'black' && Math.random() < 0.05) {
        avocados.splice(i, 1);
      }
    }
    // 判断是否丰收年或灾荒年
    let foodMultiplier = 1;
    let yearEvent = null;
    let rand = Math.random();
    if (rand < 0.05) {
      if (Math.random() < 0.5) {
        foodMultiplier = 2;
        yearEvent = '丰收年';
      } else {
        foodMultiplier = 0.5;
        yearEvent = '灾荒年';
      }
      console.log('本年为：' + yearEvent);
    }
    // 前一天吃够2个食物的牛油果，今天繁殖
    for (const avo of reproduceQueue) {
      if (avo.type === 'black') continue; // 黑色牛油果无法繁殖
      if (avo.type === 'green') {
        for (let k = 0; k < 2; k++) {
          const home = randomOnCircleEdge();
          const newAvo = new Avocado(home, avo.type);
          newAvo.energy = 20;
          avocados.push(newAvo);
        }
      } else {
        const home = randomOnCircleEdge();
        const newAvo = new Avocado(home, avo.type);
        newAvo.energy = avo.type === 'red' ? 100 : 20;
        avocados.push(newAvo);
      }
    }
    reproduceQueue = [];
    // 记录历史
    let greenCount = avocados.filter(a => a.type === 'green').length;
    let redCount = avocados.filter(a => a.type === 'red').length;
    let blackCount = avocados.filter(a => a.type === 'black').length;
    avocadoHistory.push({ green: greenCount, red: redCount, black: blackCount });
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
    // 设置本年食物补充倍数
    update.foodMultiplier = foodMultiplier;
    gamePhase = 1;
    phaseFrame = 0;
    return;
  }
  if (gamePhase === 1) {
    // 觅食阶段
    let allArrived = true;
    // 先处理黑化和捕食逻辑
    for (let i = avocados.length - 1; i >= 0; i--) {
      const avo = avocados[i];
      // 普通牛油果能量≤3时有10%概率尝试吃掉附近其他牛油果
      if (avo.type === 'green' && avo.energy <= 3 && Math.random() < 0.1) {
        let minDist = 9999, targetIdx = -1;
        for (let j = 0; j < avocados.length; j++) {
          if (i === j) continue;
          const other = avocados[j];
          if (other.type === 'black') continue;
          let d = distance(avo, other);
          if (d < 18 && d < minDist) {
            minDist = d;
            targetIdx = j;
          }
        }
        if (targetIdx !== -1) {
          avo.type = 'black';
          avo.energy = avocados[targetIdx].energy;
          avocados.splice(targetIdx, 1);
          if (targetIdx < i) i--;
        }
      }
      // 黑色牛油果可以吃掉任何其他牛油果
      if (avo.type === 'black') {
        let minDist = 9999, targetIdx = -1;
        for (let j = 0; j < avocados.length; j++) {
          if (i === j) continue;
          const other = avocados[j];
          let d = distance(avo, other);
          if (d < 18 && d < minDist) {
            minDist = d;
            targetIdx = j;
          }
        }
        if (targetIdx !== -1) {
          avo.energy += avocados[targetIdx].energy;
          avocados.splice(targetIdx, 1);
          if (targetIdx < i) i--;
        }
      }
    }
    // 再遍历所有牛油果执行移动和能量判断
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
      // 按丰收/灾荒年补充食物
      let multiplier = update.foodMultiplier || 1;
      while (foods.length < Math.floor(FOOD_COUNT * multiplier)) {
        const pos = randomInDisk();
        foods.push(new Food(pos.x, pos.y));
      }
      update.foodMultiplier = 1; // 恢复默认
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
    drawAvocado(avo.x, avo.y, avo.type);
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
