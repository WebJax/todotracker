<?php
class TaskController {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getTasksForDate($date) {
        $query = "
            SELECT 
                t.id, t.title, t.recurrence,
                -- Beregn total tid for dagen
                (SELECT SUM(duration_minutes) FROM time_entries 
                 WHERE task_id = t.id AND DATE(start_time) = :query_date_1) as total_minutes_today,
                -- Tjek om opgaven er markeret som fuldført i dag
                (SELECT COUNT(*) FROM task_completions 
                 WHERE task_id = t.id AND completion_date = :query_date_2) > 0 as is_completed,
                -- Tjek om en timer kører for denne opgave
                (SELECT id FROM time_entries 
                 WHERE task_id = t.id AND end_time IS NULL) as running_entry_id
            FROM tasks t
            WHERE 
                t.start_date <= :query_date_3 AND (
                    (t.recurrence = 'none' AND t.start_date = :query_date_4) OR
                    (t.recurrence = 'daily') OR
                    (t.recurrence = 'weekly' AND DAYOFWEEK(t.start_date) = DAYOFWEEK(:query_date_5)) OR
                    (t.recurrence = 'monthly' AND DAY(t.start_date) = DAY(:query_date_6)) OR
                    (t.recurrence = 'yearly' AND MONTH(t.start_date) = MONTH(:query_date_7) AND DAY(t.start_date) = DAY(:query_date_8))
                )
            ORDER BY t.id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':query_date_1', $date);
        $stmt->bindParam(':query_date_2', $date);
        $stmt->bindParam(':query_date_3', $date);
        $stmt->bindParam(':query_date_4', $date);
        $stmt->bindParam(':query_date_5', $date);
        $stmt->bindParam(':query_date_6', $date);
        $stmt->bindParam(':query_date_7', $date);
        $stmt->bindParam(':query_date_8', $date);
        
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function createTask($data) {
        $query = "INSERT INTO tasks (title, recurrence, start_date) VALUES (:title, :recurrence, :start_date)";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'title' => htmlspecialchars(strip_tags($data['title'])),
            'recurrence' => $data['recurrence'],
            'start_date' => $data['start_date'] ?? date('Y-m-d')
        ]);
        return ['id' => $this->conn->lastInsertId(), 'message' => 'Opgave oprettet'];
    }

    public function startTimer($data) {
        // Tjek om en anden timer allerede kører
        $check_query = "SELECT id FROM time_entries WHERE end_time IS NULL";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->execute();
        if ($check_stmt->fetch()) {
            throw new Exception("En anden opgave kører allerede.");
        }

        $query = "INSERT INTO time_entries (task_id, start_time) VALUES (:task_id, NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['task_id' => $data['id']]);
        return ['id' => $this->conn->lastInsertId(), 'message' => 'Timer startet'];
    }

    public function stopTimer($data) {
        $query = "UPDATE time_entries SET end_time = NOW(), duration_minutes = ROUND(TIMESTAMPDIFF(SECOND, start_time, NOW()) / 60), comment = :comment WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'id' => $data['id'],
            'comment' => htmlspecialchars(strip_tags($data['comment'] ?? ''))
        ]);
        return ['message' => 'Timer stoppet'];
    }

    public function completeTask($data) {
        $query = "INSERT INTO task_completions (task_id, completion_date, comment) VALUES (:task_id, :completion_date, :comment) ON DUPLICATE KEY UPDATE comment = :comment_update";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'task_id' => $data['id'],
            'completion_date' => $data['date'],
            'comment' => htmlspecialchars(strip_tags($data['comment'] ?? '')),
            'comment_update' => htmlspecialchars(strip_tags($data['comment'] ?? ''))
        ]);
        return ['message' => 'Opgave markeret som fuldført'];
    }
    
    public function getWeekOverview($date) {
        $query = "
            SELECT DATE_FORMAT(start_time, '%Y-%m-%d') as date, SUM(duration_minutes) as total_minutes
            FROM time_entries
            WHERE start_time BETWEEN DATE_SUB(:query_date_1, INTERVAL 6 DAY) AND DATE_ADD(:query_date_2, INTERVAL 1 DAY)
            AND duration_minutes IS NOT NULL
            GROUP BY DATE_FORMAT(start_time, '%Y-%m-%d')
            ORDER BY date ASC
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':query_date_1', $date);
        $stmt->bindParam(':query_date_2', $date);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getYearOverview($year) {
         $query = "
            SELECT MONTHNAME(start_time) as month, SUM(duration_minutes) as total_minutes
            FROM time_entries
            WHERE YEAR(start_time) = :query_year AND duration_minutes IS NOT NULL
            GROUP BY MONTH(start_time), MONTHNAME(start_time)
            ORDER BY MONTH(start_time) ASC
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':query_year', (int)$year, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getTaskComments($taskId, $date) {
        $query = "
            SELECT te.comment, te.start_time as created_at, 'timer' as type
            FROM time_entries te
            WHERE te.task_id = :task_id 
            AND DATE(te.start_time) = :date
            AND te.comment IS NOT NULL
            AND te.comment != ''
            
            UNION ALL
            
            SELECT tc.comment, tc.completion_date as created_at, 'completion' as type
            FROM task_completions tc
            WHERE tc.task_id = :task_id_2
            AND tc.completion_date = :date_2
            AND tc.comment IS NOT NULL
            AND tc.comment != ''
            
            ORDER BY created_at ASC
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':task_id', $taskId);
        $stmt->bindParam(':date', $date);
        $stmt->bindParam(':task_id_2', $taskId);
        $stmt->bindParam(':date_2', $date);
        
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function deleteTask($data) {
        try {
            $this->conn->beginTransaction();
            
            $taskId = $data['task_id'];
            
            // Delete related time entries first
            $query = "DELETE FROM time_entries WHERE task_id = :task_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':task_id', $taskId);
            $stmt->execute();
            
            // Delete related task completions
            $query = "DELETE FROM task_completions WHERE task_id = :task_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':task_id', $taskId);
            $stmt->execute();
            
            // Delete the task itself
            $query = "DELETE FROM tasks WHERE id = :task_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':task_id', $taskId);
            $stmt->execute();
            
            $this->conn->commit();
            
            return ['message' => 'Task deleted successfully'];
            
        } catch (Exception $e) {
            $this->conn->rollback();
            throw new Exception('Failed to delete task: ' . $e->getMessage());
        }
    }

    public function updateTask($data) {
        try {
            $taskId = $data['task_id'];
            $title = $data['title'];
            $recurrence = $data['recurrence'];
            
            $query = "UPDATE tasks SET title = :title, recurrence = :recurrence WHERE id = :task_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':recurrence', $recurrence);
            $stmt->bindParam(':task_id', $taskId);
            $stmt->execute();
            
            return ['message' => 'Task updated successfully'];
            
        } catch (Exception $e) {
            throw new Exception('Failed to update task: ' . $e->getMessage());
        }
    }
}
?>