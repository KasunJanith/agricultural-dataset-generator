# 🚀 QUICK START GUIDE

## Current Configuration (December 17, 2025)

### ✅ Model: **gpt-5-mini**
- Best instruction following
- $0.25 input / $2.00 output per 1M tokens
- ~$0.015 per batch (50 records)

### ✅ Batch Size: **50 records**
- 25 words/phrases (type:"word")
- 25 sentences (type:"sentence")
- Exactly 50/50 split (validated)

### ✅ Cost: **~$1.50 for 5,000 records**
- Your $5 budget = **~16,650 records**

---

## Start the App

```cmd
# Terminal 1 - Backend
cd d:\Research\agricultural-dataset-generator\backend
npm start

# Terminal 2 - Frontend
cd d:\Research\agricultural-dataset-generator\frontend
npm run dev
```

Open: http://localhost:5173

---

## Generate Data

1. Select subdomain (e.g., "Crop Cultivation")
2. Click **"Generate 50 Records (25 Words + 25 Sentences)"**
3. Wait 60-90 seconds
4. Check console for distribution:
   ```
   📊 Type Distribution Check:
     Words: 25 (expected: 25)
     Sentences: 25 (expected: 25)
   ✅ Perfect 50/50 distribution achieved!
   ```

---

## Export Data

1. Click **"Export as CSV"**
2. File saved with all records
3. Use for mT5 training

---

## Key Features

✅ **Informal Singlish:** SMS shortcuts, spelling variations, mixed English
✅ **Simple Sinhala:** Natural farmer language (not academic)
✅ **50/50 Split:** Balanced words and sentences
✅ **3 English Variants:** Literal, natural, contextual
✅ **Duplicate Detection:** UNIQUE constraint on (sinhala, subdomain)
✅ **Loading Animation:** Professional popup during generation

---

## Files Modified

- ✅ `backend/server.js` - Model: gpt-5-mini, Count: 50, Enhanced prompt
- ✅ `frontend/src/App.jsx` - UI updates, 50 records, loading popup

---

## Support Docs

- 📄 `GPT-5-MINI-FINAL-UPDATE.md` - Complete documentation
- 📄 `GPT-4O-MINI-50-50-FIX.md` - 50/50 split implementation
- 📄 `UPDATES-COMPLETE.md` - Previous updates summary

---

**Everything is ready! Just start the servers and begin generating.** 🎉
