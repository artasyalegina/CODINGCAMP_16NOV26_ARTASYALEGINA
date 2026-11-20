/* =============================================
   TO-DO LIST LIFE DASHBOARD — APP.JS
   Vanilla JavaScript | LocalStorage
   ============================================= */

'use strict';

// =============================================
// STATE
// =============================================
const State = {
  tasks: [],
  quickLinks: [],
  userName: '',
  theme: 'light',
  sortBy: 'default',
  notes: '',
  timer: {
    mode: 'pomodoro',      // 'pomodoro' | 'short' | 'long'
    duration: 25 * 60,     // seconds
    remaining: 25 * 60,
    running: false,
    intervalId: null,
    sessions: 0,
  },
};

// Mode durations (seconds)
const TIMER_MODES = {
  pomodoro: 25 * 60,
  short:     5 * 60,
  long:     15 * 60,
};

const TIMER_LABELS = {
  pomodoro: 'Focus',
  short:    'Short Break',
  long:     'Long Break',
};

// Motivational quotes pool
const QUOTES = [
  { text: "Mulailah dari mana kamu berada, gunakan apa yang kamu miliki, lakukan apa yang kamu bisa.", author: "Arthur Ashe" },
  { text: "Setiap hari adalah kesempatan baru untuk menjadi lebih baik dari hari kemarin.", author: "Unknown" },
  { text: "Hal-hal besar tidak dilakukan oleh satu orang, melainkan oleh tim orang-orang kecil yang melakukan hal-hal kecil.", author: "Steve Jobs" },
  { text: "Kamu tidak harus menjadi hebat untuk memulai, tapi kamu harus memulai untuk menjadi hebat.", author: "Zig Ziglar" },
  { text: "Kesuksesan adalah jumlah usaha-usaha kecil yang diulang setiap harinya.", author: "Robert Collier" },
  { text: "Percayalah, kamu jauh lebih kuat dari yang kamu kira.", author: "Unknown" },
  { text: "Jangan hitung hari-harinya, buatlah setiap hari bermakna.", author: "Muhammad Ali" },
  { text: "Mimpi itu gratis. Kerja keras untuk mewujudkannya, itu yang berbayar.", author: "Estée Lauder" },
  { text: "Produktivitas bukan soal sibuk, tapi soal efektif.", author: "David Allen" },
  { text: "Satu tugas selesai hari ini lebih baik dari seribu rencana yang tak pernah dimulai.", author: "Unknown" },
  { text: "Istirahat adalah bagian dari kerja keras, bukan pelarian darinya.", author: "Unknown" },
  { text: "Fokus pada proses, bukan hanya hasil. Hasilnya akan mengikuti.", author: "Unknown" },
];

// Day & Month names (Indonesian)
const DAYS_ID   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

// Default Quick Links
const DEFAULT_LINKS = [
  { id: uid(), icon: '🔍', name: 'Google',   url: 'https://google.com' },
  { id: uid(), icon: '📺', name: 'YouTube',  url: 'https://youtube.com' },
  { id: uid(), icon: '📸', name: 'Instagram',url: 'https://instagram.com' },
  { id: uid(), icon: '🤖', name: 'ChatGPT',  url: 'https://chat.openai.com' },
];

// =============================================
// UTILITY
// =============================================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getGreeting(hour) {
  if (hour >= 4  && hour < 12) return { text: 'Selamat Pagi',  emoji: '🌸' };
  if (hour >= 12 && hour < 15) return { text: 'Selamat Siang', emoji: '🌼' };
  if (hour >= 15 && hour < 19) return { text: 'Selamat Sore',  emoji: '🌷' };
  return                               { text: 'Selamat Malam', emoji: '🌙' };
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

// =============================================
// LOCAL STORAGE
// =============================================
function loadState() {
  try {
    const tasks      = JSON.parse(localStorage.getItem('tldl_tasks'))      || [];
    const quickLinks = JSON.parse(localStorage.getItem('tldl_links'))      || null;
    const userName   = localStorage.getItem('tldl_name')                   || '';
    const theme      = localStorage.getItem('tldl_theme')                  || 'light';
    const sortBy     = localStorage.getItem('tldl_sort')                   || 'default';
    const notes      = localStorage.getItem('tldl_notes')                  || '';
    const sessions   = parseInt(localStorage.getItem('tldl_sessions'))     || 0;

    State.tasks      = tasks;
    State.quickLinks = quickLinks === null ? DEFAULT_LINKS : quickLinks;
    State.userName   = userName;
    State.theme      = theme;
    State.sortBy     = sortBy;
    State.notes      = notes;
    State.timer.sessions = sessions;
  } catch (e) {
    console.warn('Could not load state from LocalStorage:', e);
  }
}

