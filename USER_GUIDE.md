# Firefighter Alarm System - User Guide

**For Fire Department Administrators**

Version 1.0 | Last Updated: January 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Accessing the System](#accessing-the-system)
3. [Dashboard Overview](#dashboard-overview)
4. [Monitoring System Health](#monitoring-system-health)
5. [Viewing Email Processing Log](#viewing-email-processing-log)
6. [Previewing Dispatch Documents](#previewing-dispatch-documents)
7. [Retrying Failed Jobs](#retrying-failed-jobs)
8. [System Configuration](#system-configuration)
9. [Viewing System Logs](#viewing-system-logs)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [Daily Operations Checklist](#daily-operations-checklist)

---

## Introduction

### What is the Firefighter Alarm System?

The Firefighter Alarm System automatically processes incoming dispatch emails and prints complete dispatch information for your fire crews. When a dispatch email arrives:

1. The system receives and filters the email
2. Extracts GPS coordinates from the message
3. Generates a route map from your station to the incident
4. Assembles a comprehensive dispatch document
5. Sends it directly to your printer

All of this happens automatically, usually within 30 seconds.

### Who Should Read This Guide?

This guide is for fire department administrators responsible for:

- Monitoring the dispatch system
- Handling failed dispatches
- Configuring system settings
- Basic troubleshooting

### System Access

- **URL**: `http://[server-address]:3000/dashboard`
- **Access**: Available on your local network
- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)

---

## Accessing the System

### Opening the Admin Panel

1. Open your web browser
2. Navigate to: `http://[server-address]:3000/dashboard`
3. You should see the main dashboard

**Note**: Replace `[server-address]` with your actual server address (e.g., `192.168.1.100` or `localhost` if on the server itself).

### Navigation

The system has four main sections:

- **Dashboard** - Main overview and email log
- **Settings** - System configuration
- **Logs** - Detailed system logs

---

## Dashboard Overview

The dashboard shows real-time information about your dispatch system.

### Statistics Cards

At the top of the dashboard, you'll see four cards:

**Total (24h)**

- Shows total emails processed in the last 24 hours
- Updates every 30 seconds

**Successful**

- Number of jobs that completed successfully
- These were printed and delivered

**Failed**

- Number of jobs that encountered errors
- These need your attention

**Success Rate**

- Percentage of successful jobs
- Aim for 95%+ success rate

### What do the numbers mean?

- **Good**: Success rate > 95%, few failures
- **Attention Needed**: Success rate < 90%, multiple failures
- **Critical**: Success rate < 80%, check service health immediately

---

## Monitoring System Health

Below the statistics, you'll see **Service Health** indicators.

### Service Status Badges

**Email Service**

- **Green (Healthy)**: Connected to email server, monitoring inbox
- **Red (Unhealthy)**: Cannot connect - check network and credentials
- **Gray (Unknown)**: Status unclear - system may be starting

**Map Service**

- **Green (Healthy)**: Map API responding normally
- **Yellow (Degraded)**: Slow responses or rate limiting
- **Red (Unhealthy)**: Cannot generate maps - check API key

**Printer Service**

- **Green (Healthy)**: Printer ready and accessible
- **Red (Unhealthy)**: Cannot reach printer - check CUPS and printer status

### Interpreting Service Health

**All Green**: System operating normally
**One Red**: That service is down, jobs may fail
**Multiple Red**: System cannot process dispatches, immediate action needed

### Hover for Details

Place your mouse over any service badge to see:

- Detailed status message
- Error information (if unhealthy)
- Last check time

---

## Viewing Email Processing Log

The Email Processing Log shows all dispatch emails processed by the system.

### Log Columns

**Status**

- **Green (Printed)**: Successfully processed and printed
- **Red (Failed)**: Error occurred during processing
- **Gray (Processing)**: Currently being processed

**Subject**

- Email subject line (truncated if long)
- Hover to see full subject

**Date Received**

- When the email was received
- Format: MM/DD/YYYY HH:MM:SS AM/PM

**Date Printed**

- When the dispatch was printed
- Shows "-" if not yet printed

**Error**

- Error message if job failed
- Shows "-" if no error
- Hover for full error details

**Actions**

- **Preview**: View original email and final document
- **Print**: Send to printer again
- **Retry**: Reprocess failed jobs (only for failed jobs)

### Pagination

- Use **Previous** and **Next** buttons to navigate pages
- Shows "Page X of Y" in the center
- Default: 50 entries per page

### Auto-Refresh

The log automatically refreshes every 30 seconds to show new dispatches.

---

## Previewing Dispatch Documents

The preview feature lets you see what was printed for any dispatch.

### Opening a Preview

1. Find the dispatch in the Email Processing Log
2. Click the **Preview** button
3. A modal window opens with two tabs

### Preview Tabs

**Original Email**

- Shows the raw dispatch email as received
- Useful for verifying what information was available

**Final Output**

- Shows the formatted dispatch document
- This is exactly what was printed
- Includes:
  - Dispatch header
  - Location and GPS coordinates
  - Route map (or error message if unavailable)
  - Contact information
  - Timestamp

### Using the Preview

- Switch between tabs to compare original and final output
- Check if GPS coordinates were correctly extracted
- Verify map is present and correct
- Confirm all critical information is visible

### Closing the Preview

- Click the **X** in the top-right corner
- Or click outside the modal window

---

## Retrying Failed Jobs

When a dispatch fails, you can manually retry processing.

### When to Retry

Retry a job if it failed due to:

- Temporary network issues
- Map service temporarily unavailable
- Printer was offline but is now online
- GPS extraction failed but you've verified the email has coordinates

### How to Retry

1. Find the failed job (red "Failed" badge) in the Email Processing Log
2. Click the **Retry** button
3. Button changes to "Retrying..." and is disabled
4. Wait for processing to complete (usually < 30 seconds)
5. Status updates to "Printed" (success) or remains "Failed"

### If Retry Fails Again

If the job fails after retry:

1. Check the error message by hovering over "Error" column
2. Refer to the [Troubleshooting](#troubleshooting-common-issues) section
3. Fix the underlying issue
4. Retry again

### Multiple Retries

You can retry a job multiple times. The system tracks retry attempts.

---

## System Configuration

The Settings page lets you configure system parameters.

### Accessing Settings

1. Navigate to `http://[server-address]:3000/settings`
2. You'll see six configuration sections

### Email Settings

Configure your dispatch email account:

- **IMAP Host**: Your email server (e.g., imap.gmail.com)
- **Port**: Usually 993 for secure IMAP
- **Email Address**: The account being monitored
- **Password**: Use app-specific password for Gmail
- **Check Interval**: How often to check for new emails (seconds)

**Important**: Use app-specific passwords, not your regular password.

### Filter Rules

Control which emails trigger dispatches:

- **Subject Contains**: Simple text matching (e.g., "DISPATCH")
- **Subject Regex**: Advanced pattern matching
- **From Address**: Only process emails from this sender

**Note**: Subject Contains and Subject Regex are mutually exclusive - use only one.

### Station Location

Your fire station's GPS coordinates:

- **Station Name**: For display purposes
- **Latitude**: North/South coordinate (-90 to 90)
- **Longitude**: East/West coordinate (-180 to 180)

**Finding Your Coordinates**:

1. Open Google Maps
2. Right-click your station
3. Click the coordinates to copy

### CUPS Printer Settings

Configure your printer:

- **CUPS Host**: Usually "localhost"
- **Port**: Usually 631
- **Printer Name**: Run `lpstat -p` to find

### Print Configuration

Retry behavior for failed prints:

- **Auto Retry Count**: How many times to retry (0-10)
- **Retry Delay**: Seconds between retries

### Map API Configuration

- **Provider**: Currently only Mapy.cz supported
- **API Key**: Your Mapy.cz API key

### Saving Configuration

1. Make your changes
2. Click **Save Configuration**
3. Wait for "Configuration saved successfully" message
4. Changes take effect immediately

### Validation

The system validates your configuration:

- Email format must be valid
- Coordinates must be in range
- Ports must be 1-65535
- Mutual exclusivity rules enforced

If validation fails, error messages appear below the relevant fields.

---

## Viewing System Logs

The Logs page shows detailed system activity.

### Accessing Logs

Navigate to: `http://[server-address]:3000/logs`

### Filtering Logs

**Log Level**

- **All Levels**: Show everything
- **Debug**: Detailed diagnostic information
- **Info**: Normal operations
- **Warning**: Potential issues
- **Error**: Actual errors

**Job ID**

- Enter a job ID to see only logs for that job
- Useful for troubleshooting specific dispatches

**Show Last**

- Choose how many entries to display
- Options: 50, 100, 250, 500

### Reading Log Entries

Each log entry shows:

**Badge** (colored by level)

- Green: Info
- Yellow: Warning
- Red: Error
- Gray: Debug

**Timestamp**

- When the event occurred

**Message**

- What happened

**Context** (expandable)

- Additional details
- Job ID, step, duration, etc.

**Error Details** (expandable, if error)

- Full error message
- Error code
- Stack trace

### Using Logs for Troubleshooting

1. Filter by Error level
2. Look for patterns (same error multiple times)
3. Check timestamps (when did errors start?)
4. Expand error details for codes
5. Match error codes to troubleshooting guide

### Auto-Refresh

Logs refresh every 5 seconds automatically.

---

## Troubleshooting Common Issues

### Email Service is Red

**Problem**: Cannot connect to email server

**Solutions**:

1. Check internet connection
2. Verify email credentials in Settings
3. For Gmail: Ensure IMAP is enabled
4. For Gmail: Use app-specific password
5. Check firewall isn't blocking port 993

**How to Fix**:

1. Go to Settings
2. Update Email Address and Password
3. Click Save Configuration
4. Check dashboard - should turn green in 30 seconds

---

### Map Service is Red

**Problem**: Cannot generate route maps

**Solutions**:

1. Check internet connection
2. Verify Map API Key in Settings
3. Check if API quota exceeded (Mapy.cz dashboard)
4. Try generating a test map manually

**How to Fix**:

1. Visit https://api.mapy.cz/
2. Check your API key status and quota
3. Generate new API key if needed
4. Update in Settings → Map API Configuration
5. Click Save Configuration

---

### Printer Service is Red

**Problem**: Cannot reach printer

**Solutions**:

1. Check printer is powered on
2. Check printer is connected to network
3. Verify CUPS is running: `systemctl status cups`
4. Check printer name: `lpstat -p`
5. Test print: `echo "Test" | lp -d YourPrinterName`

**How to Fix**:

1. Ensure printer is on and ready
2. Go to Settings → CUPS Printer Settings
3. Verify Printer Name matches `lpstat -p` output
4. Click Save Configuration

---

### Dispatch Shows "GPS coordinates not found"

**Problem**: System couldn't extract GPS from email

**Solutions**:

1. Open Preview and check Original Email
2. Verify email actually contains GPS coordinates
3. Check format: Should be like "50.0755, 14.4378"
4. Coordinates might be in attached files (not supported)

**How to Fix**:

1. If coordinates are present but not detected:
   - Contact technical support
   - Provide sample email via Preview
2. If coordinates truly missing:
   - Contact dispatch center about email format
   - Manual navigation required

---

### Job Status Stuck on "Processing"

**Problem**: Job hasn't completed after several minutes

**Solutions**:

1. Check Service Health - is anything red?
2. Wait a bit longer (up to 5 minutes for network issues)
3. Check system logs for errors
4. Restart the service if necessary

**How to Fix**:

1. If > 5 minutes, job is likely stuck
2. Restart service: `sudo systemctl restart firefighter-alarm`
3. Check logs: `sudo journalctl -u firefighter-alarm -n 100`
4. Contact technical support if persists

---

### Success Rate Dropping

**Problem**: More failures than normal

**Investigation**:

1. Check Service Health for red indicators
2. Look at recent failed jobs in Email Processing Log
3. Check error messages - are they the same?
4. Review system logs filtered by Error level

**Common Causes**:

- Network issues (affects email and map)
- Printer offline (affects printing only)
- API quota exceeded (affects map only)
- Email format changed (affects GPS extraction)

---

## Daily Operations Checklist

### Morning Check (5 minutes)

- [ ] Open dashboard
- [ ] Verify all Service Health indicators are green
- [ ] Check Success Rate is > 95%
- [ ] Review any failed jobs from overnight
- [ ] Retry failed jobs if issues resolved
- [ ] Check printer has paper and toner

### During Shift

- [ ] Monitor for new dispatches (automatic)
- [ ] Verify printed dispatches match screens
- [ ] Address any red service indicators immediately

### End of Shift

- [ ] Review Email Processing Log
- [ ] Document any recurring issues
- [ ] Verify all dispatches were delivered
- [ ] Check Success Rate for the day

### Weekly Tasks

- [ ] Review system logs for warnings
- [ ] Check storage space if logs show issues
- [ ] Verify backup procedures are working
- [ ] Test printer with manual print job

### Monthly Tasks

- [ ] Review configuration for any needed updates
- [ ] Check Mapy.cz API usage and quota
- [ ] Review system performance metrics
- [ ] Update documentation with any process changes

---

## Getting Help

### Self-Service Resources

1. **This User Guide**: For operational questions
2. **Deployment Guide**: For technical/installation issues
3. **System Logs**: For detailed error information
4. **Dashboard Health**: For current status

### When to Contact Support

Contact technical support if:

- Service indicators stay red after troubleshooting
- Success rate < 80% for extended period
- System is unresponsive
- Recurring errors you can't resolve

### What to Provide

When contacting support, provide:

- Screenshot of dashboard
- Recent error messages from logs
- Steps you've already tried
- Time when issue started

---

## Appendix: Understanding Error Codes

### Email Errors (EMAIL_XXX)

- **EMAIL_001**: Connection failed - check network
- **EMAIL_002**: Authentication failed - check credentials
- **EMAIL_003**: Fetch failed - temporary issue, retry

### GPS Errors (GPS_XXX)

- **GPS_001**: Coordinates not found in email
- **GPS_002**: Coordinates invalid format

### Map Errors (MAP_XXX)

- **MAP_001**: Service unavailable - retry later
- **MAP_002**: Invalid API key - check Settings
- **MAP_003**: Generation failed - check coordinates
- **MAP_004**: Timeout - network issue

### Printer Errors (PRINT_XXX)

- **PRINT_001**: Printer unreachable - check connection
- **PRINT_002**: Printer busy - retry automatically
- **PRINT_003**: Out of paper - refill printer
- **PRINT_004**: Print job failed - check CUPS

### System Errors (SYS_XXX)

- **SYS_001**: Unknown error - check logs
- **SYS_002**: Configuration error - check Settings
- **SYS_003**: Document assembly error - contact support

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: Quarterly

**For Technical Support**: See DEPLOYMENT.md

**Emergency Procedures**: If system is completely down, follow manual dispatch procedures until system is restored.
