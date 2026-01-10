# 🔍 Gemini API Debugging Guide

## Quick Test Command

Test if Gemini API is working:
```cmd
cd d:\Research\agricultural-dataset-generator\backend
node test-gemini.js
```

Expected output:
```
✅ GEMINI_API_KEY found
🔄 Testing Gemini API connection...

✅ Gemini API Response received!

Response: {"items":[{"sinhala":"කුඹුරු","singlish1":"kumburu"...

✅ Test successful! Gemini integration is working correctly.
```

If you get errors, see troubleshooting below.

---

## Common Errors & Solutions

### 1. "GEMINI_API_KEY not found"

**Problem**: Environment variable not loaded

**Solution**:
```cmd
# Check if .env file exists
dir d:\Research\agricultural-dataset-generator\backend\.env

# Verify it contains:
# GEMINI_API_KEY=AIzaSyB61hz-SRYK0yAFsUMseFfEX6nFUDyLWpU
```

### 2. "Invalid API key" or "401 Unauthorized"

**Problem**: API key is invalid or expired

**Solution**:
1. Go to https://aistudio.google.com/app/apikey
2. Verify your key is active
3. Create a new key if needed
4. Update `.env` file with new key

### 3. "Invalid response format from Gemini API"

**Problem**: Gemini returned non-JSON text

**Debugging steps**:
1. Check server console for "Response preview (first 1000 chars)"
2. Look for text before/after the JSON
3. Check if JSON is wrapped in markdown: \`\`\`json ... \`\`\`

**What the fix does**:
- ✅ Added `responseMimeType: "application/json"` to force JSON
- ✅ Strips markdown code blocks automatically
- ✅ Improved prompt to emphasize "NO text before/after JSON"

**If still failing**:
The console will now show the full response so you can see exactly what Gemini returned.

### 4. "Rate limit exceeded" or "429 Too Many Requests"

**Problem**: Hit Gemini's free tier limit

**Limits**:
- 15 requests per minute (RPM)
- 1,500 requests per day (RPD)

**Solution**:
- Wait 60 seconds for RPM reset
- Track daily usage (1 request = 200 records)
- Consider spreading generation across multiple days

### 5. "No JSON array found in response object"

**Problem**: Gemini returned JSON but different structure

**Debugging**:
Console will show: `Direct JSON.parse succeeded, keys: [array_of_keys]`

**Solution**:
The code automatically searches for any array in the response object.

### 6. "Failed to parse extracted JSON array"

**Problem**: JSON syntax error in Gemini's response

**Debugging**:
Console shows: `Extracted array string: {...}`

**Possible causes**:
- Missing commas
- Unclosed brackets
- Invalid Unicode characters

**Solution**:
- The detailed logging will show exactly where the parse failed
- May need to report to Google if it's a Gemini bug

---

## Viewing Detailed Logs

The server now logs:

1. **Request details**:
   ```
   Generating 200 items for subdomain: crop_cultivation
   Existing terms count: 42
   ```

2. **Response info**:
   ```
   Raw Gemini response received
   Response length: 45231
   Response preview (first 1000 chars): {"items":[...
   Response preview (last 200 chars): ...]}
   ```

3. **Parsing results**:
   ```
   Direct JSON.parse succeeded, keys: items
   Using 'items' array from response object
   Parsed 200 items from response
   First item sample: {...}
   ```

4. **Quality checks**:
   ```
   📊 Type Distribution Check:
     Words: 100 (expected: 100)
     Sentences: 100 (expected: 100)
   ✅ Perfect 50/50 distribution achieved!
   ```

5. **Database results**:
   ```
   Saved 198 new items, 2 duplicates skipped, 0 errors
   ```

---

## Testing the Full Flow

### Step 1: Test API Connection
```cmd
cd backend
node test-gemini.js
```

### Step 2: Start Backend Server
```cmd
cd backend
node server.js
```

Leave this running and open a new terminal for step 3.

### Step 3: Start Frontend
```cmd
cd frontend
npm run dev
```

### Step 4: Generate Small Batch
1. Open http://localhost:5173
2. Select any subdomain
3. Click generate button
4. Watch the backend console for logs

### Step 5: Verify Output
Check that:
- [ ] 200 items generated (100 words + 100 sentences)
- [ ] All Sinhala is pure Unicode (no English words)
- [ ] singlish1 is always present
- [ ] singlish2 uses conservative abbreviations
- [ ] CSV export works with UTF-8 BOM

---

## Performance Expectations

| Batch Size | Expected Time | Tokens Used (est.) |
|------------|---------------|-------------------|
| 25 records | 30-45 seconds | ~5,000 tokens |
| 200 records | 2-4 minutes | ~35,000 tokens |
| 500 records | 5-10 minutes | ~85,000 tokens |

**Note**: Gemini 2.0 Flash free tier limits:
- 15 RPM (requests per minute)
- 1,500 RPD (requests per day)
- 1 million TPM (tokens per minute)
- 50 million TPD (tokens per day)

With 200 records per batch:
- **Daily capacity**: 1,500 requests × 200 = **300,000 records/day**
- **Cost**: **$0.00** (completely free!)

---

## Comparing Outputs

If you previously generated data with OpenAI GPT-5-mini, compare:

1. **Sinhala Quality**:
   - Spelling accuracy
   - Natural language (not too formal)
   - Pure Unicode (no English mixing in Sinhala field)

2. **Singlish Quality**:
   - singlish1 readability
   - singlish2 not over-abbreviated
   - singlish3 only when natural

3. **Distribution**:
   - Exactly 50% words, 50% sentences
   - Variety of word types (terms, phrases, technical vocabulary)
   - Variety of sentence types (questions, commands, descriptions)

4. **English Variants**:
   - variant1: literal translation
   - variant2: natural English
   - variant3: contextual explanation

---

## Getting Help

If you encounter issues not covered here:

1. **Check the full server console output** - it now logs everything
2. **Look at "Response preview" logs** - see what Gemini actually returned
3. **Verify API key** - https://aistudio.google.com/app/apikey
4. **Check rate limits** - wait 60 seconds if you hit 15 RPM limit
5. **Try a smaller batch** - test with 25 records first

---

## Success Indicators

You'll know everything is working when you see:

```
✅ Perfect 50/50 distribution achieved!
Saved 200 new items, 0 duplicates skipped, 0 errors
Total generated: 200, Saved: 200, Duplicates: 0, Errors: 0
```

And in the frontend:
- Generated records appear in the table
- Sinhala displays correctly
- CSV export includes UTF-8 BOM
- All fields populated (except optional singlish2/singlish3)

---

**Current Status**: All fixes applied. Ready for testing! 🚀
