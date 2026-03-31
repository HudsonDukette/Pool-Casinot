import { getSupabase } from '../lib/supabase.js'

const canvas = document.getElementById('rouletteCanvas')
const ctx = canvas.getContext('2d')
const betButtons = Array.from(document.querySelectorAll('.bet-button'))
const spinButton = document.getElementById('spinButton')
const winningNumberNode = document.getElementById('winningNumber')
const resultMessageNode = document.getElementById('resultMessage')
const betAmountInput = document.getElementById('betAmount')

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const segmentCount = numbers.length;
const segmentAngle = (Math.PI * 2) / segmentCount;
const colors = { red: '#ef4444', black: '#111', green: '#22c55e' };

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
let isRouletteInitialized = false;

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
    const fillColor = number === 0 ? colors.green : i % 2 === 0 ? colors.black : colors.red;

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
  ctx.shadowBlur = 22;
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
    ballSpeed = 0.04;
    return;
  }
  requestAnimationFrame(updateSpin);
}

function updateBall() {
  if (!isSpinning && ballRadius > 120) {
    ballRadius -= 0.7;
  }
  if (ballSpeed > 0.005) {
    ballAngle += ballSpeed;
    ballSpeed *= 0.995;
  }
  drawFrame();
  if (isSpinning || ballRadius > 120) {
    requestAnimationFrame(updateBall);
  }
}

function getToken() {
  return localStorage.getItem('poolCasinoToken')
}

function computeResultColor(number) {
  if (number === 0) return 'green';
  return number % 2 === 0 ? 'black' : 'red';
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

async function startSpin() {
  if (isSpinning) return
  const betAmount = Number(betAmountInput.value)
  if (!betAmount || betAmount < 1) {
    resultMessageNode.textContent = 'Enter a valid bet amount'
    resultMessageNode.className = 'loss'
    return
  }

  try {
    const supabase = await getSupabase()
    // get current user
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      resultMessageNode.textContent = 'Log in to place a bet'
      resultMessageNode.className = 'loss'
      return
    }

    // fetch balance
    const { data: userRow, error: balanceErr } = await supabase.from('users').select('balance').eq('id', user.id).single()
    if (balanceErr || !userRow) throw balanceErr || new Error('Unable to load balance')
    if (betAmount > userRow.balance) {
      resultMessageNode.textContent = 'Insufficient balance'
      resultMessageNode.className = 'loss'
      return
    }

    // choose result and compute win
    const resultNumber = Math.floor(Math.random() * 37)
    const win = (() => {
      if (selectedBet === 'red' || selectedBet === 'black') {
        const color = resultNumber === 0 ? 'green' : resultNumber % 2 === 0 ? 'black' : 'red'
        return color === selectedBet
      }
      if (selectedBet === 'green') return resultNumber === 0
      if (selectedBet === 'even') return resultNumber !== 0 && resultNumber % 2 === 0
      if (selectedBet === 'odd') return resultNumber % 2 === 1
      return false
    })()

    const payout = selectedBet === 'green' ? betAmount * 35 : betAmount
    const profit = win ? payout : -betAmount
    const newBalance = Number(userRow.balance) + profit

    // update user's balance
    const { error: updateErr } = await supabase.from('users').update({ balance: newBalance }).eq('id', user.id)
    if (updateErr) throw updateErr

    // insert game history
    await supabase.from('game_history').insert({ user_id: user.id, game: 'roulette', result_number: resultNumber, bet_type: selectedBet, bet_amount: betAmount, win: win ? 1 : 0 })

    // update global stats
    const { data: stats } = await supabase.from('global_stats').select('total_pool,biggest_win,biggest_bet').eq('id', 1).single()
    if (stats) {
      const poolChange = win ? -profit : betAmount
      const totalPool = (stats.total_pool || 0) + poolChange
      const biggestWin = win && profit > (stats.biggest_win || 0) ? profit : stats.biggest_win
      const biggestBet = betAmount > (stats.biggest_bet || 0) ? betAmount : stats.biggest_bet
      await supabase.from('global_stats').update({ total_pool: totalPool, biggest_win: biggestWin, biggest_bet: biggestBet }).eq('id', 1)
    }

    // animate wheel
    const targetNumber = resultNumber
    resultIndex = numbers.indexOf(targetNumber)
    if (resultIndex < 0) resultIndex = 0
    targetRotation = Math.PI * 12 + (Math.PI * 2 - resultIndex * segmentAngle - segmentAngle / 2)
    currentRotation = 0
    isSpinning = true
    ballRadius = 250
    ballSpeed = 0.22
    spinStart = null

    winningNumberNode.textContent = targetNumber
    resultMessageNode.textContent = win ? 'Win! Collect your reward' : 'Loss. Try again.'
    resultMessageNode.className = win ? 'win' : 'loss'
    drawFrame()
    requestAnimationFrame(updateSpin)
    requestAnimationFrame(updateBall)
  } catch (error) {
    resultMessageNode.textContent = error?.message || 'Spin failed'
    resultMessageNode.className = 'loss'
  }
}

export function initRoulette() {
  if (!canvas || !ctx) return;
  if (!isRouletteInitialized) {
    isRouletteInitialized = true;
    bindBetButtons();
    spinButton.addEventListener('click', startSpin);
  }
  drawFrame();
}
