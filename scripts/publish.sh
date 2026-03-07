#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
PUBLISH_DIR="$ROOT_DIR/publish"
MANIFEST="$SRC_DIR/manifest.json"

mkdir -p "$PUBLISH_DIR"

# extract version
VERSION=$(grep '"version"' "$MANIFEST" | head -1 | sed -E 's/.*"([0-9.]+)".*/\1/')

IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

PATCH=$((PATCH + 1))

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "Bumping version: $VERSION -> $NEW_VERSION"

# update manifest.json
sed -i.bak -E "s/\"version\": \"$VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST"
rm "$MANIFEST.bak"

ZIP_NAME="browserllama-$NEW_VERSION.zip"

echo "Creating package $ZIP_NAME"

cd "$SRC_DIR"
zip -r "$PUBLISH_DIR/$ZIP_NAME" . -x "*.DS_Store"

echo "Done."
echo "Output: $PUBLISH_DIR/$ZIP_NAME"