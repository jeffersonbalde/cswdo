<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username']) || !isset($_SESSION['user_type'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Session expired or invalid',
        'redirect' => '/login.html'
    ]);
    exit;
}

// Validate session with database
require_once("connection.php");
$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT user_id, username, user_type, user_handler FROM users WHERE user_id = ? AND username = ? AND user_type = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'redirect' => '/login.html'
    ]);
    exit;
}

$stmt->bind_param("iss", $user_id, $_SESSION['username'], $_SESSION['user_type']);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    // Session data doesn't match database - invalid session
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid session data',
        'redirect' => '/login.html'
    ]);
    exit;
}

$stmt->bind_result($db_user_id, $db_username, $db_user_type, $db_user_handler);
$stmt->fetch();

// Return valid session data
echo json_encode([
    'success' => true,
    'data' => [
        'user_id' => $db_user_id,
        'username' => $db_username,
        'user_type' => $db_user_type,
        'user_handler' => $db_user_handler
    ]
]);

$stmt->close();
$conn->close();
?>

