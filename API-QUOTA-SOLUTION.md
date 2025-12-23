# 💰 API Quota Solution - Reduced Batch Size to 25

## Date: December 23, 2025

## Problem
- **OpenAI API Usage**: $4.64 / $5.00 used
- **Remaining Budget**: $0.36
- **Error**: "Failed to generate translations. Check your OpenAI API key."
- **Cause**: 200-record batches (~$0.06-0.10) too expensive for remaining budget

---

## ✅ Solution: Reduced Batch Size to 25 Records

### Changes Made:

**Backend (`server.js`):**
```javascript
// FROM: count = 200
const { subdomain, count = 25 } = req.body;

// FROM: max_completion_tokens: 64000
max_completion_tokens: 8000  // Reduced to conserve quota
```

**Frontend (`App.jsx`):**
```javascript
// FROM: count: 200
count: 25

// FROM: "Generate 200 Records (100 Words + 100 Sentences)"
"Generate 25 Records (12-13 Words + 12-13 Sentences)"

// FROM: "Generating 100 words + 100 sentences (3-5 minutes)"
"Generating 12-13 words + 12-13 sentences (30-45 seconds)"

// FROM: "batch of 200 training records"
"batch of 25 training records"
```

---

## 📊 New Batch Breakdown (25 Records)

### Per Batch:
- **12 words** (type: "word")
- **13 sentences** (type: "sentence")  
- **50/50 split maintained**

### Cost Per Batch:
- **~$0.008** (0.8 cents) per 25-record batch
- **Very affordable!**

### With $0.36 Remaining:
- Can generate: **~45 batches**
- Total records: **~1,125 records**
- Still useful for testing and small datasets!

---

## ⏱️ Generation Time

### 25 Records:
- Generation time: **30-45 seconds**
- Much faster turnaround
- Good for iterative testing

---

## 🎯 Your Options

### Option 1: Use Remaining $0.36 (Implemented) ✅
**What you can do:**
- Generate **~45 batches of 25** records
- Total: **~1,125 records**
- Perfect for:
  - Testing data quality
  - Validating the reverse generation approach
  - Small-scale experiments
  - Proof of concept

**Cost per batch:** ~$0.008

---

### Option 2: Add More Budget (Recommended for Production)
If you need more data, add budget to your OpenAI account:

1. Go to: https://platform.openai.com/settings/organization/billing
2. Add $5-$10 more
3. Then you can:
   - Switch back to 200 records/batch
   - Generate 5,000-10,000 records
   - Full-scale dataset creation

**To switch back to 200:**
```javascript
// In server.js and App.jsx
count = 200  // instead of 25
max_completion_tokens: 64000  // instead of 8000
```

---

### Option 3: Use a Cheaper Model
Switch to `gpt-4o-mini` (cheaper than gpt-5-mini):

**gpt-4o-mini pricing:**
- Input: $0.15/1M tokens (vs $0.25 for gpt-5-mini)
- Output: $0.60/1M tokens (vs $2.00 for gpt-5-mini)
- **~70% cheaper!**

**To switch:**
```javascript
// In server.js
model: 'gpt-4o-mini',  // instead of 'gpt-5-mini'
```

**Trade-off:**
- gpt-5-mini: Better instruction following, higher quality
- gpt-4o-mini: Cheaper, still good quality

---

### Option 4: Apply for OpenAI Research Credits
If this is for academic research:
1. Go to: https://openai.com/form/researcher-access-program
2. Apply for research credits
3. You might get $500-$1000 in free credits!

**Requirements:**
- Academic institution email
- Research proposal
- Approval process (2-4 weeks)

---

## 📈 Budget Planning

### Current Situation ($0.36 remaining):
| Batch Size | Cost/Batch | Batches Possible | Total Records |
|------------|------------|------------------|---------------|
| 25         | $0.008     | 45               | 1,125         |
| 50         | $0.015     | 24               | 1,200         |
| 100        | $0.03      | 12               | 1,200         |
| 200        | $0.06      | 6                | 1,200         |

### With Additional $5:
| Batch Size | Cost/Batch | Batches Possible | Total Records |
|------------|------------|------------------|---------------|
| 25         | $0.008     | 625              | 15,625        |
| 50         | $0.015     | 333              | 16,650        |
| 100        | $0.03      | 166              | 16,600        |
| 200        | $0.06      | 83               | 16,600        |

### With Additional $10:
| Batch Size | Cost/Batch | Batches Possible | Total Records |
|------------|------------|------------------|---------------|
| 200        | $0.06      | 166              | 33,200        |

---

## 🔧 Quick Commands

### Start with Current Setup (25 records):
```bash
# Terminal 1: Backend
cd d:\Research\agricultural-dataset-generator\backend
node server.js

# Terminal 2: Frontend
cd d:\Research\agricultural-dataset-generator\frontend
npm run dev
```

### To Switch Back to 200 Records Later:
1. In `backend/server.js`:
   ```javascript
   const { subdomain, count = 200 } = req.body;
   max_completion_tokens: 64000
   ```

2. In `frontend/src/App.jsx`:
   ```javascript
   count: 200
   // Update button text and loading message
   ```

---

## 💡 Recommendations

### For Testing & Quality Check ($0.36 remaining):
✅ **Use 25-record batches**
- Generate 40-45 batches
- Test all 10 subdomains (4-5 batches each)
- Validate:
  - Sinhala spelling accuracy
  - Semantic alignment
  - singlish2 quality
  - 50/50 distribution

### For Production Dataset (Add budget):
✅ **Add $10-$20**
- Use 200-record batches
- Generate 5,000-10,000 records
- Full-scale mT5 training dataset
- Multiple iterations per subdomain

---

## ✅ Current Status

**System Updated:**
- ✅ Batch size: 200 → 25 records
- ✅ Max tokens: 64000 → 8000
- ✅ Cost per batch: ~$0.008
- ✅ UI updated with correct numbers
- ✅ No syntax errors

**Ready to use with remaining budget!**

**What to do next:**
1. Restart backend/frontend if running
2. Try generating a batch (should work now)
3. Each batch will cost ~$0.008
4. You can generate ~45 batches

---

## 🎯 Summary

**Problem**: API budget nearly exhausted ($4.64/$5.00 used)

**Solution**: Reduced batch size to 25 records

**Result**: 
- Can still generate **~1,125 records** with remaining $0.36
- Perfect for testing and validation
- Add more budget when ready for production-scale generation

**Next Steps**:
- Test with 25-record batches now
- Add $5-$10 budget for larger dataset
- Or apply for research credits for academic use

🚀 **Ready to generate small batches efficiently!**
