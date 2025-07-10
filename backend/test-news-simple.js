// test-news-simple.js

const axios = require('axios');
require('dotenv').config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function testNewsSimple() {
  console.log('\n🧪 PROBANDO VERSIÓN SIMPLE DE NOTICIAS\n');
  
  const queries = [
    'latest stock market news today',
    'Federal Reserve interest rates',
    'S&P 500 Nasdaq performance'
  ];
  
  for (const query of queries) {
    console.log(`\n🔍 Buscando: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a financial news expert. Always respond with a JSON array of news items.'
            },
            {
              role: 'user',
              content: `Find 3 latest financial news about: ${query}
              
              Return ONLY a JSON array where each item has:
              {
                "headline": "news headline",
                "summary": "brief summary in Spanish",
                "source": "source name",
                "timeAgo": "time ago"
              }`
            }
          ],
          temperature: 0.1,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const content = response.data.choices[0].message.content;
      console.log('\n📝 Respuesta raw:', content.substring(0, 200) + '...');
      
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const news = JSON.parse(cleaned);
        
        if (Array.isArray(news) && news.length > 0) {
          console.log(`\n✅ Encontradas ${news.length} noticias:`);
          news.forEach((item, i) => {
            console.log(`\n${i+1}. ${item.headline}`);
            console.log(`   ${item.summary}`);
            console.log(`   Fuente: ${item.source} - ${item.timeAgo}`);
          });
        } else {
          console.log('❌ No se parsearon noticias del JSON');
        }
      } catch (parseError) {
        console.log('❌ Error parseando JSON:', parseError.message);
      }
      
    } catch (error) {
      console.log('❌ Error en API:', error.response?.data || error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testNewsSimple().catch(console.error);
