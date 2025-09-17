/*
  To‑Do List App
  - Full CRUD (add/edit/toggle/delete)
  - Inline editing with Enter/Esc
  - localStorage persistence
  - Split Active and Completed lists
  - Clear completed
  - Accessible controls and keyboard support
  - Theme toggle (auto/light)
*/

(function(){
  'use strict';

  // ----- DOM refs -----
  const addForm = document.getElementById('addForm');
  const taskInput = document.getElementById('taskInput');
  const activeList = document.getElementById('activeList');
  const completedList = document.getElementById('completedList');
  const activeEmpty = document.getElementById('activeEmpty');
  const completedEmpty = document.getElementById('completedEmpty');
  const activeCount = document.getElementById('activeCount');
  const completedCount = document.getElementById('completedCount');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const confirmModal = document.getElementById('confirmModal');
  const themeToggle = document.getElementById('themeToggle');

  // ----- State -----
  /** @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Task */
  /** @type {Task[]} */
  let tasks = [];
  let toDeleteId = null; // task id pending deletion in modal

  // ----- Storage helpers -----
  const STORAGE_KEY = 'todo.tasks.v1';
  const THEME_KEY = 'todo.theme.v1';
  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }catch{ /* ignore */ }
  }
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      if(!Array.isArray(tasks)) tasks = [];
    }catch{ tasks = []; }
  }

  // ----- Utils -----
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const byCreated = (a,b)=> a.createdAt - b.createdAt;

  // ----- Rendering -----
  function render(){
    // Clear lists
    activeList.textContent = '';
    completedList.textContent = '';

    const active = tasks.filter(t=>!t.completed).sort(byCreated);
    const completed = tasks.filter(t=>t.completed).sort(byCreated);

    active.forEach(t => activeList.appendChild(renderItem(t)));
    completed.forEach(t => completedList.appendChild(renderItem(t)));

    // Empty states
    activeEmpty.style.display = active.length ? 'none' : 'block';
    completedEmpty.style.display = completed.length ? 'none' : 'block';

    // Counters and actions
    activeCount.textContent = `${active.length} active`;
    completedCount.textContent = `${completed.length} completed`;
    clearCompletedBtn.disabled = completed.length === 0;
  }

  function renderItem(task){
    const li = document.createElement('li');
    li.className = 'task' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    // checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'checkbox';
    cb.checked = task.completed;
    cb.setAttribute('aria-label', 'Mark task as completed');
    cb.addEventListener('change', () => toggleTask(task.id));

    // title / text
    const title = document.createElement('div');
    title.className = 'task-title' + (task.completed ? ' completed' : '');
    title.textContent = task.text;

    // actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.appendChild(iconButton('edit', 'Edit task', () => startEdit(li, task)));
    actions.appendChild(iconButton('trash', 'Delete task', () => confirmDelete(task.id)));

    li.append(cb, title, actions);
    return li;
  }

  function iconButton(kind, label, onClick){
    const btn = document.createElement('button');
    btn.className = 'icon-action';
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = iconSvg(kind);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function iconSvg(kind){
    const map = {
      edit: '<svg class="icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5V18.1l9.06-9.06 1.86 1.86L5.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
      trash: '<svg class="icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
      check: '<svg class="icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17l-3.88-3.88L3.71 13.7 9 19l12-12-1.41-1.41z"/></svg>',
      close: '<svg class="icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.71L12 12l6.29 6.29-1.41 1.41L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29z"/></svg>'
    };
    return map[kind] || '';
  }

  // ----- Actions -----
  function addTask(text){
    const trimmed = text.trim();
    if(!trimmed) return;
    tasks.push({ id: uid(), text: trimmed, completed: false, createdAt: Date.now() });
    save();
    render();
  }

  function toggleTask(id){
    const t = tasks.find(x=>x.id===id);
    if(!t) return;
    t.completed = !t.completed;
    save();
    render();
  }

  function updateTask(id, newText){
    const t = tasks.find(x=>x.id===id);
    if(!t) return;
    const trimmed = newText.trim();
    if(!trimmed){
      // if cleared, keep old text and just exit
      render();
      return;
    }
    t.text = trimmed;
    save();
    render();
  }

  function removeTask(id){
    tasks = tasks.filter(t=>t.id!==id);
    save();
    render();
  }

  function clearCompleted(){
    if(!tasks.some(t=>t.completed)) return;
    tasks = tasks.filter(t=>!t.completed);
    save();
    render();
  }

  // ----- Inline editing -----
  function startEdit(li, task){
    // prevent multiple editors
    if(li.querySelector('.edit-input')) return;

    const title = li.querySelector('.task-title');
    const actions = li.querySelector('.task-actions');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = task.text;
    input.setAttribute('aria-label', 'Edit task');

    // Replace title with input
    li.replaceChild(input, title);
    input.focus();
    input.setSelectionRange(task.text.length, task.text.length);

    // Add temporary Save/Cancel buttons
    const oldActions = actions.cloneNode(true);
    actions.replaceChildren();
  const saveBtn = iconButton('check', 'Save', () => finishEdit(true));
  const cancelBtn = iconButton('close', 'Cancel', () => finishEdit(false));
    actions.append(saveBtn, cancelBtn);

    function finishEdit(commit){
      if(commit){
        updateTask(task.id, input.value);
      } else {
        render();
      }
      // focus back on item if it exists
      const item = (task.completed ? completedList : activeList).querySelector(`[data-id="${task.id}"]`);
      if(item) item.querySelector('.icon-action')?.focus();
    }

    input.addEventListener('keydown', (e)=>{
      if(e.key==='Enter') finishEdit(true);
      if(e.key==='Escape') finishEdit(false);
    });
    input.addEventListener('blur', ()=> finishEdit(true));
  }

  // ----- Confirm modal -----
  function confirmDelete(id){
    toDeleteId = id;
    openModal();
  }
  function openModal(){
    confirmModal.hidden = false;
    // basic focus trap: focus first button
    confirmModal.querySelector('[data-action="cancel"]').focus();
    document.addEventListener('keydown', onEscModal, { once: true });
  }
  function closeModal(){
    confirmModal.hidden = true;
  }
  function onEscModal(e){ if(e.key==='Escape') closeModal(); }

  confirmModal.addEventListener('click', (e)=>{
    const target = e.target;
    if(!(target instanceof HTMLElement)) return;
    if(target.dataset.close === 'true') { closeModal(); return; }
    if(target.dataset.action === 'cancel') { closeModal(); return; }
    if(target.dataset.action === 'confirm') {
      if(toDeleteId) removeTask(toDeleteId);
      toDeleteId = null;
      closeModal();
    }
  });

  // ----- Theme toggle -----
  function applyTheme(theme){
    // theme: 'light' | 'auto' (default)
    document.documentElement.setAttribute('data-theme', theme);
  }
  function loadTheme(){
    const t = localStorage.getItem(THEME_KEY) || 'auto';
    applyTheme(t);
  }
  function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme') || 'auto';
    const next = current === 'light' ? 'auto' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  // ----- Events -----
  addForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = taskInput.value;
    if(text.trim()){
      addTask(text);
      taskInput.value = '';
      taskInput.focus();
    }
  });

  clearCompletedBtn.addEventListener('click', ()=>{
    // reuse confirm modal for bulk action
    toDeleteId = null; // indicates bulk
    const title = confirmModal.querySelector('#confirmTitle');
    const desc = confirmModal.querySelector('#confirmDesc');
    const confirmBtn = confirmModal.querySelector('[data-action="confirm"]');
    title.textContent = 'Clear all completed tasks?';
    desc.textContent = 'This will permanently remove all completed tasks.';
    confirmBtn.textContent = 'Clear';
    openModal();
    // hook up one-time confirm for bulk
    const handler = (e)=>{
      const target = e.target;
      if(!(target instanceof HTMLElement)) return;
      const shouldClose = target.dataset.action === 'confirm' || target.dataset.action === 'cancel' || target.dataset.close === 'true';
      if(target.dataset.action === 'confirm'){
        clearCompleted();
      }
      if(shouldClose){
        // restore modal copy regardless of confirm/cancel/close
        title.textContent = 'Are you sure?';
        desc.textContent = 'This action cannot be undone.';
        confirmBtn.textContent = 'Delete';
        confirmModal.removeEventListener('click', handler);
      }
    };
    confirmModal.addEventListener('click', handler);
  });

  themeToggle.addEventListener('click', toggleTheme);

  // ----- Init -----
  loadTheme();
  load();
  render();

})();
