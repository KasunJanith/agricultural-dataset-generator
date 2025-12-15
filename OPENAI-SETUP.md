# 🤖 OpenAI GPT-4o-mini Setup Guide

## Why GPT-4o-mini?

✅ **Excellent multilingual support** - Strong Sinhala language capabilities  
✅ **Cost-effective** - 15x cheaper than GPT-4  
✅ **Fast inference** - Quick response times  
✅ **High quality** - Advanced reasoning and instruction following  
✅ **JSON mode** - Reliable structured output  
✅ **Large context** - 128K token context window  

---

## 🔑 Get Your OpenAI API Key

### Step 1: Sign Up
1. Go to **https://platform.openai.com/signup**
2. Create an account (you'll get $5 free credits to start!)
3. Verify your email and phone number

### Step 2: Add Payment Method (Required after free credits)
1. Go to **https://platform.openai.com/settings/organization/billing**
2. Add a payment method
3. Set usage limits to control costs

### Step 3: Generate API Key
1. Navigate to **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Give it a name (e.g., "Agricultural Dataset Generator")
4. Copy the key immediately (starts with `sk-...`)
5. **Store it securely** - it won't be shown again!

### Step 4: Add to Your Project
1. Open `backend/.env` file
2. Replace `your_openai_api_key_here` with your actual key:
   ```env
   OPENAI_API_KEY=sk-proj-your_actual_key_here
   ```

---

## 🎯 Current Configuration

### Model Being Used
- **Model**: `gpt-4o-mini`
- **Provider**: OpenAI
- **Max Output**: 8000 tokens per request
- **Temperature**: 0.9 (creative, diverse outputs)
- **Context Window**: 128K tokens

### Why GPT-4o-mini?
- ✅ Optimized for multilingual tasks (excellent Sinhala support)
- ✅ Fast and efficient (better than GPT-3.5-turbo)
- ✅ Cost-effective ($0.15 per 1M input tokens, $0.60 per 1M output tokens)
- ✅ Strong instruction following
- ✅ Latest OpenAI technology (released July 2024)

---

## 💰 OpenAI Pricing

### GPT-4o-mini Costs (December 2024)
- **Input**: $0.150 per 1M tokens
- **Output**: $0.600 per 1M tokens

### For This Project:
Each generation request (~50 records):
- **Input**: ~2,000 tokens (prompt) = $0.0003
- **Output**: ~6,000 tokens (JSON response) = $0.0036
- **Total per request**: ~$0.0039 (~0.4 cents)

**Example Cost Calculation:**
- Generate 1,000 records (20 requests × 50): ~$0.08
- Generate 10,000 records (200 requests × 50): ~$0.78
- Generate 100,000 records (2,000 requests × 50): ~$7.80

**Very affordable for research!** 🎉

### Free Credits
- New accounts get **$5 in free credits**
- Valid for 3 months
- Enough to generate **~65,000 records for free!**

---

## 🔄 Alternative OpenAI Models

If you want to change the model, edit `backend/server.js` around line 214:

### 1. **gpt-4o-mini** (Current - RECOMMENDED for this project)
```javascript
model: 'gpt-4o-mini'
```
- **Best balance**: Quality + Speed + Cost
- **Use for**: Production dataset generation
- **Cost**: $0.15/$0.60 per 1M tokens

### 2. **gpt-4o** (Premium)
```javascript
model: 'gpt-4o'
```
- **Highest quality** OpenAI model
- **Use for**: Maximum accuracy needs
- **Cost**: $2.50/$10.00 per 1M tokens (16x more expensive)

### 3. **gpt-3.5-turbo** (Budget)
```javascript
model: 'gpt-3.5-turbo'
```
- **Cheapest option**
- **Use for**: Simple tasks, high volume
- **Cost**: $0.50/$1.50 per 1M tokens
- **Note**: Lower quality for complex multilingual tasks

---

## 🛠️ Testing Your Setup

### 1. Check Environment Variable
```cmd
cd backend
node -e "require('dotenv').config(); console.log(process.env.OPENAI_API_KEY ? '✅ API Key loaded' : '❌ No API key');"
```

### 2. Start Backend
```cmd
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
```cmd
cd frontend
npm run dev
```

Open http://localhost:5173 and click **"Generate 50 Random Records"**

---

## 📊 Comparison: GPT-4o-mini vs Others

| Feature | GPT-4o-mini | Groq (Llama 3.3) | Gemini 2.5 Flash |
|---------|-------------|------------------|------------------|
| **Speed** | ⚡ Fast (~200 tokens/sec) | ⚡⚡⚡ Very Fast (~800 tokens/sec) | ⚡⚡ Fast (~300 tokens/sec) |
| **Sinhala Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **JSON Reliability** | ⭐⭐⭐⭐⭐ Native support | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Manual parsing |
| **Cost** | 💵 $0.0039/request | 🆓 Free tier generous | 🆓 Free tier limited |
| **Context Window** | 128K tokens | 128K tokens | 2M tokens |
| **Instruction Following** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best For** | Production + Research | High-volume free use | Google ecosystem |

**Verdict for this project**: 
- **Free testing**: Use Groq (more free requests)
- **Production/Research**: Use GPT-4o-mini (best quality/cost balance)
- **Maximum quality**: Use Gemini 2.5 Flash (if free tier sufficient)

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY environment variable is required"
**Solution**: 
1. Make sure `.env` file exists in `backend/` folder
2. Check the key is set correctly: `OPENAI_API_KEY=sk-...`
3. Restart the server

### Error: "Incorrect API key provided"
**Solution**:
1. Verify your key at https://platform.openai.com/api-keys
2. Make sure you copied the entire key (starts with `sk-proj-` or `sk-`)
3. Check for extra spaces in `.env` file
4. Generate a new key if needed

### Error: "You exceeded your current quota"
**Solution**:
- You've used all your free credits
- Add a payment method at https://platform.openai.com/settings/organization/billing
- Or wait for credits to renew (if on free tier)

### Error: "Rate limit exceeded"
**Solution**:
- You've hit the requests-per-minute limit
- Wait 1 minute and try again
- Consider upgrading to a paid plan for higher limits

### Error: "Invalid JSON in response"
**Solution**:
- Rare model output issue
- Try generating again
- Check console logs for raw response
- The code has fallback JSON parsing

---

## 🚀 For Deployment (Render)

When deploying to Render, add environment variable:

**Dashboard → Your Service → Environment**

```
Key: OPENAI_API_KEY
Value: sk-proj-your_actual_key_here
```

**Important**: Set usage limits in OpenAI dashboard to prevent unexpected charges!

---

## 📚 Resources

- **OpenAI Platform**: https://platform.openai.com/
- **API Keys**: https://platform.openai.com/api-keys
- **Pricing**: https://openai.com/api/pricing/
- **Documentation**: https://platform.openai.com/docs/
- **Usage Dashboard**: https://platform.openai.com/usage
- **GPT-4o-mini Announcement**: https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/

---

## ✅ Summary

**Current Setup**:
- Model: `gpt-4o-mini`
- Cost: ~$0.004 per 50-record generation
- Quality: Excellent multilingual support
- Speed: Fast (200+ tokens/sec)
- Free credits: $5 (enough for ~65,000 records)

**Perfect for**:
- ✅ Research projects
- ✅ Dataset building
- ✅ Multilingual NLP
- ✅ Cost-effective production use

---

Generated: December 12, 2025
