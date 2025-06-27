// Importar las librerías de IA
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const yahooFinanceService = require('./yahooFinanceService');

// Inicializar los clientes de IA con las API keys del .env
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

// Función principal mejorada con IAs inteligentes
async function analyzeWithAI(prompt, context = {}) {
  // Si preguntan por una acción específica, buscarla automáticamente
  const stockSymbols = extractStockSymbols(prompt);
  if (stockSymbols.length > 0 && !context.marketData) {
    context.marketData = await getMarketDataForSymbols(stockSymbols);
  }
  
  // Construir prompt inteligente para asesores financieros profesionales
  const fullPrompt = buildIntelligentPrompt(prompt, context);
  
  // Llamar a las 3 IAs en paralelo
  const [claudeResult, gptResult, geminiResult] = await Promise.allSettled([
    callClaude(fullPrompt),
    callGPT(fullPrompt),
    callGemini(fullPrompt)
  ]);

  return {
    claude: claudeResult.status === 'fulfilled' ? claudeResult.value : 'Error: ' + claudeResult.reason?.message,
    gpt4: gptResult.status === 'fulfilled' ? gptResult.value : 'Error: ' + gptResult.reason?.message,
    gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : 'Error: ' + geminiResult.reason?.message,
    consensus: generateSmartConsensus(
      claudeResult.status === 'fulfilled' ? claudeResult.value : null,
      gptResult.status === 'fulfilled' ? gptResult.value : null,
      geminiResult.status === 'fulfilled' ? geminiResult.value : null
    ),
    timestamp: new Date().toISOString()
  };
}

// Extraer símbolos de acciones de la pregunta
function extractStockSymbols(text) {
  const commonStocks = [
    'AAPL', 'APPLE', 'MSFT', 'MICROSOFT', 'GOOGL', 'GOOGLE', 'AMZN', 'AMAZON', 
    'TSLA', 'TESLA', 'META', 'NVDA', 'NVIDIA', 'JPM', 'BAC', 'WFC', 'BRK',
    // ETFs populares
    'SPY', 'VOO', 'QQQ', 'IWM', 'DIA', 'VTI', 'VEA', 'VWO',
    // ETFs de bonos
    'AGG', 'BND', 'TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'TIP',
    // Sectores
    'XLF', 'XLK', 'XLE', 'XLV', 'XLP', 'XLI', 'XLB', 'XLU', 'XLY', 'XLRE',
    // Cripto
    'GBTC', 'BITO', 'ETHE', 'BITQ',
    // Internacionales
    'EEM', 'EFA', 'FXI', 'EWJ', 'EWZ', 'INDA'
  ];
  
  const symbols = [];
  const upperText = text.toUpperCase();
  
  // Buscar símbolos comunes
  for (const stock of commonStocks) {
    if (upperText.includes(stock)) {
      // Convertir nombres a símbolos
      if (stock === 'APPLE') symbols.push('AAPL');
      else if (stock === 'MICROSOFT') symbols.push('MSFT');
      else if (stock === 'GOOGLE') symbols.push('GOOGL');
      else if (stock === 'AMAZON') symbols.push('AMZN');
      else if (stock === 'TESLA') symbols.push('TSLA');
      else if (stock === 'NVIDIA') symbols.push('NVDA');
      else symbols.push(stock);
    }
  }
  
  // Buscar patrones de símbolos (3-5 letras mayúsculas)
  const symbolPattern = /\b[A-Z]{2,5}\b/g;
  const matches = upperText.match(symbolPattern) || [];
  symbols.push(...matches);
  
  return [...new Set(symbols)]; // Eliminar duplicados
}

// Obtener datos de mercado para símbolos
async function getMarketDataForSymbols(symbols) {
  const marketData = {};
  
  for (const symbol of symbols) {
    try {
      const quote = await yahooFinanceService.getQuote(symbol);
      if (quote) {
        marketData[symbol] = quote;
      }
    } catch (error) {
      console.error(`Error obteniendo ${symbol}:`, error.message);
    }
  }
  
  return marketData;
}

