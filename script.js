/* ==================== TASKPINK APPLICATION LOGIC ==================== */

const DEFAULT_STATE = {
  columns: [
    { id: 'col-rencana', title: 'Rencana', icon: 'fa-folder-open', iconBg: 'bg-pink-100 text-pink-600' },
    { id: 'col-proses', title: 'Proses', icon: 'fa-folder', iconBg: 'bg-pink-100 text-pink-600' },
    { id: 'col-done', title: 'Selesai (Done)', icon: 'fa-circle-check', iconBg: 'bg-pink-100 text-pink-600' }
  ],
  tasks: [
    {
      id: 'task-1',
      columnId: 'col-done',
      title: 'Sejarah',
      description: 'Membuat Bookcreator',
      priority: 'medium',
      category: 'Belajar',
      dueDate: '2026-11-10',
      subtasks: [{ text: 'Kerjakan Bab 1', completed: true }]
    },
    {
      id: 'task-2',
      columnId: 'col-proses',
      title: 'Bahasa Inggris',
      description: 'Dialog Lamar Pekerjaan',
      priority: 'medium',
      category: 'Belajar',
      dueDate: '2026-11-20',
      subtasks: []
    },
    {
      id: 'task-3',
      columnId: 'col-proses',
      title: 'Matematika',
      description: 'Membuat data statistika',
      priority: 'medium',
      category: 'Belajar',
      dueDate: '2026-12-17',
      subtasks: []
    }
  ]
};

let state = loadState();
let draggedTaskId = null;
let customConfirmCallback = null;

function loadState() {
  const saved = localStorage.getItem('taskpink_kanban_state');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  localStorage.setItem('taskpink_kanban_state', JSON.stringify(state));
  updateStats();
  renderCalendar();
}

function initApp() {
  initTheme();
  renderBoard();
  renderCalendar();
  startClock();
  setupEventListeners();
  updateStats();
}

function initTheme() {
  const savedTheme = localStorage.getItem('taskpink_theme');
  const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-toggle-dark-icon')?.classList.add('hidden');
    document.getElementById('theme-toggle-light-icon')?.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    document.getElementById('theme-toggle-dark-icon')?.classList.remove('hidden');
    document.getElementById('theme-toggle-light-icon')?.classList.add('hidden');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('taskpink_theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-toggle-dark-icon')?.classList.toggle('hidden', isDark);
  document.getElementById('theme-toggle-light-icon')?.classList.toggle('hidden', !isDark);
  showToast(isDark ? 'Mode Gelap Navy Aktif' : 'Mode Terang Soft Pink Aktif', 'info');
}

function startClock() {
  function tick() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourDeg = (hours % 12) * 30 + minutes * 0.5;
    const minDeg = minutes * 6 + seconds * 0.1;
    const secDeg = seconds * 6;

    const elHour = document.getElementById('clock-hour');
    const elMin = document.getElementById('clock-minute');
    const elSec = document.getElementById('clock-second');
    const elDigital = document.getElementById('live-time-digital');

    if (elHour) elHour.style.transform = `rotate(${hourDeg}deg)`;
    if (elMin) elMin.style.transform = `rotate(${minDeg}deg)`;
    if (elSec) elSec.style.transform = `rotate(${secDeg}deg)`;
    if (elDigital) {
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');
      elDigital.innerText = `${hStr}:${mStr}:${sStr} WIB`;
    }
  }
  tick();
  setInterval(tick, 1000);
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const titleEl = document.getElementById('current-month-year');
  if (titleEl) titleEl.innerText = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div class="p-1 opacity-20">.</div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === todayDate;
    const hasTaskDone = (day % 4 === 0);
    
    let cellClass = "p-1 rounded-lg font-bold text-xs transition-all flex flex-col items-center justify-center relative";
    if (isToday) {
      cellClass += " bg-pinksoft-600 text-white font-black shadow-md scale-105";
    } else {
      cellClass += " hover:bg-pinksoft-100 dark:hover:bg-greysoft-800 text-greysoft-700 dark:text-greysoft-300";
    }

    let indicatorHtml = '';
    if (hasTaskDone && !isToday) {
      indicatorHtml = `<span class="text-[9px] text-emerald-500 font-extrabold -mt-1">✓</span>`;
    }

    grid.innerHTML += `
      <div class="${cellClass}">
        <span>${day}</span>
        ${indicatorHtml}
      </div>
    `;
  }
}

function updateStats() {
  const total = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.columnId === 'col-done').length;
  const inProgress = state.tasks.filter(t => t.columnId === 'col-proses').length;

  document.getElementById('stat-total').innerText = `Total: ${total} Tugas`;
  document.getElementById('stat-progress').innerText = `Proses: ${inProgress}`;
  document.getElementById('stat-done').innerText = `Selesai: ${doneTasks}`;

  const percent = total > 0 ? Math.round((doneTasks / total) * 100) : 0;
  const progressBar = document.getElementById('hero-progress-bar');
  const progressText = document.getElementById('hero-progress-text');
  
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.innerText = `${percent}%`;
}

