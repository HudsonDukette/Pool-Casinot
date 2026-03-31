const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const betButtons = Array.from(document.querySelectorAll('.bet-button'));
const spinButton = document.getElementById('spinButton');
const winningNumberNode = document.getElementById('winningNumber');
const resultMessageNode = document.getElementById('resultMessage');
const betAmountInput = document.getElementById('betAmount');

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const segmentCount = numbers.length;
const segmentAngle = (Math.PI * 2) / segmentCount;
const colors = {
  red: '#ef4444',
  black: '#111',
  green: '#22c55e',
};

let selectedBet = 'red';
let isSpinning = false;
let spinStart = null;
let spinDuration = 3200;
let currentRotation = 0;
let ballAngle = 0;
let ballRadius = 250;
let ballSpeed = 0.22;
let targetRotation = 0;
let resultIndex = 0;

function renderWheel() {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = 240;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(currentRotation);

  for (let i = 0; i < segmentCount; i += 1) {
    const angle = i * segmentAngle;
    const number = numbers[i];
    const isZero = number === 0;
    const fillColor = isZero
      ? colors.green
      : i % 2 === 0
      ? colors.black
      : colors.red;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerRadius, angle, angle + segmentAngle);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const labelAngle = angle + segmentAngle / 2;
    const labelRadius = outerRadius - 42;
    ctx.save();
    ctx.translate(Math.cos(labelAngle) * labelRadius, Math.sin(labelAngle) * labelRadius);
    ctx.rotate(labelAngle + Math.PI / 2);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 0, 0);
    ctx.restore();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius - 64, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0b0f';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function renderBall() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const x = centerX + Math.cos(ballAngle + currentRotation) * ballRadius;
  const y = centerY + Math.sin(ballAngle + currentRotation) * ballRadius;

  ctx.beginPath();
  ctx.fillStyle = '#fafafa';
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 24;
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFrame() {
  renderWheel();
  renderBall();
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function updateSpin(timestamp) {
  if (!spinStart) spinStart = timestamp;
  const elapsed = timestamp - spinStart;
  const progress = Math.min(elapsed / spinDuration, 1);

  currentRotation = easeOutQuad(progress) * targetRotation;

  if (progress >= 1) {
    isSpinning = false;
    spinStart = null;
    ballSpeed = 0.03;
    return;
  }

  requestAnimationFrame(updateSpin);
}

function updateBall() {
  if (!isSpinning && ballRadius > 120) {
    ballRadius -= 0.6;
  }
  if (ballSpeed > 0.005) {
    ballAngle += ballSpeed;
    ballSpeed *= 0.997;
  }
  drawFrame();
  if (isSpinning || ballRadius > 120) {
    requestAnimationFrame(updateBall);
  }
}

function computeResultColor(number) {
  if (number === 0) return 'green';
  return number % 2 === 0 ? 'black' : 'red';
}

function resolveBet(result, betType) {
  if (betType === 'red' || betType === 'black') {
    return computeResultColor(result) === betType;
  }
  if (betType === 'green') {
    return result === 0;
  }
  if (betType === 'even') {
    return result !== 0 && result % 2 === 0;
  }
  if (betType === 'odd') {
    return result % 2 === 1;
  }
  return false;
}

function chooseResult() {
  return Math.floor(Math.random() * segmentCount);
}

function startSpin() {
  if (isSpinning) return;

  const betAmount = Number(betAmountInput.value);
  if (!betAmount || betAmount < 1) {
    resultMessageNode.textContent = 'Enter a bet amount';
    resultMessageNode.className = 'loss';
    return;
  }

  resultIndex = chooseResult();
  const resultNumber = numbers[resultIndex];
  const resultColor = computeResultColor(resultNumber);
  const won = resolveBet(resultNumber, selectedBet);

  targetRotation = Math.PI * 12 + (Math.PI * 2 - resultIndex * segmentAngle - segmentAngle / 2);
  currentRotation = 0;
  isSpinning = true;
  ballRadius = 250;
  ballSpeed = 0.22;
  spinStart = null;

  winningNumberNode.textContent = resultNumber;
  resultMessageNode.textContent = won ? 'Win! Collect your reward' : 'Loss. Try again.';
  resultMessageNode.className = won ? 'win' : 'loss';

  requestAnimationFrame(updateSpin);
  requestAnimationFrame(updateBall);
}

function clearSelection() {
  betButtons.forEach((button) => button.classList.remove('selected'));
}

function bindBetButtons() {
  betButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedBet = button.dataset.bet;
      clearSelection();
      button.classList.add('selected');
    });
  });
  const initial = betButtons.find((button) => button.dataset.bet === selectedBet);
  if (initial) initial.classList.add('selected');
}

export function initRoulette() {
  if (!canvas || !ctx) return;
  bindBetButtons();
  drawFrame();
  spinButton.addEventListener('click', startSpin);
}
