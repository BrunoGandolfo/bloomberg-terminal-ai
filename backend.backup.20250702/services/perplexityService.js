const axios = require('axios');
require('dotenv').config();
const aiHeaders = require('../config/aiHeaders');

// Función helper para normalizar ratios y corregir errores comunes
const normalizeFinancialRatio = (value, metricName, symbol) => {
  // Convertir a número
  let numValue = parseFloat(value);
  
  // Validación básica
  if (isNaN(numValue) || numValue === null || numValue === undefined) {
    console.error(`❌ ${metricName} no es un número válido para ${symbol}: ${value}`);
    return 'N/A';
  }
  
  // Validaciones específicas por tipo de métrica
  switch(metricName) {
    case 'debt_to_equity_ratio':
      // El ratio D/E raramente supera 5 en empresas normales
      if (numValue > 10) {
        console.warn(`⚠️ Ratio D/E sospechosamente alto para ${symbol}: ${numValue}`);
        // Si el valor es mayor a 100, probablemente esté expresado como porcentaje
        if (numValue > 100) {
          numValue = numValue / 100;
          console.log(`✅ D/E corregido de porcentaje a decimal: ${numValue}`);
        }
      }
      // Validar rango razonable (0 a 10)
      if (numValue < 0) {
        console.error(`❌ D/E negativo para ${symbol}: ${numValue}`);
        return '0.00';
      }
      break;
      
    case 'ROE':
    case 'ROA':
    case 'profit_margin':
    case 'operating_margin':
      // Estos son porcentajes, no deberían superar 100%
      if (numValue > 100) {
        console.warn(`⚠️ ${metricName} imposible para ${symbol}: ${numValue}%`);
        // Tal vez ya está en decimal cuando debería ser porcentaje
        if (numValue < 2) {
          numValue = numValue * 100;
          console.log(`✅ ${metricName} convertido a porcentaje: ${numValue}%`);
        } else {
          return 'N/A';
        }
      }
      break;
      
    case 'P_E_ratio':
      // P/E puede ser negativo (pérdidas) o muy alto, pero validar extremos
      if (numValue > 1000 || numValue < -1000) {
        console.warn(`⚠️ P/E extremo para ${symbol}: ${numValue}`);
        return 'N/A';
      }
      break;
  }
  
  // Formatear a 2 decimales
  return numValue.toFixed(2);
};

async function searchFinancialNews(query, limit = 5) {
  try {
    console.log(`🔍 Perplexity: Buscando TODA la información sobre "${query}"`);

    const response = await axios({
      method: 'POST',
      url: 'https://api.perplexity.ai/chat/completions',
      headers: aiHeaders.perplexity,
      data: {
        model: 'sonar-pro',
        stream: false,
        messages: [{
          role: 'system',
          content: 'You are a FINANCIAL NEWS SPECIALIST. ONLY search for STOCK MARKET, TRADING, INVESTMENT, and FINANCIAL news. IGNORE all non-financial news like politics, science, sports, entertainment. Focus ONLY on: stock prices, market movements, earnings, financial analysis, economic data, trading activity.'
        }, {
          role: 'user',
          content: `Search EXTENSIVELY for ${limit} latest news/analysis about: ${query}.
                   CRITICAL: ONLY return FINANCIAL/MARKET/TRADING/INVESTMENT news.
                   NO general news, NO politics, NO science, NO entertainment.
                   Each article MUST be about stocks, markets, trading, or finance.

                   IMPORTANT INSTRUCTIONS:
                   1. Search in ENGLISH for maximum coverage
                   2. Access ALL available sources (free and preview content)
                   3. Include breaking news, analysis, opinions, reports
                   4. Get information from the last 24-48 hours
                   5. Translate EVERYTHING to Spanish in your response

                   Return ONLY a JSON array with:
                   - headline (en español)
                   - summary (en español, mínimo 2-3 oraciones con datos clave)
                   - source (nombre original: Bloomberg, Reuters, etc)
                   - timeAgo (For timeAgo use format: "hace X minutos/horas" (calculate from article timestamp). If no timestamp available, use "Hoy" for today's news)
                   - sentiment (positive/negative/neutral)
                   - relatedSymbols (array de símbolos mencionados)

                   Busca en TODAS las fuentes posibles. Quiero la información más completa.`
        }],
        temperature: 0.1,
        max_tokens: 60,
        search_domain_filter: [],  // Sin restricciones de dominio
        search_recency_filter: "day"  // Últimas 24 horas
      }
    });

    console.log(`✅ Perplexity respondió con información COMPLETA`);

    const content = response.data.choices[0].message.content;

    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const news = JSON.parse(cleanContent);

      if (Array.isArray(news)) {
        console.log(`📰 Obtenidas ${news.length} noticias de TODAS las fuentes disponibles`);
        return news;
      }
    } catch (parseError) {
      console.error('Error parseando, intentando extraer JSON:', parseError);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const news = JSON.parse(jsonMatch[0]);
          console.log(`📰 Extraídas ${news.length} noticias con parsing alternativo`);
          return news;
        } catch (e) {
          console.error('Parsing alternativo falló:', e);
        }
      }
    }

    return null;
  } catch (error) {
    if (error.response) {
      console.error(`❌ Perplexity Error ${error.response.status}:`, error.response.data);
    } else {
      console.error('❌ Error de red:', error.message);
    }
    return null;
  }
}

