// Cargar variables de entorno del archivo .env
require('dotenv').config();

// Importar dependencias
const express = require('express');
const cors = require('cors');
const dataService = require('./services/dataService');
const marketDataService = require('./services/eodhdService');
// Migrado de Yahoo Finance a EODHD para consolidar proveedores
const screenerService = require('./services/eodhdScreenerService');
const axios = require('axios');
const aiService = require('./services/aiService');
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
        const quote = await marketDataService.getQuote(position.symbol);
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
    const quote = await marketDataService.getQuote(symbol);
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
      fundamentals = await marketDataService.getFundamentals(symbol);
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
// Endpoint eliminado - perplexityService ya no existe



// Ruta combinada para cuando necesites TODO
app.get('/api/market/full/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Llamadas en paralelo para mayor velocidad
    const [quote, fundamentals] = await Promise.all([
      marketDataService.getQuote(symbol),
      marketDataService.getFundamentals(symbol)
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
    const quotes = await marketDataService.getBatchQuotes(limitedSymbols);
    
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
    const { days = 365, period } = req.query;
    
    // Convertir period a days si se proporciona
    let daysToFetch = parseInt(days);
    if (period) {
      const periodMap = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
      daysToFetch = periodMap[period] || 30;
    }
    
    logger.info(`Solicitando ${daysToFetch} días de historia para ${symbol}`);
    
    const historicalData = await marketDataService.getHistoricalData(symbol, daysToFetch);
    
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

// Alias para compatibilidad con tests
app.get('/api/market/historical/:symbol', async (req, res, next) => {
  req.url = req.url.replace('/historical/', '/history/');
  app.handle(req, res, next);
});

// --- RUTAS DE INDICADORES TÉCNICOS ---

// Feature flag para habilitar/deshabilitar análisis técnico
const TECHNICAL_ANALYSIS_ENABLED = process.env.TECHNICAL_ANALYSIS_ENABLED !== 'false';

// Middleware para verificar si el análisis técnico está habilitado
const checkTechnicalAnalysisEnabled = (req, res, next) => {
  if (!TECHNICAL_ANALYSIS_ENABLED) {
    return res.status(503).json({ 
      error: 'Technical analysis is temporarily disabled',
      message: 'El análisis técnico está temporalmente deshabilitado'
    });
  }
  next();
};

// Endpoint para obtener un indicador técnico específico
app.get('/api/technical/:symbol/:indicator', checkTechnicalAnalysisEnabled, async (req, res, next) => {
  try {
    const { symbol, indicator } = req.params;
    const { period, fastPeriod, slowPeriod, signalPeriod } = req.query;
    
    logger.info(`[Technical] Solicitando ${indicator} para ${symbol}`);
    
    let data;
    const params = {};
    
    // Parsear parámetros según el indicador
    switch (indicator.toLowerCase()) {
      case 'rsi':
        if (period) params.period = parseInt(period);
        data = await marketDataService.getRSI(symbol, params.period);
        break;
        
      case 'macd':
        if (fastPeriod) params.fastPeriod = parseInt(fastPeriod);
        if (slowPeriod) params.slowPeriod = parseInt(slowPeriod);
        if (signalPeriod) params.signalPeriod = parseInt(signalPeriod);
        data = await marketDataService.getMACD(symbol, params.fastPeriod, params.slowPeriod, params.signalPeriod);
        break;
        
      case 'sma':
        if (period) params.period = parseInt(period);
        data = await marketDataService.getSMA(symbol, params.period);
        break;
        
      case 'ema':
        if (period) params.period = parseInt(period);
        data = await marketDataService.getEMA(symbol, params.period);
        break;
        
      default:
        // Intentar con el indicador genérico
        data = await marketDataService.getTechnicalIndicator(symbol, indicator, params);
    }
    
    // Obtener solo los últimos valores para mostrar en el frontend
    const latestValues = Array.isArray(data) && data.length > 0 ? {
      indicator: indicator,
      symbol: symbol,
      latest: data[data.length - 1],
      previous: data.length > 1 ? data[data.length - 2] : null,
      data: data.slice(-20), // Últimos 20 valores para mini gráfico
      timestamp: new Date().toISOString()
    } : { error: 'No data available' };
    
    res.json(latestValues);
  } catch (error) {
    logger.error(`[Technical] Error obteniendo ${req.params.indicator} para ${req.params.symbol}:`, error);
    next(error);
  }
});

// Endpoint para obtener múltiples indicadores técnicos de una vez
app.post('/api/technical/batch', checkTechnicalAnalysisEnabled, async (req, res, next) => {
  try {
    const { symbol, indicators } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    if (!indicators || !Array.isArray(indicators)) {
      return res.status(400).json({ error: 'Indicators array is required' });
    }
    
    logger.info(`[Technical] Batch request para ${symbol}: ${indicators.join(', ')}`);
    
    // Limitar a 4 indicadores por llamada para no exceder límites de API
    const limitedIndicators = indicators.slice(0, 4);
    
    // Obtener todos los indicadores
    const results = await marketDataService.getBatchTechnicalIndicators(symbol, limitedIndicators);
    
    // Formatear resultados para el frontend
    const formattedResults = {};
    
    for (const [indicator, data] of Object.entries(results)) {
      if (data.error) {
        formattedResults[indicator] = { error: data.error };
        continue;
      }
      
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];
        formattedResults[indicator] = {
          indicator: indicator,
          symbol: symbol,
          latest: latest,
          previous: data.length > 1 ? data[data.length - 2] : null,
          data: data.slice(-20), // Últimos 20 valores
          timestamp: latest.date || new Date().toISOString(),
          interpretation: interpretIndicator(indicator, latest)
        };
      } else {
        formattedResults[indicator] = { error: 'No data available' };
      }
    }
    
    // Generar síntesis ejecutiva
    const executiveSummary = generateTechnicalSummary(formattedResults, req.body.currentPrice);
    
    res.json({
      symbol: symbol,
      indicators: formattedResults,
      executiveSummary: executiveSummary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('[Technical] Error en batch indicators:', error);
    next(error);
  }
});

// Función auxiliar para interpretar indicadores
function interpretIndicator(indicator, data) {
  switch (indicator.toLowerCase()) {
    case 'rsi':
      const rsiValue = data.rsi || data.value || data;
      if (rsiValue > 70) return { signal: 'bearish', message: 'Sobrecompra - Posible corrección bajista' };
      if (rsiValue < 30) return { signal: 'bullish', message: 'Sobreventa - Posible rebote alcista' };
      return { signal: 'neutral', message: 'RSI en zona neutral' };
      
    case 'macd':
      const macdValue = data.macd || data.MACD || 0;
      const signalValue = data.signal || data.MACD_Signal || 0;
      if (macdValue > signalValue) return { signal: 'bullish', message: 'MACD sobre señal - Tendencia alcista' };
      if (macdValue < signalValue) return { signal: 'bearish', message: 'MACD bajo señal - Tendencia bajista' };
      return { signal: 'neutral', message: 'MACD en equilibrio' };
      
    case 'sma':
    case 'ema':
      // Para SMA/EMA necesitaríamos el precio actual para comparar
      return { signal: 'info', message: `Media móvil: ${data.sma || data.ema || data.value || data}` };
      
    default:
      return { signal: 'info', message: 'Indicador calculado' };
  }
}

// Función para generar síntesis ejecutiva del análisis técnico
function generateTechnicalSummary(indicators, currentPrice) {
  const signals = {
    bullish: 0,
    bearish: 0,
    neutral: 0
  };
  
  const analysis = {};
  
  // Analizar RSI
  if (indicators.rsi && indicators.rsi.latest) {
    const rsiValue = indicators.rsi.latest.rsi || indicators.rsi.latest;
    if (rsiValue > 70) {
      signals.bearish++;
      analysis.rsi = 'sobrecompra';
    } else if (rsiValue < 30) {
      signals.bullish++;
      analysis.rsi = 'sobreventa';
    } else if (rsiValue > 50) {
      signals.bullish += 0.5;
      analysis.rsi = 'positivo';
    } else {
      signals.bearish += 0.5;
      analysis.rsi = 'negativo';
    }
  }
  
  // Analizar MACD
  if (indicators.macd && indicators.macd.latest) {
    const macdData = indicators.macd.latest;
    const macdValue = macdData.macd || macdData.MACD || 0;
    const signalValue = macdData.signal || macdData.MACD_Signal || 0;
    const divergence = macdData.divergence || macdData.MACD_Hist || (macdValue - signalValue);
    
    if (macdValue > signalValue) {
      signals.bullish++;
      analysis.macd = 'alcista';
    } else {
      signals.bearish++;
      analysis.macd = 'bajista';
    }
    
    // Analizar divergencia
    if (indicators.macd.previous) {
      const prevDivergence = indicators.macd.previous.divergence || indicators.macd.previous.MACD_Hist || 0;
      if (divergence > prevDivergence) {
        signals.bullish += 0.5;
        analysis.macdTrend = 'mejorando';
      } else {
        signals.bearish += 0.5;
        analysis.macdTrend = 'debilitándose';
      }
    }
  }
  
  // Analizar SMA/EMA vs precio
  if (currentPrice) {
    if (indicators.sma && indicators.sma.latest) {
      const smaValue = indicators.sma.latest.sma || indicators.sma.latest;
      if (currentPrice > smaValue) {
        signals.bullish++;
        analysis.sma = 'precio sobre SMA';
      } else {
        signals.bearish++;
        analysis.sma = 'precio bajo SMA';
      }
    }
    
    if (indicators.ema && indicators.ema.latest) {
      const emaValue = indicators.ema.latest.ema || indicators.ema.latest;
      if (currentPrice > emaValue) {
        signals.bullish += 0.5;
        analysis.ema = 'precio sobre EMA';
      } else {
        signals.bearish += 0.5;
        analysis.ema = 'precio bajo EMA';
      }
    }
  }
  
  // Calcular señal general
  const totalSignals = signals.bullish + signals.bearish + signals.neutral;
  const bullishPercentage = (signals.bullish / totalSignals) * 100;
  const bearishPercentage = (signals.bearish / totalSignals) * 100;
  
  let overallSignal, summary, recommendation, confidence;
  
  // Determinar señal general y generar resumen
  if (bullishPercentage >= 75) {
    overallSignal = 'ALCISTA';
    confidence = 'ALTA';
    recommendation = 'MOMENTO DE COMPRA';
    
    if (analysis.rsi === 'sobrecompra') {
      summary = 'La acción muestra fortaleza técnica generalizada, aunque el RSI indica sobrecompra. ' +
                'Los indicadores de tendencia confirman el momentum alcista. ' +
                'Considere entradas en correcciones menores para optimizar el precio.';
      recommendation = 'COMPRA EN CORRECCIONES';
      confidence = 'MEDIA';
    } else if (analysis.rsi === 'sobreventa') {
      summary = 'Excelente oportunidad técnica con múltiples señales de compra. ' +
                'La acción está sobreventa y muestra señales de reversión alcista. ' +
                'Momento muy favorable para considerar posiciones largas.';
      confidence = 'ALTA';
    } else {
      summary = 'Todos los indicadores técnicos muestran fortaleza. ' +
                'La acción está en clara tendencia alcista con buen momentum. ' +
                'Momento favorable para considerar compras o mantener posiciones.';
    }
  } else if (bearishPercentage >= 75) {
    overallSignal = 'BAJISTA';
    confidence = 'ALTA';
    recommendation = 'MOMENTO DE VENTA';
    
    if (analysis.rsi === 'sobrecompra') {
      summary = 'Múltiples señales negativas con RSI en sobrecompra. ' +
                'Alto riesgo de corrección significativa en el corto plazo. ' +
                'Considere tomar ganancias o proteger posiciones con stops ajustados.';
      confidence = 'ALTA';
    } else if (analysis.rsi === 'sobreventa') {
      summary = 'La acción está débil pero podría tener un rebote técnico menor. ' +
                'La tendencia principal sigue siendo bajista. ' +
                'Cualquier rebote podría ser una oportunidad de salida.';
      recommendation = 'CAUTELA';
      confidence = 'MEDIA';
    } else {
      summary = 'Los indicadores técnicos muestran debilidad generalizada. ' +
                'La acción está en tendencia bajista con momentum negativo. ' +
                'Considere reducir exposición o esperar mejores niveles.';
    }
  } else if (Math.abs(bullishPercentage - bearishPercentage) < 20) {
    overallSignal = 'NEUTRAL';
    recommendation = 'ESPERAR';
    confidence = 'BAJA';
    
    if (analysis.rsi === 'sobrecompra' && analysis.macd === 'bajista') {
      summary = 'Señales mixtas con posible agotamiento alcista. ' +
                'El RSI sugiere sobrecompra mientras el MACD pierde fuerza. ' +
                'Prudente esperar confirmación antes de tomar posiciones.';
    } else if (analysis.rsi === 'sobreventa' && analysis.macd === 'alcista') {
      summary = 'Posible inicio de reversión alcista desde niveles sobreventa. ' +
                'Las señales son mixtas pero mejorando. ' +
                'Observe los próximos días para confirmación de cambio de tendencia.';
      confidence = 'MEDIA';
    } else {
      summary = 'El mercado muestra indecisión con señales contradictorias. ' +
                'No hay una tendencia clara definida en este momento. ' +
                'Recomendable mantenerse al margen hasta tener señales más claras.';
    }
  } else if (bullishPercentage > bearishPercentage) {
    overallSignal = 'MIXTA-ALCISTA';
    recommendation = 'COMPRA GRADUAL';
    confidence = 'MEDIA';
    
    summary = 'La balanza técnica se inclina ligeramente al lado alcista. ' +
              'Hay señales positivas pero sin consenso total entre indicadores. ' +
              'Considere entradas graduales con gestión de riesgo activa.';
  } else {
    overallSignal = 'MIXTA-BAJISTA';
    recommendation = 'REDUCIR EXPOSICIÓN';
    confidence = 'MEDIA';
    
    summary = 'Los indicadores muestran debilidad pero sin consenso total. ' +
              'La prudencia sugiere reducir posiciones o ajustar stops. ' +
              'Evite nuevas compras hasta ver mejora en los indicadores.';
  }
  
  // Ajustes especiales para casos extremos
  if (analysis.rsi === 'sobrecompra' && analysis.macd === 'bajista' && analysis.sma === 'precio bajo SMA') {
    overallSignal = 'BAJISTA';
    summary = 'ADVERTENCIA: Múltiples señales de reversión bajista inminente. ' +
              'RSI sobrecomprado, MACD negativo y precio rompiendo soportes. ' +
              'Alta probabilidad de corrección significativa.';
    recommendation = 'VENDER';
    confidence = 'ALTA';
  }
  
  if (analysis.rsi === 'sobreventa' && analysis.macd === 'alcista' && analysis.macdTrend === 'mejorando') {
    overallSignal = 'ALCISTA';
    summary = 'OPORTUNIDAD: Reversión alcista en desarrollo desde zona sobreventa. ' +
              'MACD confirmando cambio de momentum con divergencia positiva. ' +
              'Excelente relación riesgo/beneficio para entradas.';
    recommendation = 'COMPRAR';
    confidence = 'ALTA';
  }
  
  return {
    signal: overallSignal,
    summary: summary,
    recommendation: recommendation,
    confidence: confidence,
    analysis: analysis,
    scores: {
      bullish: signals.bullish,
      bearish: signals.bearish,
      neutral: signals.neutral
    }
  };
}

// Endpoint de salud para verificar si el servicio de indicadores técnicos está funcionando
app.get('/api/technical/health', (req, res) => {
  res.json({ 
    status: 'ok',
    enabled: TECHNICAL_ANALYSIS_ENABLED,
    message: TECHNICAL_ANALYSIS_ENABLED ? 'Technical analysis service is running' : 'Technical analysis is disabled'
  });
});

// --- Rutas de Screener ---

// Ruta para obtener listas de acciones en tiempo real (más activas, ganadoras, etc.)
app.get('/api/screener/realtime/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await screenerService.getRealTimeScreener(type);
    
    // Market cap ya viene incluido desde EODHD en el campo 'capitalización'
    // No se necesita enriquecimiento adicional
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Ruta para obtener la lista de sectores únicos del mercado
app.get('/api/screener/sectors', async (req, res, next) => {
  try {
    // Lista de sectores disponibles en el mercado
    res.json(['Tecnología', 'Finanzas', 'Salud', 'Consumo', 'Energía']);
  } catch (error) {
    next(error);
  }
});

// Ruta para buscar símbolos (migrado a EODHD)
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
          const quote = await marketDataService.getQuote(symbol);
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
        const quote = await marketDataService.getQuote(position.symbol);
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

// Iniciar el servidor solo si no estamos en tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server listening at http://localhost:${port}`);
  });
}

module.exports = app;
