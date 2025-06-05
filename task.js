export class Task {
    constructor({ title = '', time = 0, comment = '', repeat = 'none', createdDate = null, done = false } = {}) {
        this.title = title;
        this.time = time;
        this.comment = comment;
        this.repeat = repeat;
        this.createdDate = createdDate;
        this.done = done;
    }
}
