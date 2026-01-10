import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Get Google Gemini API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// CORS configuration for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Serve static files from frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Initialize SQLite database
const db = new sqlite3.Database(process.env.DATABASE_URL || './datasets.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sinhala TEXT NOT NULL,
    singlish1 TEXT NOT NULL,
    singlish2 TEXT,
    singlish3 TEXT,
    variant1 TEXT NOT NULL,
    variant2 TEXT NOT NULL,
    variant3 TEXT NOT NULL,
    subdomain TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('word', 'sentence')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sinhala, subdomain)
  )`);
}

// Agricultural subdomains
const AGRICULTURAL_SUBDOMAINS = [
  'crop_cultivation',
  'livestock_management', 
  'soil_science',
  'pest_management',
  'irrigation',
  'harvesting',
  'organic_farming',
  'agricultural_machinery',
  'crop_protection',
  'post_harvest_technology'
];

// Agricultural context prompts for each subdomain
const SUBDOMAIN_PROMPTS = {
  'crop_cultivation': 'rice cultivation, vegetable farming, fruit cultivation, grain crops, planting techniques, crop rotation, seeding, transplanting, cultivation methods',
  'livestock_management': 'cattle farming, poultry, dairy production, animal husbandry, veterinary care, livestock feeding, animal health, breeding, farm animals',
  'soil_science': 'soil types, soil fertility, soil conservation, fertilizers, soil testing, organic matter, soil pH, soil nutrients, soil erosion',
  'pest_management': 'insect pests, weed control, disease management, pesticides, biological control, integrated pest management, pest identification, prevention methods',
  'irrigation': 'water management, drip irrigation, sprinkler systems, water conservation, irrigation scheduling, water sources, irrigation methods, water efficiency',
  'harvesting': 'harvest techniques, post-harvest handling, storage methods, crop yield, harvesting equipment, harvest timing, crop quality, manual harvesting',
  'organic_farming': 'organic fertilizers, natural pesticides, sustainable practices, certification, organic standards, compost, bio-fertilizers, eco-friendly methods',
  'agricultural_machinery': 'tractors, harvesters, plows, cultivators, farm equipment, machinery maintenance, implements, power tools, agricultural technology',
  'crop_protection': 'plant diseases, pest control, protective measures, crop health, prevention methods, fungicides, insecticides, protective nets',
  'post_harvest_technology': 'storage facilities, processing, packaging, quality control, preservation techniques, drying methods, cold storage, transportation'
};

// API Routes
app.get('/api/subdomains', (req, res) => {
  res.json(AGRICULTURAL_SUBDOMAINS);
});

// Get recommended batch size based on token limits
app.get('/api/token-info', (req, res) => {
  const maxRecommendedBatchSize = Math.floor(
    (TOKEN_CONFIG.MAX_MODEL_TOKENS / TOKEN_CONFIG.SAFETY_BUFFER) / TOKEN_CONFIG.TOKENS_PER_ITEM
  );
  
  res.json({
    tokenConfig: {
      tokensPerItem: TOKEN_CONFIG.TOKENS_PER_ITEM,
      safetyBuffer: TOKEN_CONFIG.SAFETY_BUFFER,
      maxModelTokens: TOKEN_CONFIG.MAX_MODEL_TOKENS,
    },
    recommendations: {
      maxBatchSize: maxRecommendedBatchSize,
      safeBatchSize: Math.floor(maxRecommendedBatchSize * 0.8), // 80% for extra safety
      defaultBatchSize: 200,
    },
    examples: [
      { batchSize: 50, estimatedTokens: Math.ceil(50 * TOKEN_CONFIG.TOKENS_PER_ITEM * TOKEN_CONFIG.SAFETY_BUFFER) },
      { batchSize: 100, estimatedTokens: Math.ceil(100 * TOKEN_CONFIG.TOKENS_PER_ITEM * TOKEN_CONFIG.SAFETY_BUFFER) },
      { batchSize: 200, estimatedTokens: Math.ceil(200 * TOKEN_CONFIG.TOKENS_PER_ITEM * TOKEN_CONFIG.SAFETY_BUFFER) },
      { batchSize: 250, estimatedTokens: Math.ceil(250 * TOKEN_CONFIG.TOKENS_PER_ITEM * TOKEN_CONFIG.SAFETY_BUFFER) },
    ]
  });
});

// Token allocation configuration for dynamic sizing
const TOKEN_CONFIG = {
  TOKENS_PER_ITEM: 200,        // Average tokens needed per generated item
  SYSTEM_PROMPT_TOKENS: 3000,  // Approximate tokens for system prompt
  SAFETY_BUFFER: 1.3,          // 30% safety margin (1.3 = 130% of estimate)
  MAX_MODEL_TOKENS: 65536,     // Gemini 2.5 Flash maximum output tokens
  WARN_THRESHOLD: 0.9,         // Warn if using >90% of model capacity
};

app.post('/api/generate-batch', async (req, res) => {
  try {
    const { subdomain, count = 200 } = req.body;
    
    if (!subdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }// Get existing Sinhala terms from database to avoid duplicates
    const existingTerms = await new Promise((resolve, reject) => {
      db.all("SELECT sinhala FROM datasets WHERE subdomain = ?", [subdomain], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.sinhala));
      });
    });    const prompt = `You are generating synthetic training data for an mT5-based
