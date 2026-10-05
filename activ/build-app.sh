#!/usr/bin/env bash
# Builds Activ in release mode and wraps it in a minimal .app bundle at dist/Activ.app.
set -euo pipefail
cd "$(dirname "$0")"

swift build -c release
BIN="$(swift build -c release --show-bin-path)/Activ"

APP="dist/Activ.app"
mkdir -p "$APP/Contents/MacOS"
cp -f "$BIN" "$APP/Contents/MacOS/Activ"
cp -f Info.plist "$APP/Contents/Info.plist"

# Shared cartoon character (same engine the VS Code extension uses)
mkdir -p "$APP/Contents/Resources/character/dist"
cp -f ../character/index.html "$APP/Contents/Resources/character/"
cp -f ../character/dist/character.bundle.js "$APP/Contents/Resources/character/dist/"
codesign --force --sign - "$APP" >/dev/null 2>&1 || true

echo "Built $APP"
echo "Run it:      open $APP"
echo "Autostart:   see README.md (LaunchAgent)"