// Construir prompt inteligente tipo asesor financiero profesional
function buildIntelligentPrompt(userPrompt, context) {
  const currentDate = new Date().toLocaleDateString('es-UY');
  
  return `Eres CLAUDE, el asesor financiero personal de Bruno Gandolfo. Eres el MEJOR analista de Wall Street con 30+ años de experiencia.

CONTEXTO CRÍTICO:
- Fecha actual: ${currentDate}
- El usuario es Bruno, un inversionista inteligente pero no profesional
- Siempre da respuestas ESPECÍFICAS con NÚMEROS y SÍMBOLOS
- NUNCA digas "no tengo datos" - usa tu conocimiento para dar contexto útil

ADVERTENCIA CRÍTICA SOBRE PRECIOS:
- NUNCA inventes precios. Si no tienes datos, di "No tengo el precio actual"
- Los precios en el contexto son los ÚNICOS válidos
- Bitcoin NO está en $47k, está sobre $100k en 2025
- SIEMPRE usa los datos proporcionados, NUNCA uses "conocimiento general" para precios

TU ESTILO:
- Habla como un mentor experimentado, no como un robot
- Usa ejemplos concretos y números específicos
- Si mencionan un símbolo, SIEMPRE busca el precio actual
- Sugiere SIEMPRE 3-5 acciones/ETFs específicos con sus símbolos
- Explica el POR QUÉ detrás de cada recomendación

DATOS DISPONIBLES:
${context.portfolio ? 
`PORTFOLIO DE BRUNO:
${JSON.stringify(context.portfolio.positions, null, 2)}
Valor total aproximado: $${context.portfolio.positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0).toLocaleString()}` 
: 'Portfolio no cargado'}

${context.marketData ? 
`PRECIOS ACTUALES DEL MERCADO:
${Object.entries(context.marketData).map(([symbol, data]) => 
  `${symbol}: $${data.price} (${data.change > 0 ? '+' : ''}${data.changePercent}%)`
).join('\n')}` 
: ''}

PREGUNTA DE BRUNO: ${userPrompt}

RESPONDE como su asesor personal de confianza. Sé específico, da números, sugiere acciones concretas.`;
}

// Llamar a Claude con configuración optimizada
async function callClaude(prompt) {
  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000, // Más tokens para respuestas completas
    temperature: 0.3, // Un poco más de creatividad pero controlada
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  return message.content[0].text;
}

// Llamar a GPT-4
async function callGPT(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: prompt
    }],
    temperature: 0.3,
    max_tokens: 2000
  });
  return completion.choices[0].message.content;
}

// Llamar a Gemini
async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Generar consenso inteligente
function generateSmartConsensus(claude, gpt, gemini) {
  const validResponses = [claude, gpt, gemini].filter(r => r !== null);
  
  if (validResponses.length === 0) {
    return '❌ Error técnico: No se pudo contactar con las IAs. Por favor intenta de nuevo.';
  }
  
  if (validResponses.length === 1) {
    return '⚠️ Solo una IA respondió. Recomiendo verificar la información con fuentes adicionales.';
  }
  
  // Analizar similitudes en las respuestas
  const allResponses = validResponses.join(' ').toLowerCase();
  
  // Buscar recomendaciones comunes
  const buySignals = (allResponses.match(/comprar|buy|bullish|positiv/g) || []).length;
  const sellSignals = (allResponses.match(/vender|sell|bearish|negativ/g) || []).length;
  const holdSignals = (allResponses.match(/mantener|hold|esperar|neutral/g) || []).length;
  
  let consensus = '📊 CONSENSO DE LAS IAs:\n';
  
  if (validResponses.length === 3) {
    consensus += '✅ Las 3 IAs respondieron exitosamente.\n\n';
    
    if (buySignals > sellSignals && buySignals > holdSignals) {
      consensus += '🟢 TENDENCIA ALCISTA: La mayoría sugiere posiciones largas o compra.\n';
    } else if (sellSignals > buySignals && sellSignals > holdSignals) {
      consensus += '🔴 TENDENCIA BAJISTA: La mayoría sugiere cautela o venta.\n';
    } else {
      consensus += '🟡 OPINIONES MIXTAS: Las IAs tienen perspectivas diferentes.\n';
    }
    
    consensus += '\n💡 RECOMENDACIÓN: Revisa los análisis individuales arriba y considera tu perfil de riesgo personal.';
  } else {
    consensus += `⚠️ ${validResponses.length}/3 IAs respondieron. Considera buscar información adicional.`;
  }
  
  return consensus;
}

// Función mejorada para analizar portfolio
async function analyzePortfolio(portfolioData, marketData, question) {
  // Si no hay pregunta específica, hacer análisis completo
  const defaultQuestion = `Analiza mi portfolio completo como un asesor financiero senior. Incluye:
  1. Evaluación de diversificación y riesgo
  2. Rendimiento actual vs mercado
  3. Recomendaciones específicas de rebalanceo
  4. Oportunidades de optimización fiscal
  5. Proyección a 6-12 meses`;
  
  return analyzeWithAI(question || defaultQuestion, {
    portfolio: portfolioData,
    marketData: marketData
  });
}

// Función mejorada para analizar documentos
async function analyzeDocument(documentText, question) {
  const defaultQuestion = `Como analista financiero senior, analiza este documento y proporciona:
  1. Métricas financieras clave (ingresos, márgenes, deuda, flujo de caja)
  2. Fortalezas y debilidades de la empresa
  3. Riesgos principales identificados
  4. Comparación con competidores del sector
  5. Recomendación de inversión (Comprar/Mantener/Vender) con justificación`;
  
  return analyzeWithAI(question || defaultQuestion, {
    document: documentText
  });
}

// Exportar todas las funciones
module.exports = {
  analyzeWithAI,
  analyzePortfolio,
  analyzeDocument
}; 