Sinhala→English translation model.

=== RESEARCH CONTEXT ===
This data will be used in a research project with the aim:
- To develop a machine-learning based translation model that accurately translates
  INFORMAL Singlish(romanized Sinhala) agricultural content into English, while preserving
  meaning, intent, and domain-specific agricultural information.

The study focuses on:
- Informal farmer communication (WhatsApp, SMS, Facebook, voice-to-text style)
- Dialectal variations, spelling inconsistencies, and mixed Sinhala–English
- Domain-specific agricultural jargon and practical farming scenarios
- Limitations of tools like Google Translate on informal agricultural text
- Low-resource machine translation for Sinhala in a specialized domain

=== YOUR TASK ===
Generate ${count} diverse Sinhala/Singlish → English translation pairs
for the agricultural subdomain: "${subdomain}"

Domain context for this subdomain:
${SUBDOMAIN_PROMPTS[subdomain]}

⚠️ CRITICAL: REVERSE GENERATION APPROACH ⚠️
To ensure accuracy and semantic alignment:

STEP 1: Generate English variants FIRST (variant1, variant2, variant3)
  - Start with agricultural concepts/questions in English
  - Ensure they are relevant to ${subdomain}
  - Make them realistic for farmer communication

STEP 2: Generate accurate Sinhala translation matching variant1
  - Translate variant1 into pure, natural, informal Sinhala
  - Ensure spelling is 100% correct
  - Use simple farmer language (not academic/formal)
  - Double-check: Does this Sinhala accurately convey variant1's meaning?

STEP 3: Generate Singlish romanizations from the Sinhala
  - Create singlish1, singlish2, singlish3 based on the accurate Sinhala

This approach ensures:
✓ English variants are conceptually accurate (your native strength)
✓ Sinhala matches English meaning precisely (no semantic drift)
✓ No Sinhala spelling/word errors
✓ Perfect semantic alignment across all fields

These pairs will be used to:
- Train and evaluate an mT5 model tailored to informal Sinhala agricultural content
- Study linguistic challenges in Sinhala agricultural expressions
- Evaluate how well translations preserve meaning, intent, and domain knowledge

=== GENERATION WORKFLOW (FOLLOW STRICTLY) ===

For EACH item you generate, follow this exact sequence:

🔵 STEP 1: CREATE ENGLISH VARIANTS FIRST
Think of a realistic agricultural concept/question for "${subdomain}":
  
  a) variant1: Direct, literal English translation
     - Simple and straightforward
     - Agricultural focus: ${SUBDOMAIN_PROMPTS[subdomain]}
     
  b) variant2: Natural conversational English
     - How a farmer or agricultural advisor would actually say it
     - More natural phrasing
     
  c) variant3: English with domain context/explanation
     - What the farmer is really asking/saying
     - Include crop, problem, intent, context
     
  d) type: Decide if this is a "word" (1-3 words) or "sentence" (full query/statement)