async function getFundamentalsWithPerplexity(symbol) {
  try {
    console.log(`🔍 Perplexity: Obteniendo fundamentals de ${symbol}`);

    const response = await axios({
      method: 'POST',
      url: 'https://api.perplexity.ai/chat/completions',
      headers: aiHeaders.perplexity,
      data: {
        model: 'sonar-pro',
        stream: false,
        messages: [{
          role: 'user',
          content: `Dame los fundamentals financieros completos y actuales de ${symbol}: ROE, ROA, P/E ratio, debt-to-equity ratio, profit margin, operating margin, revenue TTM, market cap, dividend yield, EPS, y free cash flow. Necesito números específicos con fuentes como SEC filings, Yahoo Finance o Bloomberg. Devuelve en formato JSON estructurado con esta estructura:

{
  "company": "Nombre de la empresa",
  "ticker": "${symbol}",
  "date": "fecha actual",
  "financials": {
    "ROE": "valor%",
    "ROA": "valor%", 
    "P/E_ratio": "valor",
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
}`
        }],
        temperature: 0.1,
        max_tokens: 2000
      }
    });

    const content = response.data.choices[0].message.content;
    
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = content.match(/```json\n?([\s\S]*?)```/);
      let rawData;
      
      if (jsonMatch) {
        rawData = JSON.parse(jsonMatch[1]);
      } else {
        // Si no hay markdown, intentar parsear directamente
        rawData = JSON.parse(content);
      }

      // Normalizar los ratios financieros
      if (rawData && rawData.financials) {
        const normalizedFinancials = {
          ...rawData.financials,
          ROE: normalizeFinancialRatio(rawData.financials.ROE, 'ROE', symbol),
          ROA: normalizeFinancialRatio(rawData.financials.ROA, 'ROA', symbol),
          P_E_ratio: normalizeFinancialRatio(rawData.financials.P_E_ratio, 'P_E_ratio', symbol),
          debt_to_equity_ratio: normalizeFinancialRatio(rawData.financials.debt_to_equity_ratio, 'debt_to_equity_ratio', symbol),
          profit_margin: normalizeFinancialRatio(rawData.financials.profit_margin, 'profit_margin', symbol),
          operating_margin: normalizeFinancialRatio(rawData.financials.operating_margin, 'operating_margin', symbol)
        };

        // Devolver los datos con los ratios normalizados
        const fundamentals = {
          ...rawData,
          financials: normalizedFinancials
        };

        console.log(`✅ Fundamentals normalizados para ${symbol}`);
        return fundamentals;
      }
      
      return rawData;
      
    } catch (parseError) {
      console.error(`❌ Error parseando fundamentals de ${symbol}:`, parseError.message);
      
      // Intentar extraer cualquier JSON válido
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const fundamentals = JSON.parse(jsonMatch[0]);
          console.log(`✅ Fundamentals extraídos para ${symbol} (alternativo)`);
          return fundamentals;
        } catch (e) {
          console.error('Parsing alternativo falló:', e);
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error(`❌ Error obteniendo fundamentals de ${symbol}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

module.exports = { 
  searchFinancialNews,
  getFundamentalsWithPerplexity 
};
