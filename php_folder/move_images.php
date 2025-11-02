<?php
// Script to move existing service images from wrong location to correct location

$sourceDir = './uploads/servicephotos/';
$targetDir = '../uploads/servicephotos/';

// Create target directory if it doesn't exist
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
    echo "Created target directory: $targetDir\n";
}

// Check if source directory exists
if (is_dir($sourceDir)) {
    $files = scandir($sourceDir);
    $movedCount = 0;
    
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..' && is_file($sourceDir . $file)) {
            $sourcePath = $sourceDir . $file;
            $targetPath = $targetDir . $file;
            
            if (copy($sourcePath, $targetPath)) {
                unlink($sourcePath); // Delete the original file
                echo "Moved: $file\n";
                $movedCount++;
            } else {
                echo "Failed to move: $file\n";
            }
        }
    }
    
    echo "Total files moved: $movedCount\n";
    
    // Try to remove the empty source directory
    if (count(scandir($sourceDir)) <= 2) { // Only . and .. remain
        rmdir($sourceDir);
        echo "Removed empty source directory\n";
    }
} else {
    echo "Source directory does not exist: $sourceDir\n";
}

echo "Image migration completed!\n";
?>