function saveField(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// =============================================
// DOM REFS
// =============================================
const $ = id => document.getElementById(id);

const DOM = {
  // Greeting
  greetingTime:    () => $('greeting-time'),
  greetingDate:    () => $('greeting-date'),
  greetingMsg:     () => $('greeting-msg'),
  nameInput:       () => $('name-input'),
  nameSaveBtn:     () => $('name-save-btn'),

  // Theme
  themeToggle:     () => $('theme-toggle'),
  themeIcon:       () => $('theme-icon'),
  themeText:       () => $('theme-text'),

  // Timer
  timerTime:       () => $('timer-time'),
  timerLabel:      () => $('timer-label'),
  timerProgress:   () => $('timer-progress'),
  timerStartBtn:   () => $('timer-start'),
  timerStopBtn:    () => $('timer-stop'),
  timerResetBtn:   () => $('timer-reset'),
  timerStatus:     () => $('timer-status'),
  sessionDots:     () => document.querySelectorAll('.session-dot'),

  // Tasks
  taskInput:       () => $('task-input'),
  addTaskBtn:      () => $('add-task-btn'),
  taskList:        () => $('task-list'),
  sortSelect:      () => $('sort-select'),
  totalCount:      () => $('total-count'),
  doneCount:       () => $('done-count'),
  progressBar:     () => $('progress-bar'),

  // Quick Links
  linksList:       () => $('quick-links-list'),
  linkName:        () => $('link-name'),
  linkUrl:         () => $('link-url'),
  linkIcon:        () => $('link-icon'),
  addLinkBtn:      () => $('add-link-btn'),

  // Quote
  quoteText:       () => $('quote-text'),
  quoteAuthor:     () => $('quote-author'),
  quoteRefresh:    () => $('quote-refresh'),

  // Notes
  notesArea:       () => $('notes-area'),

  // Toast
  toastContainer:  () => $('toast-container'),
};

// =============================================
// CLOCK & GREETING
// =============================================
let clockInterval = null;

function updateClock() {
  const now    = new Date();
  const hour   = now.getHours();
  const min    = now.getMinutes().toString().padStart(2, '0');
  const sec    = now.getSeconds().toString().padStart(2, '0');
  const day    = DAYS_ID[now.getDay()];
  const date   = now.getDate();
  const month  = MONTHS_ID[now.getMonth()];
  const year   = now.getFullYear();

  const timeEl = DOM.greetingTime();
  const dateEl = DOM.greetingDate();
  const msgEl  = DOM.greetingMsg();
  if (!timeEl) return;

  timeEl.textContent = `${hour.toString().padStart(2,'0')}:${min}:${sec}`;
  dateEl.textContent = `${day}, ${date} ${month} ${year}`;

  const { text, emoji } = getGreeting(hour);
  const name = State.userName ? `, ${State.userName}` : '';
  msgEl.innerHTML = `${emoji} ${text}${name}!`;
}

function startClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

// =============================================
// CUSTOM NAME
// =============================================
function setupName() {
  const input = DOM.nameInput();
  if (!input) return;
  input.value = State.userName;
  DOM.nameSaveBtn().addEventListener('click', saveName);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });
}

function saveName() {
  const name = DOM.nameInput().value.trim();
  State.userName = name;
  saveField('tldl_name', name);
  updateClock(); // refresh greeting immediately
  showToast(name ? `✨ Halo, ${name}!` : 'Nama dihapus.', 'info');
}

// =============================================
// THEME
// =============================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = DOM.themeIcon();
  const text = DOM.themeText();
  if (!icon || !text) return;
  if (theme === 'dark') {
    icon.textContent = '☀️';
    text.textContent = 'Light';
  } else {
    icon.textContent = '🌙';
    text.textContent = 'Dark';
  }
}

function toggleTheme() {
  State.theme = State.theme === 'light' ? 'dark' : 'light';
  applyTheme(State.theme);
  saveField('tldl_theme', State.theme);
  showToast(State.theme === 'dark' ? '🌙 Dark mode aktif' : '☀️ Light mode aktif', 'info');
}

// =============================================
// POMODORO TIMER
// =============================================
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

