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
    });    const prompt = `Generate ${count} high-quality Sinhala agricultural translation pairs for the "${subdomain}" subdomain.

Context: ${SUBDOMAIN_PROMPTS[subdomain]}

Requirements:
1. Generate a balanced mix of 50% words and 50% sentences related to ${subdomain}
2. Content must be authentic Sri Lankan agricultural terminology and natural farmer speech
3. Avoid duplicates with existing terms: ${existingTerms.join(', ').substring(0, 800) || 'none'}

For each item, provide:
- "sinhala": Sinhala text in Unicode script (authentic agricultural term or natural sentence)
- "singlish1": Standard romanization (e.g., "govithana")
- "singlish2": Casual SMS/chat style (e.g., "govitana", optional if no natural variation)
- "singlish3": English-mixed style (e.g., "farming eka", optional if no natural variation)
- "variant1": Formal English translation
- "variant2": Casual/conversational English translation
- "variant3": Technical or contextual English explanation
- "type": "word" or "sentence"

Output ONLY a valid JSON array in this exact format:
[
  {
    "sinhala": "ගොවිතැන",
    "singlish1": "govithana",
    "singlish2": "govitana",
    "singlish3": "farming eka",
    "variant1": "farming",
    "variant2": "agriculture work",
    "variant3": "agricultural cultivation",
    "type": "word"
  }
]

Rules:
- Always provide singlish1, variant1, variant2, variant3, and type
- Only include singlish2 and singlish3 if natural variations exist
- Ensure accurate Sinhala spelling and realistic translations
- Make content diverse and domain-specific
- NO explanations, NO markdown, ONLY valid JSON array`;    console.log(`Generating ${count} items for subdomain: ${subdomain}`);
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