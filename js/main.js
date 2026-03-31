import { initDashboard } from './dashboard.js';
import { initRoulette } from './roulette.js';

const pageButtons = Array.from(document.querySelectorAll('.nav-button[data-page], .game-tile[data-page] button, .game-tile[data-page]'));
const pages = Array.from(document.querySelectorAll('.page-panel'));
const dropdownToggle = document.querySelector('.dropdown-toggle');
const gamesDropdown = document.getElementById('gamesDropdown');
const authActions = document.getElementById('authActions');
const profileName = document.getElementById('profileName');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const toggleAuthModeButton = document.getElementById('toggleAuthMode');
const closeModalButton = document.getElementById('closeModal');

const leaderboardTable = document.getElementById('leaderboardTable');
const profileUsername = document.getElementById('profileUsername');
const profileTagline = document.getElementById('profileTagline');
const profileLevel = document.getElementById('profileLevel');
const profileBalance = document.getElementById('profileBalance');
const profileWins = document.getElementById('profileWins');
const recentActivityList = document.getElementById('recentActivityList');

const TOKEN_KEY = 'poolCasinoToken';
let authMode = 'login';
let currentPage = 'dashboard';

function setPageVisibility(pageId) {
  pages.forEach((page) => {
    page.classList.toggle('hidden', page.id !== `${pageId}Page`);
  });
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageId);
  });
  currentPage = pageId;
}

function openAuthModal(mode = 'login') {
  authMode = mode;
  authTitle.textContent = mode === 'login' ? 'Log In' : 'Sign Up';
  authSubmit.textContent = mode === 'login' ? 'Continue' : 'Create account';
  toggleAuthModeButton.textContent = mode === 'login' ? 'Sign Up' : 'Log In';
  authUsername.value = '';
  authPassword.value = '';
  authModal.classList.remove('hidden');
}

function closeAuthModal() {
  authModal.classList.add('hidden');
}

function setAuthState(user, token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    profileName.textContent = user.username.toUpperCase();
    authActions.classList.add('hidden');
    profileName.classList.remove('hidden');
  }
}

function clearAuthState() {
  localStorage.removeItem(TOKEN_KEY);
  authActions.classList.remove('hidden');
  profileName.classList.add('hidden');
  profileName.textContent = '';
}

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAuthState();
    throw new Error('Unauthorized');
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const data = await fetchWithAuth('/api/user');
    setAuthState(data.user, token);
  } catch (error) {
    clearAuthState();
  }
}

async function loadLeaderboard() {
  if (!leaderboardTable) return;
  leaderboardTable.innerHTML = `
    <div class="table-row table-header">
      <span>Rank</span>
      <span>Username</span>
      <span>Balance</span>
      <span>Winnings</span>
    </div>
  `;
  try {
    const data = await fetch('/api/leaderboard');
    if (!data.ok) throw new Error('Failed to load');
    const payload = await data.json();
    payload.leaderboard.forEach((player, index) => {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <span>${String(index + 1).padStart(2, '0')}</span>
        <span>${player.username}</span>
        <span>₿ ${Number(player.balance).toFixed(2)}</span>
        <span>—</span>
      `;
      leaderboardTable.append(row);
    });
  } catch (error) {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `<span colspan="4">Unable to load leaderboard</span>`;
    leaderboardTable.append(row);
  }
}

async function loadProfile() {
  if (!profileUsername) return;
  try {
    const data = await fetchWithAuth('/api/user');
    const history = await fetchWithAuth('/api/user/history');
    profileUsername.textContent = data.user.username.toUpperCase();
    profileTagline.textContent = `Member since ${new Date(data.user.created_at).toLocaleDateString()}`;
    profileLevel.textContent = String(Math.max(1, Math.floor(data.user.balance / 1250) + 1));
    profileBalance.textContent = `₿ ${Number(data.user.balance).toFixed(2)}`;
    profileWins.textContent = String((history.history || []).filter((entry) => entry.win).length);

    if (recentActivityList) {
      recentActivityList.innerHTML = '';
      if (history.history.length) {
        history.history.slice(0, 4).forEach((entry) => {
          const line = document.createElement('p');
          line.textContent = `${entry.game} ${entry.win ? '+WIN' : '+LOSS'} ${entry.bet_type.toUpperCase()} ₿ ${Number(entry.bet_amount).toFixed(2)}`;
          recentActivityList.append(line);
        });
      } else {
        recentActivityList.innerHTML = '<p>No recent activity</p>';
      }
    }
  } catch (error) {
    profileTagline.textContent = 'Log in to view your profile';
    profileBalance.textContent = '₿ 0.00';
    profileWins.textContent = '0';
    if (recentActivityList) {
      recentActivityList.innerHTML = '<p>No recent activity</p>';
    }
  }
}

async function refreshPage(pageId) {
  if (pageId === 'dashboard') {
    await initDashboard();
  }
  if (pageId === 'leaderboard') {
    await loadLeaderboard();
  }
  if (pageId === 'profile') {
    await loadProfile();
  }
  if (pageId === 'roulette') {
    initRoulette();
  }
}

function setActivePage(pageId) {
  setPageVisibility(pageId);
  refreshPage(pageId);
}

pageButtons.forEach((target) => {
  target.addEventListener('click', (event) => {
    event.stopPropagation();
    const page = target.dataset.page || target.getAttribute('data-page');
    if (!page) return;
    setActivePage(page);
    closeDropdown();
  });
});

dropdownToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  gamesDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
  gamesDropdown.classList.remove('open');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    gamesDropdown.classList.remove('open');
    closeAuthModal();
  }
});

loginButton.addEventListener('click', () => openAuthModal('login'));
signupButton.addEventListener('click', () => openAuthModal('signup'));
closeModalButton.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (event) => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});
toggleAuthModeButton.addEventListener('click', () => {
  openAuthModal(authMode === 'login' ? 'signup' : 'login');
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = authUsername.value.trim();
  const password = authPassword.value.trim();
  if (!username || !password) return;

  try {
    const response = await fetch(`/api/${authMode === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Authentication failed');
      return;
    }
    setAuthState(data.user, data.token);
    closeAuthModal();
    await refreshPage(currentPage);
  } catch (error) {
    alert(error.message || 'Authentication error');
  }
});

restoreSession().then(() => {
  setActivePage('dashboard');
});
