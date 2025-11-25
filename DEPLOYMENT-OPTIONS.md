# Render Deployment Options

## ⚖️ Two Deployment Strategies

### Option 1: Two Services (Current `render.yaml`) ⭐ RECOMMENDED

**What it does:**
- Backend API: Web Service (Node.js)
- Frontend UI: Static Site (HTML/CSS/JS)

**Pros:**
- ✅ Frontend loads **instantly** (served by CDN)
- ✅ No cold starts for frontend
- ✅ Frontend stays fast even when backend sleeps
- ✅ Better for user experience
- ✅ Easy to scale independently

**Cons:**
- ❌ Uses 2 services (but still free)
- ❌ Need to configure API routing/rewrites

**Free Tier Usage:**
- Frontend: ~0 hours (static files)
- Backend: ~750 hours/month (spins down when idle)

**Cost:** FREE ✅

**Files to use:**
- `render.yaml` (already configured)

---

### Option 2: Single Service (`render-single.yaml`) 💰 SAVES MORE

**What it does:**
- One Node.js server serves both API and frontend files

**Pros:**
- ✅ Only 1 service = simpler
- ✅ No routing/rewrite configuration needed
- ✅ Single URL for everything
- ✅ Database persistence with disk storage
- ✅ Less configuration

**Cons:**
- ❌ Frontend also cold-starts with backend (30 sec wait)
- ❌ Frontend waits for backend to wake up
- ❌ Slightly more resource usage

**Free Tier Usage:**
- Single service: ~750 hours/month

**Cost:** FREE ✅

**Files to use:**
- `render-single.yaml` (just created)

---

## 📊 Comparison Table

| Feature | Two Services | Single Service |
|---------|-------------|----------------|
| Frontend Speed | ⚡ Instant | 🐌 30s cold start |
| Backend Speed | 🐌 30s cold start | 🐌 30s cold start |
| Setup Complexity | Medium | Easy |
| Free Tier | ✅ Both free | ✅ Free |
| URLs | 2 separate | 1 combined |
| Database Persistence | ⚠️ Ephemeral | ✅ With disk |
| Best For | Production | Simple/MVP |

---

## 🚀 How to Deploy

### Option 1: Two Services (Recommended)

1. Go to Render Dashboard
2. New → Blueprint
3. Select repo: `KasunJanith/agricultural-dataset-generator`
4. **Branch file**: Select `render.yaml`
5. Add `GEMINI_API_KEY` to backend
6. Deploy

**Result:**
- Backend: `https://agricultural-dataset-backend.onrender.com`
- Frontend: `https://agricultural-dataset-frontend.onrender.com`

---

### Option 2: Single Service

1. Go to Render Dashboard
2. New → Blueprint
3. Select repo: `KasunJanith/agricultural-dataset-generator`
4. **Branch file**: Select `render-single.yaml`
5. Add `GEMINI_API_KEY`
6. Deploy

**Result:**
- Everything: `https://agricultural-dataset-generator.onrender.com`

---

## 🎯 My Recommendation

**Use Option 1 (Two Services)** because:

1. **Better UX**: Users see your UI immediately, even if backend is sleeping
2. **Professional**: Industry standard architecture
3. **Free**: Doesn't cost more on free tier
4. **Scalable**: Easy to upgrade later

The 30-second backend cold start only affects API calls, not the UI load time.

---

## ⚡ Quick Deploy Guide (Single Service)

If you want to deploy as a single service right now:

1. **Rename the files:**
   ```bash
   mv render.yaml render-two-services.yaml
   mv render-single.yaml render.yaml
   ```

2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Switch to single service deployment"
   git push origin main
   ```

3. **Deploy on Render:**
   - Create Blueprint with `render.yaml`
   - Add `GEMINI_API_KEY`
   - Wait 5-10 minutes
   - Done! ✅

---

## 🔄 Switch Between Options Anytime

You can switch between deployment strategies by just renaming the files and redeploying. No code changes needed!

**Current Setup:**
- `render.yaml` → Two services
- `render-single.yaml` → Single service

**To switch:** Just rename which file is called `render.yaml`

---

## 💡 Bottom Line

**For your research project:** Either option works great on the free tier!

- Choose **Two Services** if you want the best user experience
- Choose **Single Service** if you want the simplest setup

Both are completely free! 🎉
