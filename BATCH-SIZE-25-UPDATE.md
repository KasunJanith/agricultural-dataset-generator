# Batch Size Update: 25 Records

**Date:** January 12, 2026  
**Status:** ✅ COMPLETE

## Summary

Updated the Agricultural Translation Dataset Generator to use a batch size of **25 records** (approximately 12-13 words + 12-13 sentences) to improve generation reliability and reduce token usage.

## Changes Made

### Backend (`server.js`)

**Line ~135:** Updated default batch size
```javascript
const { subdomain, count = 25 } = req.body;  // 25 items: 12-13 words + 12-13 sentences
```

### Frontend (`App.jsx`)

#### 1. Request Count (Line ~85)
```javascript
const response = await axios.post(`${API_BASE}/generate-batch`, {
  subdomain,
  count: 25  // 25 items: 12-13 words + 12-13 sentences
})
```

#### 2. Loading Popup (Line ~147)
```jsx
<p className="loading-subtext">Generating 12-13 words + 12-13 sentences (~1 minute)</p>
```

#### 3. Generate Button (Line ~181)
```jsx
{loading ? '🔄 Generating Dataset...' : '🚀 Generate 25 Records (12-13 Words + 12-13 Sentences)'}
```

#### 4. Instructions (Line ~183)
```jsx
<br/>• Select an agricultural subdomain and generate a batch of 25 training records
```

#### 5. Empty State (Line ~237)
```jsx
<p>Select a subdomain above and click "Generate 25 Records" to begin.</p>
<p>Each batch generates 12-13 words/phrases and 12-13 sentences (25 total) for balanced training data.</p>
```

## Configuration

- **Model:** `gemini-2.5-flash`
- **Token Limit:** `65,536` tokens
- **Batch Size:** `25 records` (12-13 words + 12-13 sentences)
- **Estimated Time:** ~1 minute per batch
- **Token Usage:** ~5,750 tokens per batch (25 items × 230 tokens)

## Benefits

1. **Faster Generation:** ~1 minute instead of 1-2 minutes
2. **Lower Token Usage:** Uses ~9% of max tokens instead of 18%
3. **Better Reliability:** Smaller batches reduce chance of API errors
4. **Easier Testing:** Quicker iterations for testing different subdomains

## Testing Instructions

1. **Start Backend Server:**
   - Backend should be running on port 3001
   - A new window titled "Backend Server - Batch 25" should be open

2. **Open Frontend:**
   - Navigate to `http://localhost:5173` in your browser
   - Refresh the page to load the updated UI

3. **Test Generation:**
   - Select any agricultural subdomain
   - Click "Generate 25 Records (12-13 Words + 12-13 Sentences)"
   - Wait ~1 minute
   - Verify you receive 25 records (mix of words and sentences)

4. **Verify Results:**
   - Check that records appear in the table
   - Export CSV to verify data quality
   - Check statistics panel for counts

## Next Steps

1. ✅ Backend updated with batch size 25
2. ✅ Frontend UI updated with new batch size text
3. ✅ All syntax errors resolved
4. ⏳ Backend server restarted (verify it's running)
5. ⏳ Test generation with one subdomain
6. ⏳ Generate full dataset (run multiple batches)

## Scaling Up

To generate a complete dataset:
- **Per Subdomain:** Run 10-20 batches (250-500 records)
- **10 Subdomains:** Total 2,500-5,000 records
- **Total Time:** ~3-6 hours for full dataset

## Rollback

If you need to revert to 50 records:
1. Backend: Change `count = 25` to `count = 50`
2. Frontend: Change `count: 25` to `count: 50`
3. Update all UI text references from "25" to "50"
4. Restart backend server

---

**Configuration Files:**
- Backend: `backend/server.js`
- Frontend: `frontend/src/App.jsx`
- Documentation: This file

**Status:** Ready to test generation with 25 record batches! 🚀
