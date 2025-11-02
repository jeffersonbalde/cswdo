<?php
ob_start(); // ✅ Start buffering to prevent unwanted output
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once("connection.php");

// Handle both JSON and form data
$input = json_decode(file_get_contents("php://input"), true);
$action = $_POST['action'] ?? $input['action'] ?? null;

// === Get Next Ordinance ID ===
if ($action === "getNextID") {
    // First, check if the ordinances table exists, if not create it
    $createTableSQL = "CREATE TABLE IF NOT EXISTS manageordinances (
        ordinances_id INT AUTO_INCREMENT PRIMARY KEY,
        ordinances_no VARCHAR(255),
        ordinances_dateenacted DATETIME,
        ordinances_description VARCHAR(255),
        ordinances_pdfpath VARCHAR(255)
    )";
    
    $conn->query($createTableSQL);
    
    $result = $conn->query("SELECT MAX(ordinances_id) as max_id FROM manageordinances");

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && $row['max_id'] !== null ? (int) $row['max_id'] : 0;
        $nextIdNumber = $maxId + 1;

        echo json_encode([
            'success' => true,
            'ordinanceId' => $nextIdNumber
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch next ordinance ID: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Save Ordinance to DB ===
elseif ($action === "save") {
    $id = $conn->real_escape_string($_POST["ordinanceId"] ?? '');
    $dateEnacted = $conn->real_escape_string($_POST["dateEnacted"] ?? '');
    $ordinanceNo = $conn->real_escape_string($_POST["ordinanceNo"] ?? '');
    $description = $conn->real_escape_string($_POST["ordinanceDescription"] ?? '');

    if (!$id || !$dateEnacted || !$ordinanceNo || !$description) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    // Handle PDF file upload
    $pdfPath = null;
    if (isset($_FILES['ordinancePdf']) && $_FILES['ordinancePdf']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/ordinancepdfs/';
        
        // Create directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $file = $_FILES['ordinancePdf'];
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;
        
        // Validate file type
        $allowedTypes = ['application/pdf'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF files are allowed.']);
            ob_end_flush();
            exit;
        }
        
        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size too large. Maximum 10MB allowed.']);
            ob_end_flush();
            exit;
        }
        
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $pdfPath = './uploads/ordinancepdfs/' . $fileName;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload PDF file.']);
            ob_end_flush();
            exit;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'PDF file is required.']);
        ob_end_flush();
        exit;
    }

    // Insert into database
    $sql = "INSERT INTO manageordinances (
                ordinances_id, 
                ordinances_no, 
                ordinances_dateenacted, 
                ordinances_description, 
                ordinances_pdfpath
            ) VALUES (
                '$id', 
                '$ordinanceNo', 
                '$dateEnacted', 
                '$description', 
                '$pdfPath'
            )";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save ordinance: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Fetch all ordinances ===
elseif ($action === "fetchdata") {
    $result = $conn->query("SELECT * FROM manageordinances ORDER BY ordinances_id DESC");

    if ($result && $result->num_rows > 0) {
        $ordinances = [];

        while ($row = $result->fetch_assoc()) {
            // Format the date to display as "August 10, 2020" format
            $dateEnacted = $row["ordinances_dateenacted"];
            $formattedDate = '';
            if ($dateEnacted) {
                $dateObj = new DateTime($dateEnacted);
                $formattedDate = $dateObj->format('F j, Y'); // e.g., "August 10, 2020"
            }
            
            $ordinances[] = [
                "ordinanceId" => $row["ordinances_id"],
                "ordinanceNo" => $row["ordinances_no"],
                "dateEnacted" => $formattedDate,
                "description" => $row["ordinances_description"],
                "pdfPath" => $row["ordinances_pdfpath"]
            ];
        }

        echo json_encode([
            "success" => true,
            "ordinances" => $ordinances
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No ordinances found."
        ]);
    }

    ob_end_flush();
    exit;
}

// === Get Ordinance by ID ===
elseif ($action === "getOrdinanceById") {
    $ordinanceId = $conn->real_escape_string($input["ordinanceId"] ?? '');
    
    if (!$ordinanceId) {
        echo json_encode([
            'success' => false,
            'message' => 'Ordinance ID is required.'
        ]);
        ob_end_flush();
        exit;
    }
    
    $result = $conn->query("SELECT * FROM manageordinances WHERE ordinances_id = '$ordinanceId'");
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // Format the date to display as "August 10, 2020" format
        $dateEnacted = $row["ordinances_dateenacted"];
        $formattedDate = '';
        if ($dateEnacted) {
            $dateObj = new DateTime($dateEnacted);
            $formattedDate = $dateObj->format('Y-m-d'); // Format for date input
        }
        
        $ordinance = [
            "ordinanceId" => $row["ordinances_id"],
            "ordinanceNo" => $row["ordinances_no"],
            "dateEnacted" => $formattedDate,
            "description" => $row["ordinances_description"],
            "pdfPath" => $row["ordinances_pdfpath"]
        ];
        
        echo json_encode([
            'success' => true,
            'ordinance' => $ordinance
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Ordinance not found.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Update Ordinance ===
elseif ($action === "update") {
    $id = $conn->real_escape_string($_POST["ordinanceId"] ?? '');
    $dateEnacted = $conn->real_escape_string($_POST["dateEnacted"] ?? '');
    $ordinanceNo = $conn->real_escape_string($_POST["ordinanceNo"] ?? '');
    $description = $conn->real_escape_string($_POST["ordinanceDescription"] ?? '');

    if (!$id || !$dateEnacted || !$ordinanceNo || !$description) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        ob_end_flush();
        exit;
    }

    // Handle PDF file upload if provided
    $pdfPath = null;
    if (isset($_FILES['ordinancePdf']) && $_FILES['ordinancePdf']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/ordinancepdfs/';
        
        // Create directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $file = $_FILES['ordinancePdf'];
        $fileName = time() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;
        
        // Validate file type
        $allowedTypes = ['application/pdf'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF files are allowed.']);
            ob_end_flush();
            exit;
        }
        
        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size too large. Maximum 10MB allowed.']);
            ob_end_flush();
            exit;
        }
        
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $pdfPath = './uploads/ordinancepdfs/' . $fileName;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload PDF file.']);
            ob_end_flush();
            exit;
        }
    }

    // Update database
    if ($pdfPath) {
        // Update with new PDF
        $sql = "UPDATE manageordinances SET 
                ordinances_no = '$ordinanceNo', 
                ordinances_dateenacted = '$dateEnacted', 
                ordinances_description = '$description', 
                ordinances_pdfpath = '$pdfPath'
                WHERE ordinances_id = '$id'";
    } else {
        // Update without changing PDF
        $sql = "UPDATE manageordinances SET 
                ordinances_no = '$ordinanceNo', 
                ordinances_dateenacted = '$dateEnacted', 
                ordinances_description = '$description'
                WHERE ordinances_id = '$id'";
    }

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'pdfPath' => $pdfPath
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update ordinance: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Invalid Action Fallback ===
else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid action'
    ]);
    ob_end_flush();
    exit;
}

$conn->close();
?>
