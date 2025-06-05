import { Task } from './task.js';
import { TaskList } from './tasklist.js';
import { WeekView } from './weekview.js';

class TimeTracker {
    constructor() {
        this.taskList = new TaskList();
        this.weekView = new WeekView('weekDaysContainer', (date) => this.onSelectDay(date));
        this.activeTimers = new Map();
        this.init();
    }

    init() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateInput').value = today;
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('saveDayBtn').addEventListener('click', () => this.saveDay());
        document.getElementById('loadDayBtn').addEventListener('click', () => this.loadDay());
        document.getElementById('prevWeekBtn').addEventListener('click', () => this.weekView.changeWeek(-1));
        document.getElementById('nextWeekBtn').addEventListener('click', () => this.weekView.changeWeek(1));
        this.weekView.initWeekView();
        this.addTask();
        this.updateTotal();

        // Recurring Task Management UI
        this.addRecurringTaskUI();
    }

    onSelectDay(date) {
        document.getElementById('dateInput').value = date;
        this.loadDay();
    }

    addTask(taskData = null) {
        const tasksContainer = document.getElementById('tasksContainer');
        const taskDiv = document.createElement('div');
        taskDiv.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
        
        const taskId = Date.now() + Math.random();
        taskDiv.dataset.taskId = taskId;
        if (taskData && taskData.id) {
            taskDiv.dataset.recurringId = taskData.id;
        }
        
        taskDiv.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div class="md:col-span-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Opgave</label>
                    <input type="text" class="task-title w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                           placeholder="Beskriv opgaven..." value="${taskData?.title || ''}">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tid (min)</label>
                    <div class="flex items-center gap-2">
                        <input type="number" class="task-time w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                               placeholder="0" min="0" value="${taskData?.time || ''}">
                    </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Timer</label>
                    <div class="flex items-center gap-2">
                        <button class="timer-btn px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-1" 
                                title="Start timer">
                            <svg class="w-4 h-4 timer-icon-play" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 4h10a1 1 0 001-1V7a1 1 0 00-1-1H6a1 1 0 00-1 1v10a1 1 0 001 1z"></path>
                            </svg>
                            <svg class="w-4 h-4 timer-icon-stop hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z"></path>
                            </svg>
                            <span class="timer-text">Start</span>
                        </button>
                        <span class="timer-display text-sm font-mono text-gray-600 min-w-[50px]">00:00</span>
                    </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Gentag</label>
                    <select class="task-repeat w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="none">Ingen</option>
                        <option value="daily">Dagligt</option>
                        <option value="weekly">Ugentligt</option>
                        <option value="monthly">Månedligt</option>
                        <option value="yearly">Årligt</option>
                    </select>
                </div>
                <div class="md:col-span-1 flex items-end gap-1">
                    <label class="inline-flex items-center">
                        <input type="checkbox" class="task-done" ${taskData?.done ? 'checked' : ''}>
                        <span class="ml-2">Udført</span>
                    </label>
                </div>
                <div class="md:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kommentar</label>
                    <input type="text" class="task-comment w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                           placeholder="Eventuel kommentar..." value="${taskData?.comment || ''}">
                </div>
                <div class="md:col-span-1 flex items-end gap-1">
                    <button class="move-task w-full md:w-auto px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
                            title="Flyt opgave">
                        <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                    </button>
                    <button class="remove-task w-full md:w-auto px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" 
                            title="Fjern opgave">
                        <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        tasksContainer.appendChild(taskDiv);

        // Attach event listeners to the new task elements
        taskDiv.querySelector('.remove-task').addEventListener('click', () => {
            taskDiv.remove();
            this.updateTotal();
        });

        const moveTaskBtn = taskDiv.querySelector('.move-task');
        moveTaskBtn.addEventListener('click', () => {
            this.moveTask(taskDiv);
        });

        const timerBtn = taskDiv.querySelector('.timer-btn');
        timerBtn.addEventListener('click', () => {
            const taskId = taskDiv.dataset.taskId;
            this.toggleTimer(taskId);
        });

        const timeInput = taskDiv.querySelector('.task-time');
        timeInput.addEventListener('input', () => {
            const value = parseInt(timeInput.value) || 0;
            this.updateTimerDisplay(value, taskDiv.querySelector('.timer-display'));
            this.updateTotal();
        });

        const doneCheckbox = taskDiv.querySelector('.task-done');
        doneCheckbox.addEventListener('change', () => {
            const isChecked = doneCheckbox.checked;
            taskDiv.querySelector('.task-title').classList.toggle('line-through', isChecked);
            taskDiv.querySelector('.task-title').classList.toggle('text-gray-400', isChecked);
            taskDiv.querySelector('.task-time').disabled = isChecked;
            taskDiv.querySelector('.task-comment').disabled = isChecked;
            taskDiv.querySelector('.task-repeat').disabled = isChecked;
            taskDiv.querySelector('.timer-btn').disabled = isChecked;
            taskDiv.querySelector('.move-task').disabled = isChecked;
            taskDiv.querySelector('.remove-task').disabled = isChecked;

            if (isChecked) {
                // If checked, stop the timer and save the current time
                const taskId = taskDiv.dataset.taskId;
                this.stopTimer(taskId);
            }
        });

        // Initialize the task repeat select
        const repeatSelect = taskDiv.querySelector('.task-repeat');
        repeatSelect.value = taskData?.repeat || 'none';
        repeatSelect.addEventListener('change', () => {
            const selectedValue = repeatSelect.value;
            if (selectedValue === 'none') {
                taskDiv.querySelector('.task-comment').placeholder = 'Eventuel kommentar...';
            } else {
                taskDiv.querySelector('.task-comment').placeholder = `Kommentar til ${selectedValue} opgave...`;
            }
        });

        // Initialize timer display
        this.updateTimerDisplay(0, taskDiv.querySelector('.timer-display'));
    }

    collectTasks() {
        const tasks = [];
        const taskElements = document.querySelectorAll('#tasksContainer > div');
        
        taskElements.forEach(taskEl => {
            const title = taskEl.querySelector('.task-title').value.trim();
            const time = parseInt(taskEl.querySelector('.task-time').value) || 0;
            const comment = taskEl.querySelector('.task-comment').value.trim();
            const repeat = taskEl.querySelector('.task-repeat')?.value || 'none';
            const done = taskEl.querySelector('.task-done')?.checked || false;
            const id = taskEl.dataset.recurringId || undefined;
            
            if (title || time > 0 || comment) {
                tasks.push({ title, time, comment, repeat, done, id });
            }
        });
        
        return tasks;
    }

    async saveDay() {
        const date = document.getElementById('dateInput').value;
        if (!date) {
            this.showMessage('Vælg venligst en dato', 'error');
            return;
        }

        const tasks = this.collectTasks();
        // Split into recurring and normal tasks
        const normalTasks = [];
        const recurringUpdates = [];
        tasks.forEach(task => {
            if (task.repeat && task.repeat !== 'none') {
                // If it's a recurring task, only save status/time for today
                recurringUpdates.push({
                    recurring_id: task.id,
                    time: task.time,
                    done: task.done,
                    date: date
                });
            } else {
                normalTasks.push(task);
            }
        });
        const data = { date, tasks: normalTasks, recurringUpdates };

        try {
            const response = await fetch('save_tasks.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Dag gemt succesfuldt!', 'success');
            } else {
                this.showMessage('Fejl ved gemning: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Netværksfejl ved gemning', 'error');
            console.error('Save error:', error);
        }
    }

    async loadDay() {
        const date = document.getElementById('dateInput').value;
        if (!date) {
            this.showMessage('Vælg venligst en dato', 'error');
            return;
        }

        // Fetch recurring tasks
        let recurringTasks = [];
        try {
            const recurringResp = await fetch('recurring_tasks.json');
            recurringTasks = await recurringResp.json();
        } catch (e) {
            recurringTasks = [];
        }

        try {
            const response = await fetch(`load_tasks.php?date=${date}`);
            const result = await response.json();
            this.clearTasks();

            // Helper to check if a recurring task should appear on this date
            function isRecurringToday(task, dateStr) {
                if (!task.repeat || task.repeat === 'none') return false;
                const d = new Date(dateStr);
                const created = task.createdDate ? new Date(task.createdDate) : d;
                switch (task.repeat) {
                    case 'daily':
                        return true;
                    case 'weekly':
                        return d.getDay() === created.getDay();
                    case 'monthly':
                        return d.getDate() === created.getDate();
                    case 'yearly':
                        return d.getDate() === created.getDate() && d.getMonth() === created.getMonth();
                    default:
                        return false;
                }
            }

            let dayTasks = [];
            let recurringUpdates = [];
            if (result.success) {
                if (result.data && result.data.tasks) dayTasks = result.data.tasks;
                if (result.data && result.data.recurringUpdates) recurringUpdates = result.data.recurringUpdates;
            }

            // Add normal tasks
            dayTasks.forEach(task => this.addTask(task));

            // Add recurring tasks (merge with updates for this day)
            recurringTasks.forEach(recTask => {
                if (isRecurringToday(recTask, date)) {
                    // Find update for this recurring task on this day
                    const update = recurringUpdates.find(u => u.recurring_id === recTask.id);
                    this.addTask({
                        ...recTask,
                        time: update ? update.time : 0,
                        done: update ? update.done : false,
                        repeat: recTask.repeat,
                        id: recTask.id
                    });
                }
            });

            this.updateTotal();
            this.resetAllTimerDisplays();
            this.showMessage('Dag hentet succesfuldt!', 'success');
        } catch (error) {
            this.showMessage('Netværksfejl ved hentning', 'error');
            console.error('Load error:', error);
        }
    }

    updateTotal() {
        const timeInputs = document.querySelectorAll('.task-time');
        let total = 0;
        
        timeInputs.forEach(input => {
            const value = parseInt(input.value) || 0;
            total += value;
        });

        document.getElementById('totalMinutes').textContent = total;
        
        const hours = Math.floor(total / 60);
        const minutes = total % 60;
        document.getElementById('totalHours').textContent = `${hours}t ${minutes}m`;
    }

    resetAllTimerDisplays() {
        const timerDisplays = document.querySelectorAll('.timer-display');
        timerDisplays.forEach(display => {
            display.textContent = '00:00';
        });
    }

    updateTimerDisplay(minutes, displayElement) {
        const totalSeconds = minutes * 60;
        const displayMinutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        displayElement.textContent = `${displayMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    clearTasks() {
        const tasksContainer = document.getElementById('tasksContainer');
        // Stop all running timers before clearing
        this.activeTimers.forEach((timer, taskId) => {
            this.stopTimer(taskId);
        });
        tasksContainer.innerHTML = '';
    }

    toggleTimer(taskId) {
        if (this.activeTimers.has(taskId)) {
            this.stopTimer(taskId);
        } else {
            // Stop any other running timers first (only one timer at a time)
            this.activeTimers.forEach((timer, id) => {
                if (id !== taskId) {
                    this.stopTimer(id);
                }
            });
            this.startTimer(taskId);
        }
    }

    startTimer(taskId) {
        const taskDiv = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskDiv) return;

        const timerBtn = taskDiv.querySelector('.timer-btn');
        const timerText = taskDiv.querySelector('.timer-text');
        const timerDisplay = taskDiv.querySelector('.timer-display');
        const playIcon = taskDiv.querySelector('.timer-icon-play');
        const stopIcon = taskDiv.querySelector('.timer-icon-stop');
        const timeInput = taskDiv.querySelector('.task-time');

        // Update button appearance
        timerBtn.className = timerBtn.className.replace('bg-green-500', 'bg-red-500').replace('hover:bg-green-600', 'hover:bg-red-600');
        timerText.textContent = 'Stop';
        playIcon.classList.add('hidden');
        stopIcon.classList.remove('hidden');

        // Add pulsing effect to indicate active timer
        taskDiv.classList.add('ring-2', 'ring-green-400', 'ring-opacity-50');

        const startTime = Date.now();
        const initialMinutes = parseInt(timeInput.value) || 0;
        const initialSeconds = initialMinutes * 60;

        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const totalSeconds = initialSeconds + elapsed;
            
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timeInput.value = minutes;
            
            this.updateTotal();
        }, 1000);

        this.activeTimers.set(taskId, {
            timer,
            startTime,
            initialSeconds
        });
    }

    stopTimer(taskId) {
        const timerData = this.activeTimers.get(taskId);
        if (!timerData) return;

        const taskDiv = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskDiv) return;

        clearInterval(timerData.timer);
        this.activeTimers.delete(taskId);

        const timerBtn = taskDiv.querySelector('.timer-btn');
        const timerText = taskDiv.querySelector('.timer-text');
        const timerDisplay = taskDiv.querySelector('.timer-display');
        const playIcon = taskDiv.querySelector('.timer-icon-play');
        const stopIcon = taskDiv.querySelector('.timer-icon-stop');
        const timeInput = taskDiv.querySelector('.task-time');

        // Update button appearance
        timerBtn.className = timerBtn.className.replace('bg-red-500', 'bg-green-500').replace('hover:bg-red-600', 'hover:bg-green-600');
        timerText.textContent = 'Start';
        playIcon.classList.remove('hidden');
        stopIcon.classList.add('hidden');

        // Remove pulsing effect
        taskDiv.classList.remove('ring-2', 'ring-green-400', 'ring-opacity-50');

        // Calculate final time and update display
        const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
        const totalSeconds = timerData.initialSeconds + elapsed;
        const finalMinutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        timeInput.value = finalMinutes;
        timerDisplay.textContent = `${finalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.updateTotal();
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type];

        messageDiv.className = `${bgColor} text-white px-4 py-2 rounded-md shadow-lg mb-2 transition-opacity duration-300`;
        messageDiv.textContent = message;
        
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }

    moveTask(taskDiv) {
        const currentDate = document.getElementById('dateInput').value;
        const taskId = taskDiv.dataset.taskId;
        const taskTitle = taskDiv.querySelector('.task-title').value.trim();
        const taskTime = parseInt(taskDiv.querySelector('.task-time').value) || 0;
        const taskComment = taskDiv.querySelector('.task-comment').value.trim();

        // Prompt for new date
        const newDate = prompt('Indtast ny dato for opgaven (YYYY-MM-DD):', currentDate);
        if (!newDate) return;

        // Validate date format (simple check)
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(newDate)) {
            this.showMessage('Ugyldigt datoformat. Brug venligst YYYY-MM-DD.', 'error');
            return;
        }

        // Update task data
        const taskData = { title: taskTitle, time: taskTime, comment: taskComment };
        
        // Remove task from current date
        taskDiv.remove();

        // Add task to new date
        const newTaskDiv = this.addTask(taskData);

        // Update date input
        document.getElementById('dateInput').value = newDate;

        // Save changes
        this.saveDay();

        this.showMessage('Opgave flyttet til ' + newDate, 'success');
    }

    // Recurring Task Management UI
    addRecurringTaskUI() {
        // Add a button to open modal
        const btn = document.createElement('button');
        btn.id = 'manageRecurringBtn';
        btn.textContent = 'Administrer gentagelser';
        btn.className = 'px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 mb-4';
        document.body.appendChild(btn);

        // Modal
        const modal = document.createElement('div');
        modal.id = 'recurringModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold mb-4">Gentagende opgaver</h2>
                <div id="recurringList"></div>
                <button id="addRecurringBtn" class="mt-4 px-4 py-2 bg-primary text-white rounded">+ Tilføj gentagelse</button>
                <button id="closeRecurringModal" class="mt-4 ml-2 px-4 py-2 bg-gray-400 text-white rounded">Luk</button>
            </div>
        `;
        document.body.appendChild(modal);

        btn.addEventListener('click', () => { modal.classList.remove('hidden'); this.renderRecurringList(); });
        modal.querySelector('#closeRecurringModal').addEventListener('click', () => modal.classList.add('hidden'));
        modal.querySelector('#addRecurringBtn').addEventListener('click', () => this.showRecurringForm());
    }

    async renderRecurringList() {
        const listDiv = document.getElementById('recurringList');
        let tasks = [];
        try {
            const resp = await fetch('recurring_tasks.json');
            tasks = await resp.json();
        } catch {}
        listDiv.innerHTML = tasks.map(t => `
            <div class="flex justify-between items-center border-b py-2">
                <span>${t.title} (${t.repeat})</span>
                <span>
                    <button class="editRecurringBtn text-blue-600 mr-2" data-id="${t.id}">Rediger</button>
                    <button class="deleteRecurringBtn text-red-600" data-id="${t.id}">Slet</button>
                </span>
            </div>
        `).join('') || '<div class="text-gray-500">Ingen gentagelser</div>';
        listDiv.querySelectorAll('.editRecurringBtn').forEach(btn => btn.addEventListener('click', e => this.showRecurringForm(e.target.dataset.id)));
        listDiv.querySelectorAll('.deleteRecurringBtn').forEach(btn => btn.addEventListener('click', e => this.deleteRecurringTask(e.target.dataset.id)));
    }

    showRecurringForm(id = null) {
        // Simple prompt-based form for demo
        let task = { title: '', comment: '', repeat: 'daily' };
        if (id) {
            // Find task
            fetch('recurring_tasks.json').then(r => r.json()).then(tasks => {
                const t = tasks.find(t => t.id === id);
                if (t) {
                    task = t;
                    this.promptRecurringForm(task, true);
                }
            });
        } else {
            this.promptRecurringForm(task, false);
        }
    }

    promptRecurringForm(task, isEdit) {
        const title = prompt('Titel:', task.title || '');
        if (title === null) return;
        const comment = prompt('Kommentar:', task.comment || '');
        if (comment === null) return;
        const repeat = prompt('Gentag (daily, weekly, monthly, yearly):', task.repeat || 'daily');
        if (repeat === null) return;
        const newTask = { ...task, title, comment, repeat };
        if (!isEdit) newTask.id = Math.random().toString(36).substr(2, 9);
        fetch('save_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recurringTaskAction: isEdit ? 'edit' : 'add',
                recurringTask: newTask,
                date: '', tasks: []
            })
        }).then(() => { document.getElementById('recurringModal').classList.remove('hidden'); this.renderRecurringList(); });
    }

    deleteRecurringTask(id) {
        if (!confirm('Slet gentagelse?')) return;
        fetch('save_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recurringTaskAction: 'delete',
                recurringTaskId: id,
                date: '', tasks: []
            })
        }).then(() => { this.renderRecurringList(); });
    }
}

// Initialize the app when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const tracker = new TimeTracker();
    tracker.addRecurringTaskUI();
});
