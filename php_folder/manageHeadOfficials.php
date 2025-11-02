<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Check database connection
if (!$conn) {
    error_log("Database connection failed in manageheadofficials.php");
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    ob_end_flush();
    exit;
}

// Check if the manageheadofficials table exists
$tableCheck = $conn->query("SHOW TABLES LIKE 'manageheadofficials'");
if ($tableCheck->num_rows === 0) {
    error_log("Table 'manageheadofficials' does not exist in database");
    echo json_encode([
        'success' => false,
        'message' => 'Database table not found. Please contact administrator.',
        'error_details' => 'Table manageheadofficials does not exist'
    ]);
    ob_end_flush();
    exit;
}

// Handle JSON input
$input = json_decode(file_get_contents('php://input'), true);
if ($input) {
    $_POST = array_merge($_POST, $input);
}

// Debug logging
error_log("manageheadofficials.php called with POST data: " . json_encode($_POST));
error_log("manageheadofficials.php called with FILES data: " . json_encode($_FILES));

// Get action from POST data
$action = $_POST["action"] ?? null;

// === Get Next Employee ID ===
if ($action === "getNextEmployeeId") {
    try {
        $result = $conn->query("SELECT MAX(official_employee_id) as max_id FROM manageheadofficials");
        
        if ($result) {
            $row = $result->fetch_assoc();
            $maxId = $row && $row['max_id'] !== null ? (int)$row['max_id'] : 0;
            $nextId = $maxId + 1;
            
            echo json_encode([
                'success' => true,
                'employeeId' => $nextId
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'employeeId' => 1
            ]);
        }
    } catch (Exception $e) {
        error_log("Error getting next employee ID: " . $e->getMessage());
        echo json_encode([
            'success' => true,
            'employeeId' => 1
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Fetch All Officials ===
elseif ($action === "fetchdata") {
    try {
        // Always restrict to Head Officials only
        $fixedDept = 'Head Official';
        $sql = "SELECT * FROM manageheadofficials WHERE official_dept = '$fixedDept' ORDER BY official_employee_id DESC";
        
        $result = $conn->query($sql);
        
        if ($result) {
            $officials = [];
            while ($row = $result->fetch_assoc()) {
                // Map database fields to frontend expected field names
                // Fix image path: convert relative paths to absolute paths
                $imagePath = $row["official_picture_path"];
                if ($imagePath && strpos($imagePath, './uploads/') === 0) {
                    $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
                }
                
                $officials[] = [
                    'id' => $row['official_employee_id'],
                    'employeeId' => $row['official_employee_id'],
                    'name' => $row['official_name'],
                    'position' => $row['official_position'],
                    'picture' => $imagePath,
                    'dept' => $row['official_dept']
                ];
            }
            echo json_encode([
                'success' => true,
                'data' => $officials
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch officials: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error fetching officials: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while fetching officials.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Get Official By ID ===
elseif ($action === "getOfficialById") {
    $id = $conn->real_escape_string($_POST["official_id"] ?? '');
    
    if (!$id) {
        echo json_encode([
            'success' => false,
            'message' => 'Official ID is required.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        $sql = "SELECT * FROM manageheadofficials WHERE official_employee_id = '$id'";
        $result = $conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            // Map database fields to frontend expected field names
            $imagePath = $row["official_picture_path"];
            if ($imagePath && strpos($imagePath, './uploads/') === 0) {
                $imagePath = str_replace('./uploads/', '/uploads/', $imagePath);
            }
            
            $official = [
                'id' => $row['official_employee_id'],
                'employeeId' => $row['official_employee_id'],
                'name' => $row['official_name'],
                'position' => $row['official_position'],
                'picture' => $imagePath,
                'dept' => $row['official_dept']
            ];
            echo json_encode([
                'success' => true,
                'data' => $official
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Official not found.'
            ]);
        }
    } catch (Exception $e) {
        error_log("Error getting official by ID: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while getting official.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Delete Official ===
elseif ($action === "delete") {
    $id = $conn->real_escape_string($_POST["official_id"] ?? '');
    
    if (!$id) {
        echo json_encode([
            'success' => false,
            'message' => 'Official ID is required.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        $sql = "DELETE FROM manageheadofficials WHERE official_employee_id = '$id'";
        
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Official deleted successfully!'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete official: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error deleting official: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while deleting official.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Save Official (for future modal implementation) ===
elseif ($action === "save") {
    // Handle file upload first
    $picturePath = '';
    if (isset($_FILES['officialImage']) && $_FILES['officialImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['officialImage'];
        
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
        $uploadDir = '../uploads/HeadOfficialsPictures/';  // Using servicephotos folder
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Create filename with timestamp
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $picturePath = '/uploads/HeadOfficialsPictures/' . $fileName;
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
    $employeeId    = $conn->real_escape_string($_POST["employeeId"] ?? '');
    $name          = $conn->real_escape_string($_POST["name"] ?? '');
    $position      = $conn->real_escape_string($_POST["position"] ?? '');
    // Enforce department as Head Official
    $dept          = 'Head Official';

    // Basic validation
    if (!$name || !$position) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields. Name and Position are required.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        // Check if employee ID is provided, otherwise generate one
        if (!$employeeId) {
            $result = $conn->query("SELECT MAX(official_employee_id) as max_id FROM manageheadofficials");
            if ($result) {
                $row = $result->fetch_assoc();
                $maxId = $row && $row['max_id'] !== null ? (int)$row['max_id'] : 0;
                $employeeId = $maxId + 1;
            } else {
                $employeeId = 1;
            }
        }

        $sql = "INSERT INTO manageheadofficials (
                    official_employee_id,
                    official_name,
                    official_position,
                    official_picture_path,
                    official_dept
                ) VALUES (
                    '$employeeId',
                    '$name',
                    '$position',
                    '$picturePath',
                    'Head Official'
                )";

        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Official added successfully!',
                'employeeId' => $employeeId
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save official: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error saving official: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while saving official.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Update Official (for future modal implementation) ===
elseif ($action === "update") {
    $id           = $conn->real_escape_string($_POST["official_id"] ?? '');
    $employeeId   = $conn->real_escape_string($_POST["employeeId"] ?? '');
    $name         = $conn->real_escape_string($_POST["name"] ?? '');
    $position     = $conn->real_escape_string($_POST["position"] ?? '');
    // Existing picture path sent from frontend (fallback when no new file)
    $existingPath = $conn->real_escape_string($_POST["picture"] ?? '');
    // Enforce department as Head Official on update as well
    $dept         = 'Head Official';

    if (!$id || !$name || !$position) {
        echo json_encode([
            'success' => false,
            'message' => 'All required fields must be provided.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        // Determine final picture path
        $picturePath = $existingPath;

        // If a new image is uploaded, validate and move it (mirror save logic)
        if (isset($_FILES['officialImage']) && $_FILES['officialImage']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['officialImage'];

            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowedTypes)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.'
                ]);
                ob_end_flush();
                exit;
            }

            if ($file['size'] > 5 * 1024 * 1024) {
                echo json_encode([
                    'success' => false,
                    'message' => 'File size too large. Maximum size is 5MB.'
                ]);
                ob_end_flush();
                exit;
            }

            $uploadDir = '../uploads/HeadOfficialsPictures/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = time() . '_' . basename($file['name']);
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $picturePath = '/uploads/HeadOfficialsPictures/' . $fileName;
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to save uploaded file.'
                ]);
                ob_end_flush();
                exit;
            }
        }

        $sql = "UPDATE manageheadofficials SET 
                    official_name = '$name',
                    official_position = '$position',
                    official_picture_path = '$picturePath',
                    official_dept = 'Head Official'
                WHERE official_employee_id = '$id'";

        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Official updated successfully!',
                'picturePath' => $picturePath
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update official: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error updating official: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while updating official.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Invalid Action ===
else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid action specified.'
    ]);
    ob_end_flush();
}

ob_end_flush();
?>
