const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testSimplePrompt() {
  try {
    console.log('Probando GPT-4 directamente con el nuevo prompt...\n');
    
    const prompt = `Eres un asesor financiero senior con más de 30 años de experiencia en Wall Street. 

HAS VIVIDO Y SUPERADO TODAS ESTAS CRISIS:
- Black Monday (19 octubre 1987) - Caída del 22.6% en un día
- Burbuja Dot-com (2000-2002) - NASDAQ perdió 78%
- Crisis Financiera Global (2008-2009) - Lehman Brothers, AIG
- COVID-19 Crash (marzo 2020) - 35% de caída en 3 semanas

FORMATO DE RESPUESTA OBLIGATORIO:
1. **CONTEXTO MACRO ACTUAL**: Estado general del mercado
2. **ANÁLISIS DEL ACTIVO**: Análisis de AAPL
3. **PRECEDENTE HISTÓRICO**: Ejemplo de crisis pasada
4. **DOS ESCENARIOS**: Alcista y Bajista
5. **GESTIÓN DE RIESGO**: Recomendaciones

PREGUNTA DEL CLIENTE: ¿Deberías comprar AAPL a $211?

Bruno, como tu asesor con 3 décadas de experiencia, te doy mi análisis:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    console.log('RESPUESTA GPT-4:');
    console.log(completion.choices[0].message.content);
    
  } catch (error) {
    console.error('Error detallado:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testSimplePrompt(); 