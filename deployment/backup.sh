#!/bin/bash
set -e

# Firefighter Alarm System - Backup Script
# Backs up database and configuration files

APP_DIR="/opt/firefighter-alarm"
BACKUP_DIR="/var/backups/firefighter-alarm"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="firefighter-backup-$DATE.tar.gz"
RETENTION_DAYS=30

echo "Starting backup at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup: $BACKUP_FILE"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
  -C "$APP_DIR" \
  data/ \
  .env \
  2>/dev/null || true

# Set permissions
chmod 600 "$BACKUP_DIR/$BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "Backup completed: $BACKUP_SIZE"

# Clean up old backups (older than RETENTION_DAYS)
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "firefighter-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List current backups
echo "Current backups:"
ls -lh "$BACKUP_DIR" | grep "firefighter-backup"

echo "Backup finished at $(date)"