🟢 STEP 2: TRANSLATE TO ACCURATE SINHALA
Now translate variant1 into pure, natural, informal Sinhala:
  
  REQUIREMENTS:
  - Must be 100% pure Sinhala Unicode (no English words/transliterations)
  - Must accurately convey variant1's meaning (semantic alignment is critical)
  - Use simple, informal farmer language (not academic/formal)
  - Double-check spelling - it MUST be correct!
  - Sound natural for Sri Lankan farmers
  
  EXAMPLES:
  ✓ GOOD: "පොහොර දාන්න හොද වෙලාව කියන්නකො"
  ✓ GOOD: "කොළ වලට කහ පැහැයක් එනවා"
  ✓ GOOD: "වී වගාවට ජලය දෙන්නේ කොහොමද?"
  
  ❌ BAD: "fertilizer එක දාන්න" (has English word)
  ❌ BAD: "කෘෂිකාර්මික ආර්ථික සංවර්ධනය" (too formal/academic)
  ❌ BAD: Incorrect spellings or wrong words

🟡 STEP 3: CREATE SINGLISH ROMANIZATIONS
From your accurate Sinhala, generate informal romanizations:

  a) singlish1 (ALWAYS required):
     - Primary romanization of the Sinhala
     - Full form, readable
     Example: "pohora danna hoda welawa kiyannako"
  
  b) singlish2 (when natural SMS shortcuts exist):
     - Conservative SMS-style abbreviations
     - DON'T over-abbreviate - keep it readable!
     - Only use shortcuts that farmers actually use
     - Examples of acceptable shortcuts:
       • "kohomada" → "kohmda" (common)
       • "karanna" → "krnna" (natural vowel drop)
       • "danna" → "dann" (natural shortening)
       • "mama" → "mn" (very common SMS)
       • "oyaa" → "oy" (very common SMS)
     - Examples of UNACCEPTABLE over-abbreviation:
       ❌ "bindnv" (too short, unreadable)
       ❌ "gs" for "gas" (too aggressive)
       ❌ "dvl" for "daval" (loses meaning)
     - Rule of thumb: If you can't easily pronounce it, don't abbreviate it!
     - Set to null if no natural shortcuts exist
  
  c) singlish3 (only when natural English mixing exists):
     - Mixed Sinhala-English form
     - Only if farmers commonly mix English for this concept
     Examples: "fertilizer eka danna one", "spray ekak denne kohomada"
     - Set to null if no natural mixing pattern exists

=== DATA MIX (TYPE DISTRIBUTION) - CRITICAL REQUIREMENT ===

1. INFORMAL AGRICULTURAL LANGUAGE (CORE FOCUS)
- Simulate REAL farmer queries and messages, not textbook language.
- Use:
  - Dialectal forms and rural speech patterns.
  - Spelling inconsistencies and typos.
  - Transliterated Sinhala written in Latin script (“Singlish”).
  - Mixed Sinhala–English forms common in chats and SMS.

Examples of Singlish patterns to use:

SINGLISH1 (ALWAYS required - primary romanization):
  - Full romanization: "pohora danne kohomada?", "wee wagawa", "govithana"
  
SINGLISH2 (Generate when natural SMS shortcuts exist):
  - SMS abbreviations: "mn" (මම), "oy" (ඔයා), "bn" (බන්)
  - Shortened forms: "krnna" (කරන්න), "thiyenne" (තියෙන), "nane" (නෑනේ)
  - Vowel drops: "kewd" (කේවද), "kohmd" (කොහොමද), "dann" (දාන්න)
  - Common shortcuts: "ndda" (නැද්ද), "ekak" → "ekk", "karanna" → "krnna"
  - Spelling variations: "govitana" (vs govithana), "pohra" (vs pohora)
  
SINGLISH3 (Only if natural mixed Sinhala-English form exists):
  - Mixed English: "fertilizer eka danna one", "spray ekak denne kohomada?"
  - Code-switching: "tractor eka service karanna puluwanda?"
  - English nouns + Sinhala grammar: "pesticide ekak isinna", "yield eka adu wuna"

=== BAD EXAMPLES (AVOID THESE) ===
Do NOT generate overly formal, academic, or complex Sinhala that farmers wouldn't actually use:
❌ BAD (too formal/academic):
  - "කෘෂිකාර්මික ආර්ථික සංවර්ධනය සඳහා පාරිසරික තිරසාර ක්‍රමවේදයන්"
  - "ප්‍රාථමික කෘෂි රසායනික පොහොර යෙදවීමේ කාර්යක්ෂම ක්‍රමවේදයන්"
  - "කෘමිනාශක ඝනත්වය"

❌ BAD (English words in Sinhala column - NEVER DO THIS):
  - "fertilizer එක දාන්න හොද වෙලාව කියන්නකො" (has "fertilizer" - wrong!)
  - "spray එක දාන්න කොච්චර ml දාන්න ඕනෙ?" (has "spray" and "ml" - wrong!)

