import { initDashboard } from './dashboard.js'
import { initRoulette } from './roulette.js'
import { supabase } from '../lib/supabase.js'

const pageButtons = Array.from(document.querySelectorAll('.nav-button[data-page], .game-tile[data-page] button, .game-tile[data-page]'))
const pages = Array.from(document.querySelectorAll('.page-panel'))
const dropdownToggle = document.querySelector('.dropdown-toggle')
const gamesDropdown = document.getElementById('gamesDropdown')
const authActions = document.getElementById('authActions')
const profileName = document.getElementById('profileName')
const loginButton = document.getElementById('loginButton')
const signupButton = document.getElementById('signupButton')
const authModal = document.getElementById('authModal')
const authTitle = document.getElementById('authTitle')
const authForm = document.getElementById('authForm')
const authUsername = document.getElementById('authUsername')
const authPassword = document.getElementById('authPassword')
const authSubmit = document.getElementById('authSubmit')
const toggleAuthModeButton = document.getElementById('toggleAuthMode')
const closeModalButton = document.getElementById('closeModal')

const leaderboardTable = document.getElementById('leaderboardTable')
const profileUsername = document.getElementById('profileUsername')
const profileTagline = document.getElementById('profileTagline')
const profileLevel = document.getElementById('profileLevel')
const profileBalance = document.getElementById('profileBalance')
const profileWins = document.getElementById('profileWins')
const recentActivityList = document.getElementById('recentActivityList')

let authMode = 'login'
let currentPage = 'dashboard'

function setPageVisibility(pageId) {
  pages.forEach((page) => {
    page.classList.toggle('hidden', page.id !== `${pageId}Page`)
  })
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageId)
  })
  currentPage = pageId
}

function openAuthModal(mode = 'login') {
  authMode = mode
  authTitle.textContent = mode === 'login' ? 'Log In' : 'Sign Up'
  authSubmit.textContent = mode === 'login' ? 'Continue' : 'Create account'
  toggleAuthModeButton.textContent = mode === 'login' ? 'Sign Up' : 'Log In'
  authUsername.value = ''
  authPassword.value = ''
  authModal.classList.remove('hidden')
}

function closeAuthModal() {
  authModal.classList.add('hidden')
}

async function setAuthStateFromUser(user) {
  try {
    const { data, error } = await supabase.from('users').select('username').eq('id', user.id).single()
    const username = data?.username || (user.email ? user.email.split('@')[0] : 'PLAYER')
    profileName.textContent = username.toUpperCase()
    authActions.classList.add('hidden')
    profileName.classList.remove('hidden')
  } catch (e) {
    profileName.textContent = (user.email || 'PLAYER').toUpperCase()
    authActions.classList.add('hidden')
    profileName.classList.remove('hidden')
  }
}

function clearAuthState() {
  profileName.classList.add('hidden')
  profileName.textContent = ''
  authActions.classList.remove('hidden')
}

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    setAuthStateFromUser(session.user)
    refreshPage(currentPage)
  } else {
    clearAuthState()
  }
})

async function restoreSession() {
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      await setAuthStateFromUser(data.user)
    }
  } catch (e) {
    // ignore
  }
}

async function loadLeaderboard() {
  if (!leaderboardTable) return
  leaderboardTable.innerHTML = `\n    <div class="table-row table-header">\n      <span>Rank</span>\n      <span>Username</span>\n      <span>Balance</span>\n      <span>Winnings</span>\n    </div>\n  `
  try {
    const { data: players, error } = await supabase.from('users').select('username,balance').order('balance', { ascending: false }).limit(10)
    if (error) throw error
    players.forEach((player, index) => {
      const row = document.createElement('div')
      row.className = 'table-row'
      row.innerHTML = `\n        <span>${String(index + 1).padStart(2, '0')}</span>\n        <span>${player.username}</span>\n        <span>₿ ${Number(player.balance).toFixed(2)}</span>\n        <span>—</span>\n      `
      leaderboardTable.append(row)
    })
  } catch (error) {
    const row = document.createElement('div')
    row.className = 'table-row'
    row.innerHTML = `<span colspan="4">Unable to load leaderboard</span>`
    leaderboardTable.append(row)
  }
}

