<?php
// Headers for CORS and content type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once 'config.php';
require_once 'Database.php';
require_once 'TaskController.php';

// Instantiate database and controller
$database = new Database();
$db = $database->connect();
$controller = new TaskController($db);

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get data from request body for POST
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? $_GET['action'] ?? null;

// Routing
try {
    $response = null;
    switch ($method) {
        case 'GET':
            if ($action === 'get_tasks') {
                $date = $_GET['date'] ?? date('Y-m-d');
                $response = $controller->getTasksForDate($date);
            } elseif ($action === 'get_week_overview') {
                $date = $_GET['date'] ?? date('Y-m-d');
                $response = $controller->getWeekOverview($date);
            } elseif ($action === 'get_year_overview') {
                $year = $_GET['year'] ?? date('Y');
                $response = $controller->getYearOverview($year);
            } elseif ($action === 'get_task_comments') {
                $taskId = $_GET['task_id'] ?? null;
                $date = $_GET['date'] ?? date('Y-m-d');
                if ($taskId) {
                    $response = $controller->getTaskComments($taskId, $date);
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Task ID is required']);
                    exit;
                }
            }
            break;

        case 'POST':
            switch ($action) {
                case 'create_task':
                    $response = $controller->createTask($data);
                    break;
                case 'start_timer':
                    $response = $controller->startTimer($data);
                    break;
                case 'stop_timer':
                    $response = $controller->stopTimer($data);
                    break;
                case 'complete_task':
                    $response = $controller->completeTask($data);
                    break;
                case 'delete_task':
                    $response = $controller->deleteTask($data);
                    break;
                case 'update_task':
                    $response = $controller->updateTask($data);
                    break;
            }
            break;
    }

    if ($response !== null) {
        echo json_encode($response);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Action not found or invalid request method.']);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['message' => 'An error occurred: ' . $e->getMessage()]);
}
?>