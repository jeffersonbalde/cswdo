<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Debug logging
error_log("manageFeaturedStories.php called with POST data: " . json_encode($_POST));
error_log("manageFeaturedStories.php called with FILES data: " . json_encode($_FILES));

// Get action from POST data (for FormData) or JSON input (for JSON requests)
$action = $_POST["action"] ?? null;
if (!$action) {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? null;
}

error_log("Action determined: " . ($action ?? 'null'));

// === Get Next ID ===
if ($action === "getNextID") {
    $result = $conn->query("SELECT MAX(fs_id) as max_id FROM managefeaturedstories");

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && $row['max_id'] !== null ? (int) filter_var($row['max_id'], FILTER_SANITIZE_NUMBER_INT) : 0;
        $nextId = $maxId + 1;

        echo json_encode([
            'success' => true,
            'featuredstoriesId' => $nextId
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
    if (isset($_FILES['featuredstoriesImage']) && $_FILES['featuredstoriesImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['featuredstoriesImage'];
        
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
        $uploadDir = '../uploads/featuredstoriesphotos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp (like visual photos)
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $nupPicPath = '/uploads/featuredstoriesphotos/' . $fileName;
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
    $id       = $conn->real_escape_string($_POST["featuredstoriesId"] ?? '');
    $title    = $conn->real_escape_string($_POST["featuredstoriesTitle"] ?? '');
    $desc     = $conn->real_escape_string($_POST["featuredstoriesDescription"] ?? '');
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

    $sql = "INSERT INTO managefeaturedstories (
                fs_id, 
                fs_title, 
                fs_description, 
                fs_uploaddate,
                fs_pic_path
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
            'message' => 'Failed to save featured story: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Fetch All Featured Stories ===
elseif ($action === "fetchdata") {
    $result = $conn->query("SELECT * FROM managefeaturedstories ORDER BY fs_id DESC");
    if ($result && $result->num_rows > 0) {
        $featuredstories = [];
        while ($row = $result->fetch_assoc()) {
            // Fix image path: convert relative paths to absolute paths
            $imagePath = $row["fs_pic_path"];
            if ($imagePath && strpos($imagePath, './uploads/') === 0) {
                $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
                
                // Update the database with the corrected path
                $correctedPath = $conn->real_escape_string($imagePath);
                $featuredstoriesId = $conn->real_escape_string($row["fs_id"]);
                $updateSql = "UPDATE managefeaturedstories SET fs_pic_path = '$correctedPath' WHERE fs_id = '$featuredstoriesId'";
                $conn->query($updateSql);
            }
            
            $featuredstories[] = [
                "featuredstoriesId"           => $row["fs_id"],
                "featuredstoriesTitle"        => $row["fs_title"],
                "featuredstoriesDescription"  => $row["fs_description"],
                "uploadDate"             => $row["fs_uploaddate"],
                "featuredstoriesPicPath"      => $imagePath
            ];
        }
        echo json_encode([
            'success' => true,
            'featuredstories' => $featuredstories
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No featured stories found.'
        ]);
    }
    ob_end_flush();
    exit;
}

// === Get Featured Story By ID ===
elseif ($action === "getFeaturedstoriesById") {
    $featuredstoriesId = $input["featuredstoriesId"] ?? '';

    if (!$featuredstoriesId) {
        echo json_encode(['success' => false, 'message' => 'Missing featured story ID']);
        ob_end_flush(); exit;
    }

    $stmt = $conn->prepare("SELECT * FROM managefeaturedstories WHERE fs_id = ?");
    $stmt->bind_param("s", $featuredstoriesId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $row = $result->fetch_assoc()) {
        // Fix image path: convert relative paths to absolute paths
        $imagePath = $row["fs_pic_path"];
        if ($imagePath && strpos($imagePath, './uploads/') === 0) {
            $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
        }
        
        echo json_encode([
            'success' => true,
            'featuredstories' => [
                "featuredstoriesId"           => $row["fs_id"],
                "featuredstoriesTitle"        => $row["fs_title"],
                "featuredstoriesDescription"  => $row["fs_description"],
                "uploadDate"             => $row["fs_uploaddate"],
                "featuredstoriesPicPath"      => $imagePath
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Featured story not found']);
    }

    ob_end_flush(); exit;
}

// === Update Featured Story ===
elseif ($action === "update") {
    // Debug logging
    error_log("Update featured story request received: " . json_encode($_POST));
    
    // Handle file upload first
    $fsPicPath = '';
    if (isset($_FILES['featuredstoriesImage']) && $_FILES['featuredstoriesImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['featuredstoriesImage'];
        
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
        $uploadDir = '../uploads/featuredstoriesphotos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp (like visual photos)
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $fsPicPath = '/uploads/featuredstoriesphotos/' . $fileName;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save uploaded file.'
            ]);
            ob_end_flush();
            exit;
        }
    }
    
    $id       = $conn->real_escape_string($_POST["featuredstoriesId"] ?? '');
    $title    = $conn->real_escape_string($_POST["featuredstoriesTitle"] ?? '');
    $desc     = $conn->real_escape_string($_POST["featuredstoriesDescription"] ?? '');
    $uploadDate = $conn->real_escape_string($_POST["uploadDate"] ?? '');
    
    // Debug logging for extracted values
    error_log("Extracted values - ID: $id, Title: $title, Desc: $desc, UploadDate: $uploadDate, PicPath: $fsPicPath");

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

    $sql = "UPDATE managefeaturedstories SET 
                fs_title = '$title', 
                fs_description = '$desc', 
                fs_uploaddate = '$mysqlDate'";
    
    // Only update picture path if new file was uploaded
    if ($fsPicPath) {
        $sql .= ", fs_pic_path = '$fsPicPath'";
    }
    
    $sql .= " WHERE fs_id = '$id'";

    // Debug logging for SQL query
    error_log("SQL Query: " . $sql);

    if ($conn->query($sql)) {
        error_log("Featured story update successful");
        
        // Verify the update by fetching the updated record
        $verifySql = "SELECT * FROM managefeaturedstories WHERE fs_id = '$id'";
        $verifyResult = $conn->query($verifySql);
        if ($verifyResult && $row = $verifyResult->fetch_assoc()) {
            error_log("Verification - Updated record: " . json_encode($row));
        }
        
        echo json_encode(['success' => true]);
    } else {
        error_log("Featured story update failed: " . $conn->error);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update featured story: ' . $conn->error
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
