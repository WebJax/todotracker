<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit();
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate required fields
    if (!isset($data['date']) || !isset($data['tasks'])) {
        throw new Exception('Missing required fields: date and tasks');
    }
    
    $date = $data['date'];
    $tasks = $data['tasks'];
    
    // Validate date format (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        throw new Exception('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Validate that date is a valid date
    $dateObj = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
        throw new Exception('Invalid date');
    }
    
    // Validate tasks array
    if (!is_array($tasks)) {
        throw new Exception('Tasks must be an array');
    }
    
    // Validate each task
    foreach ($tasks as $index => $task) {
        if (!is_array($task)) {
            throw new Exception("Task at index $index must be an object");
        }
        
        // Ensure required fields exist
        if (!isset($task['title']) || !isset($task['time']) || !isset($task['comment'])) {
            throw new Exception("Task at index $index missing required fields");
        }
        
        // Validate time is a number
        if (!is_numeric($task['time']) || $task['time'] < 0) {
            throw new Exception("Task at index $index has invalid time value");
        }
        
        // Sanitize strings
        $tasks[$index]['title'] = trim(strip_tags($task['title']));
        $tasks[$index]['comment'] = trim(strip_tags($task['comment']));
        $tasks[$index]['time'] = (int)$task['time'];
    }
    
    // Prepare data to save
    $saveData = [
        'date' => $date,
        'tasks' => $tasks,
        'saved_at' => date('Y-m-d H:i:s'),
        'total_minutes' => array_sum(array_column($tasks, 'time'))
    ];
    
    // Ensure data directory exists
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        if (!mkdir($dataDir, 0755, true)) {
            throw new Exception('Could not create data directory');
        }
    }
    
    // Create filename
    $filename = $dataDir . '/' . $date . '.json';
    
    // Save data to file
    $jsonData = json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($jsonData === false) {
        throw new Exception('Could not encode data to JSON');
    }
    
    if (file_put_contents($filename, $jsonData, LOCK_EX) === false) {
        throw new Exception('Could not save data to file');
    }
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Tasks saved successfully',
        'date' => $date,
        'task_count' => count($tasks),
        'total_minutes' => $saveData['total_minutes']
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
?>
