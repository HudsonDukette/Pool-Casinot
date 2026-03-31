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

let isLoggedIn = false;
let currentPage = 'dashboard';

function setActivePage(pageId) {
  pages.forEach((page) => {
    page.classList.toggle('hidden', page.id !== `${pageId}Page`);
  });

  document.querySelectorAll('.nav-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageId);
  });

  currentPage = pageId;
  if (pageId === 'roulette') {
    initRoulette();
  }
}

function toggleDropdown() {
  gamesDropdown.classList.toggle('open');
}

function closeDropdown() {
  gamesDropdown.classList.remove('open');
}

function setLoginState(active) {
  isLoggedIn = active;
  authActions.classList.toggle('hidden', active);
  profileName.classList.toggle('hidden', !active);
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
  toggleDropdown();
});

document.addEventListener('click', () => {
  closeDropdown();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDropdown();
});

loginButton.addEventListener('click', () => setLoginState(true));
signupButton.addEventListener('click', () => setLoginState(true));

initDashboard();
setActivePage('dashboard');
