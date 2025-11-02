<?php
// Temporary router - redirect to main HTML file
// This forces Digital Ocean to detect PHP
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
} else {
    echo "CSWDO System - PHP is working!";
}
?>