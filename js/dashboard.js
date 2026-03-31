import { getSupabase } from '../lib/supabase.js'

async function fetchStats() {
  try {
    const supabase = await getSupabase()
    const { data: stats, error: statsErr } = await supabase.from('global_stats').select('total_pool,biggest_win,biggest_bet').eq('id', 1).single()
    if (statsErr) throw statsErr
    const { data: recentWins, error: winsErr } = await supabase
      .from('game_history')
      .select('bet_amount, result_number, bet_type, win, created_at, users(username)')
      .eq('win', 1)
      .order('created_at', { ascending: false })
      .limit(4)
    if (winsErr) throw winsErr
    return { ...stats, recent_wins: recentWins || [] }
  } catch (error) {
    return null
  }
}

export async function initDashboard() {
  const placeholders = {
    globalPool: '₿ 12.8M',
    featured: ['Roulette Royale', 'Neon Blackjack'],
    recentWins: ['JAZZMASTER +₿ 4.2k', 'NEONRUSH +₿ 8.7k'],
    biggestBet: '₿ 125k',
    biggestWin: '₿ 487k',
  };

  const globalPoolCard = document.getElementById('globalPoolCard');
  const featuredCards = document.getElementById('featuredGamesCard');
  const recentWinsCard = document.getElementById('recentWinsCard');
  const biggestCard = document.getElementById('biggestBetWinCard');

  const stats = await fetchStats();
  const poolValue = stats ? `₿ ${Number(stats.total_pool).toFixed(2)}` : placeholders.globalPool;
  const biggestBet = stats ? `₿ ${Number(stats.biggest_bet).toFixed(2)}` : placeholders.biggestBet;
  const biggestWin = stats ? `₿ ${Number(stats.biggest_win).toFixed(2)}` : placeholders.biggestWin;
  const recentWins = stats && stats.recent_wins.length ? stats.recent_wins : null;

  if (globalPoolCard) {
    globalPoolCard.querySelector('p:nth-of-type(1)').textContent = `Active wagers: 1,195`;
    globalPoolCard.querySelector('p:nth-of-type(2)').innerHTML = `Pool liquidity: <strong>${poolValue}</strong>`;
  }

  if (featuredCards) {
    featuredCards.querySelector('p:nth-of-type(1)').textContent = placeholders.featured[0];
    featuredCards.querySelector('p:nth-of-type(2)').textContent = placeholders.featured[1];
  }

  if (recentWinsCard) {
    if (recentWins) {
      recentWinsCard.querySelector('p:nth-of-type(1)').textContent = `${recentWins[0].username} +₿ ${Number(recentWins[0].bet_amount).toFixed(2)}`;
      recentWinsCard.querySelector('p:nth-of-type(2)').textContent = `${recentWins[1] ? recentWins[1].username : recentWins[0].username} +₿ ${Number(recentWins[1] ? recentWins[1].bet_amount : recentWins[0].bet_amount).toFixed(2)}`;
    } else {
      recentWinsCard.querySelector('p:nth-of-type(1)').textContent = placeholders.recentWins[0];
      recentWinsCard.querySelector('p:nth-of-type(2)').textContent = placeholders.recentWins[1];
    }
  }

  if (biggestCard) {
    biggestCard.querySelector('p:nth-of-type(1)').innerHTML = `Bet: <strong>${biggestBet}</strong>`;
    biggestCard.querySelector('p:nth-of-type(2)').innerHTML = `Win: <strong>${biggestWin}</strong>`;
  }
}
