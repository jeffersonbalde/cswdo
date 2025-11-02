<?php
ob_start(); // ✅ Start buffering to prevent unwanted output
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once("connection.php");

// Handle both JSON and form data
$input = json_decode(file_get_contents("php://input"), true);
$action = $_POST['action'] ?? $input['action'] ?? null;

// === Get Next Report ID ===
if ($action === "getNextID") {
    // First, check if the accomplishment_reports table exists, if not create it
    $createTableSQL = "CREATE TABLE IF NOT EXISTS accomplishment_reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        head_id INT,
        date_submitted DATETIME,
        department VARCHAR(255),
        title VARCHAR(255),
        content VARCHAR(255),
        file_path VARCHAR(255),
        status VARCHAR(255) DEFAULT 'Pending',
        admin_id VARCHAR(255),
        date_reviewed DATETIME,
        admin_comments VARCHAR(255)
    )";
    
    $conn->query($createTableSQL);
    
    $result = $conn->query("SELECT MAX(report_id) as max_id FROM accomplishment_reports");

    if ($result) {
        $row = $result->fetch_assoc();
        $maxId = $row && $row['max_id'] !== null ? (int) $row['max_id'] : 0;
        $nextIdNumber = $maxId + 1;

        echo json_encode([
            'success' => true,
            'reportId' => $nextIdNumber
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch next report ID: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Save Accomplishment Report to DB ===
elseif ($action === "save") {
    // Ensure table exists
    $createTableSQL = "CREATE TABLE IF NOT EXISTS accomplishment_reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        head_id INT,
        date_submitted DATETIME,
        department VARCHAR(255),
        title VARCHAR(255),
        content VARCHAR(255),
        file_path VARCHAR(255),
        status VARCHAR(255) DEFAULT 'Pending',
        admin_id VARCHAR(255),
        date_reviewed DATETIME,
        admin_comments VARCHAR(255)
    )";
    $conn->query($createTableSQL);
    
    $reportId = $conn->real_escape_string($_POST["reportId"] ?? '');
    $dateSubmitted = $_POST["dateSubmission"] ?? '';
    $headId = $conn->real_escape_string($_POST["userId"] ?? '');
    $department = $conn->real_escape_string($_POST["department"] ?? '');
    $title = $conn->real_escape_string($_POST["title"] ?? '');
    $content = $conn->real_escape_string($_POST["content"] ?? '');
    
    // Convert date to DATETIME format if needed
    if ($dateSubmitted) {
        // Try to parse the date string - handle various formats
        $dateTime = strtotime($dateSubmitted);
        if ($dateTime !== false) {
            // Convert to MySQL DATETIME format (Y-m-d H:i:s)
            $dateSubmitted = date('Y-m-d H:i:s', $dateTime);
        } else {
            // If parsing fails, try to validate if it's already in correct format
            if (!preg_match('/^\d{4}-\d{2}-\d{2}[\s]\d{2}:\d{2}:\d{2}$/', $dateSubmitted)) {
                // If not in correct format, use current date/time
                $dateSubmitted = date('Y-m-d H:i:s');
            }
        }
    } else {
        // If no date provided, use current date/time
        $dateSubmitted = date('Y-m-d H:i:s');
    }
    
    $dateSubmitted = $conn->real_escape_string($dateSubmitted);
    
    // For new reports, set status to 'Pending' and report_id to 1 initially if not provided
    if (empty($reportId) || $reportId === '1') {
        // Get next available ID
        $idResult = $conn->query("SELECT MAX(report_id) as max_id FROM accomplishment_reports");
        if ($idResult) {
            $idRow = $idResult->fetch_assoc();
            $maxId = $idRow && $idRow['max_id'] !== null ? (int) $idRow['max_id'] : 0;
            $reportId = $maxId + 1;
        } else {
            $reportId = 1;
        }
    }
    
    $status = 'Pending'; // Always set status to Pending for new submissions

    if (!$dateSubmitted || !$headId || !$department || !$title || !$content) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields. Date: ' . ($dateSubmitted ? 'OK' : 'MISSING') . ', HeadId: ' . ($headId ? 'OK' : 'MISSING') . ', Department: ' . ($department ? 'OK' : 'MISSING') . ', Title: ' . ($title ? 'OK' : 'MISSING') . ', Content: ' . ($content ? 'OK' : 'MISSING')
        ]);
        ob_end_flush();
        exit;
    }

    // Handle PDF file upload
    $pdfPath = null;
    if (!isset($_FILES['reportFile'])) {
        echo json_encode(['success' => false, 'message' => 'PDF file is required. No file was uploaded.']);
        ob_end_flush();
        exit;
    }
    
    $file = $_FILES['reportFile'];
    
    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive.',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive.',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension.'
        ];
        $errorMsg = $errorMessages[$file['error']] ?? 'Unknown upload error (Error code: ' . $file['error'] . ')';
        echo json_encode(['success' => false, 'message' => 'File upload error: ' . $errorMsg]);
        ob_end_flush();
        exit;
    }
    
    $uploadDir = '../uploads/AccomplishmentReports/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            echo json_encode(['success' => false, 'message' => 'Failed to create upload directory.']);
            ob_end_flush();
            exit;
        }
    }
    
    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;
    
    // Validate file type - check both MIME type and file extension
    $allowedTypes = ['application/pdf'];
    $allowedExtensions = ['pdf'];
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($file['type'], $allowedTypes) && !in_array($fileExtension, $allowedExtensions)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF files are allowed. Received type: ' . $file['type']]);
        ob_end_flush();
        exit;
    }
    
    // Validate file size (10MB max)
    if ($file['size'] > 10 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'File size too large. Maximum 10MB allowed. File size: ' . round($file['size'] / 1024 / 1024, 2) . 'MB']);
        ob_end_flush();
        exit;
    }
    
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $pdfPath = './uploads/AccomplishmentReports/' . $fileName;
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file to destination directory. Check permissions.']);
        ob_end_flush();
        exit;
    }

    // Insert into database
    $sql = "INSERT INTO accomplishment_reports (
                report_id,
                head_id,
                date_submitted,
                department,
                title,
                content,
                file_path,
                status
            ) VALUES (
                '$reportId',
                '$headId',
                '$dateSubmitted',
                '$department',
                '$title',
                '$content',
                '$pdfPath',
                '$status'
            )";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Report submitted successfully!',
            'reportId' => $reportId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save report: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Fetch all reports ===
