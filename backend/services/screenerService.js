/**
 * Este servicio se encarga de toda la lógica de negocio para obtener
 * datos de screeners, búsqueda de símbolos y otra información de mercado
 * desde la API de Yahoo Finance.
 */
const axios = require('axios');
const logger = require('../utils/logger');
const { screeners } = require('./cacheService');

const SCREENER_MAP = {
  most_actives: { id: 'most_actives_us', count: 25 },
  gainers: { id: 'day_gainers', count: 100 },
  losers: { id: 'day_losers', count: 100 },
  etfs: { id: 'etfs_all_all', count: 100 },
};

// --- Diccionarios de Traducción ---
const SECTOR_TRANSLATIONS = {
  'Technology': 'Tecnología',
  'Healthcare': 'Salud',
  'Financial Services': 'Servicios Financieros',
  'Communication Services': 'Servicios de Comunicación',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Consumer Defensive': 'Consumo Defensivo',
  'Industrials': 'Industria',
  'Energy': 'Energía',
  'Utilities': 'Servicios Públicos',
  'Real Estate': 'Bienes Raíces',
  'Basic Materials': 'Materiales Básicos',
};

const TYPE_TRANSLATIONS = {
    'Equity': 'Acción',
    'ETF': 'ETF',
    'Mutual Fund': 'Fondo Mutuo',
    'Index': 'Índice',
    'Currency': 'Divisa',
    'Cryptocurrency': 'Criptomoneda',
    'Future': 'Futuro',
    'Bond': 'Bono',
};

// --- Definiciones de Presets de Screener ---
const PRESET_QUERIES = {
    'dividendos_altos': {
        name: 'Dividendos Altos',
        query: { operator: 'and', operands: [{ operator: 'gt', operands: ['trailingAnnualDividendYield', 0.03] }] }
    },
    'growth_stocks': {
        name: 'Acciones de Crecimiento',
        query: { operator: 'and', operands: [{ operator: 'gt', operands: ['revenueGrowth', 0.2] }] }
    },
    'value_stocks': {
        name: 'Acciones de Valor (P/E bajo)',
        query: { operator: 'and', operands: [{ operator: 'lt', operands: ['trailingPE', 15] }, { operator: 'gt', operands: ['trailingPE', 0] }] }
    },
    'penny_stocks': {
        name: 'Penny Stocks',
        query: { operator: 'and', operands: [{ operator: 'lt', operands: ['regularMarketPrice', 5] }] }
    },
    'blue_chips': {
        name: 'Blue Chips (Gigantes del Mercado)',
        query: { operator: 'and', operands: [{ operator: 'gt', operands: ['marketCap', 100000000000] }] }
    },
};

/**
 * Fetches data from Yahoo Finance, using a cache to avoid repeated requests.
 * @param {string} type The screener type (e.g., 'most_actives').
 * @returns {Promise<Array<Object>>} A promise resolving to the list of stocks.
 */
