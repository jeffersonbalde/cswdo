<?php
// Suppress error output to prevent HTML from interfering with JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
require_once 'connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_POST['action'] ?? $input['action'] ?? '';

    switch ($action) {
        case 'getVisualData':
            handleGetVisualData($conn, $input);
            break;
        case 'updateVisualData':
            handleUpdateVisualData($conn, $_POST);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function handleGetVisualData($conn, $data) {
    $query = $data['query'] ?? '';
    
    try {
        // Create table if it doesn't exist (matching user's DB structure)
        $createTableSQL = "CREATE TABLE IF NOT EXISTS ordinances_pictures (
            ordinance_pic_id INT AUTO_INCREMENT PRIMARY KEY,
            ordinance_pic_path VARCHAR(255),
            ordinance_description VARCHAR(255),
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        
        $conn->query($createTableSQL);
        
        // Fetch the most recent data based on upload_date
        $stmt = $conn->prepare("SELECT ordinance_pic_path, ordinance_description, upload_date FROM ordinances_pictures ORDER BY upload_date DESC LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'visualPhoto' => $row['ordinance_pic_path'],
                    'visualContent' => $row['ordinance_description'],
                    'upload_date' => $row['upload_date']
                ]
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'data' => [
                    'visualPhoto' => null,
                    'visualContent' => '',
                    'upload_date' => null
                ]
            ]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleUpdateVisualData($conn, $data) {
    $visualContent = $data['visualContent'] ?? '';
    $hasNewPhoto = isset($_FILES['visualPhoto']) && $_FILES['visualPhoto']['error'] === UPLOAD_ERR_OK;
    
    try {
        // Create table if it doesn't exist (matching user's DB structure)
        $createTableSQL = "CREATE TABLE IF NOT EXISTS ordinances_pictures (
            ordinance_pic_id INT AUTO_INCREMENT PRIMARY KEY,
            ordinance_pic_path VARCHAR(255),
            ordinance_description VARCHAR(255),
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        
        $conn->query($createTableSQL);
        
        // Handle file upload if present
        $ordinancePicPath = null;
        if ($hasNewPhoto) {
            $uploadDir = '../uploads/visualphotos/ordinancevisualphotos/';
            
            // Create directory if it doesn't exist
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $file = $_FILES['visualPhoto'];
            $fileName = time() . '_' . basename($file['name']);
            $targetPath = $uploadDir . $fileName;
            
            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
                return;
            }
            
            // Validate file size (5MB max)
            if ($file['size'] > 5 * 1024 * 1024) {
                echo json_encode(['success' => false, 'message' => 'File size too large. Maximum 5MB allowed.']);
                return;
            }
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $ordinancePicPath = './uploads/visualphotos/ordinancevisualphotos/' . $fileName;
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to upload file.']);
                return;
            }
        }
        
        if ($hasNewPhoto) {
            // New picture uploaded - always insert a new record with current timestamp
            $currentTimestamp = date('Y-m-d H:i:s');
            $stmt = $conn->prepare("INSERT INTO ordinances_pictures (ordinance_pic_path, ordinance_description, upload_date) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $ordinancePicPath, $visualContent, $currentTimestamp);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Visual data saved successfully']);
        } else {
            // No new picture - update the most recent record
            $stmt = $conn->prepare("UPDATE ordinances_pictures SET ordinance_description = ? WHERE ordinance_pic_id = (SELECT ordinance_pic_id FROM (SELECT ordinance_pic_id FROM ordinances_pictures ORDER BY upload_date DESC LIMIT 1) AS temp)");
            $stmt->bind_param("s", $visualContent);
            $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Visual content updated successfully']);
            } else {
                // No existing record found, create a new one
                $currentTimestamp = date('Y-m-d H:i:s');
                $stmt = $conn->prepare("INSERT INTO ordinances_pictures (ordinance_description, upload_date) VALUES (?, ?)");
                $stmt->bind_param("ss", $visualContent, $currentTimestamp);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Visual content saved successfully']);
            }
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