✓ GOOD (PURE Sinhala - simple, natural, informal):
  - "වී වගාවට පොහොර දාන්නේ කොහොමද?" (pure Sinhala ✓)
  - "පොහොර දාන්න හොද වෙලාව කියන්නකො" (pure Sinhala ✓)
  - "කෘමිනාශක ඉසින්නේ කොහොමද?" (pure Sinhala ✓)

⚠️ CRITICAL RULE: The "sinhala" field MUST contain ONLY Sinhala Unicode script.
- NO English words (not even "fertilizer", "spray", "tractor", "ml", etc.)
- NO English transliterations in Sinhala script (no "ට්‍රැක්ටර්")
- Mixed Sinhala-English forms ONLY go in "singlish3" field

Keep Sinhala SIMPLE and NATURAL - but 100% PURE SINHALA SCRIPT!

2. DOMAIN-SPECIFIC AGRICULTURAL CONTENT
- Cover practical farmer needs in ${subdomain}, such as:
  - Pests, diseases, fertilizer, irrigation, soil, harvesting, machinery,
    organic methods, storage, etc. (depending on the subdomain).
- Include:
  - Questions to extension officers / experts.
  - Descriptions of field problems (leaf colour, insects, yield issues).
  - Requests for advice on pesticide/fertilizer dosage and timing.
  - Misconceptions or typical farmer mistakes (for realistic intent).

3. DATA MIX (TYPE DISTRIBUTION) - CRITICAL REQUIREMENT
⚠️ MANDATORY 50/50 SPLIT ⚠️

Out of ${count} total items, you MUST generate:
- EXACTLY ${Math.floor(count / 2)} items with type:"word" (words/short phrases)
- EXACTLY ${Math.ceil(count / 2)} items with type:"sentence" (full sentences)

THIS IS NOT A SUGGESTION - IT IS A STRICT REQUIREMENT!

WORDS/PHRASES (type:"word") - ${Math.floor(count / 2)} items needed:
- Single agricultural terms: "පොහොර" (fertilizer), "කෘමිනාශක" (pesticide)
- 2-3 word collocations: "කොළයේ පැහැය" (leaf color), "වී වගාව" (rice cultivation)
- Technical terms: "ජල කළමනාකරණය" (water management)
- Common farmer vocabulary
Examples of WORDS to generate:
  • පොහොර (pohora / pohra) - fertilizer
  • වී වගාව (wee wagawa) - rice cultivation
  • කෘමි ප්‍රහාරය (krumi praharaya) - pest attack

SENTENCES (type:"sentence") - ${Math.ceil(count / 2)} items needed:
- Questions: "පොහොර දාන්නේ කොහොමද?" (How to apply fertilizer?)
- Requests: "fertilizer එක දාන්න කියන්නකො" (Please tell me how to add fertilizer)
- Descriptions: "කොළ වලට කහ පැහැයක් එනවා" (Leaves are turning yellow)
- Commands: "spray එක දාන්න" (Apply the spray)
- Vary length: 5-25 words

⚠️ COUNT VERIFICATION: Before submitting, verify you have ${Math.floor(count / 2)} "word" type and ${Math.ceil(count / 2)} "sentence" type items!

4. TRANSLATION QUALITY & INTENT
For each item:
- Sinhala (Unicode) must sound natural for Sri Lankan farmers.
- English variants must:
  - Preserve factual meaning.
  - Preserve user intent (asking, complaining, requesting advice, etc.).
  - Preserve domain-specific information (crop, pest, chemical, timing).

5. RESEARCH-DRIVEN VARIANTS
Each item must include:
- variant1: Direct, fairly literal English translation (can be slightly rigid).
- variant2: Natural conversational English as an agricultural advisor would say.
- variant3: English explanation with domain context
  (e.g., what the farmer is really asking, including crop, problem, and intent).

These are needed to:
- Study literal vs. natural vs. contextual translations.
- Evaluate how well the model preserves meaning, intent, and domain-specific info.

6. AVOIDING EXACT DUPLICATES (BUT REUSE VOCABULARY IS OK)
Do NOT repeat the exact same full Sinhala sentence or word that already exists
for this subdomain:
${existingTerms.join(', ').substring(0, 800) || 'none'}

