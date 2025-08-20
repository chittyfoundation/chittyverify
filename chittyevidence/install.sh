#!/bin/bash
# Marie Kondo Evidence System - Complete Installation Script

echo "🌸 Marie Kondo Evidence System - Complete Installation"
echo "======================================================="

# Set installation directory
INSTALL_DIR="/Volumes/thumb/nb/MAIN/Legal/marie_kondo_evidence_system"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing to: $INSTALL_DIR"
echo "Source: $SOURCE_DIR"

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy application files
echo "📂 Copying application files..."
cp -r "$SOURCE_DIR"/* "$INSTALL_DIR/"

# Make scripts executable
chmod +x "$INSTALL_DIR"/bin/*.py
chmod +x "$INSTALL_DIR"/*.sh

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$INSTALL_DIR"/{data,logs,incoming,lockbox}
mkdir -p "$INSTALL_DIR"/lockbox/{.originals,00_KEY_EXHIBITS,00_EVIDENCE_INDEX,00_CASE_TIMELINE,98_DUPLICATES,99_UNSORTED}
mkdir -p "$INSTALL_DIR"/lockbox/{01_TRO_PROCEEDINGS,02_LLC_FORMATION,03_MEMBERSHIP_REMOVAL,04_PREMARITAL_FUNDING}
mkdir -p "$INSTALL_DIR"/lockbox/{05_PROPERTY_TRANSACTIONS,06_FINANCIAL_STATEMENTS,07_COURT_FILINGS,08_ATTORNEY_CORRESPONDENCE}
mkdir -p "$INSTALL_DIR"/lockbox/{09_PERJURY_EVIDENCE,10_SANCTIONS_RULE137,11_COLOMBIAN_PROPERTY,12_LEASE_AGREEMENTS}

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -q watchdog psycopg2-binary python-dotenv requests schedule > /dev/null 2>&1

# Update configuration paths in .env
echo "⚙️ Updating configuration..."
sed -i.bak "s|INCOMING_DIR=.*|INCOMING_DIR=$INSTALL_DIR/incoming|g" "$INSTALL_DIR/config/.env"
sed -i.bak "s|LOCKBOX_DIR=.*|LOCKBOX_DIR=$INSTALL_DIR/lockbox|g" "$INSTALL_DIR/config/.env"
sed -i.bak "s|LOG_FILE=.*|LOG_FILE=$INSTALL_DIR/logs/marie_kondo.log|g" "$INSTALL_DIR/config/.env"

# Create startup scripts
echo "🚀 Creating startup scripts..."

# macOS launchd plist
if [[ "$OSTYPE" == "darwin"* ]]; then
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
        <string>$INSTALL_DIR/bin/daemon.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/logs/daemon.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/logs/daemon_error.log</string>
</dict>
</plist>
EOF
    echo "✅ Created launchd service: $PLIST_FILE"
fi

# Create convenience scripts
cat > "$INSTALL_DIR/start.sh" << EOF
#!/bin/bash
# Start Marie Kondo Evidence System
echo "🌸 Starting Marie Kondo Evidence System..."

if [[ "\$OSTYPE" == "darwin"* ]]; then
    launchctl load ~/Library/LaunchAgents/com.mariekondo.evidence.plist
    echo "✅ Daemon started with launchd"
    echo "📋 Check status: launchctl list | grep mariekondo"
    echo "📄 View logs: tail -f $INSTALL_DIR/logs/marie_kondo.log"
else
    nohup python3 $INSTALL_DIR/bin/daemon.py > $INSTALL_DIR/logs/daemon.log 2>&1 &
    echo \$! > $INSTALL_DIR/data/daemon.pid
    echo "✅ Daemon started with PID \$(cat $INSTALL_DIR/data/daemon.pid)"
    echo "📄 View logs: tail -f $INSTALL_DIR/logs/daemon.log"
fi
EOF

cat > "$INSTALL_DIR/stop.sh" << EOF
#!/bin/bash
# Stop Marie Kondo Evidence System
echo "🛑 Stopping Marie Kondo Evidence System..."

if [[ "\$OSTYPE" == "darwin"* ]]; then
    launchctl unload ~/Library/LaunchAgents/com.mariekondo.evidence.plist
    echo "✅ Daemon stopped"
else
    if [ -f $INSTALL_DIR/data/daemon.pid ]; then
        kill \$(cat $INSTALL_DIR/data/daemon.pid)
        rm $INSTALL_DIR/data/daemon.pid
        echo "✅ Daemon stopped"
    else
        echo "⚠️ No daemon PID file found"
    fi
fi
EOF

cat > "$INSTALL_DIR/status.sh" << EOF
#!/bin/bash
# Check Marie Kondo Evidence System status
echo "📊 Marie Kondo Evidence System Status"
echo "====================================="

# Check if daemon is running
if [[ "\$OSTYPE" == "darwin"* ]]; then
    if launchctl list | grep -q mariekondo; then
        echo "✅ Daemon is running (launchd)"
    else
        echo "❌ Daemon is not running"
    fi
else
    if [ -f $INSTALL_DIR/data/daemon.pid ] && kill -0 \$(cat $INSTALL_DIR/data/daemon.pid) 2>/dev/null; then
        echo "✅ Daemon is running (PID \$(cat $INSTALL_DIR/data/daemon.pid))"
    else
        echo "❌ Daemon is not running"
    fi
fi

# Check directories
echo ""
echo "📁 Directory Status:"
echo "   Incoming: \$(ls -1 $INSTALL_DIR/incoming 2>/dev/null | wc -l) files"
echo "   Originals: \$(ls -1 $INSTALL_DIR/lockbox/.originals 2>/dev/null | wc -l) files"

# Check database connection
echo ""
echo "🗄️ Database Status:"
python3 -c "
import os
from pathlib import Path
import sys
sys.path.insert(0, '$INSTALL_DIR/lib')
from dotenv import load_dotenv
load_dotenv(Path('$INSTALL_DIR/config/.env'))
from evidence_core import ChittyIntegration
try:
    chitty = ChittyIntegration(os.getenv('DATABASE_URL'), os.getenv('CHITTY_ID'))
    print('   ✅ Database connection successful')
except Exception as e:
    print(f'   ❌ Database connection failed: {e}')
"

# Show recent logs
echo ""
echo "📄 Recent Logs (last 5 lines):"
if [ -f $INSTALL_DIR/logs/marie_kondo.log ]; then
    tail -5 $INSTALL_DIR/logs/marie_kondo.log | sed 's/^/   /'
else
    echo "   No logs found"
fi
EOF

# Make convenience scripts executable
chmod +x "$INSTALL_DIR"/{start,stop,status}.sh

# Create desktop alias script
cat > "$INSTALL_DIR/create_desktop_alias.sh" << EOF
#!/bin/bash
# Create desktop alias for easy access
DESKTOP_DIR="\$HOME/Desktop"
if [ -d "\$DESKTOP_DIR" ]; then
    ln -sf "$INSTALL_DIR" "\$DESKTOP_DIR/Marie_Kondo_Evidence"
    echo "🖥️ Desktop alias created: \$DESKTOP_DIR/Marie_Kondo_Evidence"
else
    echo "⚠️ Desktop directory not found"
fi
EOF
chmod +x "$INSTALL_DIR/create_desktop_alias.sh"

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "📂 Installed to: $INSTALL_DIR"
echo ""
echo "Next Steps:"
echo "1. Configure database connection:"
echo "   nano $INSTALL_DIR/config/.env"
echo ""
echo "2. Start the system:"
echo "   $INSTALL_DIR/start.sh"
echo ""
echo "3. Check status:"
echo "   $INSTALL_DIR/status.sh"
echo ""
echo "4. Add evidence by dropping files into:"
echo "   $INSTALL_DIR/incoming/"
echo ""
echo "5. View organized evidence in:"
echo "   $INSTALL_DIR/lockbox/"
echo ""
echo "6. Use the CLI:"
echo "   python3 $INSTALL_DIR/bin/evidence_cli.py --help"
echo ""
echo "7. Create desktop alias (optional):"
echo "   $INSTALL_DIR/create_desktop_alias.sh"
echo ""
echo "📚 Documentation: $INSTALL_DIR/README.md"
echo "🌸 Happy evidence organizing!"