async function loadProfile() {
  if (!profileUsername) return
  try {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) throw new Error('Not logged in')
    const { data: profile } = await supabase.from('users').select('username,balance,created_at').eq('id', user.id).single()
    const { data: history } = await supabase.from('game_history').select('game,result_number,bet_type,bet_amount,win,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12)
    profileUsername.textContent = (profile?.username || user.email.split('@')[0]).toUpperCase()
    profileTagline.textContent = `Member since ${new Date(profile?.created_at || user.created_at).toLocaleDateString()}`
    profileLevel.textContent = String(Math.max(1, Math.floor((profile?.balance || 0) / 1250) + 1))
    profileBalance.textContent = `₿ ${Number(profile?.balance || 0).toFixed(2)}`
    profileWins.textContent = String((history || []).filter((entry) => entry.win).length)

    if (recentActivityList) {
      recentActivityList.innerHTML = ''
      if ((history || []).length) {
        (history || []).slice(0, 4).forEach((entry) => {
          const line = document.createElement('p')
          line.textContent = `${entry.game} ${entry.win ? '+WIN' : '+LOSS'} ${entry.bet_type.toUpperCase()} ₿ ${Number(entry.bet_amount).toFixed(2)}`
          recentActivityList.append(line)
        })
      } else {
        recentActivityList.innerHTML = '<p>No recent activity</p>'
      }
    }
  } catch (error) {
    profileTagline.textContent = 'Log in to view your profile'
    profileBalance.textContent = '₿ 0.00'
    profileWins.textContent = '0'
    if (recentActivityList) recentActivityList.innerHTML = '<p>No recent activity</p>'
  }
}

async function refreshPage(pageId) {
  if (pageId === 'dashboard') await initDashboard()
  if (pageId === 'leaderboard') await loadLeaderboard()
  if (pageId === 'profile') await loadProfile()
  if (pageId === 'roulette') initRoulette()
}

function setActivePage(pageId) {
  setPageVisibility(pageId)
  refreshPage(pageId)
}

pageButtons.forEach((target) => {
  target.addEventListener('click', (event) => {
    event.stopPropagation()
    const page = target.dataset.page || target.getAttribute('data-page')
    if (!page) return
    setActivePage(page)
    gamesDropdown.classList.remove('open')
  })
})

dropdownToggle.addEventListener('click', (event) => {
  event.stopPropagation()
  gamesDropdown.classList.toggle('open')
})

document.addEventListener('click', () => {
  gamesDropdown.classList.remove('open')
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    gamesDropdown.classList.remove('open')
    closeAuthModal()
  }
})

loginButton.addEventListener('click', () => openAuthModal('login'))
signupButton.addEventListener('click', () => openAuthModal('signup'))
closeModalButton.addEventListener('click', closeAuthModal)
authModal.addEventListener('click', (event) => {
  if (event.target === authModal) closeAuthModal()
})
toggleAuthModeButton.addEventListener('click', () => openAuthModal(authMode === 'login' ? 'signup' : 'login'))

authForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const identifier = authUsername.value.trim()
  const password = authPassword.value.trim()
  if (!identifier || !password) return

  const email = identifier.includes('@') ? identifier : `${identifier}@poolcasino.local`

  try {
    if (authMode === 'signup') {
      // sign up then attempt to sign in so we get a session
      const { data: signupData, error: signupErr } = await supabase.auth.signUp({ email, password })
      if (signupErr && !signupErr.message.includes('already')) throw signupErr

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr && !signInData?.user) {
        // If sign in failed, inform user to confirm email
        closeAuthModal()
        alert('Check your email to confirm the account, then log in.')
        return
      }
      const user = signInData?.user || signupData?.user
      if (!user) return

      const username = identifier.includes('@') ? identifier.split('@')[0] : identifier
      await supabase.from('users').upsert({ id: user.id, username, balance: 1000 }, { onConflict: 'id' })
      await setAuthStateFromUser(user)
      closeAuthModal()
      refreshPage(currentPage)
      return
    }

    // login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data?.user) {
      alert(error?.message || 'Login failed')
      return
    }
    await setAuthStateFromUser(data.user)
    closeAuthModal()
    refreshPage(currentPage)
  } catch (err) {
    alert(err.message || 'Authentication error')
  }
})

// expose sign out via clicking username for now
profileName.addEventListener('click', async () => {
  try {
    await supabase.auth.signOut()
    clearAuthState()
    refreshPage(currentPage)
  } catch (e) {
    console.error(e)
  }
})

// restore any existing session and initialize UI
restoreSession().then(() => setActivePage('dashboard'))
