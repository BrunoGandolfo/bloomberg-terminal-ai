const axios = require('axios');
require('dotenv').config();
const logger = require('../utils/logger');
const { z } = require('zod');

/**
 * DOCUMENTACIÓN IMPORTANTE SOBRE MODELOS DE PERPLEXITY:
 *
 * Modelos disponibles (confirmados):
 * - 'sonar-pro' ✅ (USAR ESTE)
 * - 'sonar' ✅
 *
 * Modelos que NO existen (causan error 400):
 * - 'llama-3.1-sonar-pro-64k-online' ❌
 * - 'sonar-pro-64k' ❌
 *
 * Formato de fecha OBLIGATORIO: MM/DD/YYYY (ej: "07/06/2025")
 * NO usar formato ISO YYYY-MM-DD
 */

/**
 * Servicio Perplexity - Versión Simplificada con Structured Outputs
 *
 * PRINCIPIOS:
 * 1. Usa response_format con json_schema para garantizar JSON válido
 * 2. Perplexity calcula el Buffett Score directamente
 * 3. Si falla el parsing, lanza error para usar fallbacks (Yahoo/Twelve Data)
 * 4. Código simple y mantenible - sin parches ni workarounds
 */

// Configuración simple
const API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar-pro';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Convierte una fecha al formato MM/DD/YYYY requerido por Perplexity
 * @param {Date} date - La fecha a convertir
 * @returns {string} Fecha en formato MM/DD/YYYY
 */
function formatDateForPerplexity(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Esquema de validación para los fundamentals
 */
const FundamentalsSchema = z.object({
  company: z.string(),
  ticker: z.string(),
  date: z.string().optional(),
  financials: z.object({
    ROE: z.string(),
    ROA: z.string(),
    P_E_ratio: z.string(),
    debt_to_equity_ratio: z.string(),
    profit_margin: z.string(),
    operating_margin: z.string(),
    revenue_TTM: z.string().optional(),
    market_cap: z.string().optional(),
    dividend_yield: z.string().optional(),
    EPS: z.string().optional(),
    free_cash_flow: z.string().optional()
  }),
  sources: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
  analysis: z.object({
    buffettScore: z.number(),
    grade: z.string(),
    recommendation: z.string()
  })
});

/**
 * Obtener datos financieros de Perplexity (market cap y P/E)
 */
async function getFinancialDataFromPerplexity(symbol) {
  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'sonar',
        messages: [{
          role: 'system',
          content: 'You are a financial data API. Always respond with exact numbers only.'
        }, {
          role: 'user',
          content: `For ${symbol} stock, provide ONLY these values:
                    Market Cap: [number with unit like 4.04B or 3.71T]
                    P/E Ratio: [number like 26.7]
                    If any value is unavailable, write "N/A"`
        }],
        temperature: 0,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 segundos timeout
      }
    );

    const content = response.data.choices[0].message.content;
    console.log(`[Perplexity] Raw response for ${symbol}:`, content);

    // Parser más robusto con múltiples patrones
    const patterns = {
      marketCap: [
        /\*\*market\s*cap(?:italization)?\*\*[:\s]*\$?([\d.,]+)\s*(T|trillion|B|billion|M|million)/i,
        /market\s*cap(?:italization)?[:\s]*\*?\*?\$?([\d.,]+)\s*(T|trillion|B|billion|M|million)/i,
        /market\s*cap(?:italization)?[:\s]*([\d.,]+)\s*(T|trillion|B|billion|M|million)/i,
        /cap(?:italization)?[:\s]*\$?([\d.,]+)\s*(T|B|M)/i,
        /([\d.,]+)\s*(trillion|billion|million)\s*(?:market\s*cap|capitalization)/i,
        /(?:is|about|approximately|around|~)\s*\$?([\d.,]+)\s*(T|trillion|B|billion|M|million)/i,
        /\$?([\d.,]+)\s*(T|trillion|B|billion|M|million)\s*market/i
      ],
      peRatio: [
        /\*\*p\/e\s*(?:ratio)?\*\*[:\s]*([\d.,]+)/i,
        /p\/e\s*(?:ratio)?[:\s]*\*?\*?([\d.,]+)/i,
        /p\/e\s*(?:ratio)?[:\s]*([\d.,]+)/i,
        /pe\s*(?:ratio)?[:\s]*([\d.,]+)/i,
        /price[- ]to[- ]earnings[:\s]*([\d.,]+)/i,
        /p\/e[:\s]*([\d.,]+)x?/i,
        /(?:is|about|approximately|~)\s*([\d.,]+)\s*(?:p\/e|pe)/i,
        /p\/e\s*(?:is|about|approximately|around|~)\s*([\d.,]+)/i,
        /price[- ]to[- ]earnings\s*(?:ratio)?\s*(?:is|about|approximately|~)?\s*([\d.,]+)/i
      ]
    };

    let marketCapRaw = null;
    let peRatio = null;

    // Intentar todos los patrones para Market Cap
    for (const pattern of patterns.marketCap) {
      const match = content.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2].charAt(0).toUpperCase();

        if (!isNaN(value)) {
          switch(unit) {
            case 'T':
              marketCapRaw = value * 1e12;
              break;
            case 'B':
              marketCapRaw = value * 1e9;
              break;
            case 'M':
              marketCapRaw = value * 1e6;
              break;
            default:
              // Si dice "trillion", "billion", etc
              if (match[2].toLowerCase().includes('trillion')) {
                marketCapRaw = value * 1e12;
              } else if (match[2].toLowerCase().includes('billion')) {
                marketCapRaw = value * 1e9;
              } else if (match[2].toLowerCase().includes('million')) {
                marketCapRaw = value * 1e6;
              }
          }
          break; // Salir del loop si encontramos un match
        }
      }
    }

    // Intentar todos los patrones para P/E Ratio
    for (const pattern of patterns.peRatio) {
      const match = content.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0 && value < 1000) { // Validación básica
          peRatio = value;
          break;
        }
      }
    }

    // Log para debugging
    console.log(`[Perplexity] Parsed for ${symbol}:`, {
      marketCapRaw,
      peRatio,
      original: content.substring(0, 100) + '...'
    });

    return {
      marketCapRaw,
      peRatio,
      source: 'perplexity',
      confidence: (marketCapRaw && peRatio) ? 'high' : 'medium'
    };

  } catch (error) {
    console.error(`[Perplexity] Error for ${symbol}:`, error.message);

    // Manejo específico de errores
    if (error.code === 'ECONNABORTED') {
      return {
        marketCapRaw: null,
        peRatio: null,
        error: 'timeout',
        source: 'perplexity'
      };
    }

    return {
      marketCapRaw: null,
      peRatio: null,
      error: error.message,
      source: 'perplexity'
    };
  }
}

