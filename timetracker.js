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
    }

    onSelectDay(date) {
        document.getElementById('dateInput').value = date;
        this.loadDay();
    }

    addTask(taskData = null) {
        // Use TaskList to add task, but rendering is still handled here for now
        this.taskList.addTask(taskData);
    }

    collectTasks() {
        const tasks = [];
        const taskElements = document.querySelectorAll('#tasksContainer > div');
        
        taskElements.forEach(taskEl => {
            const title = taskEl.querySelector('.task-title').value.trim();
            const time = parseInt(taskEl.querySelector('.task-time').value) || 0;
            const comment = taskEl.querySelector('.task-comment').value.trim();
            const repeat = taskEl.querySelector('.task-repeat')?.value || 'none';
            
            if (title || time > 0 || comment) {
                tasks.push({ title, time, comment, repeat });
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
        const data = { date, tasks };

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

            if (result.success) {
                // Add recurring tasks
                if (result.data && result.data.tasks && result.data.tasks.length > 0) {
                    result.data.tasks.forEach(task => {
                        // If this is a recurring task, check if it should appear today
                        if (task.repeat && task.repeat !== 'none') {
                            // Add a createdDate property if not present
                            if (!task.createdDate) task.createdDate = date;
                            if (isRecurringToday(task, date)) {
                                this.addTask(task);
                            }
                        } else {
                            this.addTask(task);
                        }
                    });
                    this.showMessage('Dag hentet succesfuldt!', 'success');
                } else {
                    this.addTask(); // Add empty task if no data
                    this.showMessage('Ingen data fundet for denne dato', 'warning');
                }
                this.updateTotal();
                this.resetAllTimerDisplays();
            } else {
                this.showMessage('Fejl ved hentning: ' + result.message, 'error');
            }
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
}

// Initialize the app when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new TimeTracker();
});
