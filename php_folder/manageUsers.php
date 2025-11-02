<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Debug logging
error_log("manageUsers.php called with POST data: " . json_encode($_POST));
error_log("manageUsers.php called with FILES data: " . json_encode($_FILES));

// Get action from POST data (for FormData) or JSON input (for JSON requests)
$action = $_POST["action"] ?? null;
if (!$action) {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? null;
}

error_log("Action determined: " . ($action ?? 'null'));

// === Get Next ID ===
if ($action === "getNextID") {
    $result = $conn->query("SELECT MAX(user_id) as max_id FROM users");

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && $row['max_id'] !== null ? (int) filter_var($row['max_id'], FILTER_SANITIZE_NUMBER_INT) : 0;
        $nextId = $maxId + 1;

        echo json_encode([
            'success' => true,
            'userId' => $nextId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch next user ID.'
        ]);
    }

    ob_end_flush();
    exit;
}

// === Login Approval ===
if ($action === "login") {
    $username = $conn->real_escape_string($input['username'] ?? '');
    $password = $conn->real_escape_string($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        sendJsonResponse(false, "Missing username or password.");
    }

    // Use prepared statement to prevent SQL injection
    $stmt = $conn->prepare("SELECT user_id, password, user_type FROM users WHERE username = ?");
    if (!$stmt) {
        sendJsonResponse(false, "Database prepare error: " . $conn->error);
    }
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        sendJsonResponse(false, "User not found.");
    } else {
        $stmt->bind_result($user_id, $db_password, $user_type);
        $stmt->fetch();

        // IMPORTANT: For production, use password_verify() with hashed passwords.
        // Example: if (password_verify($password, $db_password)) { ... }
        if ($password === $db_password) { // Direct comparison as in your example (INSECURE FOR PRODUCTION)
            sendJsonResponse(true, "Login successful.", ["user_type" => $user_type, "user_id" => $user_id]);
        } else {
            sendJsonResponse(false, "Invalid password.");
        }
    }
    $stmt->close();
}

// === Save User ===
elseif ($action === "save") {
    // Get form data
    $id       = $conn->real_escape_string($_POST["userId"] ?? '');
    $userType = $conn->real_escape_string($_POST["userType"] ?? '');
    $dept     = $conn->real_escape_string($_POST["department"] ?? '');
    $username = $conn->real_escape_string($_POST["username"] ?? '');
    $handler  = $conn->real_escape_string($_POST["handlerName"] ?? '');
    $password = $conn->real_escape_string($_POST["password"] ?? '');

    if (!$id || !$userType || !$dept || !$username || !$handler || !$password) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    // Check if username already exists
    $checkStmt = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
    if (!$checkStmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Database prepare error: ' . $conn->error
        ]);
        ob_end_flush();
        exit;
    }
    $checkStmt->bind_param("s", $username);
    $checkStmt->execute();
    $checkStmt->store_result();
    if ($checkStmt->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists.'
        ]);
        ob_end_flush();
        exit;
    }
    $checkStmt->close();

    $sql = "INSERT INTO users (
                user_id, 
                user_type, 
                user_dept, 
                username, 
                user_handler, 
                password
            ) VALUES (
                '$id', 
                '$userType', 
                '$dept', 
                '$username', 
                '$handler', 
                '$password'
            )";

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save user: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Update User ===
elseif ($action === "update") {
    // Debug logging
    error_log("Update user request received: " . json_encode($_POST));
    
    $id       = $conn->real_escape_string($_POST["userId"] ?? '');
    $userType = $conn->real_escape_string($_POST["userType"] ?? '');
    $dept     = $conn->real_escape_string($_POST["department"] ?? '');
    $username = $conn->real_escape_string($_POST["username"] ?? '');
    $handler  = $conn->real_escape_string($_POST["handlerName"] ?? '');
    $password = $conn->real_escape_string($_POST["password"] ?? '');
    
    // Debug logging for extracted values
    error_log("Extracted values - ID: $id, UserType: $userType, Dept: $dept, Username: $username, Handler: $handler, Password: [HIDDEN]");

    if (!$id || !$userType || !$dept || !$username || !$handler || !$password) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    $sql = "UPDATE users SET 
                user_type = '$userType', 
                user_dept = '$dept', 
                username = '$username', 
                user_handler = '$handler', 
                password = '$password'
                WHERE user_id = '$id'";

    // Debug logging for SQL query
    error_log("SQL Query: " . $sql);

    if ($conn->query($sql)) {
        error_log("User update successful");
        
        // Verify the update by fetching the updated record
        $verifySql = "SELECT * FROM users WHERE user_id = '$id'";
        $verifyResult = $conn->query($verifySql);
        if ($verifyResult && $row = $verifyResult->fetch_assoc()) {
            error_log("Verification - Updated record: " . json_encode($row));
        }
        
        echo json_encode(['success' => true]);
    } else {
        error_log("User update failed: " . $conn->error);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update user: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Delete User ===
elseif ($action === "delete") {
    $userId = $input["userId"] ?? '';

    if (!$userId) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing user ID for deletion.'
        ]);
        ob_end_flush();
        exit;
    }

    $sql = "DELETE FROM users WHERE user_id = '$userId'";

    if ($conn->query($sql)) {
        if ($conn->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully.'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No user found with that ID.'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete user: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Fetch All Users ===
elseif ($action === "fetchdata") {
    $result = $conn->query("SELECT * FROM users ORDER BY user_id DESC");
    if ($result && $result->num_rows > 0) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                "userId"       => $row["user_id"],
                "userType"     => $row["user_type"],
                "userDept"     => $row["user_dept"],
                "username"     => $row["username"],
                "userHandler"  => $row["user_handler"],
                "password"     => $row["password"]
            ];
        }
        echo json_encode([
            'success' => true,
            'users' => $users
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No users found.'
        ]);
    }
    ob_end_flush();
    exit;
}

elseif ($action === "getUserById") {
    $userId = $input["userId"] ?? '';

    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Missing user ID']);
        ob_end_flush(); exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE user_id = ?");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $row = $result->fetch_assoc()) {
        echo json_encode([
            'success' => true,
            'user' => [
                "userId"       => $row["user_id"],
                "userType"     => $row["user_type"],
                "userDept"     => $row["user_dept"],
                "username"     => $row["username"],
                "userHandler"  => $row["user_handler"],
                "password"     => $row["password"]
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }

    ob_end_flush(); exit;
}

// === Invalid Action ===
echo json_encode([
    'success' => false,
    'message' => 'Invalid action'
]);
ob_end_flush();
exit;

// Close connection after all processing
$conn->close();
?>
