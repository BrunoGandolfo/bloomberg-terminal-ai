// Importar las librerías de IA
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dataService = require('./dataService');
const marketDataService = require('./eodhdService');
const fredService = require('./fredService');
const tickerSearchService = require('./tickerSearchService');
const axios = require('axios');
const aiHeaders = require('../config/aiHeaders');
const logger = require('../utils/logger');

// Mapeo simple de nombres de empresas a símbolos
const COMPANY_TO_TICKER = {
  'APPLE': 'AAPL',
  'MICROSOFT': 'MSFT',
  'GOOGLE': 'GOOGL',
  'AMAZON': 'AMZN',
  'TESLA': 'TSLA',
  'NVIDIA': 'NVDA'
};

// Inicializar los clientes de IA con las API keys del .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

// Función principal mejorada con IAs inteligentes
async function analyzeWithAI(prompt, context = {}) {
  logger.debug(' analyzeWithAI - prompt:', prompt);

  // Si preguntan por una acción específica, buscarla automáticamente
  const stockSymbols = extractStockSymbols(prompt);
  logger.debug(' analyzeWithAI - stockSymbols encontrados:', stockSymbols);

  if (stockSymbols.length > 0 && !context.marketData) {
    context.marketData = await getMarketDataForSymbols(stockSymbols);
    logger.debug(' analyzeWithAI - marketData obtenida:', context.marketData);
  }

  // Obtener datos macro si no están en el contexto
  if (!context.macroData) {
    try {
      const macroContext = await fredService.getContextoParaIA();
      logger.debug(' analyzeWithAI - macroContext:', macroContext);
      // Parsear los datos macro del texto con los regex correctos
      context.macroData = {
        vix: macroContext.match(/VIX \(Volatilidad\): ([\d.]+)/)?.[1],
        yield10Y: macroContext.match(/Bonos 10 años: ([\d.]+)%/)?.[1],
        yield2Y: macroContext.match(/Bonos 2 años: ([\d.]+)%/)?.[1],
        yieldSpread: macroContext.match(/Spread de yields: ([\d.-]+)%/)?.[1],
        dxy: macroContext.match(/Índice Dólar: ([\d.]+)/)?.[1],
        gold: macroContext.match(/Oro: \$([\d,]+(?:\.\d+)?)/)?.[1]?.replace(',', ''),
        oil: macroContext.match(/Petróleo WTI: \$([\d.]+)/)?.[1]
      };
      logger.debug(' analyzeWithAI - macroData parseada:', context.macroData);
    } catch (error) {
      logger.error('Error obteniendo contexto macro:', error);
      context.macroData = {};
    }
  }

  // Obtener noticias reales de EODHD
  let newsData = [];
  try {
    logger.debug(' Obteniendo noticias de EODHD...');
    const newsSymbol = stockSymbols.length > 0 ? stockSymbols[0] : "SPY.US";
    newsData = await marketDataService.getFinancialNews(newsSymbol, 3);
    logger.debug(' Noticias obtenidas:', newsData.length);
  } catch (error) {
    console.error('[ERROR] EODHD news falló:', error.message);
    newsData = []; // Continuar sin noticias si falla
  }

  // Agregar noticias al contexto
  context.news = newsData;

  // Construir prompt inteligente para asesores financieros profesionales
  const fullPrompt = await buildSimpleRAGPrompt(prompt, context);

  // Agregar logs de debug
  logger.debug('=== PROMPT SIMPLIFICADO PARA CLAUDE ===');
  logger.debug(fullPrompt);
  logger.debug('=== FIN DEL PROMPT ===');

  // Llamar a las tres IAs en paralelo
  const [claudeResult, gpt4Result, geminiResult] = await Promise.allSettled([
    callClaude(fullPrompt),
    callGPT(fullPrompt),
    callGemini(fullPrompt)
  ]);

  return {
    claude: claudeResult.status === 'fulfilled' ? claudeResult.value : 'Error: ' + claudeResult.reason?.message,
    gpt4: gpt4Result.status === 'fulfilled' ? gpt4Result.value : 'Error: ' + gpt4Result.reason?.message,
    gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : 'Error: ' + geminiResult.reason?.message,
    consensus: generateSmartConsensus(
      claudeResult.status === 'fulfilled' ? claudeResult.value : null,
      gpt4Result.status === 'fulfilled' ? gpt4Result.value : null,
      geminiResult.status === 'fulfilled' ? geminiResult.value : null
    ),
    timestamp: new Date().toISOString()
  };
}

// Importar la función optimizada para español
const extractStockSymbols = require('./extractStockSymbolsSpanish');

