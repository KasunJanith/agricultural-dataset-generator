# GPT-4o Model Testing Guide

## ✅ Model Update: GPT-5.2 → GPT-4o

### Changes Made (January 2025)

#### Issue
- Previous model: `gpt-5.2` (does not exist in OpenAI API)
- Result: Empty array `[]` returned from API

#### Solution
- Updated to: `gpt-4o` (production-ready, multilingual capable)
- Added: `temperature: 0.8` for linguistic diversity
- Fixed: Duplicate `sinhala` key in example prompt

---

## 🧪 Testing Steps

### 1. Verify OpenAI API Key
```bash
cd backend
cat .env
```

Ensure you have:
```
OPENAI_API_KEY=sk-proj-...
```

### 2. Start the Backend Server
```bash
cd backend
npm install
node server.js
```

Expected output:
```
🚀 Server running on port 5000
📊 Agricultural Dataset Generator
🌐 Environment: development
🔗 Health check: http://localhost:5000/api/health
```

### 3. Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "environment": "development"
}
```

### 4. Test Data Generation

#### Option A: Using Frontend
```bash
cd frontend
npm install
npm run dev
```

Then:
1. Open `http://localhost:3000`
2. Select a subdomain (e.g., "crop_cultivation")
3. Click "Generate 50 Random Records"
4. Wait 30-60 seconds
5. Verify records appear in table

#### Option B: Using curl (Direct API Test)
```bash
curl -X POST http://localhost:5000/api/generate-batch \
  -H "Content-Type: application/json" \
  -d '{"subdomain": "crop_cultivation", "count": 5}'
```

### 5. Expected Response Structure

#### Success Response
```json
{
  "generated": 5,
  "duplicates": 0,
  "items": [
    {
      "id": 1,
      "sinhala": "මගේ වී වගාවට මොන පොහොර දාන්න ඕන ද?",
      "singlish1": "mage wee wagawata mon pohora danna ona da?",
      "singlish2": "mge wi wagawt mona pohor dnna one da",
      "singlish3": "my rice crop ekata mon fertilizer danna ona da?",
      "variant1": "What fertilizer should I apply to my rice crop?",
      "variant2": "Which fertilizer do I need for my rice field?",
      "variant3": "Farmer asking which fertilizer type to use for rice cultivation",
      "type": "sentence",
      "subdomain": "crop_cultivation"
    }
  ]
}
```

#### Error Response (Invalid API Key)
```json
{
  "error": "Failed to generate batch translations: Request failed with status code 401"
}
```

---

## 🔍 Validation Checks

### Check 1: Data Quality
Verify the generated data has:
- ✅ **Sinhala Unicode** (සිංහල අකුරු visible)
- ✅ **Informal Singlish** (not perfect romanization)
- ✅ **Spelling variations** in singlish2/singlish3
- ✅ **SMS shortcuts** (mn, oy, bn, etc.)
- ✅ **Mixed English words** in singlish3
- ✅ **3 English variants** with different perspectives

### Check 2: Database Persistence
```bash
cd backend
sqlite3 datasets.db
```

Run queries:
```sql
-- Check total records
SELECT COUNT(*) FROM datasets;

-- Check subdomain distribution
SELECT subdomain, COUNT(*) as count 
FROM datasets 
GROUP BY subdomain;

-- View sample records
SELECT sinhala, singlish1, variant1, type 
FROM datasets 
LIMIT 5;

-- Check for duplicates (should return 0)
SELECT sinhala, subdomain, COUNT(*) 
FROM datasets 
GROUP BY sinhala, subdomain 
HAVING COUNT(*) > 1;
```

### Check 3: Informal Language Patterns

Look for these in `singlish1`, `singlish2`:
- ✅ Spelling variations: "govitana" vs "govithena"
- ✅ SMS shortcuts: "mn", "oy", "bn"
- ✅ Mixed English: "fertilizer eka", "spray karanna"
- ✅ Dialectal forms: "ethakota", "aniwa"
- ✅ Imperfect romanization (realistic farmer typing)

**BAD Examples to Avoid:**
- ❌ Perfect formal Sinhala: "කෘෂි විද්‍යාත්මක ක්‍රමවේද"
- ❌ Perfect romanization with no variations
- ❌ No English mixing
- ❌ Academic language

### Check 4: API Cost Monitoring

GPT-4o pricing (as of Jan 2025):
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens

**Estimated costs for 50 records:**
- Input tokens: ~2,000 (prompt + context)
- Output tokens: ~8,000 (50 records × ~160 tokens each)
- **Cost per batch: ~$0.08-0.10**

For 10 subdomains × 500 records each = 5,000 total records:
- Total batches: 100 (50 records each)
- **Estimated total cost: $8-10**

---

## 🐛 Troubleshooting

### Issue 1: Empty Array `[]` Returned
**Symptoms:**
- Response: `{"generated": 0, "duplicates": 0, "items": []}`
- Backend logs: `Parsed 0 items from response`

**Causes:**
- Invalid model name (e.g., gpt-5.2)
- Model rate limiting
- API key quota exceeded

**Solution:**
1. Verify model name is `gpt-4o` in `server.js`
2. Check OpenAI dashboard for rate limits
3. Review backend logs for raw API response

