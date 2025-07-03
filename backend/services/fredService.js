const axios = require('axios');
require('dotenv').config();
const twelveDataService = require('./twelveDataService');
const logger = require('../utils/logger');
const { macro } = require('./cacheService');

// Configuración de la API
const API_KEY = process.env.FRED_API_KEY;
const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// Series que necesitamos
const SERIES_IDS = {
  VIX: 'VIXCLS',
  YIELD_10Y: 'DGS10',
  YIELD_2Y: 'DGS2', 
  DXY: 'DTWEXM',
  // GOLD: Serie descontinuada, usar API alternativa
  OIL: 'DCOILWTICO'
};

/**
 * Obtener valor más reciente de una serie
 */
async function getSeriesValue(seriesId) {
  try {
    const cacheKey = `fred_${seriesId}`;
    
    // Usar el nuevo sistema de cache con getOrSet
    return await macro.getOrSet(cacheKey, async () => {
      logger.debug(`📦 FRED: Obteniendo ${seriesId} desde API`);
      
      const response = await axios.get(BASE_URL, {
        params: {
          series_id: seriesId,
          api_key: API_KEY,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        },
        timeout: 10000
      });

      const observations = response.data.observations;
      if (!observations || observations.length === 0) {
        throw new Error(`Sin datos para ${seriesId}`);
      }

      const latestValue = parseFloat(observations[0].value);
      const latestDate = observations[0].date;

      const result = {
        value: latestValue,
        date: latestDate
      };

      return result;
    });

  } catch (error) {
    logger.error(`❌ Error obteniendo FRED ${seriesId}:`, error.message);
    throw error;
  }
}

/**
 * Obtener todos los indicadores macro con contexto en español
 */
