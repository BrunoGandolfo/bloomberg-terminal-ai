// Cargar variables de entorno del archivo .env
require('dotenv').config();

// Importar dependencias
const express = require('express');
const cors = require('cors');
const dataService = require('./services/dataService');
const yahooFinanceService = require('./services/eodhdService');
const screenerService = require('./services/screenerService');
const axios = require('axios');
const aiService = require('./services/aiService');
const perplexityService = require('./services/perplexityService');
const tickerSearchService = require('./services/tickerSearchService');
const logger = require('./utils/logger');
const { fundamentals: fundamentalsCache } = require('./services/cacheService');
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
  res.send('Hello World from Terminal Financiera Power IA Backend!');
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
        const quote = await yahooFinanceService.getQuote(position.symbol);
        if (quote && quote.price) {
          position.currentPrice = quote.price;
        }
      } catch (error) {
        logger.error(`No se pudo actualizar el precio para ${position.symbol}: ${error.message}`);
        // Si falla, se mantiene el último precio guardado en el JSON
      }
      
      // Calcular valor de la posición y sumarlo al total
      const positionValue = position.shares * position.currentPrice;
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
    
    // Usar SOLO Yahoo Finance para cotizaciones
    const quote = await yahooFinanceService.getQuote(symbol);
    return res.json(quote);
    
    res.status(404).json({ message: `No data found for symbol: ${symbol}` });
  } catch (error) {
    next(error);
  }
});

// Ruta para fundamentales (market cap, P/E, etc.)
app.get('/api/market/fundamentals/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    let fundamentals = null;
    
    // Intentar primero con Yahoo Finance
    try {
      fundamentals = await yahooFinanceService.getFundamentals(symbol);
      // Verificar que no sea el objeto de error default
      if (fundamentals.error || fundamentals.name === symbol) {
        fundamentals = null;
      }
    } catch (yahooFinanceError) {
      logger.warn(`Yahoo Finance fundamentals falló para ${symbol}:`, yahooFinanceError.message);
    }
    
    // Si Yahoo Finance falla, intentar con servicio alternativo si fuera necesario
    if (!fundamentals) {
      try {
        // Aquí podrías agregar un servicio de fallback si fuera necesario
        logger.info(`No hay fundamentales disponibles para ${symbol}`);
      } catch (fallbackError) {
        logger.error(`Servicios de fundamentales no disponibles para ${symbol}:`, fallbackError.message);
      }
    }
    
    if (fundamentals) {
      res.json(fundamentals);
    } else {
      res.status(404).json({ 
        message: `No fundamentals for: ${symbol}`,
        attempted: ['Yahoo Finance']
      });
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint para análisis fundamental con Perplexity y fallback
app.get('/api/fundamentals-perplexity/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    let fundamentals = null;
    let dataSource = 'Perplexity';
    
    // Intentar primero con Perplexity
    try {
      fundamentals = await perplexityService.getFundamentalsWithPerplexity(symbol);
    } catch (perplexityError) {
      logger.warn(`Perplexity falló para ${symbol}: ${perplexityError.message}`);
      
      // Fallback a Yahoo Finance
      try {
        const yahooData = await yahooFinanceService.getFundamentals(symbol);
        if (yahooData) {
          // Convertir formato Yahoo al formato esperado por frontend
          fundamentals = {
            company: yahooData.name,
            ticker: symbol,
            date: new Date().toISOString().split('T')[0],
            financials: {
              ROE: yahooData.returnOnEquity || 'N/A',
              ROA: 'N/A', // Yahoo no proporciona ROA directamente
              P_E_ratio: yahooData.peRatio || 'N/A',
              debt_to_equity_ratio: 'N/A', // Yahoo no proporciona esto directamente
              profit_margin: yahooData.profitMargin || 'N/A',
              operating_margin: yahooData.operatingMargin || 'N/A',
              revenue_TTM: yahooData.revenue || 'N/A',
              market_cap: yahooData.marketCap || 'N/A',
              dividend_yield: yahooData.dividendYield || '0%',
              EPS: yahooData.eps || 'N/A',
              free_cash_flow: 'N/A' // Yahoo no proporciona esto directamente
            },
            sources: ['Yahoo Finance'],
            notes: ['Datos obtenidos de Yahoo Finance como fallback']
          };
          dataSource = 'Yahoo Finance (Fallback)';
        }
      } catch (yahooError) {
        logger.error(`Yahoo Finance también falló para ${symbol}: ${yahooError.message}`);
        
        // No hay más servicios de fallback disponibles
        logger.error(`Todos los servicios fallaron para ${symbol}`);
      }
    }
    
    if (fundamentals && fundamentals.financials) {
      res.json({ ...fundamentals, dataSource });
    } else {
      res.status(404).json({ 
        error: `No data for ${symbol}`,
        attempted: ['Perplexity', 'Yahoo Finance']
      });
    }
  } catch (error) {
    logger.error(`Error en endpoint fundamentals-perplexity:`, error);
    next(error);
  }
});



