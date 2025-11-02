<?php
ob_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once("connection.php");

if (!$conn) {
    error_log("Database connection failed in manageFamComOfficials.php");
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    ob_end_flush();
    exit;
}

// Ensure table exists
$tableCheck = $conn->query("SHOW TABLES LIKE 'managefamcomofficials'");
if ($tableCheck->num_rows === 0) {
    error_log("Table 'managefamcomofficials' does not exist in database");
    echo json_encode([
        'success' => false,
        'message' => 'Database table not found. Please contact administrator.',
        'error_details' => 'Table managefamcomofficials does not exist'
    ]);
    ob_end_flush();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if ($input) {
    $_POST = array_merge($_POST, $input);
}

error_log("manageFamComOfficials.php called with POST data: " . json_encode($_POST));
error_log("manageFamComOfficials.php called with FILES data: " . json_encode($_FILES));

$action = $_POST["action"] ?? null;

// Get Next Employee ID
if ($action === "getNextEmployeeId") {
    try {
        $result = $conn->query("SELECT MAX(official_employee_id) as max_id FROM managefamcomofficials");
        if ($result) {
            $row = $result->fetch_assoc();
            $maxId = $row && $row['max_id'] !== null ? (int)$row['max_id'] : 0;
            $nextId = $maxId + 1;
            echo json_encode(['success' => true, 'employeeId' => $nextId]);
        } else {
            echo json_encode(['success' => true, 'employeeId' => 1]);
        }
    } catch (Exception $e) {
        error_log("Error getting next employee ID (FC): " . $e->getMessage());
        echo json_encode(['success' => true, 'employeeId' => 1]);
    }
    ob_end_flush();
    exit;
}

// Fetch All Officials
elseif ($action === "fetchdata") {
    try {
        $dept = $conn->real_escape_string($_POST["dept"] ?? '');
        $sql = $dept
            ? "SELECT * FROM managefamcomofficials WHERE official_dept = '$dept' ORDER BY official_employee_id DESC"
            : "SELECT * FROM managefamcomofficials ORDER BY official_employee_id DESC";
        $result = $conn->query($sql);
        if ($result) {
            $officials = [];
            while ($row = $result->fetch_assoc()) {
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
            echo json_encode(['success' => true, 'data' => $officials]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to fetch officials: ' . $conn->error]);
        }
    } catch (Exception $e) {
        error_log("Error fetching FC officials: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred while fetching officials.']);
    }
    ob_end_flush();
    exit;
}

// Get Official By ID
elseif ($action === "getOfficialById") {
    $id = $conn->real_escape_string($_POST["official_id"] ?? '');
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Official ID is required.']);
        ob_end_flush();
        exit;
    }
    try {
        $sql = "SELECT * FROM managefamcomofficials WHERE official_employee_id = '$id'";
        $result = $conn->query($sql);
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
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
            echo json_encode(['success' => true, 'data' => $official]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Official not found.']);
        }
    } catch (Exception $e) {
        error_log("Error getting FC official by ID: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred while getting official.']);
    }
    ob_end_flush();
    exit;
}

// Delete Official
elseif ($action === "delete") {
    $id = $conn->real_escape_string($_POST["official_id"] ?? '');
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Official ID is required.']);
        ob_end_flush();
        exit;
    }
    try {
        $sql = "DELETE FROM managefamcomofficials WHERE official_employee_id = '$id'";
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Official deleted successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete official: ' . $conn->error]);
        }
    } catch (Exception $e) {
        error_log("Error deleting FC official: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred while deleting official.']);
    }
    ob_end_flush();
    exit;
}

// Save Official
elseif ($action === "save") {
    $picturePath = '';
    if (isset($_FILES['officialImage']) && $_FILES['officialImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['officialImage'];
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
            ob_end_flush();
            exit;
        }
        if ($file['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size too large. Maximum size is 5MB.']);
            ob_end_flush();
            exit;
        }
        $uploadDir = '../uploads/FamilyCommunityOfficialsPictures/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $picturePath = '/uploads/FamilyCommunityOfficialsPictures/' . $fileName;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
            ob_end_flush();
            exit;
        }
    }

    $employeeId = $conn->real_escape_string($_POST["employeeId"] ?? '');
    $name = $conn->real_escape_string($_POST["name"] ?? '');
    $position = $conn->real_escape_string($_POST["position"] ?? '');
    $dept = $conn->real_escape_string($_POST["dept"] ?? 'fc');

    if (!$name || !$position) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields. Name and Position are required.']);
        ob_end_flush();
        exit;
    }

    try {
        if (!$employeeId) {
            $result = $conn->query("SELECT MAX(official_employee_id) as max_id FROM managefamcomofficials");
            if ($result) {
                $row = $result->fetch_assoc();
                $maxId = $row && $row['max_id'] !== null ? (int)$row['max_id'] : 0;
                $employeeId = $maxId + 1;
            } else {
                $employeeId = 1;
            }
        }

        $sql = "INSERT INTO managefamcomofficials (
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
                    '$dept'
                )";

        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Official added successfully!', 'employeeId' => $employeeId]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save official: ' . $conn->error]);
        }
    } catch (Exception $e) {
        error_log("Error saving FC official: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred while saving official.']);
    }
    ob_end_flush();
    exit;
}

// Update Official
elseif ($action === "update") {
    $id = $conn->real_escape_string($_POST["official_id"] ?? '');
    $employeeId = $conn->real_escape_string($_POST["employeeId"] ?? '');
    $name = $conn->real_escape_string($_POST["name"] ?? '');
    $position = $conn->real_escape_string($_POST["position"] ?? '');
    $existingPath = $conn->real_escape_string($_POST["picture"] ?? '');
    $dept = $conn->real_escape_string($_POST["dept"] ?? 'fc');

    if (!$id || !$name || !$position) {
        echo json_encode(['success' => false, 'message' => 'All required fields must be provided.']);
        ob_end_flush();
        exit;
    }

    try {
        // Default to existing picture path
        $picturePath = $existingPath;

        // If a new file uploaded, validate and move it
        if (isset($_FILES['officialImage']) && $_FILES['officialImage']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['officialImage'];
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
                ob_end_flush();
                exit;
            }
            if ($file['size'] > 5 * 1024 * 1024) {
                echo json_encode(['success' => false, 'message' => 'File size too large. Maximum size is 5MB.']);
                ob_end_flush();
                exit;
            }
            $uploadDir = '../uploads/FamilyCommunityOfficialsPictures/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $fileName = time() . '_' . basename($file['name']);
            $targetPath = $uploadDir . $fileName;
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $picturePath = '/uploads/FamilyCommunityOfficialsPictures/' . $fileName;
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
                ob_end_flush();
                exit;
            }
        }

        $sql = "UPDATE managefamcomofficials SET 
                    official_name = '$name',
                    official_position = '$position',
                    official_picture_path = '$picturePath',
                    official_dept = '$dept'
                WHERE official_employee_id = '$id'";
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Official updated successfully!', 'picturePath' => $picturePath]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update official: ' . $conn->error]);
        }
    } catch (Exception $e) {
        error_log("Error updating FC official: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred while updating official.']);
    }
    ob_end_flush();
    exit;
}

// Invalid Action
else {
    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
    ob_end_flush();
}

ob_end_flush();
?>


