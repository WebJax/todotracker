import { Task } from './task.js';

export class TaskList {
    constructor(containerId = 'tasksContainer') {
        this.container = document.getElementById(containerId);
        this.tasks = [];
    }

    clear() {
        this.tasks = [];
        this.container.innerHTML = '';
    }

    addTask(taskData = {}) {
        const task = new Task(taskData);
        this.tasks.push(task);
        // Rendering is handled by TimeTracker for now
        return task;
    }

    collectTasks() {
        // This will be called by TimeTracker, which will extract from DOM
        return this.tasks;
    }
}
