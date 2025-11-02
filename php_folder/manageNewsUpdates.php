<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Debug logging
error_log("manageNewsUpdates.php called with POST data: " . json_encode($_POST));
error_log("manageNewsUpdates.php called with FILES data: " . json_encode($_FILES));

// Get action from POST data (for FormData) or JSON input (for JSON requests)
$action = $_POST["action"] ?? null;
if (!$action) {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? null;
}

error_log("Action determined: " . ($action ?? 'null'));

// === Get Next ID ===
if ($action === "getNextID") {
    $result = $conn->query("SELECT MAX(nup_id) as max_id FROM managenewsupdate");

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && $row['max_id'] !== null ? (int) filter_var($row['max_id'], FILTER_SANITIZE_NUMBER_INT) : 0;
        $nextId = $maxId + 1;

        echo json_encode([
            'success' => true,
            'newsupdateId' => $nextId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch next news update ID.'
        ]);
    }

    ob_end_flush();
    exit;
}

// === Save News Update ===
elseif ($action === "save") {
    // Handle file upload first
    $nupPicPath = '';
    if (isset($_FILES['newsupdateImage']) && $_FILES['newsupdateImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['newsupdateImage'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.'
            ]);
            ob_end_flush();
            exit;
        }

        // Validate file size (5MB max)
        if ($file['size'] > 5 * 1024 * 1024) {
            echo json_encode([
                'success' => false,
                'message' => 'File size too large. Maximum size is 5MB.'
            ]);
            ob_end_flush();
            exit;
        }

        // Create uploads directory if it doesn't exist
        $uploadDir = '../uploads/newsandupdatephotos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp (like visual photos)
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $nupPicPath = '/uploads/newsandupdatephotos/' . $fileName;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save uploaded file.'
            ]);
            ob_end_flush();
            exit;
        }
    }

    // Get form data
    $id       = $conn->real_escape_string($_POST["newsupdateId"] ?? '');
    $title    = $conn->real_escape_string($_POST["newsupdateTitle"] ?? '');
    $desc     = $conn->real_escape_string($_POST["newsupdateDescription"] ?? '');
    $uploadDate = $conn->real_escape_string($_POST["uploadDate"] ?? '');

    if (!$id || !$title || !$desc || !$uploadDate) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    // Convert ISO date to MySQL date format
    $mysqlDate = date('Y-m-d', strtotime($uploadDate));

    $sql = "INSERT INTO managenewsupdate (
                nup_id, 
                nup_title, 
                nup_description, 
                nup_uploaddate,
                nup_pic_path
            ) VALUES (
                '$id', 
                '$title', 
                '$desc', 
                '$mysqlDate',
                '$nupPicPath'
            )";

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save news update: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Fetch All News Updates ===
elseif ($action === "fetchdata") {
    $result = $conn->query("SELECT * FROM managenewsupdate ORDER BY nup_id DESC");
    if ($result && $result->num_rows > 0) {
        $newsupdates = [];
        while ($row = $result->fetch_assoc()) {
            // Fix image path: convert relative paths to absolute paths
            $imagePath = $row["nup_pic_path"];
            if ($imagePath && strpos($imagePath, './uploads/') === 0) {
                $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
                
                // Update the database with the corrected path
                $correctedPath = $conn->real_escape_string($imagePath);
                $newsupdateId = $conn->real_escape_string($row["nup_id"]);
                $updateSql = "UPDATE managenewsupdate SET nup_pic_path = '$correctedPath' WHERE nup_id = '$newsupdateId'";
                $conn->query($updateSql);
            }
            
            $newsupdates[] = [
                "newsupdateId"           => $row["nup_id"],
                "newsupdateTitle"        => $row["nup_title"],
                "newsupdateDescription"  => $row["nup_description"],
                "uploadDate"             => $row["nup_uploaddate"],
                "newsupdatePicPath"      => $imagePath
            ];
        }
        echo json_encode([
            'success' => true,
            'newsupdates' => $newsupdates
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No news updates found.'
        ]);
    }
    ob_end_flush();
    exit;
}

