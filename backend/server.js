// Cargar variables de entorno del archivo .env
require('dotenv').config();

// Importar dependencias
const express = require('express');
const cors = require('cors');
const dataService = require('./services/dataService');
const yahooFinanceService = require('./services/yahooFinanceService');
const screenerService = require('./services/screenerService');
const axios = require('axios');
const aiService = require('./services/aiService');
const twelveDataService = require('./services/twelveDataService');
const perplexityService = require('./services/perplexityService');

// --- Mapa de Traducción Inverso para Sectores ---
const SPANISH_TO_ENGLISH_SECTORS = {
  'Tecnología': 'Technology',
  'Salud': 'Healthcare',
  'Servicios Financieros': 'Financial Services',
  'Servicios de Comunicación': 'Communication Services',
  'Consumo Cíclico': 'Consumer Cyclical',
  'Consumo Defensivo': 'Consumer Defensive',
  'Industria': 'Industrials',
  'Energía': 'Energy',
  'Servicios Públicos': 'Utilities',
  'Bienes Raíces': 'Real Estate',
  'Materiales Básicos': 'Basic Materials',
};

// Crear la aplicación de Express
const app = express();
// Definir el puerto, usando una variable de entorno si está disponible
const port = process.env.PORT || 5000;

// Middlewares
// Habilitar CORS para permitir solicitudes de otros orígenes
app.use(cors());
// Middleware para parsear JSON
app.use(express.json());

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('Hello World from Bloomberg Terminal AI Backend!');
});

// Ruta de salud para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Rutas de Portafolio ---

// Ruta para obtener todos los datos del portafolio
app.get('/api/portfolio', async (req, res, next) => {
  try {
    const portfolio = await dataService.readPortfolio();
    let totalValue = 0;

    // Actualizar precios y calcular valor total
    // Usamos un bucle for...of para poder usar await dentro de él
    for (const position of portfolio.positions) {
      try {
        const quote = await twelveDataService.getQuote(position.symbol);
        if (quote && quote.price) {
          position.currentPrice = quote.price;
        }
      } catch (error) {
        console.error(`No se pudo actualizar el precio para ${position.symbol}: ${error.message}`);
        // Si falla, se mantiene el último precio guardado en el JSON
      }
      
      // Calcular valor de la posición y sumarlo al total
      const positionValue = position.shares * position.currentPrice;
      console.log(`Valor calculado para ${position.symbol}: ${position.shares} * ${position.currentPrice} = ${positionValue}`);
      totalValue += positionValue;
    }
    
    // Asignar el valor total calculado
    portfolio.totalValue = totalValue;
    
    res.json(portfolio);
  } catch (error) {
    next(error); // Pasa el error a nuestro manejador de errores centralizado
  }
});

// Ruta para guardar los datos del portafolio
app.post('/api/portfolio', async (req, res, next) => {
  try {
    await dataService.writePortfolio(req.body);
    res.status(200).json({ success: true, message: 'Portfolio saved successfully.' });
  } catch (error) {
    next(error); // Pasa el error a nuestro manejador de errores centralizado
  }
});

// --- Rutas de Mercado ---

// Ruta para obtener la cotización de un símbolo
app.get('/api/market/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Intentar primero con Twelve Data
    try {
      const quote = await twelveDataService.getQuote(symbol);
      return res.json(quote);
    } catch (twelveError) {
      console.log('Twelve Data falló, intentando Yahoo...');
      
      // Fallback a Yahoo si Twelve Data falla
      const yahooQuote = await yahooFinanceService.getQuote(symbol);
      if (yahooQuote) {
        return res.json(yahooQuote);
      }
    }
    
    res.status(404).json({ message: `No data found for symbol: ${symbol}` });
  } catch (error) {
    next(error);
  }
});

// Ruta para fundamentales (market cap, P/E, etc.)
app.get('/api/market/fundamentals/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const fundamentals = await twelveDataService.getFundamentals(symbol);
    
    if (fundamentals) {
      res.json(fundamentals);
    } else {
      res.status(404).json({ message: `No fundamentals for: ${symbol}` });
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint para análisis fundamental con Perplexity
app.get('/api/fundamentals-perplexity/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Obtener datos de Perplexity
    const fundamentals = await perplexityService.getFundamentalsWithPerplexity(symbol);
    
    if (fundamentals) {
      // Calcular Buffett Score con ponderación consensuada
      const buffettScore = calculateWeightedBuffettScore(fundamentals.financials);
      
      res.json({
        ...fundamentals,
        analysis: {
          buffettScore: buffettScore,
          grade: getBuffettGrade(buffettScore),
          recommendation: getBuffettRecommendation(buffettScore)
        }
      });
    } else {
      res.status(404).json({ error: `No fundamentals found for ${symbol}` });
    }
  } catch (error) {
    next(error);
  }
});

