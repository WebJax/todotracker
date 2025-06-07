class App {
    static state = {
        currentDate: new Date(),
        activeTimer: null,
        tasks: []
    };

    static init() {
        console.log('Initializing TimeTracker app...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, setting up app...');
                this.setupEventListeners();
                this.loadTasksForCurrentDate();
            });
        } else {
            // DOM is already loaded
            console.log('DOM already loaded, setting up app immediately...');
            this.setupEventListeners();
            this.loadTasksForCurrentDate();
        }
    }

    static setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation
        const mainNav = document.getElementById('main-nav');
        if (mainNav) {
            mainNav.addEventListener('click', this.handleNavClick.bind(this));
            console.log('✅ Navigation event listener added');
        } else {
            console.error('❌ Main nav not found');
        }
        
        // Date navigation
        const prevBtn = document.getElementById('prev-day-btn');
        const nextBtn = document.getElementById('next-day-btn');
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => this.changeDate(-1));
            nextBtn.addEventListener('click', () => this.changeDate(1));
            console.log('✅ Date navigation event listeners added');
        } else {
            console.error('❌ Date navigation buttons not found');
        }

        // Forms and actions
        const addTaskForm = document.getElementById('add-task-form');
        const taskList = document.getElementById('task-list');
        
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', this.handleAddTask.bind(this));
            console.log('✅ Add task form event listener added');
        } else {
            console.error('❌ Add task form not found');
        }
        
        if (taskList) {
            taskList.addEventListener('click', this.handleTaskListClick.bind(this));
            console.log('✅ Task list event listener added');
        } else {
            console.error('❌ Task list not found');
        }
    }
    
    static async loadTasksForCurrentDate() {
        UI.updateDate(this.state.currentDate);
        const dateStr = this.state.currentDate.toISOString().split('T')[0];
        try {
            const tasks = await ApiHandler.getTasks(dateStr);
            this.state.tasks = tasks;
            this.checkForRunningTimer();
            UI.renderTasks(this.state.tasks);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            alert("Kunne ikke hente opgaver. Tjek konsollen for fejl.");
        }
    }

    static changeDate(days) {
        this.state.currentDate.setDate(this.state.currentDate.getDate() + days);
        this.loadTasksForCurrentDate();
    }
    
    static async handleNavClick(e) {
        const view = e.target.dataset.view;
        if (!view) return;

        UI.switchView(view);

        try {
            if (view === 'week') {
                const dateStr = this.state.currentDate.toISOString().split('T')[0];
                const data = await ApiHandler.getWeekOverview(dateStr);
                UI.renderWeekChart(data);
            } else if (view === 'year') {
                const year = this.state.currentDate.getFullYear();
                const data = await ApiHandler.getYearOverview(year);
                UI.renderYearChart(data);
            }
        } catch (error) {
            console.error('Failed to load chart data:', error);
            alert('Kunne ikke hente data for diagrammet. Tjek konsollen for fejl.');
        }
    }
    
    static async handleAddTask(e) {
        e.preventDefault();
        const titleInput = document.getElementById('task-title');
        const recurrence = document.getElementById('task-recurrence').value;
        if (!titleInput.value.trim()) return;

        await ApiHandler.createTask(titleInput.value, recurrence);
        titleInput.value = '';
        this.loadTasksForCurrentDate();
    }
    
    static handleTaskListClick(e) {
        console.log('🖱️ Task list clicked:', e.target);
        console.log('🖱️ Target class:', e.target.className);
        console.log('🖱️ Target text:', e.target.textContent);
        
        const taskEl = e.target.closest('.task');
        if (!taskEl) {
            console.log('❌ No task element found');
            return;
        }
        
        const taskId = parseInt(taskEl.dataset.id);
        const isCompleted = taskEl.classList.contains('completed');
        console.log('✅ Task element found:', taskId, 'completed:', isCompleted);

        if (e.target.matches('.start-stop-btn')) {
            console.log('▶️ Start/Stop button clicked');
            // Prevent starting timer on completed tasks
            if (!isCompleted) {
                this.handleStartStopClick(taskId, taskEl);
            } else {
                console.log('Cannot start timer on completed task');
            }
        } else if (e.target.matches('.complete-btn')) {
            console.log('✓ Complete button clicked');
            // Only allow completing if not already completed
            if (!isCompleted) {
                this.handleCompleteClick(taskId);
            } else {
                console.log('Task already completed - no action');
            }
        } else if (e.target.matches('.delete-btn')) {
            console.log('🗑️ Delete button clicked');
            this.handleDeleteClick(taskId, taskEl);
        } else if (e.target.matches('.edit-btn')) {
            console.log('✏️ Edit button clicked');
            // Only allow editing if not completed
            if (!isCompleted) {
                this.handleEditClick(taskId, taskEl);
            } else {
                console.log('Cannot edit completed task');
            }
        } else if (e.target.matches('.task-title')) {
            console.log('📝 Task title clicked - toggling comments');
            this.toggleTaskComments(taskId, taskEl);
        } else {
            console.log('🤷 Unhandled click target:', e.target);
        }
    }
    
    static async handleStartStopClick(taskId, taskEl) {
        const isRunning = taskEl.classList.contains('running');
        console.log('Timer action:', isRunning ? 'stop' : 'start', 'for task', taskId);
        
        if (isRunning) {
            // Stop timer - get entry ID from data attribute
            const entryId = parseInt(taskEl.dataset.runningEntryId);
            console.log('Stopping timer with entry ID:', entryId);
            
            if (!entryId) {
                console.error('No running entry ID found');
                alert('Kunne ikke finde timer ID');
                return;
            }
            
            UI.showCommentModal(async (comment) => {
                if (comment !== null) { // User didn't cancel
                    try {
                        await ApiHandler.stopTimer(entryId, comment);
                        clearInterval(this.state.activeTimer);
                        this.state.activeTimer = null;
                        this.loadTasksForCurrentDate();
                    } catch (error) {
                        console.error('Failed to stop timer:', error);
                        alert('Kunne ikke stoppe timer: ' + error.message);
                    }
                }
            });
        } else {
            // Start timer
            if (this.state.activeTimer) {
                alert("Stop venligst den nuværende opgave, før du starter en ny.");
                return;
            }
            
            try {
                console.log('Starting timer for task:', taskId);
                const res = await ApiHandler.startTimer(taskId);
                console.log('Timer start response:', res);
                
                if (res.id) {
                    this.loadTasksForCurrentDate();
                    // Start the local timer immediately
                    setTimeout(() => {
                        const updatedTaskEl = document.querySelector(`.task[data-id="${taskId}"]`);
                        if (updatedTaskEl && updatedTaskEl.classList.contains('running')) {
                            this.startLocalTimer(updatedTaskEl);
                        }
                    }, 100); // Small delay to ensure DOM is updated
                } else {
                    alert(res.message || "Kunne ikke starte timeren.");
                }
            } catch (error) {
                console.error('Failed to start timer:', error);
                alert('Kunne ikke starte timer: ' + error.message);
            }
        }
    }
    
    static async handleCompleteClick(taskId) {
        console.log('Completing task:', taskId);
        
        UI.showCommentModal(async (comment) => {
            if (comment !== null) {
                try {
                    const dateStr = this.state.currentDate.toISOString().split('T')[0];
                    console.log('Marking task complete:', taskId, 'for date:', dateStr);
                    await ApiHandler.completeTask(taskId, dateStr, comment);
                    this.loadTasksForCurrentDate();
                } catch (error) {
                    console.error('Failed to complete task:', error);
                    alert('Kunne ikke markere opgave som fuldført: ' + error.message);
                }
            }
        });
    }
    
    static async toggleTaskComments(taskId, taskEl) {
        const commentsEl = taskEl.querySelector('.task-comments');
        
        if (commentsEl) {
            // Comments are visible, hide them
            commentsEl.remove();
            taskEl.classList.remove('expanded');
        } else {
            // Load and show comments
            try {
                const comments = await ApiHandler.getTaskComments(taskId, this.state.currentDate.toISOString().split('T')[0]);
                UI.showTaskComments(taskEl, comments);
                taskEl.classList.add('expanded');
            } catch (error) {
                console.error('Failed to load comments:', error);
            }
        }
    }
    
     static checkForRunningTimer() {
        const runningTask = this.state.tasks.find(t => t.running_entry_id);
        if (runningTask) {
            const taskEl = document.querySelector(`.task[data-id="${runningTask.id}"]`);
            if (taskEl) {
                this.startLocalTimer(taskEl);
            }
        }
    }
    
    static startLocalTimer(taskEl) {
        if (this.state.activeTimer) clearInterval(this.state.activeTimer);
        const timerDisplay = taskEl.querySelector('.task-timer');
        
        // For a real implementation, you'd need to fetch the start time from the server
        // For now, we'll start from 0 (which means the time won't be accurate on page refresh)
        let seconds = 0;
        
        this.state.activeTimer = setInterval(() => {
            seconds++;
            const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
            const s = String(seconds % 60).padStart(2, '0');
            timerDisplay.textContent = `${h}:${m}:${s}`;
        }, 1000);
    }

    static async handleDeleteClick(taskId, taskEl) {
        console.log('🗑️ DELETE CLICK DETECTED! Task ID:', taskId);
        
        // Show confirmation dialog
        const confirmed = confirm('Er du sikker på, at du vil slette denne opgave? Denne handling kan ikke fortrydes.');
        if (!confirmed) {
            console.log('Delete cancelled by user');
            return;
        }
        
        try {
            console.log('Attempting to delete task via API...');
            await ApiHandler.deleteTask(taskId);
            console.log('Task deleted successfully');
            
            // Remove the task element from the UI immediately
            taskEl.remove();
            
            // Reload tasks to ensure consistency
            this.loadTasksForCurrentDate();
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Kunne ikke slette opgaven: ' + error.message);
        }
    }

    static async handleEditClick(taskId, taskEl) {
        console.log('🔥 EDIT CLICK DETECTED! Task ID:', taskId);
        
        // Get current task data from state
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found in state');
            alert('Kunne ikke finde opgaven');
            return;
        }
        
        console.log('Task found:', task);
        
        // Show edit modal with current values
        UI.showEditTaskModal(task.title, task.recurrence, async (newTitle, newRecurrence) => {
            if (newTitle !== null && newTitle.trim()) {
                try {
                    await ApiHandler.updateTask(taskId, newTitle.trim(), newRecurrence);
                    console.log('Task updated successfully');
                    
                    // Reload tasks to show updated data
                    this.loadTasksForCurrentDate();
                } catch (error) {
                    console.error('Failed to update task:', error);
                    alert('Kunne ikke opdatere opgaven: ' + error.message);
                }
            }
        });
    }
}

App.init();