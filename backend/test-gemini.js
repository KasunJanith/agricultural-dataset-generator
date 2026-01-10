// Test Gemini API connection with multiple models
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY found');
console.log('🔄 Testing Gemini API connection...\n');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    console.log(`\n📝 Testing model: ${modelName}`);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
      },
    });

    const prompt = `Generate a simple JSON object with 2 agricultural terms:
{
  "items": [
    {"sinhala": "කුඹුරු", "singlish1": "kumburu", "variant1": "paddy field", "type": "word"},
    {"sinhala": "කුඹුරු වගා කරමු", "singlish1": "kumburu vaga karamu", "variant1": "let's cultivate paddy", "type": "sentence"}
  ]
}

Respond ONLY with this JSON format.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`✅ ${modelName} - Response received!`);
    console.log('Response length:', text.length);
    console.log('Response preview:', text.substring(0, 300));
    return true;
    
  } catch (error) {
    console.error(`❌ ${modelName} - Test failed:`, error.message);
    return false;
  }
}

async function testAllModels() {
  const modelsToTest = [
    'gemini-2.5-flash',        // Paid Tier 1: 1K RPM, 1M TPM, 10K RPD - BEST FOR YOUR USE CASE
    'gemini-2.5-flash-lite',   // Paid Tier 1: 4K RPM, 4M TPM, Unlimited RPD
    'gemini-2.0-flash',        // Paid Tier 1: 2K RPM, 4M TPM, Unlimited RPD
    'gemini-2.0-flash-exp',    // Experimental: 10 RPM only
  ];
  
  console.log('Testing Gemini models with Paid Tier 1 access...\n');
  
  for (const modelName of modelsToTest) {
    await testModel(modelName);
  }
  
  console.log('\n✅ Testing complete!');
  console.log('\n💡 Recommendation: Use gemini-2.5-flash for best performance with Paid Tier 1.');
}

testAllModels();
