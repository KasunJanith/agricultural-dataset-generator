import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key found:', GEMINI_API_KEY.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGeminiConnection() {
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  console.log(`\n🔍 Testing ${modelName} API connection...\n`);
  
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
      },
    });
    
    console.log('✅ Model created successfully');
    console.log(`   Model: ${modelName}`);
    console.log('   Max tokens: 1000');
    console.log('   Response format: application/json\n');
    
    const testPrompt = `Generate a simple JSON response with one agricultural term:
{
  "items": [
    {
      "sinhala": "පොහොර",
      "singlish1": "pohora",
      "variant1": "fertilizer",
      "type": "word"
    }
  ]
}

Output ONLY the JSON object above. No other text.`;
    
    console.log('📤 Sending test prompt...\n');
    
    const result = await model.generateContent(testPrompt);
    const text = result.response.text();
    
    console.log('✅ API call succeeded!\n');
    console.log('📥 Response received:');
    console.log('   Length:', text.length, 'characters');
    console.log('   Preview:', text.substring(0, 200) + '...\n');
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text);
      console.log('✅ JSON parsing successful!');
      console.log('   Structure:', JSON.stringify(parsed, null, 2));
      
      if (parsed.items && Array.isArray(parsed.items)) {
        console.log('\n✅ Response has "items" array with', parsed.items.length, 'items');
      }
      
      console.log('\n🎉 All tests passed! Gemini 2.5 Flash is working correctly.\n');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.error('   Raw response:', text);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('   Error:', error.message);
    console.error('   Details:', error);
    
    if (error.message.includes('fetch failed')) {
      console.error('\n💡 Possible causes:');
      console.error('   - Model name might be incorrect (check if gemini-2.5-flash exists)');
      console.error('   - API key might not have access to this model');
      console.error('   - Network connectivity issues');
      console.error('\n📝 Try these models instead:');
      console.error('   - gemini-1.5-flash');
      console.error('   - gemini-1.5-pro');
      console.error('   - gemini-pro');
    }
    
    process.exit(1);
  }
}

testGeminiConnection();
