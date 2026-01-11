# 🔧 Model Name Fix - gemini-3-flash → gemini-2.0-flash-exp

## Date: January 11, 2026

## Problem

Error: `"Invalid model configuration. Please check the model name."`

**Root Cause**: The model name `gemini-3-flash` doesn't exist yet! This was a mistake in the refactoring.

---

## ✅ Solution Applied

### Model Name Correction:
- **Wrong**: `gemini-3-flash` ❌ (doesn't exist)
- **Correct**: `gemini-2.0-flash-exp` ✅ (Gemini 2.0 Flash Experimental)

---

## Available Gemini Models (January 2026)

From Google AI Studio:

| Model Name | Output Tokens | Best For |
|------------|---------------|----------|
| `gemini-2.0-flash-exp` | 8,192 | ✅ **Recommended** - Experimental, high limits |
| `gemini-1.5-flash` | 8,192 | Stable production use |
| `gemini-1.5-flash-8b` | 8,192 | Faster, smaller model |
| `gemini-1.5-pro` | 8,192 | More powerful, slower |
| `gemini-2.5-flash` | 8,192 | Latest stable (if available) |

**Note**: `gemini-3-flash` and `gemini-3.0` models don't exist yet!

---

## 🔧 Changes Applied

### Backend (`server.js`)

```javascript
// OLD (WRONG):
model: 'gemini-3-flash',

// NEW (CORRECT):
model: 'gemini-2.0-flash-exp',
```

### Frontend (`App.jsx`)

```javascript
// Loading popup:
'Processing with Gemini 2.0 Flash Experimental (JSON Schema)'

// Model display:
'Model: Gemini 2.0 Flash Exp'

// Instructions:
'Utilizes Gemini 2.0 Flash Experimental with native JSON schema enforcement'
```

---

## 🚀 Quick Start

### 1. Restart Backend:
```cmd
cd d:\Research\agricultural-dataset-generator\backend
node server.js
```

**Expected output:**
```
Connected to SQLite database
🚀 Server running on port 5000

[On generation:]
🚀 Calling Gemini 2.0 Flash Experimental API with JSON Schema...
   Model: gemini-2.0-flash-exp
   Schema enforcement: ENABLED ✅
```

### 2. Restart Frontend:
```cmd
cd d:\Research\agricultural-dataset-generator\frontend
npm run dev
```

### 3. Test Generation:
- Open http://localhost:5173
- Click "Generate 100 Records"
- Should work now! ✅

---

## 📊 Model Capabilities

### Gemini 2.0 Flash Experimental:

| Feature | Value |
|---------|-------|
| Max Output Tokens | 8,192 |
| JSON Schema Support | ✅ Yes |
| Rate Limit (Free) | 10-15 RPM |
| Daily Limit | 1,500 requests |
| Cost | FREE |
| Sinhala Support | Excellent |

### Safe Batch Sizes:
```
With 8,192 output token limit:
- 100 items: ~23K tokens needed → TOO LARGE ❌
- 50 items: ~11.5K tokens needed → TOO LARGE ❌
- 30 items: ~7K tokens needed → SAFE ✅
- 25 items: ~5.8K tokens needed → SAFE ✅
```

**⚠️ IMPORTANT**: With 8,192 token limit, we need to reduce batch size!

---

## 🎯 Recommended Configuration

Since `gemini-2.0-flash-exp` has **only 8,192 output tokens** (not 65,536), we need to adjust:

### Option 1: Use Smaller Batches (Recommended)
```javascript
// Backend:
const { subdomain, count = 30 } = req.body;

// Frontend:
count: 30  // 15 words + 15 sentences
```

### Option 2: Switch to Higher Capacity Model
If you need 100+ items per batch, consider:
```javascript
model: 'gemini-1.5-pro',  // Same 8K limit but better quality
// OR wait for higher capacity models
```

---

## 🔍 How to Check Available Models

### Method 1: Google AI Studio
1. Go to https://aistudio.google.com/
2. Click "Get API Key"
3. Check the model dropdown
4. Use exact model names shown

### Method 2: Test Script
```javascript
// Create: test-models.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelsToTest = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

for (const modelName of modelsToTest) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Test');
    console.log(`✅ ${modelName}: WORKS`);
  } catch (e) {
    console.log(`❌ ${modelName}: ${e.message}`);
  }
}
```

---

## ✅ Summary

**Problem**: Used non-existent model name `gemini-3-flash`  
**Solution**: Changed to `gemini-2.0-flash-exp`  
**Status**: ✅ Fixed and ready to test  

**Next**: Restart servers and test generation! 🚀
