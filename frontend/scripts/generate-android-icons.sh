#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ICON="${1:-$ROOT_DIR/assets/icon.png}"
RES_DIR="${2:-$ROOT_DIR/android/app/src/main/res}"

if [ ! -f "$SOURCE_ICON" ]; then
  echo "Source icon not found: $SOURCE_ICON" >&2
  exit 1
fi

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' is required to generate Android icons." >&2
  exit 1
fi

mkdir -p "$RES_DIR"/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
mkdir -p "$RES_DIR"/mipmap-anydpi-v26
mkdir -p "$RES_DIR"/drawable

generate_icon() {
  local size="$1"
  local dir="$2"

  convert "$SOURCE_ICON" -resize "${size}x${size}" "$RES_DIR/$dir/ic_launcher.png"
  convert "$SOURCE_ICON" -resize "${size}x${size}" "$RES_DIR/$dir/ic_launcher_round.png"
}

generate_foreground() {
  local size="$1"
  local dir="$2"

  convert "$SOURCE_ICON" \
    -resize "${size}x${size}" \
    -background none \
    -gravity center \
    -extent "${size}x${size}" \
    "$RES_DIR/$dir/ic_launcher_foreground.png"
}

generate_icon 48 mipmap-mdpi
generate_icon 72 mipmap-hdpi
generate_icon 96 mipmap-xhdpi
generate_icon 144 mipmap-xxhdpi
generate_icon 192 mipmap-xxxhdpi

generate_foreground 108 mipmap-mdpi
generate_foreground 162 mipmap-hdpi
generate_foreground 216 mipmap-xhdpi
generate_foreground 324 mipmap-xxhdpi
generate_foreground 432 mipmap-xxxhdpi

cat > "$RES_DIR/drawable/ic_launcher_background.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
</shape>
EOF

cat > "$RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
EOF

cat > "$RES_DIR/mipmap-anydpi-v26/ic_launcher_round.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
EOF
