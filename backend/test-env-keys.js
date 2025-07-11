require('dotenv').config();

console.log('=== VERIFICANDO VARIABLES DE ENTORNO ===\n');

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 
  `Configurada (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : 
  '❌ NO CONFIGURADA');

console.log('GOOGLE_AI_KEY:', process.env.GOOGLE_AI_KEY ? 
  `Configurada (${process.env.GOOGLE_AI_KEY.substring(0, 10)}...)` : 
  '❌ NO CONFIGURADA');

console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 
  `Configurada (${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...)` : 
  '❌ NO CONFIGURADA');

console.log('\n=== CONTENIDO DE .env (sin valores) ===');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
lines.forEach(line => {
  if (line.includes('API_KEY')) {
    const [key] = line.split('=');
    console.log(`${key}=...`);
  }
}); 