function renderBoard() {
  const board = document.getElementById('board-container');
  if (!board) return;
  board.innerHTML = '';

  const searchVal = (document.getElementById('kanban-search')?.value || '').toLowerCase();
  const priorityVal = document.getElementById('filter-priority')?.value || 'all';
  const categoryVal = document.getElementById('filter-category')?.value || 'all';

  state.columns.forEach(col => {
    const colTasks = state.tasks.filter(t => {
      if (t.columnId !== col.id) return false;
      if (searchVal && !t.title.toLowerCase().includes(searchVal) && !(t.description || '').toLowerCase().includes(searchVal)) return false;
      if (priorityVal !== 'all' && t.priority !== priorityVal) return false;
      if (categoryVal !== 'all' && t.category !== categoryVal) return false;
      return true;
    });

    const colEl = document.createElement('div');
    colEl.className = "kanban-column timbul-column w-80 shrink-0 rounded-3xl p-4 flex flex-col max-h-[750px]";
    colEl.dataset.colId = col.id;

    colEl.innerHTML = `
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-pinksoft-100 dark:border-greysoft-800/60">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-pinksoft-100 dark:bg-pinksoft-950/80 text-pinksoft-600 dark:text-pinksoft-300 flex items-center justify-center font-black text-xs shadow-sm">
            <i class="fa-solid ${col.icon || 'fa-folder'}"></i>
          </div>
          <h3 class="font-extrabold text-sm tracking-tight text-greysoft-800 dark:text-white">${col.title}</h3>
          <span class="w-5 h-5 rounded-full bg-pinksoft-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
            ${colTasks.length}
          </span>
        </div>
        <div class="flex items-center gap-1.5 text-greysoft-400">
          <button onclick="openCreateTaskModal('${col.id}')" title="Tambah Tugas" class="p-1.5 hover:text-pinksoft-600 transition-colors">
            <i class="fa-solid fa-plus text-xs"></i>
          </button>
          <button onclick="confirmDeleteColumn('${col.id}')" title="Hapus Kolom" class="p-1.5 hover:text-rose-500 transition-colors">
            <i class="fa-regular fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>

      <div class="task-list flex-1 overflow-y-auto space-y-3 pr-1" data-col-id="${col.id}">
        ${colTasks.map(t => renderTaskCard(t)).join('')}
      </div>
    `;

    board.appendChild(colEl);
  });

  setupDragAndDrop();
}

function renderTaskCard(t) {
  const pBadge = t.priority === 'high' 
    ? '<span class="px-2.5 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black tracking-wide">🚨 URGENT</span>'
    : t.priority === 'low'
    ? '<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-black tracking-wide">🌱 RENDAH</span>'
    : '<span class="px-2.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-black tracking-wide">⚡ SEDANG</span>';

  return `
    <div class="kanban-card timbul-card rounded-2xl p-4 cursor-grab active:cursor-grabbing border border-pinksoft-100 dark:border-greysoft-800"
         draggable="true" 
         data-task-id="${t.id}">
      <div class="flex items-center justify-between mb-2">
        ${pBadge}
        <div class="flex items-center gap-1.5 text-greysoft-400">
          <button onclick="openEditTaskModal('${t.id}')" class="hover:text-pinksoft-600 transition-colors p-1">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          <button onclick="confirmDeleteTask('${t.id}')" class="hover:text-rose-500 transition-colors p-1">
            <i class="fa-regular fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
      <h4 class="font-extrabold text-sm text-greysoft-900 dark:text-white mb-1 leading-snug">${t.title}</h4>
      ${t.description ? `<p class="text-xs text-greysoft-500 dark:text-greysoft-400 font-medium mb-3 line-clamp-2">${t.description}</p>` : ''}

      <div class="flex items-center justify-between text-[11px] font-extrabold text-greysoft-500 dark:text-greysoft-400 pt-2 border-t border-pinksoft-100 dark:border-greysoft-800/60 mt-2">
        <span class="text-pinksoft-600 dark:text-pinksoft-400 flex items-center gap-1">
          <i class="fa-solid fa-tag"></i> ${t.category || 'Belajar'}
        </span>
        <span class="flex items-center gap-1">
          <i class="fa-regular fa-calendar"></i> ${t.dueDate || '2026-11-20'}
        </span>
      </div>
    </div>
  `;
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.kanban-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = card.dataset.taskId;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', draggedTaskId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedTaskId = null;
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
      const targetColId = col.dataset.colId;

      if (taskId && targetColId) {
        moveTaskToColumn(taskId, targetColId);
      }
    });
  });
}

function moveTaskToColumn(taskId, targetColId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task && task.columnId !== targetColId) {
    task.columnId = targetColId;
    saveState();
    renderBoard();
    showToast(`Kartu dipindahkan ke kolom ${getColumnTitle(targetColId)}`, 'success');

    if (targetColId === 'col-done' && typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
  }
}

function getColumnTitle(colId) {
  const col = state.columns.find(c => c.id === colId);
  return col ? col.title : 'Tujuan';
}

function populateColumnOptions(selectedColId) {
  const select = document.getElementById('form-column-id');
  if (!select) return;
  select.innerHTML = '';
  state.columns.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = c.title;
    if (c.id === selectedColId) opt.selected = true;
    select.appendChild(opt);
  });
}

