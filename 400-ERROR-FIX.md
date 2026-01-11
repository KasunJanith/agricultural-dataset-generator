# 🔧 400 Bad Request Error - Troubleshooting Guide

## Error Details

```
POST http://localhost:5000/api/generate-batch 400 (Bad Request)
```

## Root Cause

The backend is returning **400 Bad Request** because the `subdomain` field is **empty or missing** in the request.

### Backend Validation:
```javascript
if (!subdomain) {
  return res.status(400).json({ error: 'Subdomain is required' });
}
```

---

## Why This Happens

### Scenario 1: Backend Not Running ❌
If the backend server isn't running, the frontend can't fetch the list of subdomains, so `subdomain` stays empty.

### Scenario 2: Subdomains Not Loading ❌
If `/api/subdomains` endpoint fails, the dropdown stays empty and no subdomain is selected.

### Scenario 3: Timing Issue ⚠️
Trying to generate before the subdomains have finished loading from the API.

---

## ✅ Solution Steps

### Step 1: Check if Backend is Running

Open a terminal and check if server is running:
```cmd
cd d:\Research\agricultural-dataset-generator\backend
node server.js
```

**Expected output:**
```
Connected to SQLite database
🚀 Server running on port 5000
📊 Agricultural Dataset Generator
🌐 Environment: development
🔗 Health check: http://localhost:5000/api/health
```

**If not running:**
- The server crashed or wasn't started
- Start it with `node server.js`

### Step 2: Test Backend Endpoints

Open browser and test:

**Health Check:**
```
http://localhost:5000/api/health
```
Should return: `{"status":"ok"}`

**Subdomains:**
```
http://localhost:5000/api/subdomains
```
Should return array:
```json
[
  "crop_cultivation",
  "livestock_management",
  "soil_science",
  "irrigation",
  "pest_management",
  "organic_farming",
  "agricultural_machinery",
  "crop_protection",
  "harvesting",
  "post_harvest_technology"
]
```

**If endpoints fail:**
- Backend isn't running properly
- Check for errors in backend console

### Step 3: Check Frontend Console

Open browser DevTools (F12) → Console tab

Look for these messages:
```javascript
// Should see:
console.log('Sending request with subdomain:', subdomain);

// If subdomain is empty string '' or undefined:
// → That's the problem!
```

### Step 4: Wait for Subdomains to Load

After starting the frontend:
1. Wait 2-3 seconds for subdomains to load
2. Check if dropdown is populated
3. Verify a subdomain is selected (should show first one by default)
4. Then try generating

---

## 🔍 Enhanced Error Handling (Already Applied)

I've added better validation to the frontend:

```javascript
// New validation check:
if (!subdomain) {
  setError('Please select a subdomain first. Wait for subdomains to load.')
  return
}

// New console logging:
console.log('Sending request with subdomain:', subdomain);
console.error('Generation error:', err);
console.error('Error response:', err.response?.data);
```

---

## 🚀 Quick Fix

### If Backend Was Not Running:

**Terminal 1 (Backend):**
```cmd
cd d:\Research\agricultural-dataset-generator\backend
node server.js
```

Wait for:
```
Connected to SQLite database
🚀 Server running on port 5000
```

**Terminal 2 (Frontend):**
```cmd
cd d:\Research\agricultural-dataset-generator\frontend
npm run dev
```

Wait for:
```
  ➜  Local:   http://localhost:5173/
```

**Then:**
1. Open http://localhost:5173
2. Wait 2-3 seconds for page to load
3. Check subdomain dropdown is populated
4. Click "Generate 100 Records"
5. Should work! ✅

---

## 🔍 Check Backend Console for Errors

If backend is running but still getting 400:

Look for errors in backend console:
- ❌ `GEMINI_API_KEY environment variable is required`
- ❌ `Error opening database`
- ❌ Model errors
- ❌ Network issues

---

## ✅ Verification Checklist

- [ ] Backend server is running (`node server.js`)
- [ ] Backend shows "Server running on port 5000"
- [ ] Frontend is running (`npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Subdomain dropdown shows options
- [ ] A subdomain is selected (default: first one)
- [ ] Browser console shows no errors
- [ ] Health check endpoint works: http://localhost:5000/api/health

---

## 💡 Most Common Fix

**90% of the time, it's this:**

1. Backend wasn't restarted after code changes
2. Solution: Stop backend (Ctrl+C) and restart:
   ```cmd
   cd d:\Research\agricultural-dataset-generator\backend
   node server.js
   ```

---

## 🎯 Summary

**Error**: 400 Bad Request  
**Cause**: Empty subdomain in request  
**Why**: Backend not running OR subdomains not loading  
**Fix**: Restart backend, wait for subdomains to load  

**Try this now:**
1. Restart backend server
2. Refresh frontend page
3. Wait 3 seconds
4. Try generating again

Should work! 🚀
