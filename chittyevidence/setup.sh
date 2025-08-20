#!/bin/bash
# Marie Kondo Evidence System - Setup Script

echo "🌸 Marie Kondo Evidence System Setup"
echo "===================================="

# Create directory structure
BASE_DIR="$(pwd)/marie_kondo_evidence_system"

echo "Creating application structure..."

# Create directories
mkdir -p "$BASE_DIR"/{bin,config,lib,data,logs,incoming,lockbox}
mkdir -p "$BASE_DIR"/lockbox/{.originals,00_KEY_EXHIBITS,00_EVIDENCE_INDEX,00_CASE_TIMELINE,98_DUPLICATES,99_UNSORTED}
mkdir -p "$BASE_DIR"/lockbox/{01_TRO_PROCEEDINGS,02_LLC_FORMATION,03_MEMBERSHIP_REMOVAL,04_PREMARITAL_FUNDING}
mkdir -p "$BASE_DIR"/lockbox/{05_PROPERTY_TRANSACTIONS,06_FINANCIAL_STATEMENTS,07_COURT_FILINGS,08_ATTORNEY_CORRESPONDENCE}
mkdir -p "$BASE_DIR"/lockbox/{09_PERJURY_EVIDENCE,10_SANCTIONS_RULE137,11_COLOMBIAN_PROPERTY,12_LEASE_AGREEMENTS}

# Install Python dependencies
echo "Installing dependencies..."
pip3 install -q watchdog psycopg2-binary python-dotenv requests schedule > /dev/null 2>&1

# Create systemd service file (for Linux) or launchd plist (for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Create launchd plist
    PLIST_FILE="$HOME/Library/LaunchAgents/com.mariekondo.evidence.plist"
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mariekondo.evidence</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>$BASE_DIR/bin/daemon.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$BASE_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$BASE_DIR/logs/daemon.log</string>
    <key>StandardErrorPath</key>
    <string>$BASE_DIR/logs/daemon_error.log</string>
</dict>
</plist>
EOF
    echo "✅ Created launchd service: $PLIST_FILE"
else
    # Linux - Create systemd service
    SERVICE_FILE="$HOME/.config/systemd/user/mariekondo-evidence.service"
    mkdir -p "$HOME/.config/systemd/user"
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Marie Kondo Evidence System
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 $BASE_DIR/bin/daemon.py
WorkingDirectory=$BASE_DIR
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF
    echo "✅ Created systemd service: $SERVICE_FILE"
fi

echo ""
echo "📂 Directory structure created:"
echo "   $BASE_DIR/"
echo "   ├── bin/          # Application executables"
echo "   ├── config/       # Configuration files"
echo "   ├── lib/          # Core libraries"
echo "   ├── data/         # Database and indexes"
echo "   ├── logs/         # Application logs"
echo "   ├── incoming/     # Drop new evidence here"
echo "   └── lockbox/      # Organized evidence"
echo ""
echo "Next steps:"
echo "1. Copy application files to $BASE_DIR"
echo "2. Configure database connection in config/.env"
echo "3. Start the daemon:"
echo "   macOS: launchctl load $HOME/Library/LaunchAgents/com.mariekondo.evidence.plist"
echo "   Linux: systemctl --user enable --now mariekondo-evidence"