function openCreateTaskModal(colId = null) {
  const targetColId = colId || (state.columns[0] ? state.columns[0].id : 'col-rencana');
  document.getElementById('modal-task-title').innerText = 'Tambah Tugas Baru';
  document.getElementById('task-form').reset();
  document.getElementById('form-task-id').value = '';
  populateColumnOptions(targetColId);
  document.getElementById('task-modal').classList.remove('hidden');
}

function openEditTaskModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('modal-task-title').innerText = 'Edit Kartu Tugas';
  document.getElementById('form-task-id').value = task.id;
  document.getElementById('form-title').value = task.title;
  document.getElementById('form-description').value = task.description || '';
  document.getElementById('form-priority').value = task.priority || 'medium';
  document.getElementById('form-category').value = task.category || 'Belajar';
  document.getElementById('form-due-date').value = task.dueDate || '';
  
  populateColumnOptions(task.columnId);
  document.getElementById('task-modal').classList.remove('hidden');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.add('hidden');
}

function saveTaskForm(e) {
  e.preventDefault();
  const id = document.getElementById('form-task-id').value;
  const title = document.getElementById('form-title').value.trim();
  const description = document.getElementById('form-description').value.trim();
  const priority = document.getElementById('form-priority').value;
  const columnId = document.getElementById('form-column-id').value;
  const category = document.getElementById('form-category').value;
  const dueDate = document.getElementById('form-due-date').value;

  if (!title) return;

  if (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.title = title;
      task.description = description;
      task.priority = priority;
      task.columnId = columnId;
      task.category = category;
      task.dueDate = dueDate;
      showToast('Kartu tugas berhasil diperbarui', 'success');
    }
  } else {
    const newTask = {
      id: 'task-' + Date.now(),
      columnId: columnId,
      title: title,
      description: description,
      priority: priority,
      category: category,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      subtasks: []
    };
    state.tasks.push(newTask);
    showToast('Tugas baru berhasil dibuat!', 'success');
  }

  saveState();
  renderBoard();
  closeTaskModal();
}

function addNewColumnPrompt() {
  const title = prompt('Masukkan nama kolom baru:');
  if (title && title.trim()) {
    const newCol = {
      id: 'col-' + Date.now(),
      title: title.trim(),
      icon: 'fa-folder',
      iconBg: 'bg-pink-100 text-pink-600'
    };
    state.columns.push(newCol);
    saveState();
    renderBoard();
    showToast(`Kolom "${title.trim()}" ditambahkan`, 'success');
  }
}

function confirmDeleteColumn(colId) {
  showConfirmModal('Hapus Kolom', 'Apakah Anda yakin ingin menghapus kolom ini beserta semua tugas di dalamnya?', () => {
    state.columns = state.columns.filter(c => c.id !== colId);
    state.tasks = state.tasks.filter(t => t.columnId !== colId);
    saveState();
    renderBoard();
    showToast('Kolom berhasil dihapus', 'info');
  });
}

function confirmDeleteTask(taskId) {
  showConfirmModal('Hapus Tugas', 'Apakah Anda yakin ingin menghapus tugas ini?', () => {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveState();
    renderBoard();
    showToast('Tugas berhasil dihapus', 'info');
  });
}

function promptResetData() {
  showConfirmModal('Reset Papan Data', 'Apakah Anda yakin ingin memulihkan 3 kolom awal (Rencana, Dalam Proses, Selesai) dan data contoh?', () => {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    renderBoard();
    showToast('Data papan berhasil di-reset', 'info');
  });
}

function showConfirmModal(title, message, callback) {
  document.getElementById('confirm-modal-title').innerText = title;
  document.getElementById('confirm-modal-message').innerText = message;
  customConfirmCallback = callback;
  document.getElementById('custom-confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
  document.getElementById('custom-confirm-modal').classList.add('hidden');
  customConfirmCallback = null;
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-2xl text-xs font-extrabold text-white shadow-lg backdrop-blur-md flex items-center gap-2 transition-all duration-300 pointer-events-auto ${
    type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-pinksoft-600'
  }`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${msg}`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function toggleMobileNav() {
  document.getElementById('mobile-nav')?.classList.toggle('hidden');
}

function openAnalyticsModal() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.columnId === 'col-done').length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('modal-analytics-rate').innerText = `${rate}%`;
  document.getElementById('modal-analytics-bar').style.width = `${rate}%`;
  document.getElementById('analytics-modal').classList.remove('hidden');
}

function closeAnalyticsModal() {
  document.getElementById('analytics-modal').classList.add('hidden');
}

function setupEventListeners() {
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('kanban-search')?.addEventListener('input', renderBoard);
  document.getElementById('filter-priority')?.addEventListener('change', renderBoard);
  document.getElementById('filter-category')?.addEventListener('change', renderBoard);

  document.getElementById('confirm-modal-cancel-btn')?.addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-modal-action-btn')?.addEventListener('click', () => {
    if (customConfirmCallback) customConfirmCallback();
    closeConfirmModal();
  });
}

document.addEventListener('DOMContentLoaded', initApp);