// === Get News Update By ID ===
elseif ($action === "getNewsupdateById") {
    $newsupdateId = $input["newsupdateId"] ?? '';

    if (!$newsupdateId) {
        echo json_encode(['success' => false, 'message' => 'Missing news update ID']);
        ob_end_flush(); exit;
    }

    $stmt = $conn->prepare("SELECT * FROM managenewsupdate WHERE nup_id = ?");
    $stmt->bind_param("s", $newsupdateId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $row = $result->fetch_assoc()) {
        // Fix image path: convert relative paths to absolute paths
        $imagePath = $row["nup_pic_path"];
        if ($imagePath && strpos($imagePath, './uploads/') === 0) {
            $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
        }
        
        echo json_encode([
            'success' => true,
            'newsupdate' => [
                "newsupdateId"           => $row["nup_id"],
                "newsupdateTitle"        => $row["nup_title"],
                "newsupdateDescription"  => $row["nup_description"],
                "uploadDate"             => $row["nup_uploaddate"],
                "newsupdatePicPath"      => $imagePath
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'News update not found']);
    }

    ob_end_flush(); exit;
}

// === Update News Update ===
elseif ($action === "update") {
    // Debug logging
    error_log("Update news update request received: " . json_encode($_POST));
    
    // Handle file upload first
    $nupPicPath = '';
    if (isset($_FILES['newsupdateImage']) && $_FILES['newsupdateImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['newsupdateImage'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.'
            ]);
            ob_end_flush();
            exit;
        }

        // Validate file size (5MB max)
        if ($file['size'] > 5 * 1024 * 1024) {
            echo json_encode([
                'success' => false,
                'message' => 'File size too large. Maximum size is 5MB.'
            ]);
            ob_end_flush();
            exit;
        }

        // Create uploads directory if it doesn't exist
        $uploadDir = '../uploads/newsandupdatephotos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp (like visual photos)
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $nupPicPath = '/uploads/newsandupdatephotos/' . $fileName;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save uploaded file.'
            ]);
            ob_end_flush();
            exit;
        }
    }
    
    $id       = $conn->real_escape_string($_POST["newsupdateId"] ?? '');
    $title    = $conn->real_escape_string($_POST["newsupdateTitle"] ?? '');
    $desc     = $conn->real_escape_string($_POST["newsupdateDescription"] ?? '');
    $uploadDate = $conn->real_escape_string($_POST["uploadDate"] ?? '');
    
    // Debug logging for extracted values
    error_log("Extracted values - ID: $id, Title: $title, Desc: $desc, UploadDate: $uploadDate, PicPath: $nupPicPath");

    if (!$id || !$title || !$desc || !$uploadDate) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    // Convert ISO date to MySQL date format
    $mysqlDate = date('Y-m-d', strtotime($uploadDate));

    $sql = "UPDATE managenewsupdate SET 
                nup_title = '$title', 
                nup_description = '$desc', 
                nup_uploaddate = '$mysqlDate'";
    
    // Only update picture path if new file was uploaded
    if ($nupPicPath) {
        $sql .= ", nup_pic_path = '$nupPicPath'";
    }
    
    $sql .= " WHERE nup_id = '$id'";

    // Debug logging for SQL query
    error_log("SQL Query: " . $sql);

    if ($conn->query($sql)) {
        error_log("News update successful");
        
        // Verify the update by fetching the updated record
        $verifySql = "SELECT * FROM managenewsupdate WHERE nup_id = '$id'";
        $verifyResult = $conn->query($verifySql);
        if ($verifyResult && $row = $verifyResult->fetch_assoc()) {
            error_log("Verification - Updated record: " . json_encode($row));
        }
        
        echo json_encode(['success' => true]);
    } else {
        error_log("News update failed: " . $conn->error);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update news update: ' . $conn->error
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
?>
