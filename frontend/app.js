const API_URL = 'http://localhost:3000/api';

const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks-list');
const completedTasksList = document.getElementById('completed-tasks-list');
const taskCount = document.getElementById('task-count');
const completedCount = document.getElementById('completed-count');
const pendingHeader = document.getElementById('pending-header');
const completedHeader = document.getElementById('completed-header');
const pendingCountEl = document.getElementById('pending-count');
const completedTasksCountEl = document.getElementById('completed-tasks-count');

let tasks = [];

async function init() {
  await loadTasks();
  setupEventListeners();
}

function setupEventListeners() {
  addBtn.addEventListener('click', handleAddTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  });
}

async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to load tasks');
    
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    showError('Failed to load tasks');
  }
}

async function handleAddTask() {
  const text = taskInput.value.trim();
  
  if (!text) return;

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('Failed to add task');

    const newTask = await response.json();
    tasks.unshift(newTask);
    taskInput.value = '';
    renderTasks();
  } catch (error) {
    console.error('Error adding task:', error);
    showError('Failed to add task');
  }
}

async function handleToggleTask(taskId) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
      method: 'PUT',
    });

    if (!response.ok) throw new Error('Failed to toggle task');

    const updatedTask = await response.json();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = updatedTask;
      renderTasks();
    }
  } catch (error) {
    console.error('Error toggling task:', error);
    showError('Failed to update task');
  }
}

async function handleEditTask(taskId, newText) {
  if (!newText.trim()) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: newText.trim() }),
    });

    if (!response.ok) throw new Error('Failed to edit task');

    const updatedTask = await response.json();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = updatedTask;
      renderTasks();
    }
  } catch (error) {
    console.error('Error editing task:', error);
    showError('Failed to edit task');
  }
}

async function handleDeleteTask(taskId) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete task');

    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    showError('Failed to delete task');
  }
}

function renderTasks() {
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  tasksList.innerHTML = '';
  completedTasksList.innerHTML = '';

  if (pendingTasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✓</div>No pending tasks. Time to relax!</div>';
    pendingHeader.style.display = 'none';
  } else {
    pendingHeader.style.display = 'flex';
    pendingTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      tasksList.appendChild(taskElement);
    });
  }

  if (completedTasks.length > 0) {
    completedHeader.style.display = 'flex';
    completedTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      completedTasksList.appendChild(taskElement);
    });
  } else {
    completedHeader.style.display = 'none';
  }

  updateStats();
}

function createTaskElement(task) {
  const taskItem = document.createElement('div');
  taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
  taskItem.dataset.id = task.id;

  const checkbox = document.createElement('div');
  checkbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
  checkbox.addEventListener('click', () => handleToggleTask(task.id));

  const taskContent = document.createElement('div');
  taskContent.className = 'task-content';

  const taskText = document.createElement('div');
  taskText.className = 'task-text';
  taskText.textContent = task.text;

  const taskMeta = document.createElement('div');
  taskMeta.className = 'task-meta';
  
  const timeSpan = document.createElement('span');
  timeSpan.textContent = formatDate(task.created_at);
  
  taskMeta.appendChild(timeSpan);

  const taskActions = document.createElement('div');
  taskActions.className = 'task-actions';

  if (!task.completed) {
    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit';
    editBtn.textContent = 'edit';
    editBtn.addEventListener('click', () => enableEdit(taskItem, task));
    taskActions.appendChild(editBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-btn delete';
  deleteBtn.textContent = 'delete';
  deleteBtn.addEventListener('click', () => {
    if (confirm('Delete this task?')) {
      handleDeleteTask(task.id);
    }
  });

  taskActions.appendChild(deleteBtn);

  taskContent.appendChild(taskText);
  taskContent.appendChild(taskMeta);
  taskContent.appendChild(taskActions);

  taskItem.appendChild(checkbox);
  taskItem.appendChild(taskContent);

  return taskItem;
}

function enableEdit(taskItem, task) {
  const taskText = taskItem.querySelector('.task-text');
  const taskActions = taskItem.querySelector('.task-actions');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-text-input';
  input.value = task.text;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'task-btn';
  saveBtn.textContent = 'save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'task-btn';
  cancelBtn.textContent = 'cancel';

  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText && newText !== task.text) {
      handleEditTask(task.id, newText);
    } else {
      renderTasks();
    }
  };

  saveBtn.addEventListener('click', saveEdit);
  cancelBtn.addEventListener('click', () => renderTasks());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTasks();
  });

  taskText.replaceWith(input);
  taskActions.innerHTML = '';
  taskActions.appendChild(saveBtn);
  taskActions.appendChild(cancelBtn);
  
  input.focus();
  input.select();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  taskCount.textContent = total;
  completedCount.textContent = completed;
  pendingCountEl.textContent = pending;
  completedTasksCountEl.textContent = completed;
}

function showError(message) {
  console.error(message);
}

init();