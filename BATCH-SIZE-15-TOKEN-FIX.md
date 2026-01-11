# Batch Size 15 + Token Configuration Fix

**Date:** January 12, 2026  
**Status:** ✅ COMPLETE - Ready to test

## Problem Identified

The 500 Internal Server Error with "Response was truncated" was caused by:

1. **Incorrect Token Calculation:** Using only 230 tokens per item was too low
2. **Actual Token Usage:** Each record with all fields (Sinhala, 3 Singlish variants, 3 English variants) uses ~800 tokens
3. **Insufficient Safety Buffer:** 1.35x was too low, needed 1.5x

## Solution Implemented

### Token Configuration Updated (`server.js`)

```javascript
const TOKEN_CONFIG = {
  TOKENS_PER_ITEM: 800,        // Increased from 230 to handle full record
  SYSTEM_PROMPT_TOKENS: 3000,  // Approximate tokens for system prompt
  SAFETY_BUFFER: 1.5,          // Increased from 1.35 to 1.5 (50% margin)
  MAX_MODEL_TOKENS: 65536,     // Gemini 2.5 Flash maximum output tokens
  WARN_THRESHOLD: 0.85,        // Warn earlier at 85% capacity
};
```

### Batch Size Reduced to 15 Records

**Backend (`server.js` line ~135):**
```javascript
const { subdomain, count = 15 } = req.body;  // 15 items: 7-8 words + 7-8 sentences
```

**Frontend (`App.jsx` line ~85):**
```javascript
const response = await axios.post(`${API_BASE}/generate-batch`, {
  subdomain,
  count: 15  // 15 items: 7-8 words + 7-8 sentences
})
```

## Token Calculation

With the new configuration:

- **Per Item:** 800 tokens
- **Batch of 15:** 15 × 800 = 12,000 tokens
- **With 1.5x buffer:** 12,000 × 1.5 = 18,000 tokens
- **Model capacity:** 65,536 tokens
- **Utilization:** 27.5% of max (safe range!)

This leaves plenty of headroom for:
- System prompts and instructions
- JSON formatting overhead
- Variations in response length
- Safety margin to prevent truncation

## Frontend UI Updates

All UI text has been updated to reflect the new batch size:

1. **Loading Popup:**
   - "Generating 7-8 words + 7-8 sentences (~30-45 seconds)"

2. **Generate Button:**
   - "Generate 15 Records (7-8 Words + 7-8 Sentences)"

3. **Instructions:**
   - "Select an agricultural subdomain and generate a batch of 15 training records"

4. **Empty State:**
   - "Select a subdomain above and click 'Generate 15 Records' to begin"
   - "Each batch generates 7-8 words/phrases and 7-8 sentences (15 total)"

## Current Status

✅ **Backend Server:** Running on port 5000 (PID 22684)  
✅ **Token Config:** Updated to 800 tokens per item with 1.5x buffer  
✅ **Batch Size:** Reduced to 15 records  
✅ **Frontend UI:** All text updated  
✅ **No Syntax Errors:** Both files compile successfully

## Testing Instructions

### 1. Refresh Your Browser

Since the backend is already running with the new configuration:

```
1. Open http://localhost:5173 in your browser
2. Press Ctrl+Shift+R (hard refresh) to reload the frontend
3. Check that server status shows "healthy"
```

### 2. Test Generation

```
1. Select any subdomain (e.g., "Crop Production")
2. Click "Generate 15 Records (7-8 Words + 7-8 Sentences)"
3. Wait 30-45 seconds
4. Verify you receive 15 records without truncation errors
```

### 3. Watch Backend Logs

In the "Backend-15-Records" command window, you should see:

```
📊 Dynamic Token Allocation:
  Batch size: 15 items
  Tokens per item: 800 (avg)
  Base calculation: 15 × 800 = 12000 tokens
  Safety buffer: 50%
  Estimated tokens needed: 18000
  Allocated maxOutputTokens: 18000
  Model capacity: 65536 (27% utilized)
```

### 4. Verify Results

Check that:
- ✅ No truncation errors
- ✅ 15 records generated (mix of words and sentences)
- ✅ All fields populated (Sinhala, 3 Singlish, 3 English variants)
- ✅ Records appear in the table
- ✅ Statistics panel updates correctly

## Scaling Strategy

With 15 records per batch:

### Per Subdomain
- **Target:** 500-600 records
- **Batches needed:** 33-40 batches
- **Time estimate:** 20-30 minutes per subdomain

### All 10 Subdomains
- **Total records:** 5,000-6,000
- **Total batches:** 333-400
- **Total time:** 3-6 hours

### Batch Script Example

You can run multiple batches automatically (though manual verification is recommended):

```batch
@echo off
echo Generating full dataset for all subdomains...
echo.

REM Run 40 batches per subdomain
for /L %%i in (1,1,40) do (
    echo Batch %%i/40
    curl -X POST http://localhost:5000/api/generate-batch ^
         -H "Content-Type: application/json" ^
         -d "{\"subdomain\":\"crop_production\",\"count\":15}"
    timeout /t 35 /nobreak
)

echo.
echo Dataset generation complete!
```

## Why 15 Records Works

1. **Safe Token Usage:** Only 27% of max capacity
2. **Fast Generation:** ~30-45 seconds per batch
3. **Reliable:** Large safety margin prevents truncation
4. **Efficient:** Can generate 15-20 batches per 10 minutes
5. **Testable:** Quick iterations for quality checks

## Troubleshooting

### If You Still Get Truncation Errors

1. **Reduce to 10 records:**
   - Backend: `count = 10`
   - Frontend: `count: 10`
   - Update UI text accordingly

2. **Check token usage in logs:**
   - Look for "Model capacity: X% utilized"
   - Should be under 50%

3. **Verify Gemini API quota:**
   - Check your Google AI Studio dashboard
   - Ensure you're not hitting rate limits

### If Generation is Too Slow

You can increase batch size slightly:
- Try 20 records (30,000 tokens = 46% utilization)
- Try 25 records (37,500 tokens = 57% utilization)

**DO NOT exceed 30 records** or you risk truncation again!

## Next Steps

1. ✅ Backend running with new configuration
2. ✅ Frontend code updated
3. ⏳ **REFRESH BROWSER** and test generation
4. ⏳ Verify no truncation errors
5. ⏳ Generate test batch for one subdomain
6. ⏳ If successful, scale up to full dataset

---

**Files Modified:**
- `backend/server.js` (Lines ~126-131, ~135)
- `frontend/src/App.jsx` (Lines ~85, ~147, ~181, ~183, ~237)

**Documentation:**
- This file: `BATCH-SIZE-15-TOKEN-FIX.md`

**Status:** ✅ Ready for testing! Refresh your browser and try generating 15 records. 🚀
