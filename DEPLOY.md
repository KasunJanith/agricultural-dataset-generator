# Quick Render Deployment Guide

## Deploying to Render.com

### Method 1: Automatic (Using render.yaml) ⭐ RECOMMENDED

1. **Push your code to GitHub** (already done! ✅)

2. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub

3. **Create New Blueprint**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository: `KasunJanith/agricultural-dataset-generator`
   - Render will automatically detect `render.yaml`
   - Click "Apply"

4. **Configure Environment Variables**
   - Go to the backend service settings
   - Add environment variable:
     - Key: `GEMINI_API_KEY`
     - Value: Your Google Gemini API key

5. **Deploy!**
   - Render will automatically build and deploy both services
   - Wait for both builds to complete (5-10 minutes)

### Method 2: Manual Deployment

#### Deploy Backend Service:

1. Click "New +" → "Web Service"
2. Connect GitHub repo
3. Configure:
   - Name: `agricultural-dataset-backend`
   - Root Directory: Leave blank
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. Add environment variable:
   - `GEMINI_API_KEY`: Your API key
5. Create Web Service

#### Deploy Frontend (Static Site):

1. Click "New +" → "Static Site"
2. Connect same GitHub repo
3. Configure:
   - Name: `agricultural-dataset-frontend`
   - Root Directory: Leave blank
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
4. Create Static Site

#### Connect Frontend to Backend:

After both are deployed, you need to update the frontend to point to the backend:

**Option A: Using Render Rewrites** (in Static Site settings):
- Add rewrite rule:
  - Source: `/api/*`
  - Destination: `https://your-backend-url.onrender.com/api/:splat`

**Option B: Update Frontend Code**
- Set `VITE_API_URL` environment variable in Static Site
- Or hardcode the backend URL in axios calls

## Important Notes

- ✅ First deployment takes 5-10 minutes
- ✅ Free tier spins down after 15 min of inactivity (30 sec cold start)
- ✅ SQLite database persists but gets reset on redeploy (use external DB for production)
- ✅ Make sure to add `GEMINI_API_KEY` environment variable!

## Troubleshooting Render Deployments

### "sh: 1: vite: not found"
✅ FIXED! The render.yaml now properly installs dependencies.

### Build fails
- Check that both `package.json` files are committed
- Verify `render.yaml` is in the root directory
- Check build logs for specific errors

### Backend health check fails
- Verify `GEMINI_API_KEY` is set
- Check backend logs for errors
- Ensure port binding works (Render provides PORT env var)

### Frontend can't connect to backend
- Verify rewrite rules in Static Site settings
- Or set `VITE_API_URL` environment variable
- Check CORS is enabled in backend

## URLs After Deployment

- Backend: `https://agricultural-dataset-backend.onrender.com`
- Frontend: `https://agricultural-dataset-frontend.onrender.com`
- API Health: `https://agricultural-dataset-backend.onrender.com/api/health`

## Free Tier Limits

- 750 hours/month (shared across all services)
- Automatic spin-down after 15 minutes inactivity
- 30 second cold start time
- Consider upgrading if you need 24/7 availability

---

Need help? Check the full README.md for detailed documentation!