HOWEVER:
- You MAY reuse the same agricultural words (e.g., "පොහොර", "වී", "කෘමිනාශක")
  inside NEW sentences with different structures, contexts, or intents.
- You MAY generate multiple different sentences about the same concept
  (e.g., fertilizer, pests, irrigation) as long as the full Sinhala text is not
  an exact duplicate of an existing record.

In summary:
- Avoid exact duplicate Sinhala strings.
- Reusing the same vocabulary in new, varied sentences and phrases is GOOD and encouraged.

=== OUTPUT FORMAT (STRICT) ===

You MUST return a single JSON object with a top-level "items" array.
Do NOT return a bare array. Do NOT add any text before or after the JSON.

The structure MUST be:
{
  "items": [
    {
      "sinhala": "සිංහල Unicode text (informal farmer style or term)",
      "singlish1": "Primary informal Singlish form (required)",
      "singlish2": "Alternative spelling / SMS style (optional, if natural)",
      "singlish3": "Mixed Sinhala-English form (optional, if natural)",
      "variant1": "Direct English translation (literal focus)",
      "variant2": "Natural English (how an expert would actually say it)",
      "variant3": "English explanation capturing intent and agricultural context",
      "type": "word" or "sentence"
    }
  ]
}

EXAMPLES OF CORRECT SINGLISH GENERATION:

Example 1 (Word with SMS shortening):
{
  "sinhala": "පොහොර",
  "singlish1": "pohora",           ← ALWAYS required (full romanization)
  "singlish2": "pohra",            ← Natural spelling variation
  "singlish3": null,               ← No English mixing for simple word
  "variant1": "fertilizer",
  "type": "word"
}

Example 2 (Sentence with SMS shortcuts):
{
  "sinhala": "පොහොර දාන්නේ කොහොමද?",
  "singlish1": "pohora danne kohomada?",  ← ALWAYS required
  "singlish2": "pohora dann kohomda?",   ← SMS shortcuts: "danne"→"dann", "kohomada"→"kohomda"
  "singlish3": "fertilizer eka danna kohomada?", ← Mixed English
  "variant1": "How to apply fertilizer?",
  "type": "sentence"
}

Example 3 (Already short, no singlish2 needed):
{
  "sinhala": "වී",
  "singlish1": "wee",              ← ALWAYS required
  "singlish2": null,               ← Already very short, no natural shortening
  "singlish3": null,               ← No English mixing
  "variant1": "rice/paddy",
  "type": "word"
}

Example 4 (Complex sentence with all variants):
{
  "sinhala": "මම වී වගාවට පොහොර දාලා තියෙන්නේ",
  "singlish1": "mama wee wagawata pohora dala thiyenne",  ← ALWAYS required
  "singlish2": "mn wee wagawata pohora dla thyenne",    ← SMS: "mama"→"mn","dala"→"dla","thiyenne"→"thyenne"
  "singlish3": "mn wee wagawata fertilizer dala thiyenne", ← Mixed English
  "variant1": "I have applied fertilizer on the rice field",
  "type": "sentence"
}

CONSTRAINTS:
- "sinhala" MUST be 100% PURE Sinhala Unicode script ONLY.
  ❌ NO English words allowed (not even common ones like "fertilizer", "spray", "tractor")
  ❌ NO English transliterations in Sinhala script (not "ෆර්ටිලයිසර්", etc.)
  ✓ Use proper Sinhala words: පොහොර (not fertilizer), ඉසින (not spray)
  
- "singlish1" MUST ALWAYS be provided (primary romanization - full form).
  Example: "pohora danne kohomada?", "wee wagawa", "krumi praharaya"
  
- "singlish2" should be provided when natural SMS-style shortcuts exist:
  ✓ Generate if you can shorten words naturally: "kohomada" → "kohomda", "karanna" → "krnna"
  ✓ Generate if SMS abbreviations fit: "mama" → "mn", "oyaa" → "oy"
  ✓ Generate if vowel drops are natural: "kewada" → "kewd", "danna" → "dann"
  ✓ Generate if common spelling variations exist: "govithana" → "govitana", "pohora" → "pohra"
  ❌ Skip if singlish1 is already very short or no natural shortening exists
  
- "singlish3" ONLY if a natural mixed Sinhala-English form exists:
  ✓ Generate when farmers commonly mix English: "fertilizer eka danna one"
  ✓ Generate for English technical terms with Sinhala grammar: "spray karanne kohomada"
  ❌ Skip if there's no common English mixing pattern for this phrase
  
