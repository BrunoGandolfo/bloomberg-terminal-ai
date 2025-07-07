// Importar las librerías de IA
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const alphaVantageService = require('./alphaVantageService');
const fredService = require('./fredService');
const perplexityService = require('./perplexityService');
const axios = require('axios');
const aiHeaders = require('../config/aiHeaders');
const logger = require('../utils/logger');

// Inicializar los clientes de IA con las API keys del .env
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
  const fullPrompt = await buildIntelligentPrompt(prompt, context);
  
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
      const quote = await alphaVantageService.getQuote(symbol);
      if (quote) {
        marketData[symbol] = quote;
      }
    } catch (error) {
      logger.error(`Error obteniendo ${symbol}:`, error.message);
    }
  }
  
  return marketData;
}

// Construir prompt inteligente tipo asesor financiero profesional
async function buildIntelligentPrompt(userPrompt, context) {
  const currentDate = new Date().toLocaleDateString('es-UY');
  
  let portfolioData = '';
  if (context.portfolio && context.portfolio.positions) {
    const totalValue = context.portfolio.positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
    const positions = context.portfolio.positions.map(p => 
      `${p.symbol}: ${p.shares} acciones @ $${p.currentPrice} (P&L: ${((p.currentPrice - p.avgCost) / p.avgCost * 100).toFixed(1)}%)`
    ).join('\n');
    portfolioData = `
PORTFOLIO ACTUAL:
${positions}
Valor total: $${totalValue.toLocaleString()}`;
  }

  let marketData = '';
  if (context.marketData) {
    marketData = `
COTIZACIONES ACTUALES:
${Object.entries(context.marketData).map(([symbol, data]) =>
  `${symbol}: $${data.price} (${data.change > 0 ? '+' : ''}${data.changePercent}%)`
).join('\n')}`;
  }

  // Obtener contexto macroeconómico de FRED
  let macroContext = '';
  try {
    macroContext = await fredService.getContextoParaIA();
  } catch (error) {
    logger.error('Error obteniendo contexto macro:', error);
    macroContext = 'CONTEXTO MACRO: No disponible temporalmente';
  }

  // Obtener últimas noticias del mercado
  let newsContext = '';
  try {
    logger.info('📰 Obteniendo últimas noticias del mercado...');
    const news = await perplexityService.searchFinancialNews('stock market news S&P 500 Dow Jones NASDAQ trading', 3);
    if (news && news.length > 0) {
      newsContext = '\n\nÚLTIMAS NOTICIAS DEL MERCADO:\n' + 
        news.map(n => `- ${n.headline} (${n.source} - ${n.timeAgo})`).join('\n');
    }
  } catch (error) {
    logger.error('Error obteniendo noticias:', error);
  }

  return `Eres el asesor financiero personal de Bruno. Escribe como si estuvieras tomando un café con él. Sé directo, usa analogías simples, y SIEMPRE incluye tablas para visualizar datos.

DATOS DISPONIBLES (${currentDate}):
${portfolioData}
${marketData}
${macroContext}${newsContext}

PREGUNTA: ${userPrompt}

INSTRUCCIONES CRÍTICAS:
- Escribe en primera persona, conversacional: "Bruno, te recomiendo..."
- USA TABLAS MARKDOWN para comparar opciones o mostrar métricas
- NO uses bullets (*), usa prosa natural
- Máximo 400 palabras
- Si no tienes un dato, di "No tengo el dato de X"

EJEMPLO DE RESPUESTA:

Bruno,

GOOGL a $178 me parece una compra interesante. Te explico por qué.

Google no es solo búsquedas - es el dueño del casino de internet. YouTube, Android, Cloud... tienen dedos en todo. Y mira estos números:

| Métrica | Google | Microsoft | Apple |
|---------|--------|-----------|-------|
| P/E | 24x | 35x | 31x |
| Crecimiento | +11% | +12% | +5% |
| Margen neto | 21% | 36% | 25% |

Lo que me preocupa es la regulación. Si Europa los multa otra vez, puede doler. Pero a estos precios, el riesgo/recompensa me cierra.

Mi recomendación: comprá 50 acciones ahora. Si cae a $165, comprá 50 más.`;
}

// Llamar a Claude con configuración optimizada
async function callClaude(prompt) {
  const body = {
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }]
  };

  try {
    const { data, headers } = await axios.post(
      'https://api.anthropic.com/v1/messages',
      body,
      { headers: aiHeaders.claude, timeout: 10_000 }
    );

    logger.info('Claude tokens usage', {
      tokensIn: headers['anthropic-tokens-in'],
      tokensOut: headers['anthropic-tokens-out']
    });

    return data.content[0].text;
  } catch (err) {
    logger.error('Claude API error', {
      error: err.response?.data || err.message
    });
    throw new Error('ClaudeError');
  }
}

// Llamar a GPT-4
async function callGPT(prompt) {
  try {
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
  } catch (err) {
    logger.error('GPT API error', {
      error: err.response?.data || err.message
    });
    throw new Error('GPTError');
  }
}

// Llamar a Gemini
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2000 }
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: aiHeaders.gemini,
      timeout: 10_000
    });
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    logger.error('Gemini API error', {
      error: err.response?.data || err.message
    });
    throw new Error('GeminiError');
  }
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
  callClaude,
  callGPT,
  callGemini,
  analyzeWithAI,
  analyzePortfolio,
  analyzeDocument,
  generateSmartConsensus
}; 