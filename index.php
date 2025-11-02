<?php
// Temporary router to detect PHP in DigitalOcean
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
} else {
    echo "CSWDO System - PHP is working!";
}
?>

<?php $version = date('YmdHis'); ?>
<script src="components/app.js?v=<?php echo $version; ?>"></script>
<link rel="stylesheet" href="style.css?v=<?php echo $version; ?>">
