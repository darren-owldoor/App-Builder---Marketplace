# 📱 iMessage Integration with Apple Shortcuts

**Complete Setup Guide for OwlDoor Recruiters**

---

## 🎯 Overview

This integration allows you to send and receive iMessages directly through OwlDoor without using Twilio. Messages sync bidirectionally between OwlDoor and your Mac/iPhone.

### What You'll Need:
- Mac (macOS 12+) or iPhone (iOS 15+)
- Apple Shortcuts app (pre-installed)
- iMessage enabled
- OwlDoor account with iMessage integration enabled

---

## ⚡ Quick Setup (15 minutes)

### Step 1: Get Your API Credentials (2 min)

1. Log into OwlDoor
2. Go to **Settings → Integrations → iMessage**
3. Click **"Generate Secret Token"**
4. Copy these values:
   - **API Base URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1`
   - **Secret Token**: (your unique token)
   - **Device ID**: Your phone number in E.164 format (e.g., `+15555551234`)

---

### Step 2: Install the Shortcuts (5 min)

#### Download the Shortcut Bundle

1. **Download**: [OwlDoor iMessage Shortcuts.zip](#) *(link provided by admin)*
2. **Unzip** the file
3. **Double-click** each `.shortcut` file to install:
   - `OwlDoor Setup.shortcut`
   - `OwlDoor Send Messages.shortcut`
   - `OwlDoor Forward Message.shortcut`

#### Configure Once

1. Run **"OwlDoor Setup"** shortcut
2. When prompted, enter:
   - API Base URL (from Step 1)
   - Secret Token (from Step 1)
   - Device ID (your phone number)

✅ These are saved securely and you won't need to enter them again!

---

### Step 3: Mac-Specific Setup (macOS only, 4 min)

#### Install AppleScript

1. Download `sendMessage.applescript` from the bundle
2. Save to: `/Users/YOUR_USERNAME/OwlDoor/scripts/sendMessage.applescript`
3. Open **Terminal** and run:
```bash
mkdir -p ~/OwlDoor/scripts
chmod +x ~/OwlDoor/scripts/sendMessage.applescript
```

#### Enable Quick Actions

1. Open **System Settings → Keyboard → Keyboard Shortcuts → Services**
2. Find **"OwlDoor Forward Message"**
3. Check the box to enable it
4. Now you can right-click any message → **Services** → **OwlDoor Forward Message**

---

### Step 4: Automate Sending (3 min)

#### Mac: Auto-Run on Login

1. Open **Shortcuts** app
2. Right-click **"OwlDoor Send Messages"**
3. Click **"Add to Dock"** for manual use, OR:
4. Create automation:
   - Click **"Automation"** tab
   - **"+"** → **"Time of Day"**
   - Set to run every **5 minutes**
   - Choose **"OwlDoor Send Messages"**

#### iPhone: Add to Home Screen

1. Open **Shortcuts** app
2. Long-press **"OwlDoor Send Messages"**
3. Select **"Add to Home Screen"**
4. Tap icon to manually check for new messages

---

## 🔄 How It Works

### Sending Messages (OwlDoor → iMessage)

1. You compose a message in OwlDoor dashboard
2. Message is queued in the database
3. Your Shortcut runs (automatically or manually)
4. Shortcut fetches pending messages via API
5. AppleScript sends via iMessage app
6. Status updates back to OwlDoor (sent/failed)

### Receiving Messages (iMessage → OwlDoor)

#### Method 1: Quick Action (Mac)
1. Receive iMessage from a lead
2. Right-click message → **Services** → **OwlDoor Forward Message**
3. Message syncs to OwlDoor instantly

#### Method 2: Share Sheet (iPhone)
1. Receive iMessage
2. Long-press message → **Share**
3. Select **"OwlDoor Forward Message"**
4. Message syncs to OwlDoor

---

## 🧪 Testing Your Setup

### Test Outgoing:

1. In OwlDoor, create a test message to your own number
2. Run **"OwlDoor Send Messages"** shortcut
3. You should receive the message via iMessage
4. Check OwlDoor dashboard - status should show "Sent"

### Test Incoming:

1. Send yourself an iMessage from another device
2. Use Quick Action/Share to forward it
3. Check OwlDoor dashboard - message should appear in conversation

---

## 📋 Shortcut Details

### 1. OwlDoor Setup
**Purpose**: One-time configuration  
**When to run**: First install, or to update credentials

### 2. OwlDoor Send Messages
**Purpose**: Send pending messages from OwlDoor  
**When to run**: Automatically (every 5 min) or manually  
**What it does**:
- Fetches up to 5 pending messages
- Sends via iMessage
- Updates status in OwlDoor

### 3. OwlDoor Forward Message
**Purpose**: Forward incoming iMessages to OwlDoor  
**When to run**: Right-click any message  
**What it does**:
- Captures sender phone & message text
- POSTs to OwlDoor API
- Links to lead if phone number matches

---

## 🛠️ Troubleshooting

### "Invalid secret" error
- Re-run **"OwlDoor Setup"** and check you copied the full token
- Verify token is active in OwlDoor Settings

### Messages not sending
- Check you have full disk access for Shortcuts (Mac only)
- Verify `sendMessage.applescript` is in correct location
- Ensure iMessage is signed in

### Incoming messages not appearing
- Check the phone number format matches E.164 (+1XXXXXXXXXX)
- Verify lead exists in OwlDoor with that phone number
- Check API logs in OwlDoor Settings

### Shortcut won't install
- Make sure you're running macOS 12+ or iOS 15+
- Try downloading individual `.shortcut` files instead of zip

---

## 🔐 Security Notes

- **Secret Token**: Never share this! It's unique to your account
- **Device ID**: Used to route messages to the right user
- **Credentials**: Stored locally on your device only
- **Revoke Access**: Go to OwlDoor Settings → Integrations → Revoke Token

---

## 📞 Support

Need help? Contact your OwlDoor admin or check:
- **Documentation**: https://docs.owldoor.com/imessage
- **Support Email**: hello@owldoor.com
- **Setup Video**: [Link to video tutorial]

---

## 🎬 Next Steps

1. ✅ Complete setup above
2. Test with your own number
3. Start messaging leads through OwlDoor!
4. Set up automation for hands-free operation

**Pro Tip**: Run "OwlDoor Send Messages" manually a few times before enabling automation to ensure everything works smoothly.
