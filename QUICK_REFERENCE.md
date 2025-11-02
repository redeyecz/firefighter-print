# Firefighter Alarm System - Quick Reference Card

**One-Page Guide for Daily Operations**

---

## 🚀 Quick Start

**Access Dashboard**: `http://[server]:3000/dashboard`

**What the System Does**: Automatically processes dispatch emails → prints complete dispatch documents with route maps

---

## 📊 Dashboard Color Codes

### Service Health Indicators

| Color         | Status    | Meaning                    | Action                      |
| ------------- | --------- | -------------------------- | --------------------------- |
| 🟢 **Green**  | Healthy   | Service operating normally | None - continue monitoring  |
| 🟡 **Yellow** | Degraded  | Service slow or limited    | Monitor closely             |
| 🔴 **Red**    | Unhealthy | Service down or failing    | Immediate action required   |
| ⚪ **Gray**   | Unknown   | Status unclear             | Wait 30s or restart service |

### Job Status Badges

| Badge             | Meaning                            |
| ----------------- | ---------------------------------- |
| 🟢 **Printed**    | Successfully processed and printed |
| 🔴 **Failed**     | Error occurred - needs attention   |
| ⚪ **Processing** | Currently being processed (wait)   |

---

## 🔧 Common Actions

### View Dispatch Details

1. Find job in Email Processing Log
2. Click **Preview** button
3. Use tabs to see Original Email vs Final Output

### Retry Failed Dispatch

1. Locate failed job (red badge)
2. Click **Retry** button
3. Wait for status update (30s)

### Check System Status

1. Open Dashboard
2. Check Service Health section
3. All green = healthy

### View Detailed Logs

1. Go to `/logs`
2. Filter by Error level for problems
3. Use Job ID to track specific dispatch

### Update Configuration

1. Go to `/settings`
2. Make changes
3. Click **Save Configuration**
4. Verify success message

---

## 🚨 Quick Troubleshooting

### Email Service Red 🔴

**Problem**: Can't connect to email
**Fix**:

1. Check internet connection
2. Verify credentials in Settings
3. For Gmail: Use app password

### Map Service Red 🔴

**Problem**: Can't generate maps
**Fix**:

1. Check internet connection
2. Verify API key at https://api.mapy.cz/
3. Check API quota not exceeded

### Printer Service Red 🔴

**Problem**: Can't reach printer
**Fix**:

1. Check printer is on
2. Check network connection
3. Verify printer name: `lpstat -p`
4. Test print: `echo "Test" | lp -d PrinterName`

### "GPS not found" Error

**Problem**: Can't extract coordinates
**Fix**:

1. Open Preview → Original Email
2. Verify email contains GPS (format: 50.0755, 14.4378)
3. If missing, contact dispatch center

### Job Stuck "Processing"

**Problem**: Job not completing
**Fix**:

1. Wait up to 5 minutes
2. Check Service Health
3. If still stuck: `sudo systemctl restart firefighter-alarm`

---

## 📋 Daily Checklist

### Morning (5 min)

- [ ] Open Dashboard
- [ ] All services green?
- [ ] Success rate > 95%?
- [ ] Retry any failed jobs
- [ ] Check printer paper/toner

### During Shift

- [ ] Monitor for red indicators
- [ ] Verify prints match dispatches

### End of Day

- [ ] Review Email Log
- [ ] Document issues
- [ ] Check daily success rate

---

## 📞 Emergency Contacts

**System Down**: Follow manual dispatch procedures

**Technical Support**:

- Name: **\*\***\_\_\_\_**\*\***
- Phone: **\*\***\_\_\_\_**\*\***
- Email: **\*\***\_\_\_\_**\*\***

**Vendor Support**:

- Mapy.cz: https://api.mapy.cz/
- CUPS: https://www.cups.org/

---

## 🔍 Error Code Quick Reference

| Code      | Meaning          | Quick Fix                   |
| --------- | ---------------- | --------------------------- |
| EMAIL_001 | Can't connect    | Check network, credentials  |
| EMAIL_002 | Auth failed      | Update password in Settings |
| GPS_001   | GPS not found    | Check email format          |
| MAP_001   | Map service down | Retry later                 |
| MAP_002   | Invalid API key  | Update in Settings          |
| PRINT_001 | Printer offline  | Check printer connection    |
| PRINT_003 | Out of paper     | Refill printer              |

**Full Error Code List**: See USER_GUIDE.md Appendix

---

## 💡 Pro Tips

**Auto-Refresh**: Dashboard updates every 30 seconds - no need to manually refresh

**Hover for Details**: Hover over badges and error text for full information

**Parallel Processing**: System handles multiple dispatches simultaneously

**Performance Target**: 95%+ success rate, < 30 seconds per dispatch

**Log Retention**: Logs kept for last 1000 entries or as configured

---

## 🔗 Quick Links

| Page          | URL          | Purpose              |
| ------------- | ------------ | -------------------- |
| **Dashboard** | `/dashboard` | Main monitoring page |
| **Settings**  | `/settings`  | System configuration |
| **Logs**      | `/logs`      | Detailed system logs |

---

## 📖 Documentation

**Detailed Guides**:

- **USER_GUIDE.md**: Complete operational manual
- **DEPLOYMENT.md**: Technical/installation guide
- **E2E_TESTING.md**: Testing procedures

---

## 🎯 Success Metrics

**Healthy System**:

- ✅ Success Rate: > 95%
- ✅ All Services: Green
- ✅ Processing Time: < 30 seconds
- ✅ Failed Jobs: < 5% of total

**Needs Attention**:

- ⚠️ Success Rate: 90-95%
- ⚠️ One Service: Yellow/Red
- ⚠️ Processing Time: 30-60 seconds

**Critical**:

- 🚨 Success Rate: < 90%
- 🚨 Multiple Services: Red
- 🚨 System Unresponsive

---

**Print this page and keep it near your workstation for quick reference**

**Version 1.0** | **Last Updated**: January 2025

---

## System Information (Fill In)

**Server Address**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Printer Name**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Station Coordinates**:

- Latitude: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Longitude: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Last Configuration Update**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Installation Date**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Installed By**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

**Notes**:

---

---

---
