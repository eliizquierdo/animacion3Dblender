const TIMES = {
    work: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};
const TEXTS = {
    work: 'Focus',
    short: 'Short Break',
    long: 'Long Break'
};

let timeLeft = TIMES.work;
let currentMode = 'work';
let timerId = null;
let authMode = 'login';

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const statusText = document.getElementById('statusText');
const workTab = document.getElementById('workTab');
const shortTab = document.getElementById('shortTab');
const longTab = document.getElementById('longTab');

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

const userBar = document.getElementById('userBar');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const authCard = document.getElementById('authCard');
const appContainer = document.getElementById('appContainer');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authError = document.getElementById('authError');
const authToggleBtn = document.getElementById('authToggleBtn');
const authToggleText = document.getElementById('authToggleText');
const authTitle = document.getElementById('authTitle');

function playSoftAlarm() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, audioCtx.currentTime);

    gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.8);
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 1.2);
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function setMode(mode) {
    clearInterval(timerId);
    timerId = null;
    currentMode = mode;
    timeLeft = TIMES[mode];
    statusText.textContent = TEXTS[mode];

    workTab.classList.toggle('active', mode === 'work');
    shortTab.classList.toggle('active', mode === 'short');
    longTab.classList.toggle('active', mode === 'long');

    startBtn.textContent = 'Start';
    startBtn.style.backgroundColor = '#a8562f';
    startBtn.style.color = '#faf6ef';
    updateDisplay();
}

function toggleTimer() {
    if (timerId === null) {
        startBtn.textContent = 'Pause';
        startBtn.style.backgroundColor = '#e8dcc4';
        startBtn.style.color = '#3b2f26';

        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timerId);
                timerId = null;
                playSoftAlarm();
                alert('Time is up!');
                resetTimer();
            }
        }, 1000);
    } else {
        clearInterval(timerId);
        timerId = null;
        startBtn.textContent = 'Start';
        startBtn.style.backgroundColor = '#a8562f';
        startBtn.style.color = '#faf6ef';
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = TIMES[currentMode];
    updateDisplay();
    startBtn.textContent = 'Start';
    startBtn.style.backgroundColor = '#a8562f';
    startBtn.style.color = '#faf6ef';
}

// --- Auth ---

function showAuth() {
    authCard.classList.remove('hidden');
    appContainer.classList.add('hidden');
    userBar.classList.add('hidden');
}

function showApp(email) {
    authCard.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userBar.classList.remove('hidden');
    userEmailEl.textContent = email;
}

async function checkAuth() {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
        const data = await res.json();
        showApp(data.email);
        loadTasks();
    } else {
        showAuth();
    }
}

function setAuthMode(mode) {
    authMode = mode;
    authError.classList.add('hidden');
    if (mode === 'signup') {
        authTitle.textContent = 'Sign up';
        authSubmitBtn.textContent = 'Sign up';
        authToggleText.textContent = 'Already have an account?';
        authToggleBtn.textContent = 'Log in';
    } else {
        authTitle.textContent = 'Log in';
        authSubmitBtn.textContent = 'Log in';
        authToggleText.textContent = 'Need an account?';
        authToggleBtn.textContent = 'Sign up';
    }
}

async function submitAuth() {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;
    if (!email || !password) return;

    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
        authError.textContent = data.error || 'Something went wrong';
        authError.classList.remove('hidden');
        return;
    }

    authPasswordInput.value = '';
    authError.classList.add('hidden');
    showApp(data.email);
    loadTasks();
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    taskList.innerHTML = '';
    authEmailInput.value = '';
    authPasswordInput.value = '';
    showAuth();
}

// --- Tasks ---

function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;

    const span = document.createElement('span');
    span.textContent = task.text;

    checkbox.addEventListener('change', () => {
        li.classList.toggle('completed', checkbox.checked);
        toggleTask(task.id, checkbox.checked);
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    taskList.appendChild(li);
}

async function loadTasks() {
    const res = await fetch('/api/tasks');
    if (!res.ok) return;
    const data = await res.json();
    taskList.innerHTML = '';
    data.tasks.forEach(renderTask);
}

async function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;

    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskText })
    });
    if (!res.ok) return;

    const data = await res.json();
    renderTask(data.task);
    taskInput.value = '';
}

async function toggleTask(id, completed) {
    await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
    });
}

startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
workTab.addEventListener('click', () => setMode('work'));
shortTab.addEventListener('click', () => setMode('short'));
longTab.addEventListener('click', () => setMode('long'));

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
});

authSubmitBtn.addEventListener('click', submitAuth);
authToggleBtn.addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));
[authEmailInput, authPasswordInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAuth();
    });
});
logoutBtn.addEventListener('click', logout);

checkAuth();
