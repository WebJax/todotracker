-- TimeTracker Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS timetracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE timetracker;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    recurrence ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT 'none',
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_minutes INT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Task completions table
CREATE TABLE IF NOT EXISTS task_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    completion_date DATE NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_date (task_id, completion_date)
);

-- Indexes for better performance
CREATE INDEX idx_time_entries_task_date ON time_entries (task_id, start_time);
CREATE INDEX idx_time_entries_start_time ON time_entries (start_time);
CREATE INDEX idx_task_completions_date ON task_completions (completion_date);
CREATE INDEX idx_tasks_recurrence ON tasks (recurrence, start_date);
