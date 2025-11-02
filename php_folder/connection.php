<?php
// $servername = "localhost";
// $username = "root";
// $password = "@mayeimara5104"; // assuming no password in XAMPP
// $database = "cswdo_db";
// $port = 3306; 
// specify your custom port

// Create connection0

$servername = "db-mysql-nyc3-41566-do-user-25738101-0.d.db.ondigitalocean.com";
$username = "doadmin";
$password = "AVNS_kpZovBtaYjShOEnDJbY"; 
$database = "cswdo_db_ocean";
$port = 25060;




$conn = new mysqli($servername, $username, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// echo "Connected successfully";
?>