elseif ($action === "fetchdata") {
    // Ensure table exists
    $createTableSQL = "CREATE TABLE IF NOT EXISTS accomplishment_reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        head_id INT,
        date_submitted DATETIME,
        department VARCHAR(255),
        title VARCHAR(255),
        content VARCHAR(255),
        file_path VARCHAR(255),
        status VARCHAR(255) DEFAULT 'Pending',
        admin_id VARCHAR(255),
        date_reviewed DATETIME,
        admin_comments VARCHAR(255)
    )";
    $conn->query($createTableSQL);
    
    $result = $conn->query("SELECT * FROM accomplishment_reports ORDER BY report_id DESC");

    if ($result && $result->num_rows > 0) {
        $reports = [];
        
        // Get counts for status cards
        $pendingResult = $conn->query("SELECT COUNT(*) as count FROM accomplishment_reports WHERE status = 'Pending'");
        $approvedResult = $conn->query("SELECT COUNT(*) as count FROM accomplishment_reports WHERE status = 'Approved'");
        $declinedResult = $conn->query("SELECT COUNT(*) as count FROM accomplishment_reports WHERE status = 'Declined'");
        $totalResult = $conn->query("SELECT COUNT(*) as count FROM accomplishment_reports");
        
        $pendingCount = 0;
        $approvedCount = 0;
        $declinedCount = 0;
        $totalCount = 0;
        
        if ($pendingResult) {
            $pendingRow = $pendingResult->fetch_assoc();
            $pendingCount = (int)$pendingRow['count'];
        }
        if ($approvedResult) {
            $approvedRow = $approvedResult->fetch_assoc();
            $approvedCount = (int)$approvedRow['count'];
        }
        if ($declinedResult) {
            $declinedRow = $declinedResult->fetch_assoc();
            $declinedCount = (int)$declinedRow['count'];
        }
        if ($totalResult) {
            $totalRow = $totalResult->fetch_assoc();
            $totalCount = (int)$totalRow['count'];
        }

        while ($row = $result->fetch_assoc()) {
            // Format the dates
            $dateSubmitted = $row["date_submitted"];
            $formattedDateSubmitted = '';
            if ($dateSubmitted) {
                $dateObj = new DateTime($dateSubmitted);
                $formattedDateSubmitted = $dateObj->format('F j, Y'); // e.g., "November 2, 2025"
            }
            
            $dateReviewed = $row["date_reviewed"];
            $formattedDateReviewed = '';
            if ($dateReviewed) {
                $dateObj = new DateTime($dateReviewed);
                $formattedDateReviewed = $dateObj->format('F j, Y');
            }
            
            $reports[] = [
                "id" => $row["report_id"],
                "reportId" => $row["report_id"],
                "headId" => $row["head_id"],
                "dateSubmitted" => $formattedDateSubmitted,
                "dateApproved" => $formattedDateReviewed,
                "uploadDate" => $formattedDateSubmitted,
                "department" => $row["department"],
                "title" => $row["title"],
                "contentTitle" => $row["title"],
                "content" => $row["content"],
                "filePath" => $row["file_path"],
                "status" => $row["status"] ?? 'Pending',
                "adminId" => $row["admin_id"],
                "adminComments" => $row["admin_comments"]
            ];
        }

        echo json_encode([
            "success" => true,
            "data" => $reports,
            "counts" => [
                "pending" => $pendingCount,
                "approved" => $approvedCount,
                "declined" => $declinedCount,
                "total" => $totalCount
            ]
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "data" => [],
            "counts" => [
                "pending" => 0,
                "approved" => 0,
                "declined" => 0,
                "total" => 0
            ]
        ]);
    }

    ob_end_flush();
    exit;
}

