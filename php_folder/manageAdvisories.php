<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Debug logging
error_log("manageAdvisories.php called with POST data: " . json_encode($_POST));

// Get action from POST data (for FormData) or JSON input (for JSON requests)
$action = $_POST["action"] ?? null;
if (!$action) {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? null;
}

error_log("Action determined: " . ($action ?? 'null'));

// === Get Next ID ===
if ($action === "getNextID") {
    $result = $conn->query("SELECT MAX(advisories_id) as max_id FROM manageadvisories");

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && $row['max_id'] !== null ? (int) filter_var($row['max_id'], FILTER_SANITIZE_NUMBER_INT) : 0;
        $nextId = $maxId + 1;

        echo json_encode([
            'success' => true,
            'advisoryId' => $nextId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch next advisory ID.'
        ]);
    }

    ob_end_flush();
    exit;
}

// === Save Advisory ===
elseif ($action === "save") {
    // Get form data
    $id       = $conn->real_escape_string($_POST["advisoryId"] ?? '');
    $title    = $conn->real_escape_string($_POST["advisoryTitle"] ?? '');
    $date     = $conn->real_escape_string($_POST["uploadDate"] ?? '');
    $desc     = $conn->real_escape_string($_POST["advisoryDescription"] ?? '');

    if (!$id || !$title || !$date || !$desc) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    $sql = "INSERT INTO manageadvisories (
                advisories_id, 
                advisories_title, 
                advisories_date, 
                advisories_description
            ) VALUES (
                '$id', 
                '$title', 
                '$date', 
                '$desc'
            )";

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save advisory: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Fetch All Advisories ===
elseif ($action === "fetchdata") {
    $result = $conn->query("SELECT * FROM manageadvisories ORDER BY advisories_id DESC");
    if ($result && $result->num_rows > 0) {
        $advisories = [];
        while ($row = $result->fetch_assoc()) {
            $advisories[] = [
                "advisoryId"           => $row["advisories_id"],
                "advisoryTitle"        => $row["advisories_title"],
                "uploadDate"           => $row["advisories_date"],
                "advisoryDescription"  => $row["advisories_description"]
            ];
        }
        echo json_encode([
            'success' => true,
            'advisories' => $advisories
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No advisories found.'
        ]);
    }
    ob_end_flush();
    exit;
}

// === Get Advisory By ID ===
elseif ($action === "getAdvisoryById") {
    $advisoryId = $input["advisoryId"] ?? '';

    if (!$advisoryId) {
        echo json_encode(['success' => false, 'message' => 'Missing advisory ID']);
        ob_end_flush(); exit;
    }

    $stmt = $conn->prepare("SELECT * FROM manageadvisories WHERE advisories_id = ?");
    $stmt->bind_param("s", $advisoryId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $row = $result->fetch_assoc()) {
        echo json_encode([
            'success' => true,
            'advisory' => [
                "advisoryId"           => $row["advisories_id"],
                "advisoryTitle"        => $row["advisories_title"],
                "uploadDate"           => $row["advisories_date"],
                "advisoryDescription"  => $row["advisories_description"]
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Advisory not found']);
    }

    ob_end_flush(); exit;
}

// === Update Advisory ===
elseif ($action === "update") {
    // Debug logging
    error_log("Update advisory request received: " . json_encode($_POST));
    
    $id       = $conn->real_escape_string($_POST["advisoryId"] ?? '');
    $title    = $conn->real_escape_string($_POST["advisoryTitle"] ?? '');
    $date     = $conn->real_escape_string($_POST["uploadDate"] ?? '');
    $desc     = $conn->real_escape_string($_POST["advisoryDescription"] ?? '');
    
    // Debug logging for extracted values
    error_log("Extracted values - ID: $id, Title: $title, Date: $date, Desc: $desc");

    if (!$id || !$title || !$date || !$desc) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    $sql = "UPDATE manageadvisories SET 
                advisories_title = '$title', 
                advisories_date = '$date', 
                advisories_description = '$desc' 
                WHERE advisories_id = '$id'";

    // Debug logging for SQL query
    error_log("SQL Query: " . $sql);

    if ($conn->query($sql)) {
        error_log("Advisory update successful");
        
        // Verify the update by fetching the updated record
        $verifySql = "SELECT * FROM manageadvisories WHERE advisories_id = '$id'";
        $verifyResult = $conn->query($verifySql);
        if ($verifyResult && $row = $verifyResult->fetch_assoc()) {
            error_log("Verification - Updated record: " . json_encode($row));
        }
        
        echo json_encode(['success' => true]);
    } else {
        error_log("Advisory update failed: " . $conn->error);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update advisory: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Delete Advisory ===
elseif ($action === "delete") {
    $advisoryId = $conn->real_escape_string($_POST["advisoryId"] ?? '');

    if (!$advisoryId) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing advisory ID.'
        ]);
        ob_end_flush();
        exit;
    }

    $sql = "DELETE FROM manageadvisories WHERE advisories_id = '$advisoryId'";

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete advisory: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
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
