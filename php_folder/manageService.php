<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Debug logging
error_log("manageService.php called with POST data: " . json_encode($_POST));
error_log("manageService.php called with FILES data: " . json_encode($_FILES));

// Get action from POST data (for FormData) or JSON input (for JSON requests)
$action = $_POST["action"] ?? null;
if (!$action) {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? null;
}

error_log("Action determined: " . ($action ?? 'null'));

// === Get Next ID ===
if ($action === "getNextID") {
    // Try camelCase first (matches screenshot), then snake_case as fallback
    $result = $conn->query("SELECT MAX(serviceId) as max_id FROM manageServices");
    if (!$result) {
        $result = $conn->query("SELECT MAX(service_id) as max_id FROM manageServices");
    }

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && isset($row['max_id']) && $row['max_id'] !== null
            ? (int) filter_var($row['max_id'], FILTER_SANITIZE_NUMBER_INT)
            : 0;
        $nextId = $maxId + 1;

        echo json_encode([
            'success' => true,
            'serviceId' => $nextId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch next service ID.'
        ]);
    }

    ob_end_flush();
    exit;
}

// === Save Service ===
elseif ($action === "save") {
    // Handle file upload first
    $servicePicPath = '';
    if (isset($_FILES['serviceImage']) && $_FILES['serviceImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['serviceImage'];
        
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
        $uploadDir = '../uploads/servicephotos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp (like visual photos)
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $servicePicPath = '/uploads/servicephotos/' . $fileName;
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
    $id       = $conn->real_escape_string($_POST["serviceId"] ?? '');
    $title    = $conn->real_escape_string($_POST["serviceTitle"] ?? '');
    $dept     = $conn->real_escape_string($_POST["serviceDepartment"] ?? '');
    $duration = $conn->real_escape_string($_POST["processDuration"] ?? '');
    $desc     = $conn->real_escape_string($_POST["serviceDescription"] ?? '');
    $reqs     = $conn->real_escape_string($_POST["serviceRequirements"] ?? '');
    $avail    = $conn->real_escape_string($_POST["serviceWhoCanAvail"] ?? '');

    if (!$id || !$title || !$dept || !$duration || !$desc || !$reqs || !$avail) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    // Use camelCase column names to match the DB structure
    $sql = "INSERT INTO manageServices (
                serviceId,
                serviceTitle,
                serviceDepartment,
                processDuration,
                serviceDescription,
                serviceRequirements,
                serviceWhoCanAvail,
                servicePicPath
            ) VALUES (
                '$id',
                '$title',
                '$dept',
                '$duration',
                '$desc',
                '$reqs',
                '$avail',
                '$servicePicPath'
            )";

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save service: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}



// === Fetch All Services ===
elseif ($action === "fetchdata") {
    $result = $conn->query("SELECT * FROM manageServices ORDER BY serviceId DESC");
    if ($result && $result->num_rows > 0) {
        $services = [];
        while ($row = $result->fetch_assoc()) {
            // Fix image path: convert relative paths to absolute paths
            $imagePath = $row["servicePicPath"];
            if ($imagePath && strpos($imagePath, './uploads/') === 0) {
                $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
                
                // Update the database with the corrected path
                $correctedPath = $conn->real_escape_string($imagePath);
                $serviceId = $conn->real_escape_string($row["serviceId"]);
                $updateSql = "UPDATE manageServices SET servicePicPath = '$correctedPath' WHERE serviceId = '$serviceId'";
                $conn->query($updateSql);
            }
            
            $services[] = [
                "serviceId"           => $row["serviceId"],
                "serviceTitle"        => $row["serviceTitle"],
                "serviceDepartment"   => $row["serviceDepartment"],
                "processDuration"     => $row["processDuration"],
                "serviceDescription"  => $row["serviceDescription"],
                "serviceRequirements" => $row["serviceRequirements"],
                "serviceWhoCanAvail"  => $row["serviceWhoCanAvail"],
                "servicePicPath"      => $imagePath
            ];
        }
        echo json_encode([
            'success' => true,
            'services' => $services
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No services found.'
        ]);
    }
    ob_end_flush();
    exit;
}

elseif ($action === "getServiceById") {
    $serviceId = $input["serviceId"] ?? '';

    if (!$serviceId) {
        echo json_encode(['success' => false, 'message' => 'Missing service ID']);
        ob_end_flush(); exit;
    }

    $stmt = $conn->prepare("SELECT * FROM manageServices WHERE serviceId = ?");
    $stmt->bind_param("s", $serviceId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $row = $result->fetch_assoc()) {
        // Fix image path: convert relative paths to absolute paths
        $imagePath = $row["servicePicPath"];
        if ($imagePath && strpos($imagePath, './uploads/') === 0) {
            $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
        }
        
        echo json_encode([
            'success' => true,
            'service' => [
                "serviceId"           => $row["serviceId"],
                "serviceTitle"        => $row["serviceTitle"],
                "serviceDepartment"   => $row["serviceDepartment"],
                "processDuration"     => $row["processDuration"],
                "serviceDescription"  => $row["serviceDescription"],
                "serviceRequirements" => $row["serviceRequirements"],
                "serviceWhoCanAvail"  => $row["serviceWhoCanAvail"],
                "servicePicPath"      => $imagePath
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Service not found']);
    }

    ob_end_flush(); exit;
}

// === Update Service ===
elseif ($action === "update") {
    // Debug logging
    error_log("Update service request received: " . json_encode($_POST));
    
    // Handle file upload first
    $servicePicPath = '';
    if (isset($_FILES['serviceImage']) && $_FILES['serviceImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['serviceImage'];
        
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
        $uploadDir = '../uploads/servicephotos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp (like visual photos)
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $servicePicPath = '/uploads/servicephotos/' . $fileName;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save uploaded file.'
            ]);
            ob_end_flush();
            exit;
        }
    }
    
    $id       = $conn->real_escape_string($_POST["serviceId"] ?? '');
    $title    = $conn->real_escape_string($_POST["serviceTitle"] ?? '');
    $dept     = $conn->real_escape_string($_POST["serviceDepartment"] ?? '');
    $duration = $conn->real_escape_string($_POST["processDuration"] ?? '');
    $desc     = $conn->real_escape_string($_POST["serviceDescription"] ?? '');
    $reqs     = $conn->real_escape_string($_POST["serviceRequirements"] ?? '');
    $avail    = $conn->real_escape_string($_POST["serviceWhoCanAvail"] ?? '');
    
    // Debug logging for extracted values
    error_log("Extracted values - ID: $id, Title: $title, Dept: $dept, Duration: $duration, Desc: $desc, Reqs: $reqs, Avail: $avail, PicPath: $servicePicPath");

    if (!$id || !$title || !$dept || !$duration || !$desc || !$reqs || !$avail) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    $sql = "UPDATE manageServices SET 
                serviceTitle = '$title', 
                serviceDepartment = '$dept', 
                processDuration = '$duration', 
                serviceDescription = '$desc', 
                serviceRequirements = '$reqs', 
                serviceWhoCanAvail = '$avail'";
    
    // Only update picture path if new file was uploaded
    if ($servicePicPath) {
        $sql .= ", servicePicPath = '$servicePicPath'";
    }
    
    $sql .= " WHERE serviceId = '$id'";

    // Debug logging for SQL query
    error_log("SQL Query: " . $sql);

    if ($conn->query($sql)) {
        error_log("Service update successful");
        
        // Verify the update by fetching the updated record
        $verifySql = "SELECT * FROM manageServices WHERE service_id = '$id'";
        $verifyResult = $conn->query($verifySql);
        if ($verifyResult && $row = $verifyResult->fetch_assoc()) {
            error_log("Verification - Updated record: " . json_encode($row));
        }
        
        echo json_encode(['success' => true]);
    } else {
        error_log("Service update failed: " . $conn->error);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update service: ' . $conn->error
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