// Función de cálculo con ponderación consensuada de analistas
function calculateWeightedBuffettScore(financials) {
  let score = 0;
  
  // ROE > 15% (30 puntos - más importante según Buffett)
  const roe = parseFloat(financials.ROE);
  if (roe >= 15) score += 30;
  
  // ROA > 5% (20 puntos - eficiencia de activos)
  const roa = parseFloat(financials.ROA);
  if (roa >= 5) score += 20;
  
  // P/E < 25 (15 puntos - valoración razonable)
  const pe = parseFloat(financials.P_E_ratio);
  if (pe <= 25 && pe > 0) score += 15;
  
  // Debt/Equity < 0.5 (15 puntos - salud financiera)
  const debtEquity = parseFloat(financials.debt_to_equity_ratio);
  if (debtEquity <= 0.5) score += 15;
  
  // Profit Margin > 15% (10 puntos - rentabilidad)
  const profitMargin = parseFloat(financials.profit_margin);
  if (profitMargin >= 15) score += 10;
  
  // Operating Margin > 20% (10 puntos - eficiencia operativa)
  const operatingMargin = parseFloat(financials.operating_margin);
  if (operatingMargin >= 20) score += 10;
  
  return score;
}

function getBuffettGrade(score) {
  if (score >= 80) return 'A - EXCELENTE';
  if (score >= 60) return 'B - BUENA';
  if (score >= 40) return 'C - REGULAR';
  return 'D - EVITAR';
}

function getBuffettRecommendation(score) {
  if (score >= 80) return 'COMPRAR - Cumple criterios de inversión valor';
  if (score >= 60) return 'CONSIDERAR - Buenos fundamentals, analizar precio de entrada';
  if (score >= 40) return 'PRECAUCIÓN - Fundamentals mixtos, requiere análisis profundo';
  return 'EVITAR - No cumple criterios mínimos de inversión valor';
}

// Ruta combinada para cuando necesites TODO
app.get('/api/market/full/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Llamadas en paralelo para mayor velocidad
    const [quote, fundamentals] = await Promise.all([
      twelveDataService.getQuote(symbol),
      twelveDataService.getFundamentals(symbol)
    ]);
    
    res.json({
      ...quote,
      fundamentals: fundamentals
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint para múltiples cotizaciones (optimizado)
app.post('/api/market/batch-quotes', async (req, res, next) => {
  try {
    const { symbols } = req.body;
    console.log('Received symbols:', symbols);
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Se requiere un array de símbolos' });
    }
    
    // Limitar a 120 símbolos por llamada (límite de Twelve Data)
    const limitedSymbols = symbols.slice(0, 120);
    
    // Obtener cotizaciones en batch
    const quotes = await twelveDataService.getBatchQuotes(limitedSymbols);
    console.log('Twelve Data response:', quotes);
    
    // Formatear respuesta como objeto para fácil acceso
    const quotesMap = {};
    for (const item of quotes) {
      // La API devuelve un objeto con el símbolo como clave si es exitoso,
      // o un objeto con 'code' y 'message' si falla para un símbolo.
      const symbol = item.symbol;
      if (symbol && item.close) { // Asegurarse de que es una cotización válida
        quotesMap[symbol] = {
          symbol: symbol,
          name: item.name,
          price: parseFloat(item.close || 0),
          change: parseFloat(item.change || 0),
          changePercent: parseFloat(item.percent_change || 0),
          volume: parseInt(item.volume || 0),
          high: parseFloat(item.high || 0),
          low: parseFloat(item.low || 0),
          fiftyTwoWeekHigh: item.fifty_two_week?.high ? parseFloat(item.fifty_two_week.high) : null,
          fiftyTwoWeekLow: item.fifty_two_week?.low ? parseFloat(item.fifty_two_week.low) : null,
          averageVolume: parseInt(item.average_volume || 0),
        };
      }
    }
    
    // Debug temporal: imprimir el objeto completo que se envía al frontend
    console.log('QuotesMap enviando:', JSON.stringify(quotesMap, null, 2));
    res.json(quotesMap);
  } catch (error) {
    console.error('Error en batch quotes:', error);
    next(error);
  }
});

// Ruta para obtener datos históricos de un símbolo
app.get('/api/market/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { days = 365 } = req.query;
    console.log(`Solicitando ${days} días de historia para ${symbol}`);
    
    const historicalData = await twelveDataService.getHistoricalData(symbol, parseInt(days));
    
    // Formatear para el frontend
    const formattedData = historicalData.map(item => ({
      date: item.datetime,
      close: parseFloat(item.close),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseInt(item.volume)
    })).reverse();
    
    res.json(formattedData);
  } catch (error) {
    next(error);
  }
});

// --- Rutas de Screener ---

