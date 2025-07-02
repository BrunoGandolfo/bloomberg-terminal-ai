// ===================================================================
// NEWS SERVICE - Bloomberg Terminal AI
// ===================================================================
// Mock news service preparado para integración con Perplexity API
// Incluye sistema de caché de 5 minutos y datos de prueba realistas

const { searchFinancialNews } = require('./perplexityService');

class NewsService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutos en milliseconds
  }

  // ===================================================================
  // CACHE MANAGEMENT
  // ===================================================================
  
  getCacheKey(category = 'general', symbol = null) {
    return symbol ? `news_${symbol}` : `news_${category}`;
  }

  isValidCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.CACHE_DURATION;
  }

  setCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  }

  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    return cached ? cached.data : null;
  }

  // ===================================================================
  // MOCK NEWS DATA
  // ===================================================================

  getMockNews(category = 'general', limit = 20) {
    const mockNews = [
      {
        id: 'news_001',
        headline: 'Apple Alcanza Nuevo Máximo Histórico Tras Resultados del Q4',
        summary: 'Las acciones de Apple subieron 3.2% después de superar las expectativas de ingresos por servicios y ventas de iPhone. Los analistas elevan precio objetivo a $200.',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        category: 'stocks',
        sentiment: 'positive',
        impact: 'high',
        relatedSymbols: ['AAPL'],
        url: 'https://bloomberg.com/apple-earnings'
      },
      {
        id: 'news_002',
        headline: 'Fed Mantiene Tasas de Interés, Señala Posibles Recortes en 2024',
        summary: 'La Reserva Federal mantuvo las tasas entre 5.25%-5.50% pero indicó que podría considerar recortes si la inflación sigue bajando. Los mercados reaccionaron positivamente.',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
        category: 'monetary-policy',
        sentiment: 'neutral',
        impact: 'high',
        relatedSymbols: ['^GSPC', '^DJI', '^IXIC'],
        url: 'https://reuters.com/fed-rates'
      },
      {
        id: 'news_003',
        headline: 'Tesla Reporta Entregas Record en Q4, Supera Expectativas',
        summary: 'Tesla entregó 484,507 vehículos en el cuarto trimestre, superando las estimaciones de 473,000. La producción del Cybertruck se acelera según el reporte.',
        source: 'CNBC',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
        category: 'stocks',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['TSLA'],
        url: 'https://cnbc.com/tesla-deliveries'
      },
      {
        id: 'news_004',
        headline: 'Bitcoin Rompe Resistencia de $45,000 en Rally Institucional',
        summary: 'Bitcoin subió 8% hasta $46,200 impulsado por compras institucionales y expectativas de aprobación de ETF spot. El volumen de trading aumentó 340%.',
        source: 'CoinDesk',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
        category: 'crypto',
        sentiment: 'positive',
        impact: 'high',
        relatedSymbols: ['BTC-USD', 'ETH-USD'],
        url: 'https://coindesk.com/bitcoin-rally'
      },
      {
        id: 'news_005',
        headline: 'Microsoft Azure Lidera Crecimiento de Cloud, Acciones Suben 2.1%',
        summary: 'Microsoft reportó crecimiento de 30% en Azure vs 28% esperado. Los ingresos de cloud computing alcanzaron $25.7B, impulsando las acciones en after-hours.',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 horas atrás
        category: 'stocks',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['MSFT'],
        url: 'https://ft.com/microsoft-azure'
      },
      {
        id: 'news_006',
        headline: 'Precios del Petróleo Caen 2% por Temores de Recesión China',
        summary: 'El WTI cayó a $71.20 y el Brent a $76.45 tras datos débiles de manufactura china. Los analistas rebajan previsiones de demanda para 2024.',
        source: 'Wall Street Journal',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
        category: 'commodities',
        sentiment: 'negative',
        impact: 'medium',
        relatedSymbols: ['CL=F', 'BZ=F'],
        url: 'https://wsj.com/oil-prices-china'
      },
      {
        id: 'news_007',
        headline: 'NVIDIA Anuncia Nueva Arquitectura de GPU para IA, Acciones Volátiles',
        summary: 'NVIDIA presentó la arquitectura Blackwell con 50% más eficiencia energética. Las acciones oscilaron ±4% mientras inversores evalúan el impacto competitivo.',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
        category: 'tech',
        sentiment: 'neutral',
        impact: 'high',
        relatedSymbols: ['NVDA'],
        url: 'https://techcrunch.com/nvidia-blackwell'
      },
      {
        id: 'news_008',
        headline: 'JPMorgan Eleva Previsión de S&P 500 a 4,900 para Fin de Año',
        summary: 'Los estrategas de JPM citan mejores perspectivas de ganancias corporativas y posible "aterrizaje suave" de la economía. Recomiendan sobreponderar tecnología.',
        source: 'MarketWatch',
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 horas atrás
        category: 'market-outlook',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['^GSPC'],
        url: 'https://marketwatch.com/jpmorgan-sp500'
      },
      {
        id: 'news_009',
        headline: 'Ethereum Actualización "Dencun" Reduce Tarifas de Layer 2 en 90%',
        summary: 'La actualización Dencun de Ethereum implementó proto-danksharding, reduciendo drasticamente las tarifas en redes Layer 2 como Arbitrum y Optimism.',
        source: 'The Block',
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
        category: 'crypto',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['ETH-USD'],
        url: 'https://theblock.co/ethereum-dencun'
      },
      {
        id: 'news_010',
        headline: 'Amazon Invierte $15B en Centros de Datos para Competir con Microsoft',
        summary: 'Amazon Web Services anunció inversión masiva en infraestructura cloud e IA para 2024. La expansión incluye 50 nuevos centros de datos globalmente.',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
        category: 'tech',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['AMZN', 'MSFT'],
        url: 'https://bloomberg.com/amazon-aws-investment'
      }
    ];

    // Filtrar por categoría si se especifica
    let filteredNews = mockNews;
    if (category !== 'general') {
      filteredNews = mockNews.filter(news => news.category === category);
    }

    // Limitar resultados
    return filteredNews.slice(0, limit);
  }

  // ===================================================================
  // PUBLIC API METHODS
  // ===================================================================

  /**
   * Obtener noticias generales con caché
   * @param {string} category - Categoría de noticias ('general', 'stocks', 'crypto', etc.)
   * @param {number} limit - Número máximo de noticias
   * @returns {Array} Array de noticias
   */
  async getNews(category = 'general', limit = 20) {
    const cacheKey = this.getCacheKey(category);
    
    // Verificar caché
    if (this.isValidCache(cacheKey)) {
      console.log(`📰 News cache HIT for category: ${category}`);
      return this.getFromCache(cacheKey);
    }

    // Intentar obtener noticias reales con Perplexity
    if (process.env.PERPLEXITY_API_KEY && category !== 'mock') {
      try {
        console.log(`Buscando noticias reales de ${category} con Perplexity...`);
        
        let query = '';
        switch(category) {
          case 'market':
            query = 'stock market news today S&P 500 index Dow Jones Industrial NASDAQ composite trading volume financial markets Wall Street NYSE opening closing bell earnings reports';
            break;
          case 'watchlist':
            query = 'top stock gainers losers today biggest movers percentage change trading volume unusual options activity institutional buying selling hedge funds';
            break;
          case 'portfolio':
            query = 'Apple stock AAPL price news Microsoft MSFT earnings Tesla TSLA production Amazon AMZN revenue Google GOOGL Alphabet technology sector stocks analysis';
            break;
          case 'crypto':
            query = 'Bitcoin BTC price Ethereum ETH cryptocurrency market cap trading volume DeFi altcoins crypto exchange Binance Coinbase blockchain';
            break;
          default:
            query = category;
        }
        
        const perplexityNews = await searchFinancialNews(query, 15);
        
        if (perplexityNews && Array.isArray(perplexityNews) && perplexityNews.length > 0) {
          console.log(`Recibidas ${perplexityNews.length} noticias de Perplexity`);
          
          const formattedNews = perplexityNews.map((item, index) => ({
            id: `news_live_${Date.now()}_${index}`,
            headline: item.headline || item.título || 'Sin título',
            summary: item.summary || item.resumen || '',
            source: item.source || item.fuente || 'Financial Times',
            publishedAt: new Date().toISOString(),
            publishedDate: new Date().toLocaleDateString('es-ES'),
            sentiment: item.sentiment || 'neutral',
            relatedSymbols: item.relatedSymbols || item.símbolos || [],
            impact: item.sentiment === 'positive' ? 'high' : item.sentiment === 'negative' ? 'medium' : 'low',
            isLive: true,
            timeAgo: item.timeAgo && !item.timeAgo.includes('NaN') ? item.timeAgo : 'Hoy'
          }));
          
          this.setCache(cacheKey, formattedNews);
          return formattedNews;
        }
      } catch (error) {
        console.error('Error con Perplexity, usando datos mock:', error.message);
      }
    }

    console.log(`📰 News cache MISS for category: ${category}, fetching new data...`);
    
    try {
      // Por ahora usar mock data, aquí se integrará Perplexity API
      const news = this.getMockNews(category, limit);
      
      // Guardar en caché
      this.setCache(cacheKey, news);
      
      console.log(`📰 Fetched ${news.length} news articles for category: ${category}`);
      return news;
      
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Fallback a cache expirado si existe
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log('📰 Using expired cache as fallback');
        return cachedData;
      }
      
      // Último fallback: mock data limitado
      return this.getMockNews(category, Math.min(limit, 5));
    }
  }

  /**
   * Obtener noticias relacionadas con un símbolo específico
   * @param {string} symbol - Símbolo financiero (ej: 'AAPL', 'BTC-USD')
   * @param {number} limit - Número máximo de noticias
   * @returns {Array} Array de noticias relacionadas
   */
  async getNewsBySymbol(symbol, limit = 10) {
    const cacheKey = this.getCacheKey('symbol', symbol);
    
    // Verificar caché
    if (this.isValidCache(cacheKey)) {
      console.log(`📰 News cache HIT for symbol: ${symbol}`);
      return this.getFromCache(cacheKey);
    }

    console.log(`📰 News cache MISS for symbol: ${symbol}, fetching new data...`);
    
    try {
      // Filtrar noticias que mencionen el símbolo
      const allNews = this.getMockNews('general', 50);
      const symbolNews = allNews.filter(news => 
        news.relatedSymbols.includes(symbol) ||
        news.headline.toUpperCase().includes(symbol) ||
        news.summary.toUpperCase().includes(symbol)
      ).slice(0, limit);
      
      // Guardar en caché
      this.setCache(cacheKey, symbolNews);
      
      console.log(`📰 Found ${symbolNews.length} news articles for symbol: ${symbol}`);
      return symbolNews;
      
    } catch (error) {
      console.error(`Error fetching news for symbol ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Obtener noticias trending/más importantes
   * @param {number} limit - Número de noticias trending
   * @returns {Array} Array de noticias trending
   */
  async getTrendingNews(limit = 5) {
    const cacheKey = this.getCacheKey('trending');
    
    if (this.isValidCache(cacheKey)) {
      console.log('📰 Trending news cache HIT');
      return this.getFromCache(cacheKey);
    }

    try {
      // Seleccionar noticias de alto impacto de las últimas 24h
      const allNews = this.getMockNews('general', 20);
      const trendingNews = allNews
        .filter(news => news.impact === 'high')
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, limit);
      
      this.setCache(cacheKey, trendingNews);
      
      console.log(`📰 Found ${trendingNews.length} trending news articles`);
      return trendingNews;
      
    } catch (error) {
      console.error('Error fetching trending news:', error);
      return [];
    }
  }

  // ===================================================================
  // FUTURE: PERPLEXITY API INTEGRATION
  // ===================================================================

  /**
   * [PLACEHOLDER] Integración futura con Perplexity API
   * @param {string} query - Query de búsqueda
   * @param {string} category - Categoría de noticias
   * @returns {Array} Noticias de Perplexity API
   */
  async fetchFromPerplexityAPI(query, category = 'financial') {
    // TODO: Implementar cuando tengamos API key de Perplexity
    /*
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news aggregator. Return recent financial news in JSON format.'
          },
          {
            role: 'user',
            content: `Find recent financial news about ${query}. Return JSON array with headline, summary, source, publishedAt, sentiment, and relatedSymbols.`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });
    
    const data = await response.json();
    return this.parsePerplexityResponse(data);
    */
    
    console.log('🔮 Perplexity API not yet implemented, using mock data');
    return this.getMockNews(category, 10);
  }

  /**
   * [PLACEHOLDER] Parser para respuestas de Perplexity API
   * @param {Object} apiResponse - Respuesta de Perplexity
   * @returns {Array} Noticias parseadas
   */
  parsePerplexityResponse(apiResponse) {
    // TODO: Implementar parser cuando tengamos la API
    try {
      // const content = apiResponse.choices[0].message.content;
      // const newsArray = JSON.parse(content);
      // return newsArray.map(news => ({
      //   id: `perplexity_${Date.now()}_${Math.random()}`,
      //   ...news
      // }));
      
      return [];
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      return [];
    }
  }

  /**
   * Limpiar caché manualmente
   * @param {string} category - Categoría específica a limpiar, o null para limpiar todo
   */
  clearCache(category = null) {
    if (category) {
      const cacheKey = this.getCacheKey(category);
      this.cache.delete(cacheKey);
      console.log(`🗑️ Cache limpiado para categoría: ${category}`);
    } else {
      this.cache.clear();
      console.log(`🗑️ Todo el cache de noticias limpiado`);
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      cacheDuration: this.CACHE_DURATION
    };
  }

  /**
   * Obtener noticias para múltiples símbolos (Portfolio)
   * @param {Array} symbols - Array de símbolos
   * @param {number} limit - Número total de noticias
   * @returns {Array} Array de noticias
   */
  async getNewsBySymbols(symbols, limit = 15) {
    const cacheKey = this.getCacheKey('portfolio', symbols.join(','));
    
    if (this.isValidCache(cacheKey)) {
      console.log(`📰 Portfolio news cache HIT for symbols: ${symbols.join(',')}`);
      return this.getFromCache(cacheKey);
    }

    try {
      const allNews = this.getMockNews('general', 50);
      const portfolioNews = allNews.filter(news => 
        symbols.some(symbol => 
          news.relatedSymbols.includes(symbol) ||
          news.headline.toUpperCase().includes(symbol) ||
          news.summary.toUpperCase().includes(symbol)
        )
      ).slice(0, limit);
      
      // Si no hay suficientes noticias específicas, agregar noticias generales de mercado
      if (portfolioNews.length < 5) {
        const marketNews = allNews.filter(news => 
          news.category === 'market-outlook' || news.category === 'monetary-policy'
        ).slice(0, 5 - portfolioNews.length);
        portfolioNews.push(...marketNews);
      }
      
      this.setCache(cacheKey, portfolioNews);
      
      console.log(`📰 Found ${portfolioNews.length} portfolio news for symbols: ${symbols.join(',')}`);
      return portfolioNews;
      
    } catch (error) {
      console.error('Error fetching portfolio news:', error);
      return this.getMockNews('general', 5);
    }
  }

  /**
   * Obtener noticias específicas de criptomonedas
   * @param {number} limit - Número de noticias crypto
   * @returns {Array} Array de noticias crypto
   */
  async getCryptoNews(limit = 10) {
    const cacheKey = this.getCacheKey('crypto');
    
    if (this.isValidCache(cacheKey)) {
      console.log('📰 Crypto news cache HIT');
      return this.getFromCache(cacheKey);
    }

    try {
      // Obtener noticias de categoría crypto + mock adicional específico
      const cryptoNews = [
        ...this.getMockNews('crypto', 5),
        ...this.generateAdditionalCryptoNews()
      ].slice(0, limit);
      
      this.setCache(cacheKey, cryptoNews);
      
      console.log(`📰 Found ${cryptoNews.length} crypto news articles`);
      return cryptoNews;
      
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      return this.getMockNews('crypto', 3);
    }
  }

  /**
   * Generar noticias adicionales específicas de crypto
   * @returns {Array} Array de noticias crypto adicionales
   */
  generateAdditionalCryptoNews() {
    return [
      {
        id: 'crypto_additional_1',
        headline: 'Coinbase Expande Servicios Institucionales con Nuevo Custody',
        summary: 'Coinbase lanza solución avanzada de custodia institucional, atrayendo fondos de pensiones y family offices con $2.3B en nuevos depósitos.',
        source: 'CoinTelegraph',
        publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        category: 'crypto',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['COIN', 'BTC-USD'],
        url: 'https://cointelegraph.com/coinbase-custody'
      },
      {
        id: 'crypto_additional_2',
        headline: 'Solana Supera Transacciones de Ethereum por Tercer Mes Consecutivo',
        summary: 'La red Solana procesó 13.2M transacciones diarias vs 11.8M de Ethereum, consolidando su posición como blockchain de alta velocidad preferida.',
        source: 'DeFi Pulse',
        publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        category: 'crypto',
        sentiment: 'positive',
        impact: 'medium',
        relatedSymbols: ['SOL-USD', 'ETH-USD'],
        url: 'https://defipulse.com/solana-ethereum'
      }
    ];
  }
}

// Exportar instancia singleton
const newsService = new NewsService();

module.exports = {
  newsService,
  NewsService // Para testing si es necesario
}; 