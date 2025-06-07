<?php
class Database {
    private $host = '127.0.0.1';
    private $db_name = 'timetracker';
    private $username = 'root';
    private $password = '2010Thuva';
    private $conn;

    public function connect() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4', 
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            // I et produktionsmiljø bør fejlen logges, ikke udskrives
            http_response_code(500);
            echo json_encode(['message' => 'Database Connection Error: ' . $e->getMessage()]);
            exit();
        }
        return $this->conn;
    }
}
?>