async function fetchScreenerDataFromApi(type) {
  const cacheKey = `screener_${type}`;
  
  // Usar getOrSet del nuevo sistema de cache
  return screeners.getOrSet(cacheKey, async () => {
    if (type === 'most_actives') {
    try {
      // 1. Obtener la lista inicial de símbolos "trending" desde la API de tendencias.
      // Esta API es ligera y solo devuelve los símbolos más populares.
      const trendingUrl = 'https://query1.finance.yahoo.com/v1/finance/trending/US';
      const { data: trendingData } = await axios.get(trendingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const quotes = trendingData?.finance?.result?.[0]?.quotes;

      if (!quotes || quotes.length === 0) {
        logger.error('No se pudieron obtener los símbolos de trending desde Yahoo.');
        return [];
      }
      
      // Filtra para excluir índices (ej. ^GSPC) y limita a los primeros 10 para optimizar.
      const symbols = quotes.map(q => q.symbol).filter(s => !s.startsWith('^')).slice(0, 10);

      // 2. INTENTO MASIVO: Intentar obtener todos los detalles en una sola llamada a la API de 'quote'.
      // Este es el método más rápido y eficiente.
      try {
        const symbolsString = symbols.join(',');
        const response = await axios.get(
          // Esta API de 'quote' puede recibir múltiples símbolos separados por comas.
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        
        const detailedQuotes = response.data?.quoteResponse?.result || [];
        if (detailedQuotes.length > 0) {
          logger.debug('Datos de un símbolo:', JSON.stringify(detailedQuotes[0], null, 2));
        }
        logger.info(`¡Éxito con llamada masiva! Se obtuvieron detalles para ${detailedQuotes.length} símbolos.`);

        const formattedData = detailedQuotes.map(quote => ({
          símbolo: quote.symbol,
          nombre: quote.shortName || quote.longName || 'N/A',
          precio: quote.regularMarketPrice,
          cambio_porcentual: quote.regularMarketChangePercent,
          capitalización: quote.marketCap || 0,
          sector: 'N/A' // La API de Quote no devuelve este dato
        })).filter(q => q.precio != null);

        return formattedData;

      } catch (bulkError) {
        // 3. FALLBACK: Si la llamada masiva falla, se usa un bucle individual.
        // Este método es más lento pero más robusto contra ciertos errores de la API.
        logger.warn(`La llamada masiva falló (error: ${bulkError.message}). Volviendo al método individual.`);
        
        const detailedQuotes = [];
        for (const symbol of symbols) {
          try {
            // La API de 'chart' es una alternativa fiable para obtener datos de un solo símbolo.
            const chartResponse = await axios.get(
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
              { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            
            const meta = chartResponse.data?.chart?.result?.[0]?.meta;
            logger.debug('Datos individuales de', symbol, ':', meta);
            if (meta && meta.regularMarketPrice && meta.previousClose) {
              detailedQuotes.push({
                símbolo: symbol,
                nombre: meta.shortName || symbol,
                precio: meta.regularMarketPrice,
                cambio_porcentual: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                capitalización: meta.marketCap || 0,
                sector: 'N/A'
              });
            }
            await new Promise(r => setTimeout(r, 100));
          } catch (individualError) {
            logger.error(`Error con ${symbol} en el método individual:`, individualError.message);
          }
        }
        
        return detailedQuotes;
      }
    } catch (error) {
      logger.error(`Error en el proceso de fetch para "most_actives":`, error.message);
      return [];
    }
  }

  const screener = SCREENER_MAP[type];
  if (!screener) {
    throw new Error(`Invalid screener type '${type}' provided.`);
  }

  const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${screener.id}&count=${screener.count}`;
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const quotes = data?.finance?.result?.[0]?.quotes || [];
    
    const formattedData = quotes.map(quote => ({
      símbolo: quote.symbol,
      nombre: quote.longName || quote.shortName || 'N/A',
      sector: SECTOR_TRANSLATIONS[quote.sector] || quote.sector || 'N/A',
      capitalización: quote.marketCap || 0,
      precio: quote.regularMarketPrice,
      cambio_porcentual: quote.regularMarketChangePercent,
    })).filter(stock => stock.precio != null && stock.cambio_porcentual != null && stock.sector !== 'N/A');

    return formattedData;
  } catch (error) {
    logger.error(`Error fetching screener data for ${type}:`, error.message);
    // On error, return an empty array but don't cache it
    return [];
  }
  }); // Cierre de getOrSet callback
}

/**
 * Extracts unique sectors from a list of stocks.
 * @param {Array<Object>} stocks The list of stock objects.
 * @returns {Array<string>} An array of unique sector names.
 */
function extractSectors(stocks) {
  const sectorSet = new Set(stocks.map(stock => stock.sector));
  return Array.from(sectorSet).sort();
}

/**
 * Gets real-time screener data, with an option to filter by sector.
 * @param {string} type The screener type ('most_actives', 'gainers', etc.).
 * @param {Object} options Optional parameters for filtering.
 * @param {string|null} options.sector The sector to filter by.
 * @returns {Promise<Array<Object>>} A promise resolving to the list of stocks.
 */
async function getRealTimeScreener(type, { sector = null } = {}) {
  try {
    const allStocks = await fetchScreenerDataFromApi(type);

    if (sector) {
      return allStocks.filter(stock => stock.sector === sector);
    }
    
    return allStocks;
  } catch (error) {
    logger.error(`getRealTimeScreener failed: ${error.message}`);
    return [];
  }
}

/**
 * Gets a list of all unique sectors available in the current market data.
 * @returns {Promise<Array<string>>} A promise resolving to a sorted list of sector names.
 */
async function getSectorsFromMarket() {
  try {
    // Use the broadest category to get a good list of sectors
    const stocks = await fetchScreenerDataFromApi('most_actives');
    return extractSectors(stocks);
  } catch (error) {
    logger.error(`getSectorsFromMarket failed: ${error.message}`);
    return [];
  }
}

/**
 * Searches for financial instruments by a query string.
 * @param {string} query The search query (e.g., 'Tesla', 'BTC-USD').
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of search results.
 */
async function searchSymbol(query) {
  if (!query) {
    return [];
  }

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&count=20`;

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const results = data?.quotes || [];

    // Filter out results without a symbol and map to the desired format
    const formattedResults = results
      .filter(item => item.symbol)
      .map(item => ({
        símbolo: item.symbol,
        nombre: item.longname || item.shortname || item.symbol,
        intercambio: item.exchDisp || 'N/A', // Exchange display name
        tipo: TYPE_TRANSLATIONS[item.typeDisp] || item.typeDisp || 'N/A',
      }));

    return formattedResults;

  } catch (error) {
    logger.error(`Error searching for symbol "${query}":`, error.message);
    return [];
  }
}

/**
 * Gets all stocks for a given sector using a dynamic screener.
 * @param {string} englishSector The sector name in English (as required by the API).
 * @returns {Promise<Array<Object>>} A promise resolving to a list of stocks with translated fields.
 */
async function getAllStocksBySector(englishSector) {
    if (!englishSector) {
        logger.error('Sector is required for getAllStocksBySector');
        return [];
    }
    
    const screenerQuery = {
        operator: 'and',
        operands: [{ operator: 'eq', operands: ['sector', englishSector] }]
    };
    
    // La API de screener de Yahoo permite construir consultas complejas en formato JSON.
    // Aquí, buscamos acciones donde el campo 'sector' sea igual al proporcionado.
    const url = `https://query1.finance.yahoo.com/v1/finance/screener?formatted=false&fields=symbol,shortName,regularMarketPrice,regularMarketChangePercent,marketCap,sector&query=${encodeURIComponent(JSON.stringify(screenerQuery))}&count=250`;

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const quotes = data?.finance?.result?.[0]?.quotes || [];

        return quotes.map(quote => ({
            símbolo: quote.symbol,
            nombre: quote.shortName || 'N/A',
            precio: quote.regularMarketPrice,
            cambio_porcentual: quote.regularMarketChangePercent,
            capitalización: quote.marketCap,
            sector: SECTOR_TRANSLATIONS[quote.sector] || quote.sector,
        }));

    } catch (error) {
        logger.error(`Error fetching stocks for sector "${englishSector}":`, error.message);
        return [];
    }
}

/**
 * Fetches data for the major stock market indices.
 * @returns {Promise<Array<Object>>} A promise resolving to a list of major indices.
 */
async function getMajorIndices() {
    const symbols = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', '^FTSE', '^N225', '^HSI']; // S&P 500, Dow Jones, Nasdaq, Russell 2000
    
    const indicesData = [];
    for (const symbol of symbols) {
        try {
            const response = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );

            const meta = response.data?.chart?.result?.[0]?.meta;
            if (meta && meta.regularMarketPrice && meta.previousClose) {
                indicesData.push({
                    símbolo: symbol,
                    nombre: meta.exchangeName || symbol,
                    precio: meta.regularMarketPrice,
                    cambio: meta.regularMarketPrice - meta.previousClose,
                    cambio_porcentual: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                });
            }
        } catch (error) {
            logger.error(`Error al obtener datos para el índice ${symbol}:`, error.message);
        }
    }

    return indicesData;
}

/**
 * Fetches a list of top Treasury and corporate bonds.
 * @returns {Promise<Array<Object>>} A promise resolving to a list of bonds.
 */
async function getTopBonds() {
    // Lista de ETFs de Bonos más populares del mercado
    const symbols = ['TLT','IEF','SHY','AGG','BND','HYG','LQD','TIP','IEI','SHV'];
    
    const bondData = [];
    for (const symbol of symbols) {
        try {
            const response = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );

            const meta = response.data?.chart?.result?.[0]?.meta;
            if (meta && meta.regularMarketPrice && meta.previousClose) {
                bondData.push({
                    símbolo: symbol,
                    nombre: `${meta.shortName || symbol} (Bond ETF)`,
                    precio: meta.regularMarketPrice,
                    cambio: meta.regularMarketPrice - meta.previousClose,
                    rendimiento_anual: meta.trailingAnnualDividendYield ? `${(meta.trailingAnnualDividendYield * 100).toFixed(2)}%` : 'N/A',
                });
            }
        } catch (error) {
            logger.error(`Error al obtener datos para el Bono ETF ${symbol}:`, error.message);
        }
    }
    return bondData;
}

/**
 * Fetches the top 100 most active ETFs from the US market.
 * @returns {Promise<Array<Object>>} A promise resolving to a list of top ETFs.
 */
async function getTopETFs() {
    // Lista de ETFs populares por volumen y relevancia
    const symbols = ['SPY','QQQ','IWM','DIA','VTI','EEM','GLD','IEF','TLT','XLF','XLE','XLK','ARKK','VNQ','SLV'];
    
    const etfData = [];
    for (const symbol of symbols) {
        try {
            const response = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );

            const meta = response.data?.chart?.result?.[0]?.meta;
            if (meta && meta.regularMarketPrice && meta.previousClose) {
                etfData.push({
                    símbolo: symbol,
                    nombre: meta.shortName || symbol,
                    precio: meta.regularMarketPrice,
                    cambio_porcentual: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                    capitalización: meta.marketCap || 0,
                });
            }
        } catch (error) {
            logger.error(`Error al obtener datos para el ETF ${symbol}:`, error.message);
        }
    }
    return etfData;
}

/**
 * Returns a list of available screener presets.
 * @returns {Array<{id: string, name: string}>} A list of preset objects.
 */
function getScreenerPresets() {
    return Object.entries(PRESET_QUERIES).map(([id, { name }]) => ({ id, name }));
}

/**
 * Fetches stocks based on a predefined screener preset.
 * @param {string} presetType The ID of the preset (e.g., 'dividendos_altos').
 * @returns {Promise<Array<Object>>} A promise resolving to a list of stocks matching the preset criteria.
 */
async function getScreenerPresetData(presetType) {
    const preset = PRESET_QUERIES[presetType];
    if (!preset) {
        logger.error(`Invalid preset type: ${presetType}`);
        return [];
    }

    const query = JSON.stringify(preset.query);
    const fields = 'symbol,shortName,longName,regularMarketPrice,regularMarketChangePercent,marketCap,sector,trailingPE,trailingAnnualDividendYield,revenueGrowth';
    // Se usa la misma API de screener que en 'getAllStocksBySector' pero con consultas más complejas.
    const url = `https://query1.finance.yahoo.com/v1/finance/screener?formatted=false&fields=${fields}&query=${encodeURIComponent(query)}&count=100`;

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const quotes = data?.finance?.result?.[0]?.quotes || [];

        return quotes.map(quote => ({
            símbolo: quote.symbol,
            nombre: quote.longName || quote.shortName || 'N/A',
            precio: quote.regularMarketPrice,
            cambio_porcentual: quote.regularMarketChangePercent,
            capitalización: quote.marketCap,
            sector: SECTOR_TRANSLATIONS[quote.sector] || quote.sector || 'N/A',
            ratio_pe: quote.trailingPE,
            rendimiento_dividendo: quote.trailingAnnualDividendYield,
            crecimiento_ingresos: quote.revenueGrowth,
        })).filter(q => q.precio);
    } catch (error) {
        logger.error(`Error fetching preset screener "${presetType}":`, error.message);
        return [];
    }
}

module.exports = {
  getRealTimeScreener,
  getSectorsFromMarket,
  searchSymbol,
  getAllStocksBySector,
  getMajorIndices,
  getTopBonds,
  getTopETFs,
  getScreenerPresets,
  getScreenerPresetData,
}; 