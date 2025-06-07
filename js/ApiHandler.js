class ApiHandler {
    static API_URL = './api/index.php';

    static async _request(method, params) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (method === 'GET') {
            const urlParams = new URLSearchParams(params);
            const response = await fetch(`${this.API_URL}?${urlParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }

        options.body = JSON.stringify(params);
        const response = await fetch(this.API_URL, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    static getTasks(date) {
        return this._request('GET', { action: 'get_tasks', date });
    }


    static createTask(title, recurrence) {
        return this._request('POST', { action: 'create_task', title, recurrence });
    }

    static startTimer(taskId) {
        return this._request('POST', { action: 'start_timer', id: taskId });
    }

    static stopTimer(entryId, comment) {
        return this._request('POST', { action: 'stop_timer', id: entryId, comment });
    }

    static completeTask(taskId, date, comment) {
        return this._request('POST', { action: 'complete_task', id: taskId, date, comment });
    }

    static getWeekOverview(date) {
        return this._request('GET', { action: 'get_week_overview', date });
    }

    static getYearOverview(year) {
        return this._request('GET', { action: 'get_year_overview', year });
    }

    static getTaskComments(taskId, date) {
        return this._request('GET', { action: 'get_task_comments', task_id: taskId, date });
    }

    static deleteTask(taskId) {
        return this._request('POST', { action: 'delete_task', task_id: taskId });
    }

    static updateTask(taskId, title, recurrence) {
        return this._request('POST', { action: 'update_task', task_id: taskId, title, recurrence });
    }
}