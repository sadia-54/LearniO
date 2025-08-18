require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    // Check if API key is set
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      console.log('Please add GEMINI_API_KEY to your .env file or set it as an environment variable');
      return;
    }

    console.log('🔑 GEMINI_API_KEY found:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log('🤖 Testing Gemini AI connection...');

    // Simple test prompt
    const prompt = "Hello! Please respond with 'Gemini AI is working correctly!' and nothing else.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini AI Response:', text);
    console.log('🎉 Gemini AI integration is working!');
    
  } catch (error) {
    console.error('❌ Error testing Gemini AI:', error.message);
    if (error.message.includes('API_KEY')) {
      console.log('💡 Make sure your GEMINI_API_KEY is valid and has proper permissions');
    }
  }
}

testGemini();