function setTimerDuration(mode) {
  if (State.timer.running) stopTimer();
  State.timer.mode     = mode;
  State.timer.duration = TIMER_MODES[mode];
  State.timer.remaining = TIMER_MODES[mode];
  renderTimer();
  updateTimerStatus('idle');

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function startTimer() {
  if (State.timer.running) return;
  State.timer.running = true;
  DOM.timerStartBtn().disabled = true;
  DOM.timerStopBtn().disabled  = false;
  updateTimerStatus('running');

  State.timer.intervalId = setInterval(() => {
    if (State.timer.remaining > 0) {
      State.timer.remaining--;
      renderTimer();
    } else {
      timerComplete();
    }
  }, 1000);
}

function stopTimer() {
  if (!State.timer.running) return;
  State.timer.running = false;
  clearInterval(State.timer.intervalId);
  State.timer.intervalId = null;
  DOM.timerStartBtn().disabled = false;
  DOM.timerStopBtn().disabled  = true;
  updateTimerStatus('paused');
}

function resetTimer() {
  stopTimer();
  State.timer.remaining = State.timer.duration;
  renderTimer();
  updateTimerStatus('idle');
}

function timerComplete() {
  stopTimer();
  State.timer.remaining = 0;
  renderTimer();

  if (State.timer.mode === 'pomodoro') {
    State.timer.sessions++;
    saveField('tldl_sessions', String(State.timer.sessions));
    renderSessionDots();
    showToast('🎉 Sesi fokus selesai! Ambil istirahat sebentar.', 'success');
    updateTimerStatus('done');
    // Suggest short/long break
    setTimeout(() => {
      const breakType = State.timer.sessions % 4 === 0 ? 'long' : 'short';
      showToast(breakType === 'long' ? '☕ Waktunya istirahat panjang!' : '🌸 Waktunya istirahat singkat!', 'info');
    }, 1500);
  } else {
    showToast('⏰ Waktu istirahat habis! Yuk fokus lagi.', 'info');
    updateTimerStatus('done');
  }

  // Browser notification (if permitted)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Life Dashboard ✿', {
      body: State.timer.mode === 'pomodoro' ? 'Sesi fokus selesai! 🎉' : 'Istirahat selesai!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌸</text></svg>'
    });
  }
}

function renderTimer() {
  const { remaining, duration } = State.timer;
  const timeEl    = DOM.timerTime();
  const progressEl = DOM.timerProgress();
  const labelEl   = DOM.timerLabel();

  if (!timeEl) return;

  timeEl.textContent = formatTime(remaining);
  if (labelEl) labelEl.textContent = TIMER_LABELS[State.timer.mode];

  if (progressEl) {
    const pct    = remaining / duration;
    const offset = TIMER_CIRCUMFERENCE * (1 - pct);
    progressEl.style.strokeDasharray  = `${TIMER_CIRCUMFERENCE}`;
    progressEl.style.strokeDashoffset = `${offset}`;
  }

  // Update page title
  if (State.timer.running) {
    document.title = `${formatTime(remaining)} ✿ Life Dashboard`;
  } else {
    document.title = '🌸 Life Dashboard';
  }
}

function updateTimerStatus(status) {
  const el = DOM.timerStatus();
  if (!el) return;
  const messages = {
    idle:    'Timer siap dimulai ✨',
    running: `${TIMER_LABELS[State.timer.mode]} sedang berjalan... 🌸`,
    paused:  'Timer dijeda. Lanjutkan kapan saja!',
    done:    'Selesai! Kerja bagus~ 🎉',
  };
  el.textContent = messages[status] || '';
}

function renderSessionDots() {
  const dots = DOM.sessionDots();
  const mod  = State.timer.sessions % 4;
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i < mod || (mod === 0 && State.timer.sessions > 0 && i < 4));
  });
}

function setupTimerControls() {
  DOM.timerStartBtn().addEventListener('click', startTimer);
  DOM.timerStopBtn().addEventListener('click',  stopTimer);
  DOM.timerResetBtn().addEventListener('click', resetTimer);

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setTimerDuration(btn.dataset.mode));
  });

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// =============================================
// TASKS
// =============================================
function getSortedTasks() {
  const tasks = [...State.tasks];
  switch (State.sortBy) {
    case 'alpha-asc':
      return tasks.sort((a, b) => a.text.localeCompare(b.text));
    case 'alpha-desc':
      return tasks.sort((a, b) => b.text.localeCompare(a.text));
    case 'done-first':
      return tasks.sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0));
    case 'undone-first':
      return tasks.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
    default:
      return tasks; // insertion order
  }
}

