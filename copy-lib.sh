#!/bin/bash
# Copy instead of symlink for Windows compatibility

SOURCE="$1"
TARGET="$2"

# Create parent directory if it doesn't exist
mkdir -p "$(dirname "$TARGET")"

# Copy file instead of creating symlink
cp "$SOURCE" "$TARGET"

echo "Copied $SOURCE to $TARGET"
