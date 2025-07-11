const aiService = require('./services/aiService');

async function testPrompt() {
  try {
    console.log('Probando nuevo prompt de experto...\n');
    
    const result = await aiService.analyzeWithAI(
      '¿Cuál es tu análisis profesional de AAPL?',
      {
        marketData: {
          AAPL: {
            symbol: 'AAPL',
            price: 211.14,
            change: 1.13,
            changePercent: 0.54,
            marketCap: 3153544871936,
            trailingPE: 32.68
          }
        }
      }
    );
    
    console.log('=== RESPUESTA GPT-4 ===');
    console.log(result.gpt4);
    console.log('\n=== RESPUESTA GEMINI ===');
    console.log(result.gemini);
    console.log('\n=== RESPUESTA CLAUDE ===');
    console.log(result.claude);
    console.log('\n=== CONSENSO ===');
    console.log(result.consensus);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPrompt(); 