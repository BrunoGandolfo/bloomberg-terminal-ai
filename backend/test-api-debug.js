const axios = require('axios');
require('dotenv').config();

async function testAPIs() {
  console.log('=== VERIFICANDO API KEYS ===\n');
  
  // Test OpenAI
  console.log('1. Probando OpenAI GPT-4...');
  try {
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ OpenAI funciona correctamente');
  } catch (error) {
    console.log('❌ OpenAI Error:', error.response?.data || error.message);
  }

  // Test Google Gemini
  console.log('\n2. Probando Google Gemini...');
  try {
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_KEY}`,
      {
        contents: [{ parts: [{ text: 'Test' }] }]
      }
    );
    console.log('✅ Gemini funciona correctamente');
  } catch (error) {
    console.log('❌ Gemini Error:', error.response?.data || error.message);
  }

  // Test Claude
  console.log('\n3. Probando Claude...');
  try {
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    console.log('✅ Claude funciona correctamente');
  } catch (error) {
    console.log('❌ Claude Error:', error.response?.data || error.message);
  }
}

testAPIs(); 