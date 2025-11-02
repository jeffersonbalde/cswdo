<?php
session_start(); // Start the session to access session variables

// Set security headers to prevent caching
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Check if the user is logged in and has a WebAdministrator user type
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'WebAdministrator') {
    // If not logged in or not a WebAdministrator, redirect to login page
    header("Location: login.html");
    exit;
}

// Retrieve user data from session
$adminRole = htmlspecialchars($_SESSION['user_type']);
$adminName = htmlspecialchars($_SESSION['user_handler']);

// Fetch fresh user data from database for security
require_once("php_folder/connection.php");
$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT username, user_type, user_handler FROM users WHERE user_id = ?");
if ($stmt) {
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($username, $user_type, $user_handler);
        $stmt->fetch();
        
        // Update session data with fresh database data
        $adminRole = htmlspecialchars($user_type);
        $adminName = htmlspecialchars($user_handler);
    }
    $stmt->close();
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="TRiG3N" />
    <meta
      name="description"
      content="The official Web-Application of City Social Welfare and Development Office Pagadian City"
    />
    <title>CSWDO-Pagadian | Web Admin Dashboard</title>
    <!-- bootstrap import -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-SgOJa3DmI69IUzQ2PVdRZhwQ+dy64/BUtbMJw1MZ8t5HZApcHrRKUc4W0kG879m7"
      crossorigin="anonymous"
    />
    <!-- imports of components -->
    <script type="module" src="./components/register-components.js"></script>
    
    <!-- Session Security -->
    <script src="./components/session-security.js"></script>
    
    <!-- User data injection -->
    <script>
        // User data injected by PHP
        window.userData = {
            username: '<?php echo htmlspecialchars($_SESSION['username']); ?>',
            user_type: '<?php echo $adminRole; ?>',
            user_handler: '<?php echo $adminName; ?>'
        };
        console.log('User data loaded:', window.userData);
    </script>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        /* Dashboard container layout */
        .dashboard-container {
            display: flex;
            height: 100vh;
            overflow: hidden;
        }
        /* Ensure sidebar doesn't shrink */
        admin-sidebar {
            flex-shrink: 0;
            z-index: 10;
        }
        /* Main shell takes remaining space */
        admin-mainshell {
            flex: 1;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <webadmin-sidebar></webadmin-sidebar>
        <admin-mainshell></admin-mainshell>
    </div>
</body>
</html>
