#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p public/images

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOGO_PATH="$PROJECT_DIR/public/images/logo.png"
OUTPUT_DIR="$PROJECT_DIR/public/images"

# Create a temporary directory for intermediate files
temp_dir=$(mktemp -d)

# Function to create a social image with a colored background
create_social_image() {
  local width=$1
  local height=$2
  local output=$3
  local bg_color=${4:-'#1e40af'}  # Default blue color matching the site's theme
  
  # Create a colored background with the logo centered
  convert -size ${width}x${height} "xc:$bg_color" \
    "$LOGO_PATH" -gravity center -resize "$((width * 70 / 100))x$((height * 70 / 100))" -composite \
    "$OUTPUT_DIR/$output"
  
  echo "Created: $output (${width}x${height})"
}

# Create OG Image (1200x630)
create_social_image 1200 630 "og-image.jpg"

# Create Twitter Card Image (1200x628)
create_social_image 1200 628 "twitter-card.jpg"

# Create Apple Touch Icon (180x180)
convert "$LOGO_PATH" -resize 180x180 -background none -gravity center -extent 180x180 "$OUTPUT_DIR/apple-touch-icon.png"
echo "Created: apple-touch-icon.png (180x180)"

# Create Favicon (32x32)
convert "$LOGO_PATH" -resize 32x32 -background none -gravity center -extent 32x32 "$OUTPUT_DIR/favicon.ico"
echo "Created: favicon.ico (32x32)"

# Clean up
echo "All social images created successfully in $OUTPUT_DIR"
