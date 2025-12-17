# GPT-4o-mini & 50/50 Word/Sentence Fix

## Date: December 17, 2025

## Issues Fixed

### ❌ **Problem 1: Wrong Model**
The system was using `gpt-3.5-turbo` instead of `gpt-4o-mini`

### ❌ **Problem 2: Only Generating Sentences**
The AI was ignoring the 50/50 distribution requirement and generating mostly/only sentences instead of an equal mix of words and sentences.

## ✅ Solutions Implemented

### 1. **Updated Model to gpt-4o-mini**
**File**: `backend/server.js` (Line 289)

**Before:**
```javascript
model: 'gpt-3.5-turbo',
```

**After:**
```javascript
model: 'gpt-4o-mini',
```

**Why gpt-4o-mini?**
- Better instruction following
- Lower cost: $0.15 input / $0.60 output per 1M tokens
- Better JSON generation reliability
- More consistent adherence to complex requirements

---

### 2. **Strengthened System Prompt**
**File**: `backend/server.js` (Line 286-292)

Added much stronger emphasis on the 50/50 requirement:

**Before:**
```javascript
content: 'You are an expert... CRITICAL: Generate EXACTLY 50% words/phrases (type:"word") and 50% sentences (type:"sentence").'
```

**After:**
```javascript
content: 'You are an expert... CRITICAL REQUIREMENT: You MUST generate EXACTLY 50% words/phrases (type:"word") and 50% sentences (type:"sentence"). This 50/50 distribution is MANDATORY for research validity. Count carefully and ensure equal distribution!'
```

---

### 3. **Enhanced Prompt Instructions**
**File**: `backend/server.js` (Lines 195-224)

Completely rewrote section 3 with:

✅ **Visual Emphasis:**
```
⚠️ MANDATORY 50/50 SPLIT ⚠️
```

✅ **Exact Counts:**
```
Out of ${count} total items, you MUST generate:
- EXACTLY ${Math.floor(count / 2)} items with type:"word"
- EXACTLY ${Math.ceil(count / 2)} items with type:"sentence"
```

✅ **Clear Examples:**
```
WORDS/PHRASES (type:"word") - 12 items needed:
  • පොහොර (pohora) - fertilizer
  • වී වගාව (wee wagawa) - rice cultivation
  
SENTENCES (type:"sentence") - 13 items needed:
  • "පොහොර දාන්නේ කොහොමද?" (How to apply fertilizer?)
```

✅ **Verification Reminder:**
```
⚠️ COUNT VERIFICATION: Before submitting, verify you have X "word" type and Y "sentence" type items!
```

---

### 4. **Added Distribution Validation Logging**
**File**: `backend/server.js` (After line 365)

Added automatic validation that logs the distribution:

```javascript
// Validate 50/50 word/sentence distribution
const wordCount = generatedData.filter(item => item.type === 'word').length;
const sentenceCount = generatedData.filter(item => item.type === 'sentence').length;
const expectedWords = Math.floor(count / 2);
const expectedSentences = Math.ceil(count / 2);

console.log(`\n📊 Type Distribution Check:`);
console.log(`  Words: ${wordCount} (expected: ${expectedWords})`);
console.log(`  Sentences: ${sentenceCount} (expected: ${expectedSentences})`);

if (wordCount !== expectedWords || sentenceCount !== expectedSentences) {
  console.warn(`⚠️  WARNING: Type distribution is not 50/50!`);
} else {
  console.log(`✅ Perfect 50/50 distribution achieved!`);
}
```

**Benefits:**
- Immediate feedback on distribution
- Easy to spot when AI doesn't follow instructions
- Helps with debugging and quality control

---

### 5. **Updated Final Instructions**
**File**: `backend/server.js` (Lines 266-270)

Added one final reminder before the AI generates:

```javascript
=== FINAL INSTRUCTIONS ===
- Generate EXACTLY ${count} items total.
- ⚠️ CRITICAL: ${Math.floor(count / 2)} items MUST be type:"word" and ${Math.ceil(count / 2)} items MUST be type:"sentence"
- Double-check your work: Count the "word" and "sentence" types before submitting!
```

---

## Expected Results

### For 25 Records (Default Batch):
- **12 Words/Phrases** (type: "word")
- **13 Sentences** (type: "sentence")

### Example Output Distribution:

**Words (12):**
1. පොහොර (fertilizer)
2. කෘමිනාශක (pesticide)
3. වී වගාව (rice cultivation)
4. කොළ පැහැය (leaf color)
5. ජල කළමනාකරණය (water management)
6. ... (7 more)

**Sentences (13):**
1. "පොහොර දාන්නේ කොහොමද?"
2. "fertilizer එක දාන්න හොද වෙලාව කියන්නකො"
3. "කොළ වලට කහ පැහැයක් එනවා"
4. ... (10 more)

---

## Testing Instructions

1. **Start Backend:**
   ```cmd
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```cmd
   cd frontend
   npm run dev
   ```

3. **Generate Data:**
   - Select any subdomain
   - Click "Generate 25 Records"
   - Watch the backend console logs

4. **Check Console Output:**
   Look for this validation section:
   ```
   📊 Type Distribution Check:
     Words: 12 (expected: 12)
     Sentences: 13 (expected: 13)
   ✅ Perfect 50/50 distribution achieved!
   ```

5. **Verify in Database:**
   ```cmd
   cd backend
   sqlite3 datasets.db
   ```
   ```sql
   SELECT type, COUNT(*) as count 
   FROM datasets 
   WHERE subdomain = 'crop_cultivation' 
   GROUP BY type;
   ```
   
   Should show approximately equal counts.

---

## Why This Matters for Research

The 50/50 distribution is critical because:

1. **Balanced Training Data**: mT5 model needs equal representation of:
   - Technical vocabulary (words)
   - Contextual usage (sentences)

2. **Research Validity**: Ensures dataset isn't biased toward one type

3. **Evaluation Metrics**: Allows separate analysis of:
   - Word-level translation accuracy
   - Sentence-level fluency and meaning preservation

4. **Real-World Representation**: Farmers use both:
   - Quick term lookups ("what is X?")
   - Full questions/descriptions

---

## Cost Implications

### gpt-4o-mini Pricing:
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

### Estimated Costs (25 records/batch):
- Input tokens: ~2,500 tokens (prompt + context)
- Output tokens: ~3,500 tokens (25 items × ~140 tokens each)
- Cost per batch: ~$0.0025
- **5,000 records = 200 batches = ~$0.50**

### Budget Capacity:
- $5 budget → **~10,000 records** possible
- Much better than gpt-3.5-turbo in following complex instructions
- Worth the slightly higher cost for quality and reliability

---

## Troubleshooting

### If you still see imbalanced distribution:

1. **Check Console Logs**: Look for the validation output
2. **Try Different Subdomain**: Some domains may be easier for the model
3. **Increase Temperature**: Try 0.7 or 0.8 for more variety
4. **Manual Correction**: If consistently off, you can add manual filtering

### If model returns error:

1. Check API key is valid
2. Verify you have OpenAI credits
3. Check network connection
4. Look at raw response in console logs

---

## Summary

✅ Model: `gpt-4o-mini` (was `gpt-3.5-turbo`)  
✅ System prompt: Strengthened with multiple warnings  
✅ Prompt section 3: Completely rewritten with visual emphasis  
✅ Validation: Added automatic distribution checking  
✅ Final instructions: Added double-check reminder  

**Result**: System should now generate exactly 50% words and 50% sentences for every batch! 🎯