function addTask() {
  const input = DOM.taskInput();
  const text  = input.value.trim();
  if (!text) {
    input.focus();
    shakeElement(input);
    return;
  }

  const task = { id: uid(), text, done: false, createdAt: Date.now() };
  State.tasks.unshift(task);
  saveField('tldl_tasks', State.tasks);
  input.value = '';
  renderTasks();
  showToast('✅ Tugas ditambahkan!', 'success');
}

function toggleTask(id) {
  const task = State.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveField('tldl_tasks', State.tasks);
  renderTasks();
  if (task.done) showToast('🌸 Tugas selesai! Mantap~', 'success');
}

function deleteTask(id) {
  State.tasks = State.tasks.filter(t => t.id !== id);
  saveField('tldl_tasks', State.tasks);
  renderTasks();
  showToast('🗑️ Tugas dihapus.', 'warning');
}

function startEditTask(id) {
  const item = document.querySelector(`.task-item[data-id="${id}"]`);
  if (!item) return;
  const task    = State.tasks.find(t => t.id === id);
  if (!task) return;
  const textEl  = item.querySelector('.task-text');
  const editEl  = item.querySelector('.task-edit-input');
  const editBtn = item.querySelector('.task-action-btn.edit');

  textEl.classList.add('hidden');
  editEl.classList.remove('hidden');
  editEl.value = task.text;
  editEl.focus();
  editEl.select();
  if (editBtn) editBtn.textContent = '💾';

  const save = () => {
    const val = editEl.value.trim();
    if (val) task.text = val;
    saveField('tldl_tasks', State.tasks);
    renderTasks();
    showToast('✏️ Tugas diperbarui!', 'info');
  };

  editEl.addEventListener('keydown', e => {
    if (e.key === 'Enter')  save();
    if (e.key === 'Escape') renderTasks(); // cancel
  });

  if (editBtn) editBtn.addEventListener('click', save, { once: true });
}

function renderTasks() {
  const listEl = DOM.taskList();
  if (!listEl) return;

  const sorted = getSortedTasks();
  const total  = State.tasks.length;
  const done   = State.tasks.filter(t => t.done).length;

  // Stats
  const totalCountEl = DOM.totalCount();
  const doneCountEl  = DOM.doneCount();
  const progressEl   = DOM.progressBar();
  if (totalCountEl) totalCountEl.textContent = total;
  if (doneCountEl)  doneCountEl.textContent  = done;
  if (progressEl)   progressEl.style.width   = total > 0 ? `${Math.round((done / total) * 100)}%` : '0%';

  if (sorted.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🌸</span>
        <p>Belum ada tugas. Yuk tambahkan sesuatu!</p>
      </div>`;
    return;
  }

  listEl.innerHTML = sorted.map(task => `
    <div class="task-item ${task.done ? 'completed' : ''}" data-id="${escapeHtml(task.id)}">
      <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''}
             aria-label="Tandai selesai" onchange="toggleTask('${escapeHtml(task.id)}')">
      <div class="task-text-wrap">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <input type="text" class="task-edit-input hidden" value="${escapeHtml(task.text)}" placeholder="Edit tugas...">
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit" title="Edit tugas" onclick="startEditTask('${escapeHtml(task.id)}')">✏️</button>
        <button class="task-action-btn delete" title="Hapus tugas" onclick="deleteTask('${escapeHtml(task.id)}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function setupTaskControls() {
  DOM.addTaskBtn().addEventListener('click', addTask);
  DOM.taskInput().addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });
  DOM.sortSelect().addEventListener('change', e => {
    State.sortBy = e.target.value;
    saveField('tldl_sort', State.sortBy);
    renderTasks();
  });
  DOM.sortSelect().value = State.sortBy;
}

// Make task functions global for inline handlers
window.toggleTask     = toggleTask;
window.deleteTask     = deleteTask;
window.startEditTask  = startEditTask;

