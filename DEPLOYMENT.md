# Firefighter Alarm System - Deployment Guide

This guide provides step-by-step instructions for deploying the Firefighter Alarm System on a Linux server (Debian, Ubuntu, or Raspberry Pi OS).

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Quick Installation](#quick-installation)
4. [Manual Installation](#manual-installation)
5. [Configuration](#configuration)
6. [Service Management](#service-management)
7. [Troubleshooting](#troubleshooting)
8. [Backup and Restore](#backup-and-restore)
9. [Updating the System](#updating-the-system)

---

## System Requirements

### Hardware

- **Minimum**: Raspberry Pi 3 or equivalent (1GB RAM, 2 cores)
- **Recommended**: Raspberry Pi 4 or equivalent (2GB+ RAM, 4 cores)
- **Storage**: 4GB free disk space minimum

### Software

- **Operating System**: Debian 11+, Ubuntu 20.04+, or Raspberry Pi OS
- **Runtime**: Bun 1.0+ (installed automatically)
- **Services**: CUPS (printing), SQLite3 (database)
- **Network**: Internet access for email and map services

### Network Requirements

- **IMAP Access**: Port 993 (IMAPS) to email server
- **Map API**: HTTPS access to api.mapy.cz
- **CUPS**: Local printer access (usually localhost:631)
- **Admin Panel**: Port 3000 (configurable)

---

## Pre-Installation Checklist

Before installing, gather the following information:

- [ ] Email server credentials (IMAP host, username, password)
- [ ] Mapy.cz API key ([Get one here](https://api.mapy.cz/))
- [ ] Fire station GPS coordinates (latitude, longitude)
- [ ] CUPS printer name (run `lpstat -p -d` to list printers)
- [ ] Network-connected printer or CUPS server

---

## Quick Installation

### 1. Download the installer

```bash
git clone https://github.com/yourorg/firefighter-alarm.git
cd firefighter-alarm
```

### 2. Run the installation script

```bash
cd deployment
sudo ./install.sh
```

The script will:

- Install system dependencies (CUPS, SQLite, etc.)
- Install Bun runtime
- Create application user and directories
- Install application dependencies
- Build the application
- Set up systemd service
- Create database

### 3. Configure the system

```bash
sudo nano /opt/firefighter-alarm/.env
```

Update the following required settings:

- Email credentials
- Map API key
- Station location
- Printer name

### 4. Start the service

```bash
sudo systemctl start firefighter-alarm
sudo systemctl status firefighter-alarm
```

### 5. Access the admin panel

Open your browser to: `http://localhost:3000/dashboard`

---

## Manual Installation

If you prefer to install manually or the script fails:

### 1. Install System Dependencies

```bash
sudo apt-get update
sudo apt-get install -y curl unzip cups cups-client sqlite3 git
```

### 2. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
```

### 3. Create Application User

```bash
sudo useradd -r -s /bin/bash -d /opt/firefighter-alarm -m firefighter
sudo usermod -a -G lp firefighter
```

### 4. Create Directories

```bash
sudo mkdir -p /opt/firefighter-alarm/{data,logs}
```

### 5. Copy Application Files

```bash
sudo cp -r ./* /opt/firefighter-alarm/
sudo chown -R firefighter:firefighter /opt/firefighter-alarm
```

### 6. Install Dependencies and Build

```bash
cd /opt/firefighter-alarm
sudo -u firefighter bun install --production
sudo -u firefighter bun run build
```

### 7. Configure Environment

```bash
sudo cp /opt/firefighter-alarm/.env.example /opt/firefighter-alarm/.env
sudo chown firefighter:firefighter /opt/firefighter-alarm/.env
sudo chmod 600 /opt/firefighter-alarm/.env
sudo nano /opt/firefighter-alarm/.env
```

### 8. Install Systemd Service

```bash
sudo cp /opt/firefighter-alarm/deployment/firefighter-alarm.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable firefighter-alarm
sudo systemctl start firefighter-alarm
```

---

## Configuration

### Environment Variables

Edit `/opt/firefighter-alarm/.env`:

#### Email Configuration (Required)

```env
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=dispatch@example.com
EMAIL_PASSWORD=your_app_password
```

**For Gmail:**

- Enable IMAP in Gmail settings
- Use an App Password (not your regular password)
- Generate at: https://myaccount.google.com/apppasswords

#### Filter Configuration

Choose ONE of the following:

```env
# Option 1: Simple substring match
FILTER_SUBJECT_CONTAINS=DISPATCH

# Option 2: Regular expression (mutually exclusive with CONTAINS)
# FILTER_SUBJECT_REGEX=^FIRE-\d+
```

#### Station Location (Required)

```env
STATION_NAME=Fire Station 1
STATION_LAT=49.947014
STATION_LON=17.885027
```

**Finding your coordinates:**

- Open Google Maps
- Right-click your station location
- Click the coordinates to copy them

#### Map API Configuration (Required)

```env
MAP_API_KEY=your_mapy_cz_api_key
MAP_PROVIDER=mapycz
```

**Get a Mapy.cz API key:**

1. Visit https://api.mapy.cz/
2. Create an account
3. Generate an API key
4. Add the key to your .env file

#### CUPS Printer Configuration

```env
CUPS_HOST=localhost
CUPS_PORT=631
CUPS_PRINTER_NAME=FireDispatchPrinter
```

**Finding your printer name:**

```bash
lpstat -p -d
```

---

## Service Management

### Starting the Service

```bash
sudo systemctl start firefighter-alarm
```

### Stopping the Service

```bash
sudo systemctl stop firefighter-alarm
```

### Restarting the Service

```bash
sudo systemctl restart firefighter-alarm
```

### Checking Status

```bash
sudo systemctl status firefighter-alarm
```

### Viewing Logs

**Real-time logs:**

```bash
sudo journalctl -u firefighter-alarm -f
```

**Last 100 lines:**

```bash
sudo journalctl -u firefighter-alarm -n 100
```

**Logs since boot:**

```bash
sudo journalctl -u firefighter-alarm -b
```

### Enable Auto-Start on Boot

```bash
sudo systemctl enable firefighter-alarm
```

### Disable Auto-Start

```bash
sudo systemctl disable firefighter-alarm
```

---

## Troubleshooting

### Service Won't Start

**Check service status:**

```bash
sudo systemctl status firefighter-alarm
```

**View detailed logs:**

```bash
sudo journalctl -u firefighter-alarm -n 50 --no-pager
```

**Common issues:**

1. Missing .env file → Copy from .env.example
2. Invalid configuration → Check .env syntax
3. Port already in use → Change PORT in .env
4. Permission issues → Check file ownership

### Email Not Connecting

**Test IMAP connection:**

```bash
openssl s_client -connect imap.gmail.com:993 -crlf
```

**Common issues:**

1. Wrong credentials → Check EMAIL_USER and EMAIL_PASSWORD
2. IMAP not enabled → Enable in email provider settings
3. Firewall blocking → Check port 993 is open
4. 2FA required → Use app-specific password

### Printer Not Working

**Check CUPS status:**

```bash
sudo systemctl status cups
```

**List available printers:**

```bash
lpstat -p -d
```

**Test print:**

```bash
echo "Test" | lp -d YourPrinterName
```

**Common issues:**

1. Printer name incorrect → Run `lpstat -p` to find correct name
2. CUPS not running → `sudo systemctl start cups`
3. Permission denied → User must be in 'lp' group
4. Printer offline → Check network/USB connection

### Map Service Errors

**Common issues:**

1. Invalid API key → Check MAP_API_KEY in .env
2. API quota exceeded → Check your Mapy.cz dashboard
3. Network timeout → Increase MAP_TIMEOUT_MS
4. Invalid coordinates → Verify STATION_LAT and STATION_LON

### Database Issues

**Check database file:**

```bash
ls -la /opt/firefighter-alarm/data/dispatch.db
```

**Test database access:**

```bash
sudo -u firefighter sqlite3 /opt/firefighter-alarm/data/dispatch.db "SELECT * FROM sqlite_master;"
```

**Rebuild database:**

```bash
sudo rm /opt/firefighter-alarm/data/dispatch.db
sudo -u firefighter sqlite3 /opt/firefighter-alarm/data/dispatch.db "VACUUM;"
sudo systemctl restart firefighter-alarm
```

---

## Backup and Restore

### Backup Procedure

**1. Stop the service:**

```bash
sudo systemctl stop firefighter-alarm
```

**2. Backup database and configuration:**

```bash
sudo tar -czf firefighter-backup-$(date +%Y%m%d).tar.gz \
  -C /opt/firefighter-alarm \
  data/ \
  .env
```

**3. Store backup securely:**

```bash
sudo mv firefighter-backup-*.tar.gz /path/to/backup/location/
```

**4. Restart the service:**

```bash
sudo systemctl start firefighter-alarm
```

### Restore Procedure

**1. Stop the service:**

```bash
sudo systemctl stop firefighter-alarm
```

**2. Extract backup:**

```bash
sudo tar -xzf firefighter-backup-YYYYMMDD.tar.gz -C /opt/firefighter-alarm
```

**3. Fix permissions:**

```bash
sudo chown -R firefighter:firefighter /opt/firefighter-alarm/data
sudo chown firefighter:firefighter /opt/firefighter-alarm/.env
sudo chmod 600 /opt/firefighter-alarm/.env
```

**4. Restart the service:**

```bash
sudo systemctl start firefighter-alarm
```

### Automated Backups

**Create daily backup cron job:**

```bash
sudo crontab -e
```

Add this line:

```cron
0 2 * * * /opt/firefighter-alarm/deployment/backup.sh
```

---

## Updating the System

### Manual Update

**1. Stop the service:**

```bash
sudo systemctl stop firefighter-alarm
```

**2. Backup current installation:**

```bash
sudo tar -czf firefighter-backup-before-update.tar.gz -C /opt/firefighter-alarm .
```

**3. Pull latest code:**

```bash
cd /path/to/source
git pull origin main
```

**4. Copy new files:**

```bash
sudo cp -r ./* /opt/firefighter-alarm/
```

**5. Update dependencies:**

```bash
cd /opt/firefighter-alarm
sudo -u firefighter bun install --production
```

**6. Rebuild:**

```bash
sudo -u firefighter bun run build
```

**7. Restart service:**

```bash
sudo systemctl start firefighter-alarm
```

**8. Verify:**

```bash
sudo systemctl status firefighter-alarm
```

---

## Health Checks

### System Health API

**Check all services:**

```bash
curl http://localhost:3000/api/dashboard/health
```

**Check specific service:**

```bash
curl http://localhost:3000/api/dashboard/health | jq '.emailService'
```

### Manual Health Checks

**1. Check if service is running:**

```bash
sudo systemctl is-active firefighter-alarm
```

**2. Check port is listening:**

```bash
sudo netstat -tlnp | grep :3000
```

**3. Check disk space:**

```bash
df -h /opt/firefighter-alarm
```

**4. Check memory usage:**

```bash
ps aux | grep firefighter-alarm
```

---

## Support

For issues not covered in this guide:

1. Check the logs: `sudo journalctl -u firefighter-alarm -n 100`
2. Review the GitHub issues: https://github.com/yourorg/firefighter-alarm/issues
3. Contact your system administrator

---

## Security Notes

- Never commit .env file to version control
- Use app-specific passwords for email
- Restrict access to port 3000 using firewall rules
- Regularly update system dependencies
- Keep backups in a secure location
- Use HTTPS in production (setup reverse proxy with nginx/caddy)

---

**Installation Date:** **\*\*\*\***\_**\*\*\*\***

**Configured By:** **\*\*\*\***\_**\*\*\*\***

**Emergency Contact:** **\*\*\*\***\_**\*\*\*\***