- "variant1", "variant2", "variant3", and "type" MUST always be provided.

- type:
  - "word" for single terms / short phrases (1–3 words)
  - "sentence" for longer queries / statements

=== FINAL INSTRUCTIONS ===
- Generate EXACTLY ${count} items total.
- ⚠️ CRITICAL: ${Math.floor(count / 2)} items MUST be type:"word" and ${Math.ceil(count / 2)} items MUST be type:"sentence"
- Put ALL items inside the "items" array of a single JSON object.
- Output ONLY that JSON object. No markdown, no comments, no extra text.
- Double-check your work: Count the "word" and "sentence" types before submitting!`;    console.log(`Generating ${count} items for subdomain: ${subdomain}`);
    console.log(`Existing terms count: ${existingTerms.length}`);

    // Calculate dynamic token limit based on batch size
    const estimatedOutputTokens = Math.ceil(
      (count * TOKEN_CONFIG.TOKENS_PER_ITEM) * TOKEN_CONFIG.SAFETY_BUFFER
    );
    
    // Use the smaller of: estimated need or model maximum
    const dynamicMaxTokens = Math.min(estimatedOutputTokens, TOKEN_CONFIG.MAX_MODEL_TOKENS);
    
    // Calculate recommended maximum batch size
    const maxRecommendedBatchSize = Math.floor(
      (TOKEN_CONFIG.MAX_MODEL_TOKENS / TOKEN_CONFIG.SAFETY_BUFFER) / TOKEN_CONFIG.TOKENS_PER_ITEM
    );
    
    console.log(`\n📊 Dynamic Token Allocation:`);
    console.log(`  Batch size: ${count} items`);
    console.log(`  Tokens per item: ${TOKEN_CONFIG.TOKENS_PER_ITEM} (avg)`);
    console.log(`  Base calculation: ${count} × ${TOKEN_CONFIG.TOKENS_PER_ITEM} = ${count * TOKEN_CONFIG.TOKENS_PER_ITEM} tokens`);
    console.log(`  Safety buffer: ${Math.round((TOKEN_CONFIG.SAFETY_BUFFER - 1) * 100)}%`);
    console.log(`  Estimated tokens needed: ${estimatedOutputTokens}`);
    console.log(`  Allocated maxOutputTokens: ${dynamicMaxTokens}`);
    console.log(`  Model capacity: ${TOKEN_CONFIG.MAX_MODEL_TOKENS} (${Math.round((dynamicMaxTokens / TOKEN_CONFIG.MAX_MODEL_TOKENS) * 100)}% utilized)`);
    
    // Warn if approaching or exceeding token limit
    if (estimatedOutputTokens > TOKEN_CONFIG.MAX_MODEL_TOKENS) {
      console.warn(`\n⚠️  WARNING: Token limit exceeded!`);
      console.warn(`   Requested: ${estimatedOutputTokens} tokens`);
      console.warn(`   Maximum: ${TOKEN_CONFIG.MAX_MODEL_TOKENS} tokens`);
      console.warn(`   Current batch size: ${count} items`);
      console.warn(`   Recommended maximum: ${maxRecommendedBatchSize} items`);
      console.warn(`   Action: Consider reducing batch size to avoid truncation.`);
    } else if (dynamicMaxTokens > TOKEN_CONFIG.MAX_MODEL_TOKENS * TOKEN_CONFIG.WARN_THRESHOLD) {
      console.warn(`\n⚠️  NOTICE: Approaching token limit (${Math.round((dynamicMaxTokens / TOKEN_CONFIG.MAX_MODEL_TOKENS) * 100)}%)`);
      console.warn(`   Maximum safe batch size: ${maxRecommendedBatchSize} items`);
    }

    // Combine system and user messages for Gemini with strong JSON formatting instructions
    const fullPrompt = `You are an expert Sri Lankan agricultural linguist specializing in Sinhala-English translation.

CRITICAL: Your response must be ONLY a valid JSON object. No text before or after the JSON. No markdown code blocks. No explanations.

REQUIRED JSON FORMAT:
{
  "items": [
    {
      "sinhala": "කුඹුරු",
      "singlish1": "kumburu",
      "singlish2": "kumburu",
      "singlish3": null,
      "variant1": "paddy field",
      "variant2": "rice field",
      "variant3": "paddy cultivation area",
      "type": "word"
    }
  ]
}