/**
 * Obtener fundamentals financieros con la solución definitiva de Perplexity
 */
async function getFundamentalsClean(symbol) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY no configurada');
  }

  // Obtener nombre de la compañía para mejor contexto
  let companyName = symbol;
  try {
    // Intentar obtener el nombre real de la compañía
    const searchResponse = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const results = searchResponse.data?.quotes || [];
    if (results.length > 0 && results[0].longname) {
      companyName = results[0].longname;
    }
  } catch (e) {
    // Si falla, usar el símbolo
    companyName = symbol;
  }

  // Esquema JSON completo y detallado
  const fullSchema = {
    type: "object",
    properties: {
      company: {
        type: "string",
        description: "Nombre completo de la compañía"
      },
      ticker: {
        type: "string",
        description: "Símbolo ticker de la acción"
      },
      date: {
        type: "string",
        description: "Fecha del análisis en formato YYYY-MM-DD"
      },
      financials: {
        type: "object",
        properties: {
          ROE: {
            type: "string",
            description: "Return on Equity como porcentaje (ej: 15.5%)"
          },
          ROA: {
            type: "string",
            description: "Return on Assets como porcentaje (ej: 8.2%)"
          },
          P_E_ratio: {
            type: "string",
            description: "Price-to-Earnings ratio actual (ej: 24.5)"
          },
          debt_to_equity_ratio: {
            type: "string",
            description: "Debt-to-Equity ratio (ej: 0.45)"
          },
          profit_margin: {
            type: "string",
            description: "Profit margin como porcentaje (ej: 12.8%)"
          },
          operating_margin: {
            type: "string",
            description: "Operating margin como porcentaje (ej: 18.5%)"
          },
          revenue_TTM: {
            type: "string",
            description: "Revenue trailing twelve months (ej: $45.2B)"
          },
          market_cap: {
            type: "string",
            description: "Market capitalization (ej: $2.1T)"
          },
          dividend_yield: {
            type: "string",
            description: "Dividend yield como porcentaje (ej: 2.3%)"
          },
          EPS: {
            type: "string",
            description: "Earnings per share (ej: 12.45)"
          },
          free_cash_flow: {
            type: "string",
            description: "Free cash flow TTM (ej: $15.8B)"
          }
        },
        required: ["ROE", "ROA", "P_E_ratio", "debt_to_equity_ratio", "profit_margin", "operating_margin", "revenue_TTM", "market_cap", "EPS", "free_cash_flow"]
      },
      sources: {
        type: "array",
        items: { type: "string" },
        description: "Fuentes específicas consultadas para cada dato"
      },
      notes: {
        type: "array",
        items: { type: "string" },
        description: "Notas sobre cálculos realizados o limitaciones de datos"
      },
      analysis: {
        type: "object",
        properties: {
          buffettScore: {
            type: "number",
            description: "Puntuación Warren Buffett de 0-100"
          },
          grade: {
            type: "string",
            description: "Calificación de A+ a F"
          },
          recommendation: {
            type: "string",
            description: "Recomendación de inversión"
          }
        },
        required: ["buffettScore", "grade", "recommendation"]
      }
    },
    required: ["company", "ticker", "financials", "analysis"]
  };

  // Calcular fecha de búsqueda (últimos 30 días) en formato MM/DD/YYYY
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const searchAfterDate = formatDateForPerplexity(thirtyDaysAgo);

  try {
    // Payload completo con TODOS los parámetros nuevos de Perplexity
    const payload = {
      model: 'sonar-pro', // Modelo corregido - DOCUMENTADO: Este es el modelo correcto, NO usar llama-3.1-sonar-pro-64k-online
      messages: [
        {
          role: "system",
          content: `Eres un analista financiero profesional senior con 20 años de experiencia.

          INSTRUCCIONES CRÍTICAS:
          - Busca CADA dato en AL MENOS 2 fuentes confiables (Yahoo Finance, Bloomberg, Reuters, SEC, Morningstar)
          - Si un dato no está disponible directamente, CALCÚLALO a partir de otros datos
            Ejemplos: ROE = Net Income / Equity, ROA = Net Income / Total Assets
          - NUNCA devuelvas "N/A" sin antes:
            1. Buscar en todas las fuentes disponibles
            2. Intentar calcular el dato
            3. Buscar en reportes trimestrales/anuales
          - Para cada dato, cita la fuente EXACTA (no solo "[1]")
          - Prioriza datos del último trimestre o año fiscal
          - Si encuentras discrepancias entre fuentes, usa el valor más reciente o el promedio
          - Responde ÚNICAMENTE con el JSON especificado, sin texto adicional`
        },
        {
          role: "user",
          content: `Obtén TODOS los datos financieros fundamentales de ${symbol} (${companyName}).

          IMPORTANTE:
          - Revenue TTM debe ser de los últimos 12 meses
          - P/E ratio debe ser el actual del mercado
          - ROE y ROA del último año fiscal completo
          - Debt-to-equity calculado como Total Debt / Total Equity
          - Free Cash Flow de los últimos 12 meses

          Si un dato requiere cálculo, muéstralo en las notas.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: fullSchema
        }
      },
      // NUEVOS PARÁMETROS CRÍTICOS DE PERPLEXITY:
      search_domain_filter: [
        "finance.yahoo.com",
        "bloomberg.com",
        "reuters.com",
        "sec.gov",
        "morningstar.com",
        "marketwatch.com",
        "investing.com",
        "seekingalpha.com",
        "macrotrends.net",
        "companiesmarketcap.com"
      ],
      search_after_date_filter: searchAfterDate, // Formato MM/DD/YYYY corregido
      temperature: 0.1, // Baja temperatura para mayor consistencia
      max_tokens: 4000 // Suficiente espacio para respuesta completa
    };

    logger.info(`[Perplexity] Solicitando fundamentals para ${symbol} (${companyName}) con parámetros avanzados`);

    const response = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // Aumentar timeout para el modelo más potente
    });

    const data = response.data.choices[0].message.content;

    // Parsear y validar con Zod
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      // Validar con Zod
      const validatedData = FundamentalsSchema.parse(parsedData);

      // Log de éxito con detalles
      logger.info(`[Perplexity] Datos obtenidos exitosamente para ${symbol}:`, {
        company: validatedData.company,
        buffettScore: validatedData.analysis?.buffettScore,
        sourcesCount: validatedData.sources?.length || 0,
        notesCount: validatedData.notes?.length || 0
      });

      // Limpiar valores de financials para remover explicaciones
      if (validatedData.financials) {
        Object.keys(validatedData.financials).forEach(key => {
          let value = validatedData.financials[key];
          if (typeof value === 'string') {
            // Solo limpiar si contiene paréntesis con texto largo dentro
            if (value.includes('(') && value.includes(')')) {
              const parenContent = value.match(/\([^)]+\)/);
              if (parenContent && parenContent[0].length > 10) {
                // Si el paréntesis tiene más de 10 caracteres, es una explicación
                value = value.split('(')[0].trim();
              }
            }

            // Si el valor empieza con ~, removerlo
            value = value.replace(/^~/, '').trim();

            // Limpiar rangos como "60-70" a solo el primer número
            if (value.includes('–') || value.includes('-')) {
              const parts = value.split(/[–-]/);
              if (parts[0].match(/\d/)) {
                value = parts[0].trim();
              }
            }

            // Si contiene "Not available" o similar, convertir a N/A
            if (value.toLowerCase().includes('not available') ||
                value.toLowerCase().includes('no recent') ||
                value.toLowerCase().includes('search results') ||
                value === '') {
              value = 'N/A';
            }

            validatedData.financials[key] = value;
          }
        });
      }

      // Devolver los datos validados con análisis Buffett incluido
      return validatedData;

    } catch (parseError) {
      // Manejo robusto de errores
      logger.error('Error procesando respuesta de Perplexity:', {
        error: parseError.message,
        symbol: symbol,
        responseType: typeof data,
        responseLength: typeof data === 'string' ? data.length : 'N/A'
      });

      // Si es error de Zod, mostrar detalles específicos
      if (parseError.name === 'ZodError') {
        logger.error('Errores de validación:', parseError.errors);
        throw new Error(`Respuesta inválida de Perplexity: ${parseError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }

      // Si es error de JSON parse
      if (parseError instanceof SyntaxError) {
        logger.error('JSON malformado recibido:', typeof data === 'string' ? data.substring(0, 500) + '...' : data);
        throw new Error('Perplexity devolvió JSON malformado. Intenta nuevamente.');
      }

      throw new Error(`Error procesando respuesta: ${parseError.message}`);
    }

  } catch (error) {
    logger.error('Error en Perplexity API:', error.response?.data || error.message);
    if (error.response?.status === 429) {
      throw new Error('Rate limit alcanzado - intenta más tarde');
    }
    if (error.response?.status === 401) {
      throw new Error('API key inválida');
    }
    if (error.response?.status === 400) {
      throw new Error('Solicitud inválida a Perplexity');
    }
    if (error.response?.status === 500) {
      throw new Error('Error del servidor de Perplexity');
    }
    throw new Error(`Error obteniendo fundamentals de Perplexity: ${error.message}`);
  }
}

/**
 * Búsqueda de noticias financieras profesionales
 * Versión inteligente sin json_schema para máxima flexibilidad
 */
async function searchFinancialNews(query, limit = 5) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    logger.error('PERPLEXITY_API_KEY no configurada');
    return [];
  }

  try {
    const response = await axios.post(API_URL, {
      model: MODEL,
      messages: [{
        role: 'system',
        content: `You are a senior financial analyst at a major investment bank with real-time market access.
        You specialize in global markets, macroeconomics, and geopolitical analysis.
        Always provide the MOST RECENT news from the last 24-48 hours.
        Focus on news that directly impacts investment decisions.
        Include specific numbers, percentages, and data points.
        Search across ALL major financial news sources globally.`
      }, {
        role: 'user',
        content: `Find the ${limit} most important and RECENT financial news about: "${query}"
        
        CRITICAL REQUIREMENTS:
        - Only news from the LAST 48 HOURS (check timestamps)
        - Must be REAL, VERIFIED news from reputable sources
        - Include news from ALL regions: Americas, Europe, Asia, Emerging Markets
        - Focus on market-moving events
        
        Search priorities:
        1. Central bank decisions (Fed, ECB, BoJ, BoE, PBoC) and monetary policy
        2. Major economic data releases (inflation, GDP, employment, PMIs)
        3. Significant market movements (indices, currencies, commodities)
        4. Geopolitical events affecting markets
        5. Major corporate earnings and M&A activity
        6. Regulatory changes and government policies
        
        For each news item, return a JSON array with EXACTLY these fields:
        {
          "headline": "Full headline in Spanish (translate if needed)",
          "summary": "2-3 sentence summary in Spanish with SPECIFIC numbers, percentages, and key data points",
          "source": "Actual source name (Reuters, Bloomberg, FT, WSJ, CNBC, etc)",
          "market": "Main market affected (Wall Street, Europa, Asia, Emergentes, Commodities, Forex, Crypto)",
          "category": "Category (Política Monetaria, Geopolítica, Earnings, Datos Macro, Mercados, Sectorial)",
          "timeAgo": "Time in Spanish (hace 2 horas, hace 1 día, etc)",
          "sentiment": "positive, negative, or neutral for markets",
          "impact": "alto, medio, or bajo",
          "keyMetrics": ["specific metric 1", "specific metric 2"],
          "affectedAssets": ["asset1", "asset2"]
        }
        
        IMPORTANT:
        - Verify all news is from the last 48 hours
        - Include specific numbers (e.g., "S&P 500 cayó 2.3%", "Fed mantiene tasas en 5.5%")
        - Identify which specific assets/markets are affected
        - All content in professional Spanish
        - DO NOT invent or fabricate news`
      }],
      temperature: 0.1,
      max_tokens: 3000,
      // Parámetros para búsqueda actualizada
      search_recency_filter: "day", // Solo últimas 24 horas
      search_domain_filter: [
        "reuters.com",
        "bloomberg.com",
        "ft.com",
        "wsj.com",
        "cnbc.com",
        "marketwatch.com",
        "investing.com",
        "forexlive.com",
        "financialtimes.com",
        "economist.com"
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    });

    const content = response.data.choices[0].message.content;
    logger.info(`[Perplexity News] Respuesta recibida para: ${query}`);

    // Parsear respuesta
    try {
      // Limpiar posibles markdown o formato
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      let news = JSON.parse(cleanContent);
      
      // Asegurar que es un array
      if (!Array.isArray(news)) {
        logger.error('Respuesta no es un array');
        return [];
      }
      
      // Validar y enriquecer cada noticia
      const validatedNews = news.map(item => {
        // Asegurar todos los campos con valores por defecto inteligentes
        return {
          headline: item.headline || 'Sin título',
          summary: item.summary || 'Sin resumen disponible',
          source: item.source || 'Fuente no especificada',
          market: item.market || 'Global',
          category: item.category || 'Mercados',
          timeAgo: item.timeAgo || 'Recientemente',
          sentiment: item.sentiment || 'neutral',
          impact: item.impact || 'medio',
          keyMetrics: Array.isArray(item.keyMetrics) ? item.keyMetrics : [],
          affectedAssets: Array.isArray(item.affectedAssets) ? item.affectedAssets : [],
          // Metadatos adicionales
          dataSource: 'Perplexity',
          timestamp: new Date().toISOString(),
          queryUsed: query
        };
      }).filter(item => 
        // Filtrar noticias sin contenido real
        item.headline !== 'Sin título' && 
        item.summary !== 'Sin resumen disponible'
      );
      
      logger.info(`[Perplexity News] ${validatedNews.length} noticias válidas obtenidas`);
      
      // Log de análisis de contenido
      if (validatedNews.length > 0) {
        const markets = [...new Set(validatedNews.map(n => n.market))];
        const categories = [...new Set(validatedNews.map(n => n.category))];
        const sources = [...new Set(validatedNews.map(n => n.source))];
        
        logger.info(`[Perplexity News] Mercados cubiertos: ${markets.join(', ')}`);
        logger.info(`[Perplexity News] Categorías: ${categories.join(', ')}`);
        logger.info(`[Perplexity News] Fuentes: ${sources.join(', ')}`);
      }
      
      return validatedNews;
      
    } catch (parseError) {
      logger.error('Error parseando JSON de noticias:', parseError.message);
      logger.error('Contenido recibido:', content.substring(0, 500) + '...');
      return [];
    }

  } catch (error) {
    logger.error('Error en búsqueda de noticias:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Búsqueda inteligente de contexto macro para el agente IA
 * Se actualiza dinámicamente según el día y hora
 */
async function getMarketContext() {
  // Queries dinámicas basadas en el momento del día
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  let queries = [];
  
  // Queries base siempre relevantes
  queries.push('breaking financial news today market moving');
  queries.push('central banks monetary policy latest decisions');
  
  // Queries según la hora del día (UTC)
  if (hour >= 0 && hour < 6) {
    // Madrugada: Foco en Asia
    queries.push('Asian markets Japan China indices performance');
    queries.push('Bank of Japan PBOC monetary policy');
  } else if (hour >= 6 && hour < 13) {
    // Mañana: Foco en Europa
    queries.push('European markets DAX FTSE CAC opening');
    queries.push('ECB European Central Bank policy euro');
  } else if (hour >= 13 && hour < 21) {
    // Tarde: Foco en Americas
    queries.push('US markets S&P 500 Nasdaq Dow Jones');
    queries.push('Federal Reserve Fed policy inflation data');
  } else {
    // Noche: Resumen global
    queries.push('global markets summary today performance');
    queries.push('commodities oil gold copper prices');
  }
  
  // Queries especiales según el día
  if (dayOfWeek === 3) { // Miércoles
    queries.push('Fed FOMC minutes federal reserve');
  }
  if (dayOfWeek === 4) { // Jueves
    queries.push('ECB monetary policy decision euro');
  }
  if (dayOfWeek === 5) { // Viernes
    queries.push('US jobs report NFP unemployment');
  }
  
  // Agregar query sobre earnings si estamos en temporada (enero, abril, julio, octubre)
  const month = now.getMonth();
  if ([0, 3, 6, 9].includes(month)) {
    queries.push('earnings reports tech companies financial results');
  }
  
  logger.info(`[Market Context] Buscando contexto con ${queries.length} queries dinámicas`);
  
  const allNews = [];
  
  // Buscar noticias para cada query
  for (let i = 0; i < queries.length; i++) {
    const news = await searchFinancialNews(queries[i], 2); // 2 noticias por query
    allNews.push(...news);
    
    // Esperar un poco entre búsquedas para no saturar
    if (i < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Eliminar duplicados basados en headline similar
  const uniqueNews = allNews.filter((item, index, self) => {
    return index === self.findIndex(n => {
      // Considerar duplicados si los titulares son muy similares
      const similarity = getSimilarity(n.headline, item.headline);
      return similarity > 0.8;
    });
  });
  
  // Ordenar por impacto y relevancia temporal
  const sortedNews = uniqueNews.sort((a, b) => {
    // Priorizar por impacto
    const impactOrder = { 'alto': 3, 'medio': 2, 'bajo': 1 };
    const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
    
    if (impactDiff !== 0) return impactDiff;
    
    // Si mismo impacto, priorizar por tiempo más reciente
    const timeValue = (timeAgo) => {
      if (timeAgo.includes('hora')) return 3;
      if (timeAgo.includes('día')) return 2;
      return 1;
    };
    
    return timeValue(b.timeAgo) - timeValue(a.timeAgo);
  });
  
  // Retornar las 10 noticias más relevantes
  const topNews = sortedNews.slice(0, 10);
  
  logger.info(`[Market Context] Contexto final: ${topNews.length} noticias únicas de alto impacto`);
  
  return topNews;
}

/**
 * Función auxiliar para calcular similitud entre strings
 */
function getSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / parseFloat(longer.length);
}

/**
 * Calcular distancia de edición entre dos strings
 */
function getEditDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

module.exports = {
  getFundamentalsWithPerplexity: getFundamentalsClean,
  searchFinancialNews,
  getFinancialDataFromPerplexity,
  getMarketContext
};
