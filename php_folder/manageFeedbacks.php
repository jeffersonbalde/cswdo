<?php
ob_start(); // Buffer output
header('Content-Type: application/json');
ini_set('display_errors', 0); // Hide errors from users
error_reporting(E_ALL);       // Log all errors

require_once("connection.php");

// Check database connection
if (!$conn) {
    error_log("Database connection failed in manageFeedbacks.php");
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    ob_end_flush();
    exit;
}

// Check if the managefeedback table exists
$tableCheck = $conn->query("SHOW TABLES LIKE 'managefeedback'");
if ($tableCheck->num_rows === 0) {
    error_log("Table 'managefeedback' does not exist in database");
    echo json_encode([
        'success' => false,
        'message' => 'Database table not found. Please contact administrator.',
        'error_details' => 'Table managefeedback does not exist'
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
error_log("manageFeedbacks.php called with POST data: " . json_encode($_POST));

// Get action from POST data
$action = $_POST["action"] ?? null;

// === Save Feedback ===
if ($action === "save") {
    // Get form data
    $baranggay    = $conn->real_escape_string($_POST["barangay"] ?? '');
    $satisfaction = $conn->real_escape_string($_POST["satisfaction"] ?? '');
    $visit        = $conn->real_escape_string($_POST["visit"] ?? ''); // Purpose of visit
    $looking      = $conn->real_escape_string($_POST["found_info"] ?? ''); // Whether they found what they were looking for
    $recommend    = $conn->real_escape_string($_POST["recommendations"] ?? '');

    // Debug logging for received data
    error_log("Received feedback data - Barangay: '$baranggay', Satisfaction: '$satisfaction', Visit: '$visit', Looking: '$looking', Recommend: '$recommend'");
    
    // Additional debug logging for each field
    error_log("Raw POST data for barangay: " . ($_POST["barangay"] ?? 'NULL'));
    error_log("Raw POST data for satisfaction: " . ($_POST["satisfaction"] ?? 'NULL'));
    error_log("Raw POST data for visit: " . ($_POST["visit"] ?? 'NULL'));
    error_log("Raw POST data for found_info: " . ($_POST["found_info"] ?? 'NULL'));
    error_log("Raw POST data for recommendations: " . ($_POST["recommendations"] ?? 'NULL'));

    // Basic validation
    if (!$baranggay || !$satisfaction || !$visit || !$looking || !$recommend) {
        ob_clean(); // Clear any output before sending JSON
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields. Please fill in all fields.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        $sql = "INSERT INTO managefeedback (
                    feedback_baranggay, 
                    feedback_satisfaction, 
                    feedback_visit, 
                    feedback_looking, 
                    feedback_recommend,
                    feedback_date
                ) VALUES (
                    '$baranggay', 
                    '$satisfaction', 
                    '$visit', 
                    '$looking', 
                    '$recommend',
                    CURDATE()
                )";

        if ($conn->query($sql)) {
            // Clear any output buffer before sending JSON
            ob_clean();
            echo json_encode([
                'success' => true,
                'message' => 'Feedback submitted successfully!'
            ]);
        } else {
            // Clear any output buffer before sending JSON
            ob_clean();
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save feedback: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error saving feedback: " . $e->getMessage());
        // Clear any output buffer before sending JSON
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while saving feedback.'
        ]);
    }
    
    // Ensure output buffer is flushed
    ob_end_flush();
    exit;
}

// === Fetch All Feedbacks ===
elseif ($action === "fetchdata") {
    try {
        $sql = "SELECT * FROM managefeedback ORDER BY feedback_id DESC";
        $result = $conn->query($sql);
        
        if ($result) {
            $feedbacks = [];
            while ($row = $result->fetch_assoc()) {
                $feedbacks[] = $row;
            }
            echo json_encode([
                'success' => true,
                'data' => $feedbacks
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch feedbacks: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error fetching feedbacks: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while fetching feedbacks.'
        ]);
    }
}

// === Get Feedback By ID ===
elseif ($action === "getFeedbackById") {
    $id = $conn->real_escape_string($_POST["feedback_id"] ?? '');
    
    if (!$id) {
        echo json_encode([
            'success' => false,
            'message' => 'Feedback ID is required.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        $sql = "SELECT * FROM managefeedback WHERE feedback_id = '$id'";
        $result = $conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            $feedback = $result->fetch_assoc();
            echo json_encode([
                'success' => true,
                'data' => $feedback
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Feedback not found.'
            ]);
        }
    } catch (Exception $e) {
        error_log("Error getting feedback by ID: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while getting feedback.'
        ]);
    }
}

// === Update Feedback ===
elseif ($action === "update") {
    $id           = $conn->real_escape_string($_POST["feedback_id"] ?? '');
    $baranggay    = $conn->real_escape_string($_POST["barangay"] ?? '');
    $satisfaction = $conn->real_escape_string($_POST["satisfaction"] ?? '');
    $visit        = $conn->real_escape_string($_POST["visit"] ?? '');
    $looking      = $conn->real_escape_string($_POST["found_info"] ?? '');
    $recommend    = $conn->real_escape_string($_POST["recommendations"] ?? '');

    if (!$id || !$baranggay || !$satisfaction || !$visit || !$looking || !$recommend) {
        echo json_encode([
            'success' => false,
            'message' => 'All fields are required.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        $sql = "UPDATE managefeedback SET 
                    feedback_baranggay = '$baranggay',
                    feedback_satisfaction = '$satisfaction',
                    feedback_visit = '$visit',
                    feedback_looking = '$looking',
                    feedback_recommend = '$recommend',
                    feedback_date = CURDATE()
                WHERE feedback_id = '$id'";

        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Feedback updated successfully!'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update feedback: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error updating feedback: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while updating feedback.'
        ]);
    }
}

// === Delete Feedback ===
elseif ($action === "delete") {
    $id = $conn->real_escape_string($_POST["feedback_id"] ?? '');
    
    if (!$id) {
        echo json_encode([
            'success' => false,
            'message' => 'Feedback ID is required.'
        ]);
        ob_end_flush();
        exit;
    }

    try {
        $sql = "DELETE FROM managefeedback WHERE feedback_id = '$id'";
        
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Feedback deleted successfully!'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete feedback: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error deleting feedback: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while deleting feedback.'
        ]);
    }
}

// === Get Next ID ===
elseif ($action === "getNextID") {
    try {
        $sql = "SELECT MAX(feedback_id) as max_id FROM managefeedback";
        $result = $conn->query($sql);
        
        if ($result) {
            $row = $result->fetch_assoc();
            $nextId = ($row['max_id'] ?? 0) + 1;
            echo json_encode([
                'success' => true,
                'next_id' => $nextId
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to get next ID: ' . $conn->error
            ]);
        }
    } catch (Exception $e) {
        error_log("Error getting next ID: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while getting next ID.'
        ]);
    }
}

// === Invalid Action ===
else {
    ob_clean(); // Clear any output before sending JSON
    echo json_encode([
        'success' => false,
        'message' => 'Invalid action specified.'
    ]);
    ob_end_flush();
    exit;
}

ob_end_flush();
?>