// Ruta combinada para cuando necesites TODO
app.get('/api/market/full/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Llamadas en paralelo para mayor velocidad
    const [quote, fundamentals] = await Promise.all([
      yahooFinanceService.getQuote(symbol),
      yahooFinanceService.getFundamentals(symbol)
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
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Se requiere un array de símbolos' });
    }
    
    // Limitar a 120 símbolos por llamada (límite optimizado)
    const limitedSymbols = symbols.slice(0, 120);
    
    // Obtener cotizaciones en batch
    const quotes = await yahooFinanceService.getBatchQuotes(limitedSymbols);
    
    // El servicio eodhdService ya devuelve el formato de mapa de objetos correcto.
    // No se necesita procesamiento adicional.
    res.json(quotes);
  } catch (error) {
    logger.error('Error en batch quotes:', error);
    next(error);
  }
});

// Ruta para obtener datos históricos de un símbolo
app.get('/api/market/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { days = 365 } = req.query;
    logger.info(`Solicitando ${days} días de historia para ${symbol}`);
    
    const historicalData = await yahooFinanceService.getHistoricalData(symbol, parseInt(days));
    
    // Formatear para el frontend
    const formattedData = historicalData.map(item => ({
      date: item.datetime || item.date,
      close: parseFloat(item.close),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseInt(item.volume)
    }));
    
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

// --- Rutas de Watchlist ---

app.get('/api/watchlist', async (req, res, next) => {
  try {
    const list = await dataService.readWatchlist();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

app.post('/api/watchlist', async (req, res, next) => {
  try {
    const { watchlist } = req.body;
    if (!Array.isArray(watchlist)) {
      return res.status(400).json({ error: 'Se requiere un array "watchlist" en el cuerpo de la petición' });
    }
    await dataService.writeWatchlist(watchlist);
    res.status(200).json({ success: true, message: 'Watchlist guardada correctamente.' });
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

// --- Endpoint temporal para limpiar caché ---
// Limpiar todo el caché
app.get('/api/clear-cache', (req, res) => {
  try {
    fundamentalsCache.clear();
    logger.info('All fundamentals cache cleared');
    res.json({ success: true, message: 'All fundamentals cache cleared' });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error clearing cache', 
      details: error.message 
    });
  }
});

// Limpiar caché de un símbolo específico
app.get('/api/clear-cache/:symbol', (req, res) => {
  const { symbol } = req.params;
  try {
    fundamentalsCache.delete(symbol);
    logger.info(`Cache cleared for symbol: ${symbol}`);
    res.json({ success: true, message: `Cache cleared for ${symbol}` });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error clearing cache', 
      details: error.message 
    });
  }
});

// --- Búsqueda de Tickers ---
app.get('/api/search/ticker', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json([]);
    }
    const results = tickerSearchService.searchTicker(q);
    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda de tickers:', error);
    next(error);
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
  logger.info(`Server listening at http://localhost:${port}`);
});
