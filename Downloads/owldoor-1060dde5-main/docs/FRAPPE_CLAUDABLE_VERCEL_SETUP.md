# Configuration Guide: Frappe, Claudable, and Vercel

This guide explains how to set up and configure Frappe, Claudable, and Vercel integrations for your admin dashboard.

---

## 1. Frappe Designer Setup

### What is Frappe?
Frappe Framework is a full-stack web framework built on Python. It includes Frappe Desk (a low-code platform) and other applications.

### Option A: Use Public Frappe Instance (Quick Start)
If you just want to try it out, you can use the default public URL (already configured). No setup needed!

### Option B: Self-Host Frappe (Recommended for Production)

#### Step 1: Install Frappe Framework
```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y python3-dev python3-pip python3-venv git curl

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MariaDB
sudo apt-get install -y mariadb-server mariadb-client

# Install Redis
sudo apt-get install -y redis-server

# Install Bench CLI
sudo pip3 install frappe-bench
```

#### Step 2: Create a New Site
```bash
# Initialize bench
bench init frappe-bench --frappe-branch version-14
cd frappe-bench

# Create a new site
bench new-site mysite.local

# Get your site URL (usually http://localhost:8000 or your domain)
```

#### Step 3: Configure Environment Variable
Add to your `.env.local` file:
```bash
VITE_FRAPPE_URL=http://your-frappe-instance.com/?embed=1
```

**For local development:**
```bash
VITE_FRAPPE_URL=http://localhost:8000/?embed=1
```

**For production:**
```bash
VITE_FRAPPE_URL=https://frappe.yourdomain.com/?embed=1
```

#### Step 4: Access in Admin Panel
Navigate to: `/admin?view=frappe` in your application.

---

## 2. Claudable Builder Setup

### What is Claudable?
Claudable is a visual builder tool for creating admin and marketing experiences. It's an embeddable iframe-based design tool.

### Option A: Use Public Claudable Sandbox (Quick Start)
The default public sandbox is already configured. No setup needed for testing!

### Option B: Self-Host Claudable (Recommended for Production)

#### Step 1: Clone Claudable Repository
```bash
git clone https://github.com/opactorai/Claudable.git
cd Claudable
```

#### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

#### Step 3: Configure and Run
```bash
# Set up environment variables (see Claudable README)
cp .env.example .env

# Start development server
npm run dev
# or
yarn dev
```

#### Step 4: Deploy Claudable
You can deploy Claudable to:
- **Vercel**: `vercel deploy`
- **Netlify**: Connect your GitHub repo
- **Your own server**: Use PM2 or similar process manager

#### Step 5: Configure Environment Variable
Add to your `.env.local` file:
```bash
VITE_CLAUDABLE_URL=https://your-claudable-instance.vercel.app/?embed=1
```

**For local development:**
```bash
VITE_CLAUDABLE_URL=http://localhost:3000/?embed=1
```

**For production:**
```bash
VITE_CLAUDABLE_URL=https://claudable.yourdomain.com/?embed=1
```

**Important:** Always include `?embed=1` at the end of the URL for proper iframe embedding.

#### Step 6: Access in Admin Panel
Navigate to: `/admin?view=claudable` in your application.

---

## 3. Vercel Site Editor Setup

### What is Vercel?
Vercel is a platform for deploying frontend applications. The Vercel Site Editor allows you to manage your Vercel projects directly from your admin panel.

### Option A: Configure Token in Admin Panel (Easiest)

#### Step 1: Get Your Vercel API Token
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "Admin Panel Access")
4. Set expiration (or leave as "No expiration")
5. Click "Create Token"
6. **Copy the token immediately** (you won't see it again!)

#### Step 2: Configure in Admin Panel
1. Navigate to `/admin?view=vercel` in your application
2. Click the "Configure" button
3. Paste your Vercel token
4. Click "Save Token"

The token will be stored securely in your browser's localStorage.

### Option B: Set Environment Variable (For Team Use)

#### Step 1: Get Your Vercel API Token
Follow the same steps as Option A, Step 1.

#### Step 2: Add to Environment Variables
Add to your `.env.local` file:
```bash
VITE_VERCEL_TOKEN=your_vercel_token_here
```

**For Vercel Deployment:**
Add the environment variable in Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `VITE_VERCEL_TOKEN` with your token value
4. Select environments (Production, Preview, Development)

**For Local Development:**
Add to `.env.local`:
```bash
VITE_VERCEL_TOKEN=vercel_xxxxxxxxxxxxx
```

#### Step 3: Access in Admin Panel
Navigate to: `/admin?view=vercel` in your application.

### Features Available:
- ✅ View all your Vercel projects
- ✅ See recent deployments
- ✅ Access production and preview URLs
- ✅ Quick links to Vercel dashboard
- ✅ View deployment status

---

## Complete Environment File Example

Here's a complete `.env.local` example with all three configured:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_HCAPTCHA_SITE_KEY=your-hcaptcha-key

# Frappe Configuration
VITE_FRAPPE_URL=https://frappe.yourdomain.com/?embed=1

# Claudable Configuration
VITE_CLAUDABLE_URL=https://claudable.yourdomain.com/?embed=1

# Vercel Configuration (optional - can also set in UI)
VITE_VERCEL_TOKEN=vercel_xxxxxxxxxxxxx
```

---

## Quick Setup Checklist

### Frappe
- [ ] Decide: Use public instance or self-host?
- [ ] If self-hosting: Install Frappe Framework
- [ ] Set `VITE_FRAPPE_URL` in `.env.local`
- [ ] Restart dev server: `npm run dev`
- [ ] Access at `/admin?view=frappe`

### Claudable
- [ ] Decide: Use public sandbox or self-host?
- [ ] If self-hosting: Clone and deploy Claudable
- [ ] Set `VITE_CLAUDABLE_URL` in `.env.local` (with `?embed=1`)
- [ ] Restart dev server: `npm run dev`
- [ ] Access at `/admin?view=claudable`

### Vercel
- [ ] Get Vercel API token from [vercel.com/account/tokens](https://vercel.com/account/tokens)
- [ ] Either:
  - Set `VITE_VERCEL_TOKEN` in `.env.local`, OR
  - Configure directly in admin panel at `/admin?view=vercel`
- [ ] Restart dev server if using env variable
- [ ] Access at `/admin?view=vercel`

---

## Troubleshooting

### Frappe/Claudable Not Loading
- Check that the URL includes `?embed=1`
- Verify the instance is accessible (try opening the URL directly)
- Check browser console for CORS errors
- Ensure the iframe sandbox permissions are correct

### Vercel Token Not Working
- Verify token hasn't expired
- Check token has correct permissions
- Try regenerating the token
- Check browser console for API errors

### Environment Variables Not Loading
- Restart your dev server after changing `.env.local`
- Verify variable names start with `VITE_`
- Check for typos in variable names
- Clear browser cache if needed

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Vercel Token**: This is sensitive! Never commit it to git. Use environment variables or configure in UI.
2. **Frappe/Claudable URLs**: These are public URLs, but ensure your instances have proper authentication if they contain sensitive data.
3. **Environment Files**: Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## Need Help?

- **Frappe**: [frappeframework.com/docs](https://frappeframework.com/docs)
- **Claudable**: [GitHub Repository](https://github.com/opactorai/Claudable)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

