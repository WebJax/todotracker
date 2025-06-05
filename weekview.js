export class WeekView {
    constructor(containerId = 'weekDaysContainer', onSelectDay = null) {
        this.container = document.getElementById(containerId);
        this.onSelectDay = onSelectDay;
        this.currentWeekStart = null;
        this.currentWeekEnd = null;
    }

    initWeekView(date = new Date()) {
        const dayOfWeek = date.getDay() || 7;
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        const weekEnd = new Date(date.setDate(diff + 6));
        this.currentWeekStart = weekStart;
        this.currentWeekEnd = weekEnd;
        this.renderWeekDays(weekStart, weekEnd);
    }

    renderWeekDays(start, end) {
        this.container.innerHTML = '';
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dayButton = document.createElement('button');
            dayButton.className = 'px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none';
            dayButton.textContent = currentDate.getDate();
            dayButton.dataset.date = currentDate.toISOString().split('T')[0];
            if (dayButton.dataset.date === new Date().toISOString().split('T')[0]) {
                dayButton.classList.add('bg-primary', 'text-white');
            } else {
                dayButton.classList.add('text-gray-800');
            }
            dayButton.addEventListener('click', (e) => {
                if (this.onSelectDay) this.onSelectDay(e.currentTarget.dataset.date);
            });
            this.container.appendChild(dayButton);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    changeWeek(direction) {
        const diff = direction * 7;
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + diff);
        this.currentWeekEnd.setDate(this.currentWeekEnd.getDate() + diff);
        this.renderWeekDays(this.currentWeekStart, this.currentWeekEnd);
    }
}