// =============================================
// QUICK LINKS
// =============================================
function addQuickLink() {
  const name = DOM.linkName().value.trim();
  const url  = DOM.linkUrl().value.trim();
  const icon = DOM.linkIcon().value.trim() || '🔗';

  if (!name || !url) {
    showToast('Isi nama dan URL terlebih dahulu!', 'error');
    return;
  }

  let finalUrl = url;
  if (!/^https?:\/\//i.test(url)) finalUrl = 'https://' + url;

  const link = { id: uid(), icon, name, url: finalUrl };
  State.quickLinks.push(link);
  saveField('tldl_links', State.quickLinks);

  DOM.linkName().value = '';
  DOM.linkUrl().value  = '';
  DOM.linkIcon().value = '';
  renderQuickLinks();
  showToast('🔗 Link ditambahkan!', 'success');
}

function deleteQuickLink(id) {
  State.quickLinks = State.quickLinks.filter(l => l.id !== id);
  saveField('tldl_links', State.quickLinks);
  renderQuickLinks();
  showToast('🗑️ Link dihapus.', 'warning');
}

function renderQuickLinks() {
  const list = DOM.linksList();
  if (!list) return;

  if (State.quickLinks.length === 0) {
    list.innerHTML = `<p class="text-muted" style="font-size:0.8rem;text-align:center;padding:8px 0;">Belum ada link. Tambahkan di bawah!</p>`;
    return;
  }

  list.innerHTML = State.quickLinks.map(link => `
    <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="quick-link-item">
      <span class="link-icon">${escapeHtml(link.icon)}</span>
      <span class="link-name">${escapeHtml(link.name)}</span>
      <button class="quick-link-delete" onclick="event.preventDefault(); deleteQuickLink('${escapeHtml(link.id)}')" title="Hapus link">✕</button>
    </a>
  `).join('');
}

window.deleteQuickLink = deleteQuickLink;

function setupLinkControls() {
  DOM.addLinkBtn().addEventListener('click', addQuickLink);
  DOM.linkUrl().addEventListener('keydown', e => {
    if (e.key === 'Enter') addQuickLink();
  });
}

// =============================================
// QUOTE
// =============================================
let currentQuoteIndex = -1;

function renderQuote(animate = false) {
  const textEl   = DOM.quoteText();
  const authorEl = DOM.quoteAuthor();
  if (!textEl || !authorEl) return;

  let idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); }
  while (idx === currentQuoteIndex && QUOTES.length > 1);
  currentQuoteIndex = idx;

  const q = QUOTES[idx];
  if (animate) {
    textEl.style.opacity = '0';
    authorEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent   = `"${q.text}"`;
      authorEl.textContent = `— ${q.author}`;
      textEl.style.transition   = 'opacity 0.5s';
      authorEl.style.transition = 'opacity 0.5s';
      textEl.style.opacity   = '1';
      authorEl.style.opacity = '1';
    }, 300);
  } else {
    textEl.textContent   = `"${q.text}"`;
    authorEl.textContent = `— ${q.author}`;
  }
}

function setupQuote() {
  renderQuote();
  DOM.quoteRefresh().addEventListener('click', () => renderQuote(true));
}

// =============================================
// QUICK NOTES
// =============================================
function setupNotes() {
  const area = DOM.notesArea();
  if (!area) return;
  area.value = State.notes;
  area.addEventListener('input', () => {
    State.notes = area.value;
    saveField('tldl_notes', State.notes);
  });
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'info') {
  const container = DOM.toastContainer();
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.35s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 2800);
}

// =============================================
// UTILITY — Shake animation for empty input
// =============================================
function shakeElement(el) {
  el.style.animation = 'none';
  el.style.borderColor = 'var(--danger)';
  el.offsetHeight; // reflow
  el.style.animation = '';
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' },
  ], { duration: 300, easing: 'ease-in-out' });
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + Enter → Add task if task input is focused
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement === DOM.taskInput()) addTask();
    }
    // Space → Start/Stop timer (when no input is focused)
    if (e.key === ' ' && e.code === 'Space') {
      const tag = document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'BUTTON' && tag !== 'SELECT') {
        e.preventDefault();
        State.timer.running ? stopTimer() : startTimer();
      }
    }
  });
}

// =============================================
// INIT
// =============================================
function init() {
  loadState();

  // Apply theme before rendering to avoid flash
  applyTheme(State.theme);

  // Setup all features
  startClock();
  setupName();
  setupTimerControls();
  setupTaskControls();
  setupLinkControls();
  setupQuote();
  setupNotes();
  setupKeyboardShortcuts();

  // Initial renders
  renderTimer();
  renderTasks();
  renderQuickLinks();
  renderSessionDots();
  updateTimerStatus('idle');

  // Theme toggle
  DOM.themeToggle().addEventListener('click', toggleTheme);

  // Initial page title
  document.title = '🌸 Life Dashboard';

  console.log('%c🌸 Life Dashboard loaded!', 'color: #f06292; font-weight: bold; font-size: 14px;');
  console.log('%cTips: Tekan Spasi untuk start/stop timer!', 'color: #9e6b7e; font-size: 11px;');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
