const TIMES = {
    work: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};
const TEXTS = {
    work: '🍓study time🍓',
    short: '🌸little break🌸',
    long: '🧁long break🧁'
};

let timeLeft = TIMES.work;
let currentMode = 'work';
let timerId = null;

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
    startBtn.style.backgroundColor = '#ff758f';
    startBtn.style.color = 'white';
    updateDisplay();
}

function toggleTimer() {
    if (timerId === null) {
        startBtn.textContent = 'Pause';
        startBtn.style.backgroundColor = '#ffb3c1';
        startBtn.style.color = '#ff4d6d';
        
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timerId);
                timerId = null;
                playSoftAlarm(); 
                alert('🌸 Time is up! 🌸');
                resetTimer();
            }
        }, 1000);
    } else {
        clearInterval(timerId);
        timerId = null;
        startBtn.textContent = 'Start';
        startBtn.style.backgroundColor = '#ff758f';
        startBtn.style.color = 'white';
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = TIMES[currentMode];
    updateDisplay();
    startBtn.textContent = 'Start';
    startBtn.style.backgroundColor = '#ff758f';
    startBtn.style.color = 'white';
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    const li = document.createElement('li');
    li.className = 'task-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    const span = document.createElement('span');
    span.textContent = taskText;

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            li.classList.add('completed');
        } else {
            li.classList.remove('completed');
        }
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    taskList.appendChild(li);

    taskInput.value = "";
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