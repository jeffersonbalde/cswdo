<?php
session_start();
require_once("connection.php");

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username']) || !isset($_SESSION['user_type'])) {
    // Redirect to login if not authenticated
    header('Location: /login.html');
    exit;
}

// Fetch fresh user data from database
$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT username, user_type FROM users WHERE user_id = ?");
if (!$stmt) {
    die("Database error");
}

$stmt->bind_param("i", $user_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    header('Location: /login.html');
    exit;
}

$stmt->bind_result($username, $user_type);
$stmt->fetch();

// Prepare user data for JavaScript injection
$userData = [
    'username' => $username,
    'user_type' => $user_type,
    'user_handler' => $username  // Using username as user_handler
];

$stmt->close();
$conn->close();

// Return the user data as a JavaScript object
echo "<script>
// User data injected by PHP
window.userData = " . json_encode($userData) . ";
console.log('User data loaded:', window.userData);
</script>";
?>
