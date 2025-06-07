<?php
// Test database connection and tables
require_once 'api/Database.php';

try {
    $database = new Database();
    $db = $database->connect();
    
    echo "✅ Database connection successful!\n";
    
    // Test if tables exist
    $tables = ['tasks', 'time_entries', 'task_completions'];
    foreach ($tables as $table) {
        $stmt = $db->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        if ($stmt->fetch()) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' missing\n";
        }
    }
    
    // Insert a test task
    $stmt = $db->prepare("INSERT INTO tasks (title, recurrence, start_date) VALUES (?, ?, ?)");
    $stmt->execute(['Test opgave', 'daily', date('Y-m-d')]);
    echo "✅ Test task created with ID: " . $db->lastInsertId() . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
