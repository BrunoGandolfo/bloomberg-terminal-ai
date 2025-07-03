const axios = require('axios');
require('dotenv').config();
const logger = require('../utils/logger');

/**
 * Servicio Perplexity V2 - Versión limpia y simplificada
 * 
 * PRINCIPIOS:
 * 1. Pedir valores numéricos puros a Perplexity
 * 2. Parsing mínimo - si falla, falla limpio
 * 3. Sin transformaciones complejas
 * 4. Errores claros y específicos
 */

// Configuración simple
const API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar-pro';

/**
 * Obtener fundamentals financieros con formato numérico puro
 */
async function getFundamentalsClean(symbol) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY no configurada');
  }

  // Prompt que funciona mejor con Perplexity
  const prompt = `Dame los fundamentals financieros completos y actuales de ${symbol}: ROE, ROA, P/E ratio, debt-to-equity ratio, profit margin, operating margin, revenue TTM, market cap, dividend yield, EPS, y free cash flow. Necesito números específicos con fuentes como SEC filings, Yahoo Finance o Bloomberg. 

IMPORTANTE: 
- Devuelve SOLO el JSON, sin texto adicional antes o después
- NO incluyas comentarios dentro del JSON
- Usa este formato EXACTO:

{
  "company": "Nombre de la empresa",
  "ticker": "${symbol}",
  "date": "fecha actual",
  "financials": {
    "ROE": "valor%",
    "ROA": "valor%", 
    "P_E_ratio": "valor",
    "debt_to_equity_ratio": "valor",
    "profit_margin": "valor%",
    "operating_margin": "valor%",
    "revenue_TTM": "valor en billones/millones",
    "market_cap": "valor",
    "dividend_yield": "valor%",
    "EPS": "valor",
    "free_cash_flow": "valor"
  },
  "sources": ["lista de fuentes"],
  "notes": ["notas importantes"]
}`;

  try {
    // Petición simple
    const response = await axios.post(API_URL, {
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    
    // Extraer JSON - intentar markdown primero, luego directo
    let jsonStr = content;
    const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1];
    }
    
    // Limpieza MÍNIMA: solo quitar comentarios que rompen JSON
    jsonStr = jsonStr.replace(/\/\/.*$/gm, ''); // Quitar comentarios //
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, ''); // Quitar comentarios /* */

    // Parsear directamente - sin más transformaciones
    try {
      const data = JSON.parse(jsonStr);
      
      // Validación básica
      if (!data.financials) {
        throw new Error('Respuesta sin datos financieros');
      }
      
      // Simplemente devolver los datos como vienen
      return data;
      
    } catch (parseError) {
      logger.error('Error parseando JSON:', parseError.message);
      logger.error('Contenido recibido:', jsonStr.substring(0, 200) + '...');
      throw new Error(`JSON inválido de Perplexity: ${parseError.message}`);
    }
    
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Rate limit alcanzado - intenta más tarde');
    }
    if (error.response?.status === 401) {
      throw new Error('API key inválida');
    }
    throw error;
  }
}



/**
 * Búsqueda de noticias financieras (sin cambios)
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
        content: 'You are a financial news specialist. Return ONLY financial/market news in JSON array format.'
      }, {
        role: 'user',
        content: `Find ${limit} latest financial news about: ${query}. Return JSON array with: headline, summary (in Spanish), source, timeAgo, sentiment.`
      }],
      temperature: 0.1,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    
    // Intentar parsear respuesta
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const news = JSON.parse(cleanContent);
      return Array.isArray(news) ? news : [];
    } catch (e) {
      logger.error('Error parseando noticias:', e.message);
      return [];
    }
    
  } catch (error) {
    logger.error('Error obteniendo noticias:', error.message);
    return [];
  }
}

module.exports = {
  getFundamentalsWithPerplexity: getFundamentalsClean,
  searchFinancialNews
}; 