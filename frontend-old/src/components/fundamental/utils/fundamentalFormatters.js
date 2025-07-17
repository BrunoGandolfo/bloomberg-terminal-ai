// Funciones de utilidad para análisis fundamental

export const getScoreColor = (score) => {
  if (score >= 80) return '#00FF00';
  if (score >= 60) return '#FFFF00';
  if (score >= 40) return '#FFA500';
  return '#FF0000';
};

export const getGrade = (score) => {
  if (score >= 80) return 'A - EXCELENTE';
  if (score >= 60) return 'B - BUENA';
  if (score >= 40) return 'C - REGULAR';
  return 'D - EVITAR';
};

// Datos de las métricas de Buffett con explicaciones
export const buffettMetrics = [
  {
    key: 'ROE',
    name: 'Return on Equity (ROE)',
    description: 'Retorno sobre Patrimonio',
    threshold: '>15%',
    explanation: 'Mide qué tan bien usa la compañía el dinero de los accionistas para generar ganancias. Buffett busca compañías que generen consistentemente >15% anual.',
    why: 'Una compañía con alto ROE significa que es muy eficiente convirtiendo la inversión de accionistas en ganancias.'
  },
  {
    key: 'ROA',
    name: 'Return on Assets (ROA)',
    description: 'Retorno sobre Activos',
    threshold: '>5%',
    explanation: 'Indica qué tan eficientemente la compañía usa TODOS sus activos para generar ganancias. Incluye deuda y patrimonio.',
    why: 'Compañías con alto ROA son expertas en generar ganancias sin necesidad de muchos activos o deuda excesiva.'
  },
  {
    key: 'P_E_ratio',
    name: 'Price to Earnings (P/E)',
    description: 'Precio sobre Ganancias',
    threshold: '<25',
    explanation: 'Cuánto pagas por cada $1 de ganancia anual. Un P/E de 20 significa que pagas $20 por cada $1 que gana la compañía.',
    why: 'Buffett evita compañías sobrevaloradas. Un P/E bajo sugiere que puedes comprar ganancias futuras a precio razonable.'
  },
  {
    key: 'debt_to_equity_ratio',
    name: 'Debt to Equity Ratio',
    description: 'Ratio Deuda/Patrimonio',
    threshold: '<0.5',
    explanation: 'Cuánta deuda tiene la compañía vs su patrimonio. 0.5 significa 50 cents de deuda por cada $1 de patrimonio.',
    why: 'Compañías muy endeudadas son riesgosas. Buffett prefiere compañías conservadoras que no dependan de deuda para crecer.'
  },
  {
    key: 'profit_margin',
    name: 'Profit Margin',
    description: 'Margen de Ganancia',
    threshold: '>15%',
    explanation: 'Qué porcentaje de cada venta se convierte en ganancia neta. 20% significa que de cada $100 vendidos, $20 son ganancia.',
    why: 'Márgenes altos indican que la compañía tiene ventajas competitivas y puede controlar costos efectivamente.'
  },
  {
    key: 'operating_margin',
    name: 'Operating Margin',
    description: 'Margen Operativo',
    threshold: '>20%',
    explanation: 'Ganancia operativa como % de ventas, antes de intereses e impuestos. Mide eficiencia operativa pura.',
    why: 'Buffett busca compañías que operen eficientemente. Alto margen operativo = excelente control de costos.'
  }
];

export const parsePerplexityResponse = (perplexityData) => {
  if (!perplexityData || !perplexityData.choices || !perplexityData.choices[0]) {
    return null;
  }
  
  try {
    const content = perplexityData.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Si no encuentra JSON, intentar parsear directamente
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing Perplexity response:', error);
    return null;
  }
};

export const formatValue = (value, defaultValue = '-') => {
  if (!value || 
      value === 'N/A' || 
      value === 'No disponible' || 
      value === 'Not available' ||
      value === 'Not available in search results' ||
      (typeof value === 'string' && value.includes('No disponible')) ||
      (typeof value === 'string' && value.includes('Not available')) ||
      (typeof value === 'string' && value.includes('Not provided')) ||
      (typeof value === 'string' && value.includes('search results'))) {
    return defaultValue;
  }
  return value;
};

export const getMetricColor = (key, value, styles) => {
  const numValue = parseFloat(value);

  switch(key) {
    case 'ROE':
      return numValue >= 15 ? styles.excellent : styles.poor;
    case 'ROA':
      return numValue >= 5 ? styles.excellent : styles.poor;
    case 'P_E_ratio':
      return numValue <= 25 ? styles.excellent : styles.poor;
    case 'debt_to_equity_ratio':
      return numValue <= 0.5 ? styles.excellent : styles.poor;
    case 'profit_margin':
      return numValue >= 15 ? styles.excellent : styles.poor;
    case 'operating_margin':
      return numValue >= 20 ? styles.excellent : styles.poor;
    default:
      return { color: '#FF8800' };
  }
};

export const getMetricStatus = (key, value) => {
  const numValue = parseFloat(value);

  switch(key) {
    case 'ROE':
      return numValue >= 15 ? '✓ EXCELENTE' : '✗ BAJO';
    case 'ROA':
      return numValue >= 5 ? '✓ EXCELENTE' : '✗ BAJO';
    case 'P_E_ratio':
      return numValue <= 25 ? '✓ RAZONABLE' : '✗ ALTO';
    case 'debt_to_equity_ratio':
      return numValue <= 0.5 ? '✓ CONSERVADOR' : '✗ ALTO RIESGO';
    case 'profit_margin':
      return numValue >= 15 ? '✓ EXCELENTE' : '✗ BAJO';
    case 'operating_margin':
      return numValue >= 20 ? '✓ EXCELENTE' : '✗ BAJO';
    default:
      return '';
  }
}; 