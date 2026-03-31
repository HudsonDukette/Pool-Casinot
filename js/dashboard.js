export function initDashboard() {
  const placeholders = {
    globalPool: '₿ 12.8M',
    featured: ['Roulette Royale', 'Neon Blackjack'],
    recentWins: ['JAZZMASTER +₿ 4.2k', 'NEONRUSH +₿ 8.7k'],
    biggestBet: '₿ 125k',
    biggestWin: '₿ 487k',
  };

  const cardNodes = document.querySelectorAll('.info-card');
  if (!cardNodes.length) return;

  cardNodes[0].querySelector('p:nth-of-type(1)').textContent = `Active wagers: 1,195`;
  cardNodes[0].querySelector('p:nth-of-type(2)').textContent = `Pool liquidity: ${placeholders.globalPool}`;
  cardNodes[1].querySelector('p:nth-of-type(1)').textContent = placeholders.featured[0];
  cardNodes[1].querySelector('p:nth-of-type(2)').textContent = placeholders.featured[1];
  cardNodes[2].querySelector('p:nth-of-type(1)').textContent = placeholders.recentWins[0];
  cardNodes[2].querySelector('p:nth-of-type(2)').textContent = placeholders.recentWins[1];
  cardNodes[3].querySelector('p:nth-of-type(1)').innerHTML = `Bet: <strong>${placeholders.biggestBet}</strong>`;
  cardNodes[3].querySelector('p:nth-of-type(2)').innerHTML = `Win: <strong>${placeholders.biggestWin}</strong>`;
}
