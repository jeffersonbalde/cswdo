<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once("connection.php");

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username']) || !isset($_SESSION['user_type']) || !isset($_SESSION['user_handler'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Fetch fresh user data from database for security
$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT user_id, username, user_type, user_handler, user_dept FROM users WHERE user_id = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database prepare error'
    ]);
    exit;
}

$stmt->bind_param("i", $user_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'User not found in database'
    ]);
    exit;
}

$stmt->bind_result($db_user_id, $username, $user_type, $user_handler, $user_dept);
$stmt->fetch();

// Return user data
echo json_encode([
    'success' => true,
    'data' => [
        'user_id' => $db_user_id,
        'username' => $username,
        'user_type' => $user_type,
        'user_handler' => $user_handler,
        'user_dept' => $user_dept ?? ''
    ]
]);

$stmt->close();
$conn->close();
?>