WORKFLOW: 
1) Generate English variants FIRST (variant1, variant2, variant3)
2) Translate variant1 to pure Sinhala (100% correct spelling, simple informal language)
3) Generate singlish romanizations from Sinhala

REQUIREMENTS:
- Generate EXACTLY 50% words (type:"word") and 50% sentences (type:"sentence")
- "sinhala" field MUST be 100% pure Sinhala Unicode - NO English words
- "singlish1" is ALWAYS required
- "singlish2" should be conservative SMS shortcuts (DON'T over-abbreviate)
- "singlish3" only if natural English-Sinhala mixing exists (otherwise null)

${prompt}

REMINDER: Output ONLY the JSON object. Start with { and end with }. No other text.`;    // Use Gemini 2.5 Flash with dynamically calculated token limit
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 1,
        maxOutputTokens: dynamicMaxTokens, // Dynamically calculated based on batch size!
        responseMimeType: "application/json",
      },
    });

    console.log(`\n🚀 Calling Gemini 2.5 Flash API...`);
    console.log(`   Model: gemini-2.5-flash`);
    console.log(`   Max output tokens: ${dynamicMaxTokens}`);
    const result = await model.generateContent(fullPrompt);
    console.log("✅ Gemini API call succeeded");const text = result.response.text() || '{}';
    console.log("Raw Gemini response received");
    console.log("Response length:", text.length);
    console.log("Response preview (first 1000 chars):", text.substring(0, 1000));
    console.log("Response preview (last 200 chars):", text.substring(Math.max(0, text.length - 200)));
    
    // Check if response looks truncated
    const lastChars = text.substring(Math.max(0, text.length - 20));
    const isTruncated = !lastChars.includes('}') || text.split('{').length !== text.split('}').length;
    if (isTruncated) {
      console.warn("⚠️ WARNING: Response appears truncated! Missing closing braces.");
      console.warn("   This usually means maxOutputTokens was too small.");
      console.warn("   Attempting to fix by adding missing closing braces...");
      
      // Try to fix incomplete JSON by adding missing closing braces
      throw new Error('Response truncated - increase maxOutputTokens or reduce batch size');
    }

    // Normalize response: remove surrounding markdown fences if present
    let normalizedText = text.trim();
    if (normalizedText.startsWith('```')) {
      normalizedText = normalizedText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
    }

    // Extract JSON from response (expecting an object with an `items` array)
    let generatedData;
    try {
      const direct = JSON.parse(normalizedText);
      console.log("Direct JSON.parse succeeded, keys:", Object.keys(direct));

      if (Array.isArray(direct)) {
        // Fallback if model still returns a bare array
        generatedData = direct;
      } else if (Array.isArray(direct.items)) {
        generatedData = direct.items;
        console.log("Using 'items' array from response object");
      } else {
        const firstArrayKey = Object.keys(direct).find(key => Array.isArray(direct[key]));
        if (firstArrayKey) {
          generatedData = direct[firstArrayKey];
          console.log(`Found array in '${firstArrayKey}' property`);
        } else {
          throw new Error('No JSON array found in response object');
        }
      }    } catch (e) {
      console.log("Direct JSON.parse failed:", e.message);
      console.log("Attempting regex-based array extraction");
      console.log("Normalized text (full):", normalizedText);

      const arrayMatch = normalizedText.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        console.error('No JSON array found in Gemini response text');
        console.error('Full normalized text:', normalizedText);
        throw new Error('Invalid response format from Gemini API. Expected JSON array');
      }      try {
        generatedData = JSON.parse(arrayMatch[0]);
        console.log("Regex-based JSON array parse succeeded, length:", generatedData.length);
      } catch (innerErr) {
        console.error('Failed to parse extracted JSON array:', innerErr.message);
        console.error('Extracted array string:', arrayMatch[0].substring(0, 500));
        throw new Error('Invalid response format from Gemini API. Expected JSON array');
      }
    }console.log(`Parsed ${generatedData.length} items from response`);
    if (generatedData.length > 0) {
      console.log("First item sample:", JSON.stringify(generatedData[0], null, 2));
    }

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
      console.warn(`   Please check model output. Expected ${expectedWords} words and ${expectedSentences} sentences.`);
    } else {
      console.log(`✅ Perfect 50/50 distribution achieved!`);
    }

    // Save to database
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO datasets (sinhala, singlish1, singlish2, singlish3, variant1, variant2, variant3, subdomain, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);    let savedCount = 0;
    const savedItems = [];
    let duplicateCount = 0;
    let errorCount = 0;

    for (const item of generatedData) {
      await new Promise((resolve, reject) => {
        stmt.run([
          item.sinhala,
          item.singlish1 || item.singlish || item.sinhala, // fallback for backward compatibility
          item.singlish2 || null,
          item.singlish3 || null,
          item.variant1,
          item.variant2,
          item.variant3,
          subdomain,
          item.type || (item.sinhala.split(' ').length > 2 ? 'sentence' : 'word')
        ], function(err) {
          if (err) {
            console.error('Database error for item:', item.sinhala, err.message);
            errorCount++;
            resolve();
          } else if (this.changes > 0) {
            savedCount++;
            savedItems.push({
              id: this.lastID,
              ...item,
              subdomain
            });
            resolve();
          } else {
            console.log('Duplicate skipped:', item.sinhala);
            duplicateCount++;
            resolve();
          }
        });
      });
    }

    stmt.finalize();
    
    console.log(`Saved ${savedCount} new items, ${duplicateCount} duplicates skipped, ${errorCount} errors`);
    console.log(`Total generated: ${generatedData.length}, Saved: ${savedCount}, Duplicates: ${duplicateCount}, Errors: ${errorCount}`);
    
    res.json({
      generated: savedCount,
      duplicates: generatedData.length - savedCount,
      items: savedItems
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
      // Check for specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file.',
        details: error.message 
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Gemini API rate limit exceeded. Please wait a moment and try again.',
        details: error.message 
      });
    }
    
    if (error.message?.includes('model') || error.message?.includes('not found')) {
      return res.status(400).json({ 
        error: 'Invalid model configuration. Please check the model name.',
        details: error.message 
      });
    }
    
    if (error.message?.includes('truncated') || error.message?.includes('Unterminated string')) {
      return res.status(500).json({ 
        error: 'Response was truncated. The batch size may be too large for the token limit.',
        details: error.message,
        suggestion: 'Try reducing batch size to 100 records or contact support if issue persists.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate batch translations: ' + error.message,
      details: error.stack?.split('\n').slice(0, 3).join('\n')
    });
  }
});