// Ruta para obtener listas de acciones en tiempo real (más activas, ganadoras, etc.)
app.get('/api/screener/realtime/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await screenerService.getRealTimeScreener(type);
    
    // Enriquecer con market cap
    for (const stock of data) {
      try {
        const fundamentals = await perplexityService.getFundamentalsWithPerplexity(stock.símbolo);
        stock.capitalización = fundamentals?.financials?.market_cap || '0.00B';
      } catch (error) {
        stock.capitalización = '0.00B';
      }
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Ruta para obtener la lista de sectores únicos del mercado
app.get('/api/screener/sectors', async (req, res, next) => {
  try {
    // Devolver lista fija temporalmente mientras se arregla la API de Yahoo
    res.json(['Tecnología', 'Finanzas', 'Salud', 'Consumo', 'Energía']);
  } catch (error) {
    next(error);
  }
});

// Ruta para buscar símbolos en Yahoo Finance
app.get('/api/screener/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter "q" is required.' });
    }
    const results = await screenerService.searchSymbol(q);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Ruta para filtrar las acciones más activas por sector
app.get('/api/screener/filter', async (req, res, next) => {
  try {
    const { sector } = req.query;
     if (!sector) {
      return res.status(400).json({ message: 'Query parameter "sector" is required.' });
    }
    // Por defecto, filtra sobre las más activas, que es la lista más amplia
    const data = await screenerService.getRealTimeScreener('most_actives', { sector });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// --- Nuevas Rutas de Screener ---

app.get('/api/screener/by-sector/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    
    // Mapeo temporal de sectores hasta tener una API mejor
    const sectorMap = {
      'Tecnología': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMZN', 'TSLA', 'AMD', 'INTC', 'CRM'],
      'Finanzas': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'V'],
      'Salud': ['UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'ABT', 'CVS', 'LLY', 'MRK', 'DHR'],
      'Consumo': ['WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'NKE', 'MCD', 'SBUX', 'TGT'],
      'Energía': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'PSX', 'VLO', 'OXY']
    };
    
    const symbols = sectorMap[sector] || [];
    
    if (symbols.length === 0) {
      return res.json([]);
    }
    
    // Obtener datos de cada símbolo
    const stocksData = [];
    for (const symbol of symbols) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        
        const meta = response.data?.chart?.result?.[0]?.meta;
        if (meta) {
          stocksData.push({
            símbolo: symbol,
            nombre: meta.shortName || symbol,
            precio: meta.regularMarketPrice,
            cambio_porcentual: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
            capitalización: 0,
            sector: sector
          });
        }
      } catch (err) {
        // No loguear errores de símbolos individuales que pueden no existir
      }
    }
    
    res.json(stocksData);
  } catch (error) {
    console.error('Error in by-sector:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/screener/indices', async (req, res, next) => {
  try {
    const data = await screenerService.getMajorIndices();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/screener/bonds', async (req, res, next) => {
  try {
    const data = await screenerService.getTopBonds();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/screener/etfs', async (req, res, next) => {
  try {
    const data = await screenerService.getTopETFs();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// --- Rutas de IA ---

// Endpoint principal de IA - análisis general
app.post('/api/ai/analyze', async (req, res, next) => {
  try {
    const { question, includePortfolio, includeMarketData } = req.body;
    
    let context = {};
    
    // Incluir portfolio si se solicita
    if (includePortfolio) {
      context.portfolio = await dataService.readPortfolio();
    }
    
    // Incluir datos de mercado si se solicita
    if (includeMarketData && context.portfolio) {
      const symbols = context.portfolio.positions.map(p => p.symbol);
      const marketData = {};
      
      // Obtener precio actual de cada símbolo
      for (const symbol of symbols) {
        try {
          const quote = await yahooFinanceService.getQuote(symbol);
          if (quote) {
            marketData[symbol] = quote;
          }
        } catch (error) {
          console.error(`Error obteniendo ${symbol}:`, error);
        }
      }
      
      context.marketData = marketData;
    }
    
    // Llamar al servicio de IA
    const aiResponses = await aiService.analyzeWithAI(question, context);
    
    res.json({
      success: true,
      responses: aiResponses
    });
    
  } catch (error) {
    console.error('Error en análisis de IA:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al procesar análisis de IA',
      details: error.message 
    });
  }
});

// Endpoint específico para analizar portfolio
app.post('/api/ai/analyze-portfolio', async (req, res, next) => {
  try {
    const { question } = req.body;
    
    // Obtener datos actuales
    const portfolio = await dataService.readPortfolio();
    const marketData = {};
    
    // Obtener precios de mercado
    for (const position of portfolio.positions) {
      try {
        const quote = await yahooFinanceService.getQuote(position.symbol);
        if (quote) {
          marketData[position.symbol] = quote;
        }
      } catch (error) {
        console.error(`Error con ${position.symbol}:`, error);
      }
    }
    
    // Analizar con IA
    const analysis = await aiService.analyzePortfolio(portfolio, marketData, question);
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Error analizando portfolio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al analizar portfolio'
    });
  }
});

// Middleware para manejo de errores
// Este middleware se ejecutará si ninguna de las rutas anteriores coincide
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Middleware para manejar todos los errores pasados por next()
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 