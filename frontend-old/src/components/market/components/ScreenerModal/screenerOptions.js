// Lista de screeners disponibles
export const SCREENER_OPTIONS = [
  { 
    id: 'most_actives',
    name: 'Más Activos',
    description: 'Acciones con mayor volumen de trading',
    symbol: 'AAPL' // Demo symbol por ahora
  },
  { 
    id: 'gainers',
    name: 'Mayores Ganancias',
    description: 'Acciones con mayor % de subida hoy',
    symbol: 'NVDA' // Demo symbol
  },
  { 
    id: 'losers',
    name: 'Mayores Pérdidas',
    description: 'Acciones con mayor % de bajada hoy',
    symbol: 'META' // Demo symbol
  },
  { 
    id: 'trending',
    name: 'Tendencias',
    description: 'Acciones más buscadas y comentadas',
    symbol: 'TSLA' // Demo symbol
  },
  { 
    id: 'tech_leaders',
    name: 'Líderes Tecnológicos',
    description: 'Principales empresas del sector tech',
    symbol: 'MSFT' // Demo symbol
  },
  { 
    id: 'energy_stocks',
    name: 'Sector Energía',
    description: 'Principales acciones del sector energético',
    symbol: 'XOM' // Demo symbol
  },
  { 
    id: 'dividend_aristocrats',
    name: 'Aristócratas del Dividendo',
    description: 'Empresas con historial sólido de dividendos',
    symbol: 'JNJ' // Demo symbol
  },
  { 
    id: 'small_cap',
    name: 'Small Cap',
    description: 'Empresas de pequeña capitalización con potencial',
    symbol: 'ROKU' // Demo symbol
  }
]; 