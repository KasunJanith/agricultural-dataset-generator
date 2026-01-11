# ✅ FINAL CONFIGURATION - 50 Records per Batch

**Date**: January 11, 2026  
**Status**: ✅ CONFIGURED

---

## Current Configuration

| Setting | Value |
|---------|-------|
| **Model** | gemini-2.5-flash |
| **Max Token Limit** | 65,536 |
| **Batch Size** | 50 records |
| **Words** | 25 |
| **Sentences** | 25 |
| **Generation Time** | 1-2 minutes |
| **Token Usage** | ~15,525 tokens (24% capacity) |

---

## Changes Applied

### Backend (`backend/server.js`)

✅ **Token Limit** (line ~126):
```javascript
MAX_MODEL_TOKENS: 65536,  // Full capacity
```

✅ **Default Batch Size** (line ~184):
```javascript
const { subdomain, count = 50 } = req.body;  // 50 items: 25 words + 25 sentences
```

### Frontend (`frontend/src/App.jsx`)

✅ **Request Count** (line ~86):
```javascript
count: 50  // 50 items: 25 words + 25 sentences
```

✅ **Loading Popup** (line ~149):
```jsx
<p className="loading-subtext">Generating 25 words + 25 sentences (1-2 minutes)</p>
```

✅ **Button Text** (line ~181):
```jsx
'🚀 Generate 50 Records (25 Words + 25 Sentences)'
```

✅ **Instructions** (line ~184):
```jsx
• Select an agricultural subdomain and generate a batch of 50 training records
• Utilizes Gemini 2.5 Flash with JSON mode (65536 token limit)
```

✅ **Empty State** (line ~237):
```jsx
<p>Select a subdomain above and click "Generate 50 Records" to begin.</p>
<p>Each batch generates 25 words/phrases and 25 sentences (50 total) for balanced training data.</p>
```

---

## Token Calculation

### For 50 Items

```
Items: 50
Tokens per item: 230 (average)
Base tokens: 50 × 230 = 11,500
Safety buffer: 11,500 × 1.35 = 15,525
Model capacity: 65,536

Usage: 15,525 / 65,536 = 23.7% ✅ Very safe!
```

---

## How to Use

### 1. Restart Backend
```cmd
cd d:\Research\agricultural-dataset-generator\backend
node server.js
```

### 2. Refresh Frontend
Press `Ctrl+R` in browser at http://localhost:5173

### 3. Generate Data
1. Select subdomain (e.g., "Crop Cultivation")
2. Click "**Generate 50 Records (25 Words + 25 Sentences)**"
3. Wait 1-2 minutes
4. Success! ✅

---

## Data Generation Strategy

### Target: 5,000 Records

**Breakdown**:
- 10 subdomains × 500 records each = 5,000 total
- 500 ÷ 50 = 10 batches per subdomain
- 10 batches × 2 min = 20 minutes per subdomain
- **Total time**: 10 subdomains × 20 min = **~3.3 hours**

### Target: 10,000 Records

**Breakdown**:
- 10 subdomains × 1,000 records each = 10,000 total
- 1,000 ÷ 50 = 20 batches per subdomain
- 20 batches × 2 min = 40 minutes per subdomain
- **Total time**: 10 subdomains × 40 min = **~6.7 hours**

---

## Benefits of 50-Record Batches

✅ **Balanced**: 25 words + 25 sentences (perfect 50/50)  
✅ **Safe**: Only 24% token capacity used  
✅ **Fast**: 1-2 minutes per batch  
✅ **Efficient**: 2x faster than 25-record batches  
✅ **No errors**: Well within token limits  

---

## Comparison

| Batch Size | Time | Batches for 500 | Total Time |
|------------|------|-----------------|------------|
| 25 records | 1 min | 20 batches | 20 min |
| **50 records** | **2 min** | **10 batches** | **20 min** ✅ |
| 100 records | 3 min | 5 batches | 15 min |

**50 records is the sweet spot**: Balanced efficiency and reliability!

---

## Expected Output

Each batch generates:
- ✅ 25 words/short phrases (type: "word")
- ✅ 25 full sentences (type: "sentence")
- ✅ Pure Sinhala Unicode (no English in sinhala field)
- ✅ 3 Singlish romanization variants
- ✅ 3 English translation variants
- ✅ Domain-specific agricultural terminology

**Example Word**:
```json
{
  "sinhala": "පොහොර",
  "singlish1": "pohora",
  "singlish2": "pohra",
  "singlish3": null,
  "variant1": "fertilizer",
  "variant2": "fertiliser",
  "variant3": "plant nutrients",
  "type": "word"
}
```

**Example Sentence**:
```json
{
  "sinhala": "පොහොර දාන්න හොද වෙලාව කියන්නකො",
  "singlish1": "pohora danna hoda welawa kiyannako",
  "singlish2": "pohra dann hoda welawa kiyannako",
  "singlish3": null,
  "variant1": "Tell me the best time to apply fertilizer",
  "variant2": "When should I add fertilizer?",
  "variant3": "What's the right timing for fertilizer application?",
  "type": "sentence"
}
```

---

## Backend Console Output

**Expected logs**:
```
Generating 50 items for subdomain: crop_cultivation
Existing terms count: 0

📊 Dynamic Token Allocation:
  Batch size: 50 items
  Tokens per item: 230 (avg)
  Base calculation: 50 × 230 = 11500 tokens
  Safety buffer: 35%
  Estimated tokens needed: 15525
  Allocated maxOutputTokens: 15525
  Model capacity: 65536 (24% utilized)

🚀 Calling Gemini 2.5 Flash API...
   Model: gemini-2.5-flash
   Subdomain: crop_cultivation
   Max output tokens: 15525
   Response format: application/json
✅ Gemini API call succeeded
✅ JSON parsed successfully
Response has items array
Parsed 50 items from response

📊 Type Distribution Check:
  Words: 25 (expected: 25)
  Sentences: 25 (expected: 25)
✅ Perfect 50/50 distribution achieved!
```

---

## Troubleshooting

### Still Getting 500 Errors?

**Check backend logs** for token warnings.

**If you see truncation**, reduce batch size:
- Edit `frontend/src/App.jsx` line ~86: `count: 40`
- Edit `backend/server.js` line ~184: `count = 40`

### Want Faster Generation?

**Increase batch size** (if model supports it):
- 75 records: 3 min per batch
- 100 records: 3-4 min per batch
- Monitor for truncation errors

**Don't exceed ~200 records** or you'll hit token limits!

---

## Files Modified

1. ✅ `backend/server.js`
   - Line ~126: `MAX_MODEL_TOKENS: 65536`
   - Line ~184: `count = 50`

2. ✅ `frontend/src/App.jsx`
   - Line ~86: `count: 50`
   - Line ~149: Loading text updated
   - Line ~181: Button text updated
   - Line ~184: Instructions updated
   - Line ~237: Empty state updated

---

## Status: ✅ READY

Configuration complete. Ready to generate research dataset!

**Next step**: Restart backend and start generating 50-record batches! 🚀
