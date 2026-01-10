// Test Gemini API connection
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

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 1000,
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
    
    console.log('✅ Gemini API Response received!\n');
    console.log('Response:', text.substring(0, 500));
    console.log('\n✅ Test successful! Gemini integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('API key')) {
      console.error('\n💡 Tip: Check your GEMINI_API_KEY in the .env file');
      console.error('   Get a key at: https://aistudio.google.com/app/apikey');
    }
  }
}

testGemini();
