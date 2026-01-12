# Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (GitHub Pages)                      │
│              https://username.github.io/pong                 │
│                   Static HTML/CSS/JS                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebSocket + REST API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Railway)                            │
│          https://pong-server.up.railway.app                  │
│              Node.js + Express + Socket.io                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ PostgreSQL Connection
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE (Supabase)                          │
│            PostgreSQL + Real-time subscriptions              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Deploy Database (Supabase)

Already covered in `04-database.md`. After setup, you should have:

- ✅ Supabase project created
- ✅ Database schema applied
- ✅ Three credentials saved:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`

---

## Step 2: Deploy Backend (Railway)

### Option A: Using Railway Dashboard (Easiest)

1. Go to https://railway.app and sign up (free tier: $5/month credit)

2. Click **"New Project"** → **"Deploy from GitHub repo"**

3. Select your repository and the `server/` directory

4. Railway auto-detects Node.js and sets up build

5. Go to **Settings → Variables** and add:
   ```
   FRONTEND_URL=https://yourusername.github.io/pong-game
   SUPABASE_URL=https://yourproject.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   ```

6. Go to **Settings → Networking → Generate Domain**
   - You'll get a URL like: `https://pong-server-production.up.railway.app`

7. Save this URL - you'll need it for the frontend config

### Option B: Using Railway CLI

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to server directory
cd server/

# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set FRONTEND_URL=https://yourusername.github.io/pong-game
railway variables set SUPABASE_URL=https://yourproject.supabase.co
railway variables set SUPABASE_SERVICE_KEY=eyJ...

# Generate domain
railway domain
```

### Verify Backend Deployment

Visit your Railway URL in a browser:
```
https://pong-server-production.up.railway.app/
```

You should see:
```json
{
  "status": "Pong server running",
  "players": 0,
  "rooms": 0,
  "queue": 0
}
```

---

## Step 3: Configure Frontend

Update the frontend config with your backend URL:

```javascript
// js/config.js
const CONFIG = {
  BACKEND_URL: 'https://pong-server-production.up.railway.app',
  SUPABASE_URL: 'https://yourproject.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...'  // Public key only!
};
```

**⚠️ Never put SUPABASE_SERVICE_KEY in frontend code!**

---

## Step 4: Deploy Frontend (GitHub Pages)

### If you created a new repository:

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/pong-game.git
   git push -u origin main
   ```

2. Go to your repo on GitHub → **Settings** → **Pages**

3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`

4. Click **Save**

5. Wait 1-2 minutes for deployment

6. Your game is live at: `https://yourusername.github.io/pong-game/`

### For automatic deployments:

Every time you push to `main`, GitHub Pages will automatically redeploy.

---

## Step 5: Update CORS Settings

Make sure your Railway backend allows your GitHub Pages URL:

In `server/index.js`, verify the CORS config includes your frontend URL:

```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST']
}));

const io = new Server(httpServer, {
  cors: {
    origin: [
      FRONTEND_URL,
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ],
    methods: ['GET', 'POST']
  }
});
```

---

## Environment Variables Reference

### Railway (Backend) - REQUIRED

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `PORT` | `3001` | Auto-set by Railway |
| `FRONTEND_URL` | `https://user.github.io/pong` | Your GitHub Pages URL |
| `SUPABASE_URL` | `https://abc123.supabase.co` | From Supabase dashboard |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | **SECRET** - service role key |

### Frontend (config.js) - PUBLIC

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `BACKEND_URL` | `https://app.up.railway.app` | Railway app URL |
| `SUPABASE_URL` | `https://abc123.supabase.co` | From Supabase dashboard |
| `SUPABASE_ANON_KEY` | `eyJ...` | Public anon key (safe) |

---

## Testing the Full Stack

### 1. Test Backend Health
```bash
curl https://your-app.up.railway.app/
# Should return: {"status":"Pong server running",...}
```

### 2. Test Leaderboard API
```bash
curl https://your-app.up.railway.app/api/leaderboard
# Should return: [] or list of players
```

### 3. Test WebSocket Connection
Open browser console on your frontend:
```javascript
const socket = io('https://your-app.up.railway.app');
socket.on('connect', () => console.log('Connected!'));
// Should log: "Connected!"
```

### 4. Test Full Flow
1. Open game in two browser tabs
2. Register with different usernames
3. Create room in tab 1, join with code in tab 2
4. Play a match
5. Check leaderboard updates

---

## Troubleshooting

### "WebSocket connection failed"

1. Check Railway logs for errors
2. Verify CORS settings include your frontend URL
3. Ensure `FRONTEND_URL` env var is set correctly

### "Failed to connect to server"

1. Verify Railway app is running (check dashboard)
2. Check if free tier credits are exhausted
3. Try the health check endpoint manually

### "Leaderboard not updating"

1. Check Supabase dashboard for errors
2. Verify `SUPABASE_SERVICE_KEY` is correct on Railway
3. Check Railway logs for database errors

### CORS Errors

Make sure:
- Frontend URL in Railway env vars should NOT have a trailing slash (e.g., `https://username.github.io/pong` not `https://username.github.io/pong/`)
- URL matches exactly (https vs http, www vs no-www)
- **Note**: GitHub Pages root URLs naturally have a trailing slash when accessed (e.g., navigating to `https://username.github.io/pong/` in browser), but the CORS origin should be specified without it in the backend configuration.

### Railway Deployment Failing

1. Check `package.json` has correct `start` script
2. Ensure `engines.node` specifies Node 18+
3. Check Railway build logs for npm errors

---

## Cost Summary

| Service | Free Tier | Paid (if exceeded) |
|---------|-----------|-------------------|
| **GitHub Pages** | Unlimited static hosting | N/A |
| **Railway** | $5/month credit (varies by usage) | $0.01/hr + resources |
| **Supabase** | 500MB, unlimited API | $25/month |

**Note**: Railway pricing and free tier limits may change. Verify current pricing at [railway.app/pricing](https://railway.app/pricing). The $5/month credit typically covers hobby projects with moderate usage (~500 hours of uptime), but actual usage depends on compute resources and traffic.

**Total for hobby project**: $0/month (within free tiers for typical usage)

---

## Final URLs

After deployment, you should have:

```
Frontend:    https://yourusername.github.io/pong-game/
Backend:     https://pong-server-production.up.railway.app/
Health:      https://pong-server-production.up.railway.app/
Leaderboard: https://pong-server-production.up.railway.app/api/leaderboard
Database:    https://yourproject.supabase.co (dashboard)
```

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What is Railway's free tier credit per month?
2. What endpoint can you visit to verify the backend is running?
3. What environment variable must NEVER be exposed in frontend code?
4. In GitHub Pages settings, what branch and folder should be selected?

**Response Format:**
```
07-deployment.md verified ✓
Answers: [Railway free: $___/month] | [Health endpoint: ___] | [Secret var: ___] | [GitHub Pages: branch ___, folder ___]
```
