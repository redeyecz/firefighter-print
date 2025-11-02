#!/bin/bash
set -e

# Firefighter Alarm System - Installation Script
# This script installs the system on a fresh Linux server (Debian/Ubuntu/Raspberry Pi OS)

echo "=========================================="
echo "Firefighter Alarm System - Installation"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: This script must be run as root (use sudo)"
  exit 1
fi

# Configuration
APP_USER="firefighter"
APP_DIR="/opt/firefighter-alarm"
SYSTEMD_SERVICE="/etc/systemd/system/firefighter-alarm.service"

echo "Step 1: Installing system dependencies..."
apt-get update
apt-get install -y \
  curl \
  unzip \
  cups \
  cups-client \
  sqlite3 \
  git

echo ""
echo "Step 2: Installing Bun..."
if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
else
  echo "Bun is already installed"
fi

# Verify bun installation
if ! command -v bun &> /dev/null; then
  echo "ERROR: Bun installation failed"
  exit 1
fi

echo ""
echo "Step 3: Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
  echo "User $APP_USER created"
else
  echo "User $APP_USER already exists"
fi

# Add user to lp group for CUPS access
usermod -a -G lp "$APP_USER"

echo ""
echo "Step 4: Creating application directory..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/logs"

echo ""
echo "Step 5: Copying application files..."
# Assumes script is run from deployment directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cp -r "$PROJECT_DIR"/* "$APP_DIR/"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo ""
echo "Step 6: Installing application dependencies..."
cd "$APP_DIR"
sudo -u "$APP_USER" bun install --production

echo ""
echo "Step 7: Building application..."
sudo -u "$APP_USER" bun run build

echo ""
echo "Step 8: Setting up environment configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created .env file from .env.example"
  echo "IMPORTANT: Edit $APP_DIR/.env with your configuration"
else
  echo ".env file already exists, skipping"
fi

chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

echo ""
echo "Step 9: Installing systemd service..."
cp "$APP_DIR/deployment/firefighter-alarm.service" "$SYSTEMD_SERVICE"
systemctl daemon-reload
systemctl enable firefighter-alarm.service

echo ""
echo "Step 10: Setting up database..."
sudo -u "$APP_USER" sqlite3 "$APP_DIR/data/dispatch.db" "VACUUM;"

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit the configuration file:"
echo "   sudo nano $APP_DIR/.env"
echo ""
echo "2. Configure your email settings, Map API key, and printer"
echo ""
echo "3. Start the service:"
echo "   sudo systemctl start firefighter-alarm"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status firefighter-alarm"
echo ""
echo "5. View logs:"
echo "   sudo journalctl -u firefighter-alarm -f"
echo ""
echo "6. Access the admin panel:"
echo "   http://localhost:3000/dashboard"
echo ""
echo "=========================================="