// === Get Report by ID ===
elseif ($action === "getReportById") {
    $reportId = $conn->real_escape_string($input["reportId"] ?? $_POST["reportId"] ?? '');
    
    if (!$reportId) {
        echo json_encode([
            'success' => false,
            'message' => 'Report ID is required.'
        ]);
        ob_end_flush();
        exit;
    }
    
    $result = $conn->query("SELECT * FROM accomplishment_reports WHERE report_id = '$reportId'");
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // Format dates - return full DATETIME for JavaScript to parse
        $dateSubmitted = $row["date_submitted"];
        $formattedDateSubmitted = '';
        if ($dateSubmitted && $dateSubmitted !== null && trim($dateSubmitted) !== '') {
            try {
                $dateObj = new DateTime($dateSubmitted);
                // Return in Y-m-d format (JavaScript will format it for display)
                $formattedDateSubmitted = $dateObj->format('Y-m-d');
            } catch (Exception $e) {
                // If date parsing fails, return empty string
                $formattedDateSubmitted = '';
            }
        }
        
        $dateReviewed = $row["date_reviewed"];
        $formattedDateReviewed = '';
        if ($dateReviewed && $dateReviewed !== null && trim($dateReviewed) !== '') {
            try {
                $dateObj = new DateTime($dateReviewed);
                // Return in Y-m-d format (JavaScript will format it for display)
                $formattedDateReviewed = $dateObj->format('Y-m-d');
            } catch (Exception $e) {
                // If date parsing fails, return empty string
                $formattedDateReviewed = '';
            }
        }
        
        $report = [
            "reportId" => $row["report_id"],
            "headId" => $row["head_id"],
            "dateSubmitted" => $formattedDateSubmitted,
            "dateReviewed" => $formattedDateReviewed,
            "dateApproved" => $formattedDateReviewed, // Alias for consistency with frontend
            "department" => $row["department"],
            "title" => $row["title"],
            "content" => $row["content"],
            "filePath" => $row["file_path"],
            "status" => $row["status"] ?? 'Pending',
            "adminId" => $row["admin_id"],
            "adminComments" => $row["admin_comments"]
        ];
        
        echo json_encode([
            'success' => true,
            'report' => $report
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Report not found.'
        ]);
    }
    
    ob_end_flush();
    exit;
}

// === Update Report (for approval) ===
elseif ($action === "update" || $action === "approve") {
    $reportId = $conn->real_escape_string($_POST["reportId"] ?? $input["reportId"] ?? '');
    $adminId = $conn->real_escape_string($_POST["adminId"] ?? $input["adminId"] ?? '');
    $dateReviewed = $conn->real_escape_string($_POST["dateReviewed"] ?? $input["dateReviewed"] ?? '');
    $adminComments = $conn->real_escape_string($_POST["adminComments"] ?? $input["adminComments"] ?? '');
    $status = $conn->real_escape_string($_POST["status"] ?? $input["status"] ?? '');

    if (!$reportId) {
        echo json_encode([
            'success' => false,
            'message' => 'Report ID is required.'
        ]);
        ob_end_flush();
        exit;
    }

    // Build update query dynamically
    $updateFields = [];
    
    if ($adminId) {
        $updateFields[] = "admin_id = '$adminId'";
    }
    
    if ($dateReviewed) {
        $updateFields[] = "date_reviewed = '$dateReviewed'";
    }
    
    if ($adminComments !== '') {
        $updateFields[] = "admin_comments = '$adminComments'";
    }
    
    if ($status) {
        $updateFields[] = "status = '$status'";
    }
    
    if (empty($updateFields)) {
        echo json_encode([
            'success' => false,
            'message' => 'No fields to update.'
        ]);
        ob_end_flush();
        exit;
    }

    // Update database
    $sql = "UPDATE accomplishment_reports SET " . implode(', ', $updateFields) . " WHERE report_id = '$reportId'";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Report updated successfully!'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update report: ' . $conn->error
        ]);
    }

    ob_end_flush();
    exit;
}

// === Delete Report ===
elseif ($action === "delete") {
    $reportId = $conn->real_escape_string($_POST["reportId"] ?? $input["reportId"] ?? '');
    
    if (!$reportId) {
        echo json_encode([
            'success' => false,
            'message' => 'Report ID is required.'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Get file path before deleting to remove file
    $result = $conn->query("SELECT file_path FROM accomplishment_reports WHERE report_id = '$reportId'");
    $filePath = null;
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $filePath = $row['file_path'];
    }
    
    // Delete from database
    $sql = "DELETE FROM accomplishment_reports WHERE report_id = '$reportId'";
    
    if ($conn->query($sql) === TRUE) {
        // Delete file if exists
        if ($filePath && file_exists('../' . $filePath)) {
            @unlink('../' . $filePath);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Report deleted successfully!'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete report: ' . $conn->error
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

