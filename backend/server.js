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
  TOKENS_PER_ITEM: 150,        // Single variant per item is compact and fast
  SYSTEM_PROMPT_TOKENS: 2000,  // Approximate tokens for system prompt
  SAFETY_BUFFER: 1.3,          // 30% safety margin
  MAX_MODEL_TOKENS: 65536,     // Gemini maximum output tokens
  WARN_THRESHOLD: 0.85,        // Warn earlier at 85% capacity
};

app.post('/api/generate-batch', async (req, res) => {
  try {
    const { subdomain, count = 2 } = req.body;  // Default 2 items for fast demos
    
    if (!subdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }// Get existing Sinhala terms from database to avoid duplicates
    const existingTerms = await new Promise((resolve, reject) => {
      db.all("SELECT sinhala FROM datasets WHERE subdomain = ?", [subdomain], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.sinhala));
      });
    });

    const prompt = `You are generating synthetic training data for an mT5-based Sinhala→English translation model.

=== RESEARCH CONTEXT ===
This data will be used in a research project to train a model that translates INFORMAL Singlish (romanized Sinhala) agricultural content into English.
Focus on informal farmer queries, practical farming, and domain terminology for "${subdomain}".

Domain context:
${SUBDOMAIN_PROMPTS[subdomain]}

=== GENERATION INSTRUCTIONS ===
For each item:
1. "variant1": Clear, accurate English translation (the primary translation).
2. "sinhala": Pure, natural informal Sinhala (100% Sinhala Unicode, NO English words).
3. "singlish1": Primary romanized Singlish of the Sinhala phrase (e.g., "pohora danna kohomada?").
4. "type": "word" (1-3 words) or "sentence" (full query/statement).

=== STRICT 50/50 DISTRIBUTION ===
Total items to generate: ${count}
- ${Math.floor(count / 2)} items MUST have type: "word"
- ${Math.ceil(count / 2)} items MUST have type: "sentence"

=== AVOIDING EXACT DUPLICATES ===
Avoid exact duplicates of existing terms:
${existingTerms.join(', ').substring(0, 500) || 'none'}

=== OUTPUT FORMAT ===
Return ONLY a valid JSON object:
{
  "items": [
    {
      "sinhala": "පොහොර",
      "singlish1": "pohora",
      "variant1": "fertilizer",
      "type": "word"
    },
    {
      "sinhala": "පොහොර දාන්නේ කොහොමද?",
      "singlish1": "pohora danne kohomada?",
      "variant1": "How to apply fertilizer?",
      "type": "sentence"
    }
  ]
}

=== FINAL INSTRUCTIONS ===
- Generate EXACTLY ${count} items total.
- ${Math.floor(count / 2)} items type:"word" and ${Math.ceil(count / 2)} items type:"sentence".
- Put ALL items inside the "items" array.
- Output ONLY the JSON object. No markdown, no extra text.`;

    console.log(`Generating ${count} items for subdomain: ${subdomain}`);
    console.log(`Existing terms count: ${existingTerms.length}`);

    // Calculate dynamic token limit based on batch size
    const estimatedOutputTokens = Math.ceil(
      (count * TOKEN_CONFIG.TOKENS_PER_ITEM) * TOKEN_CONFIG.SAFETY_BUFFER
    );
    
    // Use the smaller of: estimated need or model maximum, with a minimum of 1200 tokens
    const dynamicMaxTokens = Math.max(1200, Math.min(estimatedOutputTokens, TOKEN_CONFIG.MAX_MODEL_TOKENS));
    
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
      "variant1": "paddy field",
      "type": "word"
    }
  ]
}

REQUIREMENTS:
- Generate EXACTLY 50% words (type:"word") and 50% sentences (type:"sentence")
- "sinhala" field MUST be 100% pure Sinhala Unicode - NO English words
- "singlish1" is ALWAYS required (readable informal Romanized Sinhala)
- "variant1" is ALWAYS required (clear English translation)

${prompt}

REMINDER: Output ONLY the JSON object. Start with { and end with }. No other text.`;

    // Use Gemini 3.5 Flash Lite with dynamically calculated token limit (500 requests/day quota)
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    console.log(`\n🚀 Calling Gemini API...`);
    console.log(`   Default Model: ${modelName}`);
    console.log(`   Max output tokens: ${dynamicMaxTokens}`);

    // Call Gemini API with automatic retry and model fallback (gemini-3.5-flash-lite -> gemini-3.1-flash-lite)
    let result;
    const fallbackModels = [modelName, 'gemini-3.1-flash-lite'].filter((v, i, a) => a.indexOf(v) === i);
    let lastError;

    for (const mName of fallbackModels) {
      const model = genAI.getGenerativeModel({
        model: mName,
        generationConfig: {
          temperature: 1,
          maxOutputTokens: dynamicMaxTokens,
          responseMimeType: "application/json",
        },
      });

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`   Trying with model: ${mName} (attempt ${attempt}/3)...`);
          result = await model.generateContent(fullPrompt);
          break;
        } catch (err) {
          lastError = err;
          const isTransient = err.status === 503 ||
                              err.status === 429 ||
                              err.message?.includes('503') ||
                              err.message?.includes('high demand') ||
                              err.message?.includes('Resource has been exhausted') ||
                              err.message?.includes('rate limit');
          if (isTransient && attempt < 3) {
            const delayMs = attempt * 2000;
            console.warn(`⚠️ ${mName} busy / rate limited (attempt ${attempt}/3). Retrying in ${delayMs / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            console.warn(`⚠️ ${mName} attempt ended: ${err.message?.substring(0, 100)}`);
            break;
          }
        }
      }
      if (result) break;
    }

    if (!result) {
      throw lastError;
    }

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
          item.variant2 || item.variant1,
          item.variant3 || item.variant1,
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
    if (error.message?.includes('API key') || error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file.',
        details: error.message 
      });
    }

    if (error.status === 503 || error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('Service Unavailable')) {
      return res.status(503).json({ 
        error: 'Gemini API is temporarily experiencing high demand. Please try again in a few moments, or reduce the batch size.',
        details: error.message 
      });
    }
    
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('exhausted')) {
      return res.status(429).json({ 
        error: 'Gemini API rate limit exceeded. Please wait a moment and try again.',
        details: error.message 
      });
    }
    
    if (error.status === 404 || error.message?.includes('is not found') || error.message?.includes('is not supported')) {
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