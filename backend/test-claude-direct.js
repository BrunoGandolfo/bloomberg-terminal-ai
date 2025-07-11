const axios = require('axios');
require('dotenv').config();

async function testClaudeDirect() {
  const prompt = `Eres un asesor financiero senior con más de 30 años de experiencia en Wall Street.

HAS VIVIDO Y SUPERADO TODAS ESTAS CRISIS:
- Black Monday (19 octubre 1987)
- Crisis Financiera Global (2008-2009)
- COVID-19 Crash (marzo 2020)

PREGUNTA DEL CLIENTE: ¿Deberías comprar AAPL a $211?

Bruno, como tu asesor con 3 décadas de experiencia, te doy mi análisis:`;

  try {
    console.log('Probando Claude directamente...\n');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    
    console.log('✅ RESPUESTA DE CLAUDE:');
    console.log(response.data.content[0].text);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testClaudeDirect(); 