### Issue 2: Sinhala Unicode Not Rendering
**Symptoms:**
- Seeing question marks `???` or boxes `□□□`

**Solution:**
1. Ensure database encoding is UTF-8
2. Frontend should render with proper font (Arial, Noto Sans Sinhala)
3. Check `Content-Type: application/json; charset=utf-8` in responses

### Issue 3: Duplicates Not Being Prevented
**Symptoms:**
- Same Sinhala term generated multiple times
- `duplicates` count always 0

**Solution:**
1. Check UNIQUE constraint: `UNIQUE(sinhala, subdomain)`
2. Verify prompt includes existing terms to avoid
3. Review database schema with `sqlite3 datasets.db ".schema"`

### Issue 4: Too Formal Language Generated
**Symptoms:**
- Perfect romanization, no spelling variations
- Academic Sinhala terms
- No SMS shortcuts

**Solution:**
1. Increase `temperature` to 0.9 for more variation
2. Review prompt examples (ensure they show informal language)
3. Add more explicit instructions about dialectal forms

### Issue 5: API Rate Limiting
**Symptoms:**
- `Error 429: Rate limit exceeded`

**Solution:**
1. OpenAI free tier: 3 requests/min
2. Add delay between batches:
```javascript
// In server.js
await new Promise(resolve => setTimeout(resolve, 20000)); // 20s delay
```
3. Upgrade OpenAI plan for higher limits

---

## 📊 Backend Logging Analysis

### What to Look For

#### Good Generation Logs:
```
Generating 50 items for subdomain: crop_cultivation
Existing terms count: 150
Raw OpenAI response received
Response preview: [{"sinhala":"මගේ...","singlish1":"mage...
JSON parsed successfully, type: object isArray: true
Parsed 50 items from response
First item sample: {
  "sinhala": "...",
  "singlish1": "...",
  ...
}
Saved 47 new items, 3 duplicates skipped, 0 errors
```

#### Bad Generation Logs:
```
Generating 50 items for subdomain: crop_cultivation
Existing terms count: 0
Raw OpenAI response received
Response preview: []
JSON parsed successfully, type: object isArray: true
Parsed 0 items from response  ❌ PROBLEM HERE
Saved 0 new items, 0 duplicates skipped, 0 errors
```

If you see "Parsed 0 items", check:
1. Raw response preview (should start with `[{"sinhala":`)
2. Model name (must be `gpt-4o`, not `gpt-5.2`)
3. API key validity
4. OpenAI account status

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ Backend server starts without errors
2. ✅ Health endpoint returns `{"status": "OK"}`
3. ✅ Generate button creates 50 records in 30-60 seconds
4. ✅ Data table displays Sinhala Unicode properly
5. ✅ Singlish romanizations have variations (singlish1 ≠ singlish2)
6. ✅ English variants differ meaningfully
7. ✅ Duplicates are prevented (UNIQUE constraint works)
8. ✅ CSV export downloads successfully
9. ✅ Statistics panel shows correct counts
10. ✅ Informal language patterns are present (SMS shortcuts, etc.)

---

## 🚀 Performance Benchmarks

### Expected Performance:
- **Generation time**: 30-60 seconds for 50 records
- **Database write**: <1 second
- **CSV export**: <2 seconds for 500 records
- **Frontend load**: <3 seconds

### Bottlenecks:
1. **OpenAI API latency** (30-45 seconds) - Cannot optimize
2. **Database writes** (0.5-1 second) - Use prepared statements ✅
3. **Frontend rendering** (0.1 second) - Use React virtualization for >1000 rows

---

## 📝 Next Steps After Successful Test

1. **Generate Full Dataset**
   - Run 10 batches per subdomain (500 records each)
   - Total: 5,000 records across 10 subdomains
   - Estimated time: ~1 hour
   - Estimated cost: ~$8-10

2. **Quality Review**
   - Export CSV
   - Manually review 50 random samples
   - Check for informal language patterns
   - Verify agricultural terminology accuracy

3. **Expert Validation** (Per Research Proposal)
   - Send sample to agricultural experts
   - Send sample to Sinhala linguists
   - Get feedback from native farmers
   - Adjust prompt based on feedback

4. **Prepare for mT5 Training**
   - Split data: 80/10/10 (train/val/test)
   - Tokenize with mT5Tokenizer
   - Set up Hugging Face pipeline

---

## 🔗 Useful Commands

### Reset Database
```bash
cd backend
rm datasets.db
node server.js  # Will recreate with fresh schema
```

### Check Database Size
```bash
cd backend
du -h datasets.db
```

### Export All Data to CSV
```bash
curl http://localhost:5000/api/export-csv > full_dataset.csv
```

### View Database Schema
```bash
cd backend
sqlite3 datasets.db ".schema datasets"
```

### Count Records by Subdomain
```bash
cd backend
sqlite3 datasets.db "SELECT subdomain, COUNT(*) FROM datasets GROUP BY subdomain;"
```

---

## 📧 Support

If you encounter issues:
1. Check backend logs (`console.log` output)
2. Review OpenAI dashboard (usage, errors)
3. Verify `.env` file has correct API key
4. Test with smaller batch (count: 5)
5. Check this troubleshooting guide

---

**Model**: GPT-4o  
**Last Tested**: January 2025  
**Status**: ✅ Production Ready
