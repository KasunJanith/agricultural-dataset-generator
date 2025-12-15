import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Get OpenAI API key from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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

app.post('/api/generate-batch', async (req, res) => {
  try {
    const { subdomain, count = 50 } = req.body;
    
    if (!subdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }    // Get existing Sinhala terms from database to avoid duplicates
    const existingTerms = await new Promise((resolve, reject) => {
      db.all("SELECT sinhala FROM datasets WHERE subdomain = ?", [subdomain], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.sinhala));
      });
    });   const prompt = `You are generating synthetic training data for an mT5-based
Sinhala→English translation model.

=== RESEARCH CONTEXT ===
This data will be used in an MSc research project with the aim:
- To develop a machine-learning based translation model that accurately translates
  INFORMAL Sinhala / Singlish agricultural content into English, while preserving
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

These pairs will be used to:
- Train and evaluate an mT5 model tailored to informal Sinhala agricultural content
- Study linguistic challenges in Sinhala agricultural expressions
- Evaluate how well translations preserve meaning, intent, and domain knowledge

=== LINGUISTIC & STRUCTURAL REQUIREMENTS ===

1. INFORMAL AGRICULTURAL LANGUAGE (CORE FOCUS)
- Simulate REAL farmer queries and messages, not textbook language.
- Use:
  - Dialectal forms and rural speech patterns.
  - Spelling inconsistencies and typos.
  - Transliterated Sinhala written in Latin script (“Singlish”).
  - Mixed Sinhala–English forms common in chats and SMS.

Examples of patterns to use in Singlish:
- SMS / chat shortcuts: "mn" (මම), "oy" (ඔයා), "bn" (බන්),
  "ndda" (නේද), "krnna" (කරන්න), "thiyenne" ( තියෙන ), "nane" ( නෑනේ )
- Spelling variations:
  "govithana" / "govitana" / "govithenna"
  "pohora" / "pohra" / "pohar"
- Mixed English:
  "fertilizer eka danna one",
  "spray ekak denne kohomada?",
  "tractor eka service karanna puluwanda?"

2. DOMAIN-SPECIFIC AGRICULTURAL CONTENT
- Cover practical farmer needs in ${subdomain}, such as:
  - Pests, diseases, fertilizer, irrigation, soil, harvesting, machinery,
    organic methods, storage, etc. (depending on the subdomain).
- Include:
  - Questions to extension officers / experts.
  - Descriptions of field problems (leaf colour, insects, yield issues).
  - Requests for advice on pesticide/fertilizer dosage and timing.
  - Misconceptions or typical farmer mistakes (for realistic intent).

3. DATA MIX (TYPE DISTRIBUTION)
- Around 60% items: SENTENCES (queries, complaints, observations, instructions).
- Around 40% items: WORDS or SHORT PHRASES (terms, collocations).
- Vary sentence length (5–25 words).
- Include:
  - Questions (with ?)
  - Commands/requests
  - Statements / descriptions

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

Output ONLY a valid JSON array. No markdown, no comments, no extra text.

Each item in the array MUST have this structure:

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

CONSTRAINTS:
- "sinhala" must be in Sinhala Unicode, not Latin.
- "singlish1" MUST always be provided.
- "variant1", "variant2", "variant3", and "type" MUST always be provided.
- "singlish2" and "singlish3" ONLY if realistic variants exist.
- type:
  - "word" for single terms / short phrases (1–3 words)
  - "sentence" for longer queries / statements

=== GOOD EXAMPLES (STYLE, NOT TO BE COPIED DIRECTLY) ===

Example 1 (sentence):
{
  "sinhala": "මගේ වී වගාවේ කොළ පැහැයෙන් කහ වීමක් තියෙනවා, මේක මොන රෝගයක් විය හැකිද?",
  "singlish1": "mage wee wagawe kola paheyen kaha weemak thiyenawa, meka mona rogayak viya heki da?",
  "singlish2": "mge wi wgawe kola pahyen kha wimak thyenw mek mona rogayak viya heki d?",
  "singlish3": "mage paddy eke leaves kaha wela thiyenawa, meka mona disease ekakda?",
  "variant1": "The leaves in my paddy field are turning yellow. What disease could this be?",
  "variant2": "The leaves in my rice field are turning yellow. What disease might be causing it?",
  "variant3": "A farmer is asking about a possible rice disease because the paddy leaves are turning yellow in the field.",
  "type": "sentence"
}

Example 2 (word/phrase):
{
  "sinhala": "කෘමිනාශක",
  "singlish1": "kruminaashaka ",
  "singlish2": "kruminashaka",
  "singlish3": "pesticide eka",
  "variant1": "pesticide",
  "variant2": "insecticide",
  "variant3": "chemical used to kill pests",
  "type": "word"
}

=== BAD EXAMPLES (AVOID) ===
- Overly formal academic Sinhala (e.g., "කෘමිනාශක ඝනත්වය").
- Perfectly standardized, no spelling variation, no dialect, no informality.
- Pure general-domain content with no agricultural relevance.
- Any output that is not pure JSON.

=== FINAL INSTRUCTIONS ===
- Generate EXACTLY ${count} items.
- Make content diverse across different farming problems and terms in "${subdomain}".
- Focus on realistic informal farmer language + accurate domain-specific English.
- Do NOT output anything except the JSON array.`;    console.log(`Generating ${count} items for subdomain: ${subdomain}`);
    console.log(`Existing terms count: ${existingTerms.length}`);    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Sri Lankan agricultural linguist specializing in Sinhala-English translation. Respond ONLY with valid JSON arrays, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],      model: 'gpt-5.2', // GPT-5.2 model for advanced multilingual support
      max_completion_tokens: 10000
    });
      const text = chatCompletion.choices[0]?.message?.content || '[]';
    console.log("Raw OpenAI response received");
    console.log("Response preview:", text.substring(0, 500));
    
    // Extract JSON from response
    let generatedData;
    try {
      const parsed = JSON.parse(text);
      console.log("JSON parsed successfully, type:", typeof parsed, "isArray:", Array.isArray(parsed));
      
      // If response is wrapped in an object, try to find the array
      if (Array.isArray(parsed)) {
        generatedData = parsed;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        generatedData = parsed.data;
        console.log("Found array in 'data' property");
      } else if (parsed.items && Array.isArray(parsed.items)) {
        generatedData = parsed.items;
        console.log("Found array in 'items' property");
      } else {
        // Try to find any array in the object
        const firstArrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (firstArrayKey) {
          generatedData = parsed[firstArrayKey];
          console.log(`Found array in '${firstArrayKey}' property`);
        } else {
          console.error("No array found in response object. Keys:", Object.keys(parsed));
          throw new Error('No array found in response');
        }
      }
    } catch (e) {
      console.log("JSON parsing failed, trying regex fallback:", e.message);
      // Fallback: try to extract JSON array from text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from OpenAI API. Expected JSON array.');
      }
      generatedData = JSON.parse(jsonMatch[0]);
    }

    console.log(`Parsed ${generatedData.length} items from response`);
    if (generatedData.length > 0) {
      console.log("First item sample:", JSON.stringify(generatedData[0], null, 2));
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
    res.status(500).json({ error: 'Failed to generate batch translations: ' + error.message });
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
    let csvContent = headers.join(',') + '\n';
    
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