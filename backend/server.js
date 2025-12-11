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

// Get Gemini API key from environment
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

app.post('/api/generate-batch', async (req, res) => {
  try {
    const { subdomain, count = 50 } = req.body;
    
    if (!subdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }

    // Get existing Sinhala terms from database to avoid duplicates
    const existingTerms = await new Promise((resolve, reject) => {
      db.all("SELECT sinhala FROM datasets WHERE subdomain = ?", [subdomain], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.sinhala));
      });
    });    const prompt = `
                    Generate ${count} high-quality, diverse Sinhala → Singlish → English translation pairs for the "${subdomain}" agriculture subdomain.

                    Context:
                    ${SUBDOMAIN_PROMPTS[subdomain]}

                    ----------------------------------
                    STRICT REQUIREMENTS
                    ----------------------------------

                    1. DATA BALANCE
                    - 50% single Sinhala words (agricultural terms)
                    - 50% short Sinhala sentences (farmer queries, advice, observations)
                    - Of the entire dataset:
                      • 40% must be technical/agricultural terms (single words)
                      • 60% must be conversational, rural-style sentences

                    2. DOMAIN RELEVANCE
                    - ALL content must relate only to the subdomain "${subdomain}".
                    - Keep it rural Sri Lankan, practical, believable.
                    - Absolutely NO generic or unrelated Sinhala sentences.

                    3. DUPLICATE AVOIDANCE
                    Avoid duplicates with these existing terms:
                    ${existingTerms.join(", ").substring(0, 1000) || "none"}

                    ----------------------------------
                    4. SINGLISH VARIATIONS (CRUCIAL)
                    ----------------------------------

                    Provide **1–3 Singlish versions** representing real-life Sinhala → English-letter writing styles:

                    • singlish1 (Standard phonetic)
                      - Accurate, clear transliteration
                      - Examples: "govithana", "mee pohora", "katu pol"

                    • singlish2 (Social Media / SMS)
                      - Use shortcuts, vowel drops, slang
                      - Use common Sri Lankan texting patterns:
                        Examples:
                          mn, oy, bn, khmd, krnna, dnnaw?, ndda?
                      - Examples: "govitana", "mee pohra", "ktu pol"

                    • singlish3 (English-mixed)
                      - Mix Sinhala transliteration + simple English agriculture terms
                      - Examples:
                          "farming eka hari nadda?"
                          "liquid pohora eka danna one"

                    Rules:
                    - Always produce singlish1.
                    - Produce singlish2 and singlish3 only if natural.
                    - Maintain consistency between Sinhala → Singlish spelling.

                    ----------------------------------
                    5. ENGLISH VARIANTS
                    ----------------------------------

                    Provide 3 English versions for each item:

                    • variant1: Formal, clear translation  
                    • variant2: Casual/spoken rural-English style  
                    • variant3: Short technical explanation or interpretation

                    ----------------------------------
                    6. OUTPUT FORMAT (JSON ONLY)
                    ----------------------------------

                    Return ONLY a JSON array exactly like this:

                    [
                      {
                        "sinhala": "සිංහල අකුරෙන්",
                        "singlish1": "phonetic transliteration",
                        "singlish2": "sms/slang version (optional)",
                        "singlish3": "english-mixed version (optional)",
                        "variant1": "Formal English translation",
                        "variant2": "Casual spoken English translation",
                        "variant3": "Short technical/interpretive description",
                        "type": "word or sentence"
                      }
                    ]

                    ----------------------------------
                    7. QUALITY RULES
                    ----------------------------------

                    - Sinhala must be grammatically correct and rural-authentic.
                    - Singlish must be realistic, not robotic.
                    - Make all items unique and domain-specific.
                    - NO hallucinated diseases or chemicals.
                    - Keep sentences short and natural (WhatsApp-style length).
                    - Ensure Sinhala → Singlish alignment is exact.
                    - Ensure no repetition across items.
                    - NO text outside the JSON array.
                    `;

    console.log(`Generating ${count} items for subdomain: ${subdomain}`);
    console.log(`Existing terms count: ${existingTerms.length}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw Gemini response received");
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API. Expected JSON array.');
    }

    const generatedData = JSON.parse(jsonMatch[0]);
    console.log(`Parsed ${generatedData.length} items from response`);    // Save to database
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO datasets (sinhala, singlish1, singlish2, singlish3, variant1, variant2, variant3, subdomain, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let savedCount = 0;
    const savedItems = [];

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
            console.error('Database error for item:', item.sinhala, err);
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
            resolve();
          }
        });
      });
    }

    stmt.finalize();
    
    console.log(`Saved ${savedCount} new items, ${generatedData.length - savedCount} duplicates skipped`);
    
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