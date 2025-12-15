# 🚀 Groq API Setup Guide

## Why Groq?

✅ **Ultra-fast inference** - 10x faster than traditional APIs  
✅ **Free tier available** - Great for development and testing  
✅ **Llama 3.3 70B model** - High-quality, multilingual support  
✅ **Better for Sinhala** - Llama models often handle non-Latin scripts well  
✅ **JSON mode support** - Reliable structured output  

---

## 🔑 Get Your Groq API Key

### Step 1: Sign Up
1. Go to **https://console.groq.com/**
2. Click **Sign Up** (free account)
3. Verify your email

### Step 2: Generate API Key
1. Navigate to **https://console.groq.com/keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Agricultural Dataset Generator")
4. Copy the key immediately (it won't be shown again!)

### Step 3: Add to Your Project
1. Open `backend/.env` file
2. Replace `your_groq_api_key_here` with your actual key:
   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

---

## 🎯 Current Configuration

### Model Being Used
- **Model**: `llama-3.3-70b-versatile`
- **Provider**: Groq
- **Speed**: ~800 tokens/second
- **Max Output**: 8000 tokens per request
- **Temperature**: 0.9 (creative, diverse outputs)

### Why Llama 3.3 70B?
- ✅ Excellent multilingual performance (Sinhala support)
- ✅ Strong instruction following
- ✅ Good at generating structured JSON
- ✅ Free tier includes this model
- ✅ Fast inference on Groq's LPU chips

---

## 💰 Groq Free Tier Limits

**Current Free Tier (as of Dec 2024):**
- **Requests per day**: 14,400 requests/day
- **Requests per minute**: 30 requests/minute
- **Tokens per minute**: 20,000 tokens/minute

**For this project:**
- Each generation = 1 request
- Each request generates ~8000 tokens max
- **You can generate ~14,400 batches per day for FREE!**

That's **720,000 agricultural terms per day** (14,400 × 50 records)! 🎉

---

## 🔄 Alternative Groq Models

If you want to change the model, edit `backend/server.js` line ~214:

### Available Models:

#### 1. **llama-3.3-70b-versatile** (Current - RECOMMENDED)
```javascript
model: 'llama-3.3-70b-versatile'
```
- Best quality
- Excellent for multilingual
- 128K context window

#### 2. **llama-3.1-70b-versatile**
```javascript
model: 'llama-3.1-70b-versatile'
```
- Slightly older but still excellent
- Very fast
- Good multilingual support

#### 3. **llama-3.1-8b-instant**
```javascript
model: 'llama-3.1-8b-instant'
```
- Fastest option
- Lower quality for complex tasks
- Good for simple translations

#### 4. **mixtral-8x7b-32768**
```javascript
model: 'mixtral-8x7b-32768'
```
- Good alternative
- Mixture of experts model
- Fast and efficient

---

## 🛠️ Testing Your Setup

### 1. Check Environment Variable
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.GROQ_API_KEY ? '✅ API Key loaded' : '❌ No API key');"
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📊 Agricultural Dataset Generator
🌐 Environment: development
```

### 3. Test Health Endpoint
Open browser: http://localhost:5000/api/health

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "environment": "development"
}
```

### 4. Start Frontend & Generate
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 and click **"Generate 50 Random Records"**

---

## 📊 Comparison: Groq vs Gemini

| Feature | Groq (Llama 3.3) | Gemini 2.5 Flash |
|---------|------------------|------------------|
| **Speed** | ⚡ 800 tokens/sec | 🐌 ~100 tokens/sec |
| **Free Tier** | ✅ 14,400 requests/day | ✅ 1,500 requests/day |
| **Sinhala Support** | ✅ Good | ✅ Excellent |
| **JSON Mode** | ✅ Native support | ⚠️ Text parsing needed |
| **Cost** | 💵 Free tier generous | 💵 Free tier limited |
| **Output Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Infrastructure** | LPU (custom chips) | Google TPUs |

**Verdict for this project**: Groq is better for:
- 🚀 Speed (10x faster generation)
- 💰 Cost (more free requests)
- 🔧 Reliability (JSON mode)
- 📈 Scalability (build datasets faster)

---

## 🐛 Troubleshooting

### Error: "GROQ_API_KEY environment variable is required"
**Solution**: 
1. Make sure `.env` file exists in `backend/` folder
2. Check the key is set correctly: `GROQ_API_KEY=gsk_...`
3. Restart the server

### Error: "Rate limit exceeded"
**Solution**: 
- You've hit the free tier limit
- Wait 1 minute (30 requests/min limit)
- Or upgrade to paid tier

### Error: "Invalid API key"
**Solution**:
1. Check your key at https://console.groq.com/keys
2. Make sure there are no extra spaces in `.env`
3. Regenerate a new key if needed

### Error: "No array found in response"
**Solution**:
- The model didn't return proper JSON
- Check the console logs for the raw response
- Might be a temporary model issue - try again

---

## 🚀 For Deployment (Render)

When deploying to Render, add environment variable:

**Dashboard → Your Service → Environment**

```
Key: GROQ_API_KEY
Value: gsk_your_actual_groq_key_here
```

---

## 📚 Resources

- **Groq Console**: https://console.groq.com/
- **API Keys**: https://console.groq.com/keys
- **Groq Docs**: https://console.groq.com/docs
- **Llama 3.3 Info**: https://www.llama.com/
- **Rate Limits**: https://console.groq.com/settings/limits

---

## ✅ Summary

**Before (Gemini)**:
- Model: `gemini-2.5-flash`
- Speed: ~100 tokens/sec
- Free: 1,500 requests/day

**After (Groq)**:
- Model: `llama-3.3-70b-versatile`
- Speed: ~800 tokens/sec ⚡
- Free: 14,400 requests/day 🎉

**Result**: 10x faster generation, 9x more free requests! Perfect for building large ML datasets quickly.

---

Generated: December 11, 2025
