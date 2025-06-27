// Cargar variables de entorno del archivo .env
require('dotenv').config();

// Importar dependencias
const express = require('express');
const cors = require('cors');
const dataService = require('./services/dataService');
const yahooFinanceService = require('./services/yahooFinanceService');
const historicalDataService = require('./services/historicalDataService');
const screenerService = require('./services/screenerService');
const axios = require('axios');

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
    const data = await dataService.readPortfolio();
    res.json(data);
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

// Ruta para obtener la cotización de un símbolo desde Alpha Vantage
app.get('/api/market/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await yahooFinanceService.getQuote(symbol);

    if (quote) {
      res.json(quote);
    } else {
      // Esto ocurre si Alpha Vantage no encuentra el símbolo
      res.status(404).json({ message: `No data found for symbol: ${symbol}` });
    }
  } catch (error) {
    // Pasa cualquier otro error (ej. problema de red, API key inválida)
    // a nuestro manejador de errores, que devolverá un 500.
    next(error);
  }
});

// Ruta para obtener datos históricos de un símbolo
app.get('/api/market/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const data = await historicalDataService.getHistoricalData(symbol);
    res.json(data);
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