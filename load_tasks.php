<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only GET method allowed']);
    exit();
}

try {
    // Get date parameter
    if (!isset($_GET['date']) || empty($_GET['date'])) {
        throw new Exception('Date parameter is required');
    }
    
    $date = $_GET['date'];
    
    // Validate date format (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        throw new Exception('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Validate that date is a valid date
    $dateObj = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
        throw new Exception('Invalid date');
    }
    
    // Create filename
    $dataDir = __DIR__ . '/data';
    $filename = $dataDir . '/' . $date . '.json';
    
    // Check if file exists
    if (!file_exists($filename)) {
        // Return success with empty data if file doesn't exist
        echo json_encode([
            'success' => true,
            'message' => 'No data found for this date',
            'date' => $date,
            'data' => [
                'date' => $date,
                'tasks' => []
            ]
        ]);
        exit();
    }
    
    // Read file contents
    $fileContents = file_get_contents($filename);
    if ($fileContents === false) {
        throw new Exception('Could not read data file');
    }
    
    // Decode JSON
    $data = json_decode($fileContents, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data in file');
    }
    
    // Validate data structure
    if (!isset($data['date']) || !isset($data['tasks'])) {
        throw new Exception('Invalid data structure in file');
    }
    
    // Ensure tasks is an array
    if (!is_array($data['tasks'])) {
        $data['tasks'] = [];
    }
    
    // Calculate total minutes if not present
    if (!isset($data['total_minutes'])) {
        $data['total_minutes'] = array_sum(array_column($data['tasks'], 'time'));
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Data loaded successfully',
        'date' => $date,
        'data' => [
            'date' => $data['date'],
            'tasks' => $data['tasks']
        ],
        'total_minutes' => $data['total_minutes'],
        'task_count' => count($data['tasks'])
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
