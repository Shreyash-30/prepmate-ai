# Cleanup Script - Remove old unnecessary files from frontend
# This removes files that are no longer used in the new architecture

Write-Host "Cleaning up old frontend files..." -ForegroundColor Cyan
Write-Host ""

# Array of files/directories to remove
$oldFiles = @(
  "src\modules\dashboard\components\Sidebar.tsx",
  "src\modules\roadmap",
  "src\modules\analytics\services"
)

$removed = 0
$notFound = 0

# Remove each file/directory
foreach ($file in $oldFiles) {
  if (Test-Path $file) {
    Remove-Item $file -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "REMOVED: $file" -ForegroundColor Green
    $removed++
  } else {
    Write-Host "NOT FOUND: $file" -ForegroundColor Yellow
    $notFound++
  }
}

Write-Host ""
Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host "Removed: $removed files/directories"
Write-Host "Not found: $notFound files/directories"