async function getMacroIndicators() {
  try {
    logger.info('📊 Obteniendo indicadores macro de FRED...');
    
    // Hacer todas las llamadas en paralelo
    const [vix, yield10Y, yield2Y, dxy, oil] = await Promise.allSettled([
      getSeriesValue(SERIES_IDS.VIX),
      getSeriesValue(SERIES_IDS.YIELD_10Y),
      getSeriesValue(SERIES_IDS.YIELD_2Y),
      getSeriesValue(SERIES_IDS.DXY),
      getSeriesValue(SERIES_IDS.OIL)
    ]);
    
    // Obtener precio del oro desde Twelve Data
    let goldValue = null;
    try {
      logger.info('📊 Obteniendo precio del oro (XAU/USD) desde Twelve Data...');
      const goldQuote = await twelveDataService.getQuote('XAU/USD');
      if (goldQuote && goldQuote.price) {
        goldValue = goldQuote.price;
        logger.info(`✅ Precio del oro: $${goldValue}/oz`);
      }
    } catch (error) {
      logger.error('❌ Error obteniendo precio del oro:', error.message);
    }

    // Calcular spread de yields
    const yieldSpread = yield10Y.status === 'fulfilled' && yield2Y.status === 'fulfilled' 
      ? yield10Y.value.value - yield2Y.value.value 
      : null;

    // Interpretación en español
    const interpretacion = {
      vix: interpretarVIX(vix.status === 'fulfilled' ? vix.value.value : null),
      curvaRendimiento: interpretarCurva(yieldSpread),
      dolar: interpretarDolar(dxy.status === 'fulfilled' ? dxy.value.value : null),
      commodities: interpretarCommodities(
        goldValue,
        oil.status === 'fulfilled' ? oil.value.value : null
      )
    };

    // Formatear respuesta
    return {
      indicadores: {
        vix: {
          valor: vix.status === 'fulfilled' ? vix.value.value : null,
          interpretacion: interpretacion.vix
        },
        rendimientos: {
          bonos10A: yield10Y.status === 'fulfilled' ? yield10Y.value.value : null,
          bonos2A: yield2Y.status === 'fulfilled' ? yield2Y.value.value : null,
          spread: yieldSpread,
          interpretacion: interpretacion.curvaRendimiento
        },
        dolar: {
          indice: dxy.status === 'fulfilled' ? dxy.value.value : null,
          interpretacion: interpretacion.dolar
        },
        oro: {
          precio: goldValue,
          unidad: 'USD/onza'
        },
        petroleo: {
          precio: oil.status === 'fulfilled' ? oil.value.value : null,
          unidad: 'USD/barril'
        }
      },
      resumen: generarResumenMercado(interpretacion),
      ultimaActualizacion: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ Error obteniendo indicadores macro:', error);
    throw error;
  }
}

/**
 * Interpretar valor del VIX en español
 */
function interpretarVIX(valor) {
  if (!valor) return "Sin datos";
  
  if (valor < 12) return "Extrema complacencia (muy bajo)";
  if (valor < 20) return "Mercado tranquilo";
  if (valor < 30) return "Volatilidad elevada";
  if (valor < 40) return "Miedo significativo";
  return "Pánico extremo en el mercado";
}

/**
 * Interpretar curva de rendimientos
 */
function interpretarCurva(spread) {
  if (spread === null) return "Sin datos";
  
  if (spread < -0.5) return "Inversión fuerte - alta probabilidad de recesión";
  if (spread < 0) return "Curva invertida - señal de alerta";
  if (spread < 0.5) return "Curva plana - desaceleración económica";
  if (spread < 1.5) return "Curva normal - economía estable";
  return "Curva empinada - expectativas de crecimiento";
}

/**
 * Interpretar índice del dólar
 */
function interpretarDolar(valor) {
  if (!valor) return "Sin datos";
  
  if (valor < 85) return "Dólar muy débil";
  if (valor < 90) return "Dólar débil";
  if (valor < 100) return "Dólar en rango normal";
  if (valor < 105) return "Dólar fuerte";
  return "Dólar muy fuerte";
}

/**
 * Interpretar commodities
 */
function interpretarCommodities(oro, petroleo) {
  let mensaje = "";
  
  if (oro) {
    if (oro > 3000) mensaje += "Oro en máximos históricos (fuerte demanda de refugio). ";
    else if (oro > 2500) mensaje += "Oro muy alto (incertidumbre elevada). ";
    else if (oro > 2000) mensaje += "Oro en niveles altos (refugio seguro activo). ";
    else if (oro < 1800) mensaje += "Oro en niveles bajos (apetito por riesgo). ";
    else mensaje += "Oro en rango normal. ";
  }
  
  if (petroleo) {
    if (petroleo > 90) mensaje += "Petróleo caro (presión inflacionaria).";
    else if (petroleo < 60) mensaje += "Petróleo barato (demanda débil).";
    else mensaje += "Petróleo en rango normal.";
  }
  
  return mensaje || "Sin datos de commodities";
}

/**
 * Generar resumen del mercado en español
 */
function generarResumenMercado(interpretacion) {
  const partes = [];
  
  if (interpretacion.vix.includes("tranquilo")) {
    partes.push("El mercado está relativamente calmado");
  } else if (interpretacion.vix.includes("Miedo") || interpretacion.vix.includes("Pánico")) {
    partes.push("Hay nerviosismo en los mercados");
  }
  
  if (interpretacion.curvaRendimiento.includes("invertida")) {
    partes.push("la curva de rendimientos sugiere riesgo de recesión");
  }
  
  if (interpretacion.dolar.includes("fuerte")) {
    partes.push("el dólar está fortalecido");
  }
  
  return partes.join(", ") + ".";
}

/**
 * Obtener contexto para el agente IA
 */
async function getContextoParaIA() {
  try {
    const datos = await getMacroIndicators();
    
    // Formatear para inyectar en el prompt del agente
    return `
CONTEXTO MACROECONÓMICO:
- VIX (Volatilidad): ${datos.indicadores.vix.valor?.toFixed(2) || 'N/A'} - ${datos.indicadores.vix.interpretacion}
- Bonos 10 años: ${datos.indicadores.rendimientos.bonos10A?.toFixed(2) || 'N/A'}%
- Spread de yields: ${datos.indicadores.rendimientos.spread?.toFixed(2) || 'N/A'}% - ${datos.indicadores.rendimientos.interpretacion}
- Índice Dólar: ${datos.indicadores.dolar.indice?.toFixed(2) || 'N/A'} - ${datos.indicadores.dolar.interpretacion}
- Oro: $${datos.indicadores.oro.precio?.toFixed(2) || 'N/A'}/oz
- Petróleo WTI: $${datos.indicadores.petroleo.precio?.toFixed(2) || 'N/A'}/barril

RESUMEN: ${datos.resumen}`;

  } catch (error) {
    logger.error('Error obteniendo contexto macro:', error);
    return 'CONTEXTO MACRO: No disponible en este momento';
  }
}

// Exportar funciones
module.exports = {
  getMacroIndicators,
  getContextoParaIA,
  getSeriesValue
}; 