app.get('/api/datasets', (req, res) => {
  const { subdomain } = req.query;
  let query = "SELECT * FROM datasets";
  let params = [];

  if (subdomain) {
    query += " WHERE subdomain = ?";
    params.push(subdomain);
  }

  query += " ORDER BY created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch datasets' });
    }
    res.json(rows);
  });
});

app.get('/api/statistics', (req, res) => {
  db.all(`
    SELECT 
      subdomain,
      type,
      COUNT(*) as count
    FROM datasets 
    GROUP BY subdomain, type
    ORDER BY subdomain, type
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    res.json(rows);
  });
});

app.get('/api/export-csv', (req, res) => {
  const { subdomain } = req.query;
  let query = "SELECT * FROM datasets";
  let params = [];

  if (subdomain) {
    query += " WHERE subdomain = ?";
    params.push(subdomain);
  }
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to export data' });
    }    const headers = ['Sinhala', 'Singlish1', 'Singlish2', 'Singlish3', 'Variant1', 'Variant2', 'Variant3', 'Subdomain', 'Type'];
    // Add UTF-8 BOM for proper Unicode display in Excel and other applications
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    
    rows.forEach(row => {
      const escapedRow = [
        `"${(row.sinhala || '').replace(/"/g, '""')}"`,
        `"${(row.singlish1 || row.singlish || '').replace(/"/g, '""')}"`,
        `"${(row.singlish2 || '').replace(/"/g, '""')}"`,
        `"${(row.singlish3 || '').replace(/"/g, '""')}"`,
        `"${(row.variant1 || '').replace(/"/g, '""')}"`,
        `"${(row.variant2 || '').replace(/"/g, '""')}"`,
        `"${(row.variant3 || '').replace(/"/g, '""')}"`,
        `"${row.subdomain}"`,
        `"${row.type}"`
      ];
      csvContent += escapedRow.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=agricultural_dataset${subdomain ? '_' + subdomain : ''}.csv`);
    res.send(csvContent);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Agricultural Dataset Generator`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});