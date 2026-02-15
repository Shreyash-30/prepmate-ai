#!/bin/bash
# Cleanup Script - Remove old unnecessary files from frontend
# This removes files that are no longer used in the new architecture

echo "🧹 Cleaning up old frontend files..."
echo ""

# Array of files/directories to remove
old_files=(
  "src/modules/dashboard/components/Sidebar.tsx"
  "src/modules/roadmap"
  "src/modules/analytics/services"
  "src/modules/practice/services/oldPracticeService.ts"
)

# Remove each file/directory
for file in "${old_files[@]}"; do
  if [ -e "$file" ]; then
    rm -rf "$file"
    echo "✓ Removed: $file"
  else
    echo "⊘ Not found: $file"
  fi
done

echo ""
echo "✅ Cleanup completed!"
