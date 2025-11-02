<?php
session_start();
ob_start();
header('Content-Type: application/json');
ini_set('display_errors', 1); // ✅ Enable for debugging — set to 0 in production
error_reporting(E_ALL);

require_once("connection.php");

// Unified JSON response function
function sendJsonResponse($success, $message = '', $data = []) {
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    ob_end_flush();
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJsonResponse(false, "Invalid request method.");
}

// Read POST inputs
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    sendJsonResponse(false, "Missing username or password.");
}

// Prepare query - include user_dept
$stmt = $conn->prepare("SELECT user_id, username, password, user_type, user_handler, user_dept FROM users WHERE username = ?");
if (!$stmt) {
    sendJsonResponse(false, "Database prepare error.");
}

$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    sendJsonResponse(false, "User not found.");
}

$stmt->bind_result($user_id, $db_username, $db_password, $user_type, $user_handler, $user_dept);
$stmt->fetch();

// ⚠️ Replace with password_verify($password, $db_password) if using hashed passwords
if ($password === $db_password) {
    // Start session and return success JSON with user_type
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $db_username;
    $_SESSION['user_type'] = $user_type;
    $_SESSION['user_handler'] = $user_handler;
    $_SESSION['user_dept'] = $user_dept ?? ''; // Store user_dept in session

    sendJsonResponse(true, "Login successful", [
        "user_id" => $user_id,
        "username" => $db_username,
        "user_type" => $user_type,
        "user_handler" => $user_handler,
        "user_dept" => $user_dept ?? ''
    ]);
} else {
    sendJsonResponse(false, "Invalid password.");
}

$stmt->close();
$conn->close();
?>
