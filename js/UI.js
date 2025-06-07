class UI {
    static weekChart = null;
    static yearChart = null;

    static renderTasks(tasks) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="loader">Ingen opgaver for denne dag.</p>';
            return;
        }
        tasks.forEach(task => {
            const taskEl = this.createTaskElement(task);
            taskList.appendChild(taskEl);
        });
    }

    static createTaskElement(task) {
        const el = document.createElement('div');
        el.className = 'task';
        el.dataset.id = task.id;
        el.dataset.runningEntryId = task.running_entry_id || '';

        if (task.is_completed) el.classList.add('completed');
        if (task.running_entry_id) el.classList.add('running');
        
        // Format total time as HH:MM
        const totalMinutes = task.total_minutes_today ? Math.round(task.total_minutes_today) : 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Determine repeat icon based on recurrence
        const repeatIcon = task.recurrence === 'daily' ? '🔄' : 
                          task.recurrence === 'weekly' ? '📅' : 
                          task.recurrence === 'monthly' ? '📆' : '';

        el.innerHTML = `
            <div class="task-info">
                <div class="task-title">
                    ${task.title}
                    ${repeatIcon ? `<span class="repeat-icon" title="Gentages ${task.recurrence}">${repeatIcon}</span>` : ''}
                </div>
            </div>
            <div class="task-controls">
                <div class="total-time">Total: ${formattedTime}</div>
                <div class="control-row">
                    <span class="task-timer">00:00:00</span>
                    <button class="start-stop-btn ${task.running_entry_id ? 'stop' : ''}" ${task.is_completed ? 'disabled' : ''}>${task.running_entry_id ? 'Stop' : 'Start'}</button>
                    <button class="complete-btn ${task.is_completed ? 'completed' : ''}" ${task.is_completed ? 'disabled' : ''}>✓</button>
                    <button class="edit-btn" title="Rediger opgave" ${task.is_completed ? 'disabled' : ''}>✏️</button>
                    <button class="delete-btn" title="Slet opgave">🗑️</button>
                </div>
            </div>
        `;
        return el;
    }

    static updateDate(date) {
        const dateString = date.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
        document.getElementById('current-date').textContent = dateString;
    }
    
    static switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`${viewId}-view`).classList.remove('hidden');

        document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
        document.querySelector(`#main-nav button[data-view="${viewId}"]`).classList.add('active');
    }

    static showCommentModal(callback) {
        console.log('Showing comment modal');
        const modal = document.getElementById('comment-modal');
        const commentInput = document.getElementById('modal-comment');
        const saveBtn = document.getElementById('modal-save-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        
        if (!modal || !commentInput || !saveBtn || !cancelBtn) {
            console.error('Modal elements not found');
            return;
        }
        
        commentInput.value = '';
        modal.classList.remove('hidden');
        commentInput.focus();
        
        const saveHandler = () => {
            console.log('Save clicked, comment:', commentInput.value);
            callback(commentInput.value);
            cleanup();
        };

        const cancelHandler = () => {
            console.log('Cancel clicked');
            callback(null); // Indicate cancellation
            cleanup();
        };

        const cleanup = () => {
            console.log('Cleaning up modal');
            modal.classList.add('hidden');
            saveBtn.removeEventListener('click', saveHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };
        
        saveBtn.addEventListener('click', saveHandler, { once: true });
        cancelBtn.addEventListener('click', cancelHandler, { once: true });
    }

    static renderWeekChart(data) {
        const ctx = document.getElementById('week-chart').getContext('2d');
        
        // Handle error responses or invalid data
        if (!Array.isArray(data)) {
            console.error('Week chart data is not an array:', data);
            return;
        }
        
        // If no data, show empty chart with placeholder
        if (data.length === 0) {
            data = Array.from({length: 7}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 6 + i);
                return {
                    date: date.toISOString().split('T')[0],
                    total_minutes: 0
                };
            });
        }
        
        const labels = data.map(d => new Date(d.date).toLocaleDateString('da-DK', { weekday: 'short' }));
        const values = data.map(d => d.total_minutes || 0);

        if (this.weekChart) this.weekChart.destroy();
        this.weekChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Minutter registreret',
                    data: values,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: { 
                scales: { 
                    y: { 
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutter'
                        }
                    } 
                } 
            }
        });
    }

    static renderYearChart(data) {
        const ctx = document.getElementById('year-chart').getContext('2d');
        
        // Handle error responses or invalid data
        if (!Array.isArray(data)) {
            console.error('Year chart data is not an array:', data);
            return;
        }
        
        // If no data, show empty chart with month labels
        if (data.length === 0) {
            const months = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 
                          'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
            data = months.map(month => ({ month, total_minutes: 0 }));
        }
        
        const labels = data.map(d => d.month);
        const values = data.map(d => d.total_minutes || 0);

        if (this.yearChart) this.yearChart.destroy();
        this.yearChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Minutter registreret',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(46, 204, 113)',
                    tension: 0.1
                }]
            },
            options: { 
                scales: { 
                    y: { 
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutter'
                        }
                    } 
                } 
            }
        });
    }

    static showTaskComments(taskEl, comments) {
        const commentsEl = document.createElement('div');
        commentsEl.className = 'task-comments';
        
        if (comments.length === 0) {
            commentsEl.innerHTML = '<p class="no-comments">Ingen kommentarer endnu</p>';
        } else {
            const commentsHTML = comments.map(comment => `
                <div class="comment">
                    <div class="comment-time">${new Date(comment.created_at).toLocaleString('da-DK')}</div>
                    <div class="comment-text">${comment.comment}</div>
                </div>
            `).join('');
            commentsEl.innerHTML = `<div class="comments-list">${commentsHTML}</div>`;
        }
        
        taskEl.appendChild(commentsEl);
    }

    static showEditTaskModal(currentTitle, currentRecurrence, callback) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');

        title.textContent = 'Rediger Opgave';
        content.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label for="edit-task-title" style="display: block; margin-bottom: 5px; font-weight: 500;">Opgave titel:</label>
                <input type="text" id="edit-task-title" value="${currentTitle}" 
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-task-recurrence" style="display: block; margin-bottom: 5px; font-weight: 500;">Gentagelse:</label>
                <select id="edit-task-recurrence" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                    <option value="none" ${currentRecurrence === 'none' || !currentRecurrence ? 'selected' : ''}>Ingen gentagelse</option>
                    <option value="daily" ${currentRecurrence === 'daily' ? 'selected' : ''}>Dagligt 🔄</option>
                    <option value="weekly" ${currentRecurrence === 'weekly' ? 'selected' : ''}>Ugentligt 📅</option>
                    <option value="monthly" ${currentRecurrence === 'monthly' ? 'selected' : ''}>Månedligt 📆</option>
                </select>
            </div>
        `;

        const saveBtn = document.getElementById('edit-modal-save-btn');
        const cancelBtn = document.getElementById('edit-modal-cancel-btn');
        const titleInput = document.getElementById('edit-task-title');

        // Focus on title input
        setTimeout(() => titleInput.focus(), 100);

        // Set up event handlers
        const handleSave = () => {
            const newTitle = titleInput.value.trim();
            const recurrence = document.getElementById('edit-task-recurrence').value;
            modal.style.display = 'none';
            callback(newTitle, recurrence);
            cleanup();
        };

        const handleCancel = () => {
            modal.style.display = 'none';
            callback(null, null);
            cleanup();
        };

        const cleanup = () => {
            saveBtn.removeEventListener('click', handleSave);
            cancelBtn.removeEventListener('click', handleCancel);
            titleInput.removeEventListener('keyup', handleEnter);
        };

        const handleEnter = (e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
        };

        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        titleInput.addEventListener('keyup', handleEnter);

        modal.style.display = 'block';
    }
}