// Obtener datos de mercado para símbolos
async function getMarketDataForSymbols(symbols) {
  const marketData = {};

  for (const symbol of symbols) {
    try {
      const quote = await marketDataService.getQuote(symbol);
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
COTIZACIONES Y FUNDAMENTALES ACTUALES:
${Object.entries(context.marketData).map(([symbol, data]) => {
  let fundamental = `${symbol}:
  - Precio: $${data.price} (${data.change > 0 ? '+' : ''}${data.changePercent}%)
  - P/E: ${data.trailingPE || 'N/A'} | Forward P/E: ${data.forwardPE || 'N/A'}
  - Market Cap: ${data.marketCap ? (data.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
  - EPS: ${data.eps || 'N/A'} | ROE: ${data.roe || 'N/A'}
  - Beta: ${data.beta || 'N/A'} | Target: $${data.targetPrice || 'N/A'}`;

  if (data.revenue) fundamental += `\n  - Revenue: ${(data.revenue / 1e9).toFixed(2)}B`;
  if (data.ebitda) fundamental += ` | EBITDA: ${(data.ebitda / 1e9).toFixed(2)}B`;
  if (data.profitMargin) fundamental += `\n  - Profit Margin: ${data.profitMargin}`;

  return fundamental;
}).join('\n\n')}`;
  }

  // Obtener contexto macroeconómico de FRED
  let macroContext = '';
  try {
    // Habilitado nuevamente - el error del oro ya está resuelto
    macroContext = await fredService.getContextoParaIA();
    // macroContext = 'CONTEXTO MACRO: Temporalmente no disponible';
  } catch (error) {
    logger.error('Error obteniendo contexto macro:', error);
    macroContext = 'CONTEXTO MACRO: No disponible temporalmente';
  }

  // Obtener últimas noticias del mercado
  let newsContext = '';
  try {
    logger.info('📰 Obteniendo últimas noticias del mercado...');
    const news = await marketDataService.getFinancialNews("SPY.US", 3);
    if (news && news.length > 0) {
      newsContext = '\n\nÚLTIMAS NOTICIAS DEL MERCADO:\n' +
        news.map(n => `- ${n.headline} (${n.source} - ${n.timeAgo})`).join('\n');
    }
  } catch (error) {
    logger.error('Error obteniendo noticias:', error);
  }

  return `Eres el Portfolio Manager Principal de un hedge fund con IA, liderando un equipo de agentes especializados con 35+ años de experiencia combinada en Wall Street. Tu metodología integra:

🧠 CHAIN-OF-THOUGHT FINANCIERO (CoT):
Descompones cada análisis en pasos lógicos estructurados, procesando información como los mejores hedge funds cuantitativos.

👥 TU EQUIPO DE AGENTES ESPECIALIZADOS:
1. MACRO ANALYST (Metodología Ray Dalio): Analiza ciclos económicos, correlaciones globales
2. FUNDAMENTALS ANALYST (Metodología Warren Buffett): Busca valor intrínseco, moats competitivos
3. QUANT ANALYST (Metodología Jim Simons): Patrones técnicos, momentum, mean reversion
4. SENTIMENT ANALYST (Metodología George Soros): Lee el pulso del mercado, reflexividad
5. RISK MANAGER (Metodología Taleb): Gestiona tail risks, cisnes negros

📊 METODOLOGÍA DE ANÁLISIS SISTEMÁTICA:

PASO 1 - CONTEXTO MACRO (Siempre primero, sin excepción):
- Analizar VIX vs promedio histórico (20): Si VIX > 30 = pánico, < 15 = complacencia
- Curva rendimientos: Invertida = recesión en 6-18 meses (histórico 87% precisión)
- Inflación vs Fed target: Cada 1% sobre 2% = -0.5x en múltiplos de valoración
- Dollar Index (DXY): > 105 = presión en emergentes, < 95 = rally commodities
- Oro/Petróleo ratio: > 20 = flight to safety, < 15 = risk-on environment

PASO 2 - INTEGRACIÓN DE NOTICIAS (Ponderación por relevancia):
- Noticias macro globales: 40% peso (afectan todo el mercado)
- Noticias sector específico: 30% peso (afectan peers)
- Noticias empresa específica: 30% peso (impacto directo)
- Aplicar descuento temporal: -10% relevancia por cada 24h de antigüedad

PASO 3 - ANÁLISIS ESPECÍFICO POR TIPO DE ACTIVO:

Para ACCIONES individuales:
- P/E vs mediana histórica 10 años del sector
- PEG ratio: < 1 = crecimiento barato, > 2 = sobrevalorado
- Free Cash Flow yield vs bono 10 años
- Insider buying/selling últimos 3 meses
- Short interest y days to cover

Para ETFs/Índices:
- Composición y peso top 10 holdings
- Tracking error y expense ratio
- Flujos netos últimos 20 días
- Premium/discount to NAV

Para BONOS/Renta fija:
- Duration y convexidad actual
- Spread vs treasuries comparables
- Rating changes últimos 6 meses

PASO 4 - SÍNTESIS MULTI-AGENTE:
Cada agente da su veredicto (1-10) con justificación:
- Macro Agent: [score]/10 - [razón específica con datos]
- Fundamental Agent: [score]/10 - [métricas clave]
- Quant Agent: [score]/10 - [señales técnicas]
- Sentiment Agent: [score]/10 - [pulso del mercado]
- Risk Agent: [score]/10 - [riesgos identificados]

CONSENSO = Promedio ponderado (Macro 25%, Fund 25%, Quant 20%, Sent 15%, Risk 15%)

📈 TONO Y COMUNICACIÓN:
- Hablar con AUTORIDAD pero accesible: "Los datos me indican..." no "Creo que..."
- Usar analogías cuando sea útil: "Como en 2008 cuando..."
- Ser ESPECÍFICO con números: "VIX en 23.4" no "VIX elevado"
- Admitir incertidumbre cuando existe: "Sin precedente claro, pero similar a..."

⚠️ REGLAS DE DECISIÓN CRÍTICAS:
1. NUNCA recomendar sin contexto macro (es el ancla de todo análisis)
2. Si consenso < 4/10: Evitar o vender
3. Si consenso 4-6/10: Posición pequeña o esperar
4. Si consenso > 7/10: Posición completa con gestión de riesgo
5. Si VIX > 40 o crisis sistémica: Modo preservación de capital

DATOS EN TIEMPO REAL (${currentDate}):
${portfolioData}
${marketData}
${macroContext}${newsContext}

PREGUNTA: ${userPrompt}

📊 USO INTELIGENTE DE DATOS:
- Tienes acceso a 40+ métricas fundamentales y técnicas
- MUESTRA en tablas solo las más relevantes (5-7 por tabla)
- USA todas las demás "bajo el capot" para enriquecer tu análisis
- Tu análisis debe reflejar la profundidad de datos sin abrumar al usuario
- Prioriza claridad: mejor pocas métricas bien explicadas que muchas confusas

FORMATO DE RESPUESTA ESTRUCTURADO:

📊 **CONTEXTO MACRO** [Peso: 25%]
| Indicador | Valor | Interpretación |
|-----------|-------|----------------|
| VIX | [valor] | [tranquilo/nervioso/pánico] |
| Yield Curve | [2Y]/[10Y] | [normal/plana/invertida] |
| DXY | [valor] | [dólar fuerte/débil] |
| Inflación | [X]% | [vs 2% Fed target] |

🔍 **ANÁLISIS FUNDAMENTAL** [Peso: 50%]
| Ratio Clave | Actual | Forward/Sector | Señal |
|-------------|--------|----------------|-------|
| P/E | [valor] | Fwd: [forwardPE] | ✅/⚠️/❌ |
| Price/Sales | [valor] | Sector: [X] | ✅/⚠️/❌ |
| Beta | [valor] | Mercado = 1.0 | [interpretación] |
| Márgenes | Op: [X]% | Neto: [Y]% | [salud] |

[Análisis narrativo usando TODOS los datos disponibles pero sin abrumar con números]

📈 **ANÁLISIS TÉCNICO**
| Indicador | Valor | % desde nivel | Señal |
|-----------|-------|---------------|-------|
| Precio Actual | $[X] | - | - |
| 52W High | $[high] | [X]% debajo | ✅/⚠️ |
| MA 50 | $[ma50] | [X]% arriba/debajo | ✅/❌ |
| MA 200 | $[ma200] | [X]% arriba/debajo | ✅/❌ |

👥 **CONSENSO ANALISTAS**
| Rating | Cantidad | % del Total |
|--------|----------|-------------|
| Strong Buy | [X] | [Y]% |
| Buy | [X] | [Y]% |
| Hold | [X] | [Y]% |
| Sell | [X] | [Y]% |
**Consenso: [X.X]/5 - Precio Objetivo: $[target]**

🎯 **ESCENARIOS DE INVERSIÓN**
| Escenario | Prob | Precio | Potencial | Catalizador |
|-----------|------|--------|-----------|-------------|
| 🚀 Alcista | 30% | $[X] | +[Y]% | [evento] |
| 📊 Base | 50% | $[X-Y] | +[Z]% | [tendencia] |
| 📉 Bajista | 20% | $[Z] | -[W]% | [riesgo] |

💡 **RECOMENDACIÓN EJECUTIVA**
[Síntesis clara y accionable basada en TODOS los datos pero expresada simplemente]
- **Acción**: [COMPRAR/MANTENER/VENDER]
- **Precio entrada**: $[X] o mejor
- **Stop loss**: $[Y] (-[Z]%)
- **Target**: $[W] (+[V]%)
- **Tamaño**: [X]% del portfolio
- **Horizonte**: [corto/medio/largo plazo]

REGLAS CRÍTICAS PARA TABLAS:
1. SIEMPRE usar formato markdown para tablas
2. Mostrar SOLO ratios clave en tablas (5-7 máximo por tabla)
3. Usar TODOS los datos disponibles en el análisis narrativo
4. Incluir señales visuales: ✅ (positivo), ⚠️ (neutral), ❌ (negativo)
5. Comparar siempre actual vs forward/histórico/sector
6. Las tablas deben ser CONCISAS pero INFORMATIVAS

DATOS BAJO EL CAPOT (usar sin mostrar todos):
- Revenue, EBITDA, ROA para evaluar salud financiera
- Debt/Equity para evaluar riesgo financiero
- Shares float, insiders % para evaluar liquidez
- Todos los márgenes para evaluar eficiencia
- PEG ratio para evaluar crecimiento vs precio`;
}

// Nueva función simplificada con enfoque RAG (Retrieval-Augmented Generation)
async function buildSimpleRAGPrompt(userPrompt, context) {
  const currentDate = new Date().toLocaleDateString('es-UY');

  // 1. Formatear datos de mercado de manera clara
  let marketDataSection = '';
  if (context.marketData) {
    marketDataSection = 'DATOS VERIFICADOS DE MERCADO:\n';

    for (const [symbol, data] of Object.entries(context.marketData)) {
      marketDataSection += `
${symbol}:
  Precio: $${data.price} (${data.change > 0 ? '+' : ''}${data.changePercent}%)
  P/E: ${data.trailingPE || 'N/D'} | Forward P/E: ${data.forwardPE || 'N/D'}
  Market Cap: ${data.marketCap ? '$' + (data.marketCap / 1e9).toFixed(2) + 'B' : 'N/D'}
  EPS: ${data.eps || 'N/D'} | Beta: ${data.beta || 'N/D'}
  Target: ${data.targetPrice ? '$' + data.targetPrice : 'N/D'}
`;
    }
  }

  // 2. Formatear datos macro de manera clara
  let macroDataSection = '';
  if (context.macroData) {
    macroDataSection = `
DATOS MACROECONÓMICOS VERIFICADOS:
  VIX: ${context.macroData.vix || 'N/D'}
  Yield 10Y: ${context.macroData.yield10Y || 'N/D'}%
  Yield 2Y: ${context.macroData.yield2Y || 'N/D'}%
  Spread: ${context.macroData.yieldSpread || 'N/D'}%
  Dollar Index: ${context.macroData.dxy || 'N/D'}
  Oro: ${context.macroData.gold ? '$' + context.macroData.gold + '/oz' : 'N/D'}
  Petróleo: ${context.macroData.oil ? '$' + context.macroData.oil + '/barril' : 'N/D'}
`;
  }

  // Sección de noticias
  let newsSection = '';
  if (context.news && context.news.length > 0) {
    newsSection = '\nNOTICIAS FINANCIERAS RECIENTES (fuentes verificadas):\n';
    context.news.forEach((news, index) => {
      newsSection += `${index + 1}. ${news.headline}\n`;
      newsSection += `   Fuente: ${news.source} - ${news.timeAgo}\n`;
      newsSection += `   Impacto: ${news.impact} | Sentimiento: ${news.sentiment}\n\n`;
    });
  }

  // 3. Construir prompt simple y directo
  return `INSTRUCCIONES CRÍTICAS:
1. USA SOLO LOS DATOS PROPORCIONADOS ABAJO. NO inventes números.
2. Si un dato no está disponible, di "no disponible" o "N/D".
3. Sé preciso con los números exactos proporcionados.
4. Responde de manera profesional pero concisa.

FECHA ACTUAL: ${currentDate}

${marketDataSection}
${macroDataSection}
${newsSection}
PREGUNTA DEL USUARIO: ${userPrompt}

RESPUESTA (basada ÚNICAMENTE en los datos proporcionados):`;
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
      { headers: aiHeaders.claude, timeout: 60_000 }
    );

    logger.info('Claude tokens usage', {
      tokensIn: headers['anthropic-tokens-in'],
      tokensOut: headers['anthropic-tokens-out']
    });

    return data.content[0].text;
  } catch (err) {
    logger.error('Claude API error', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      code: err.code
    });
    throw new Error('ClaudeError');
  }
}

// Llamar a GPT-4 (con fallback a GPT-3.5-turbo)
async function callGPT(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Usar GPT-3.5 hasta tener API key válida para GPT-4
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
      error: err.response?.data || err.message,
      status: err.response?.status
    });
    // Mensaje más claro sobre el error
    if (err.response?.status === 401 || err.message?.includes('invalid_api_key')) {
      throw new Error('API key de OpenAI inválida. Verifica tu OPENAI_API_KEY en .env');
    }
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
  generateSmartConsensus,
  extractStockSymbols // Agregado para testing
};
