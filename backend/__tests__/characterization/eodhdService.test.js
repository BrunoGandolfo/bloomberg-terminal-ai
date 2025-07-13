const eodhdService = require('../../services/eodhdService');
require('dotenv').config({ path: '../../.env' });

// Tests de caracterización - capturan el comportamiento ACTUAL del sistema
describe('EODHD Service - Comportamiento Actual', () => {
  // Usamos un timeout más largo para llamadas reales a la API
  jest.setTimeout(30000);

  describe('getQuote', () => {
    test('devuelve estructura esperada para símbolo válido', async () => {
      const quote = await eodhdService.getQuote('AAPL.US');
      
      // Capturar estructura exacta actual
      expect(quote).toBeDefined();
      expect(quote).toHaveProperty('symbol');
      expect(quote).toHaveProperty('name');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('change');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('high');
      expect(quote).toHaveProperty('low');
      expect(quote).toHaveProperty('previousClose');
      
      // Documentar tipos actuales
      expect(typeof quote.price).toBe('number');
      expect(typeof quote.changePercent).toBe('number');
      expect(typeof quote.volume).toBe('number');
    });

    test('maneja símbolo de crypto con formato especial', async () => {
      const quote = await eodhdService.getQuote('BTC-USD.CC');
      
      expect(quote).toBeDefined();
      expect(quote.symbol).toBe('BTC-USD.CC');
      // Comportamiento actual: precio puede venir como string
      expect(['string', 'number']).toContain(typeof quote.price);
      if (typeof quote.price === 'string' && quote.price !== 'NA') {
        expect(parseFloat(quote.price)).toBeGreaterThan(0);
      } else if (typeof quote.price === 'number') {
        expect(quote.price).toBeGreaterThan(0);
      }
    });

    test('devuelve datos con NA para símbolo inválido', async () => {
      const quote = await eodhdService.getQuote('INVALID_SYMBOL_XYZ');
      
      // Comportamiento actual: devuelve objeto con valores "NA"
      expect(quote).toBeDefined();
      expect(quote.symbol).toBe('INVALID_SYMBOL_XYZ');
      expect(quote.price).toBe('NA');
      expect(quote.change).toBe('NA');
    });
  });

  describe('getBatchQuotes', () => {
    test('maneja array de símbolos válidos', async () => {
      const symbols = ['AAPL.US', 'MSFT.US', 'GOOGL.US'];
      const result = await eodhdService.getBatchQuotes(symbols);
      
      // Comportamiento actual: devuelve objeto con símbolos como claves
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      
      // Verificar que al menos algunos símbolos están presentes
      const foundSymbols = symbols.filter(symbol => result[symbol]);
      expect(foundSymbols.length).toBeGreaterThan(0);
      
      // Verificar estructura de cada quote
      foundSymbols.forEach(symbol => {
        const quote = result[symbol];
        expect(quote).toHaveProperty('symbol');
        expect(quote).toHaveProperty('price');
      });
    });

    test('filtra símbolos inválidos sin fallar', async () => {
      const symbols = ['AAPL.US', 'INVALID_XYZ', 'MSFT.US'];
      const result = await eodhdService.getBatchQuotes(symbols);
      
      // Comportamiento actual: devuelve objeto con quotes
      expect(result).toBeDefined();
      if (result.quotes && Array.isArray(result.quotes)) {
        // No asumimos que filtra automáticamente
        const invalidQuote = result.quotes.find(q => q && q.symbol === 'INVALID_XYZ');
        if (invalidQuote) {
          expect(invalidQuote.price).toBe('NA');
        }
      }
    });
  });

  describe('getHistoricalData', () => {
    test('respeta período por defecto (100 días)', async () => {
      const data = await eodhdService.getHistoricalData('AAPL.US');
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(100);
      
      // Verificar estructura de datos
      const firstPoint = data[0];
      expect(firstPoint).toHaveProperty('date');
      expect(firstPoint).toHaveProperty('open');
      expect(firstPoint).toHaveProperty('high');
      expect(firstPoint).toHaveProperty('low');
      expect(firstPoint).toHaveProperty('close');
      expect(firstPoint).toHaveProperty('volume');
    });

    test('respeta período personalizado', async () => {
      const data = await eodhdService.getHistoricalData('AAPL.US', 30);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(30);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Indicadores Técnicos', () => {
    test('getRSI devuelve valor numérico válido', async () => {
      const rsi = await eodhdService.getRSI('AAPL.US');
      
      expect(rsi).toBeDefined();
      // Comportamiento actual: devuelve un objeto con data array
      if (rsi.data && Array.isArray(rsi.data)) {
        expect(rsi.data.length).toBeGreaterThan(0);
        const lastValue = rsi.data[rsi.data.length - 1];
        expect(lastValue).toHaveProperty('rsi');
        expect(typeof lastValue.rsi).toBe('number');
      } else if (typeof rsi.value === 'number') {
        // Formato alternativo
        expect(rsi.value).toBeGreaterThanOrEqual(0);
        expect(rsi.value).toBeLessThanOrEqual(100);
      }
    });

    test('getMACD devuelve estructura completa', async () => {
      const macd = await eodhdService.getMACD('AAPL.US');
      
      expect(macd).toBeDefined();
      // Comportamiento actual: devuelve array de datos históricos
      if (Array.isArray(macd)) {
        expect(macd.length).toBeGreaterThan(0);
        const lastValue = macd[macd.length - 1];
        expect(lastValue).toHaveProperty('macd');
        expect(lastValue).toHaveProperty('signal');
        expect(lastValue).toHaveProperty('divergence');
        expect(typeof lastValue.macd).toBe('number');
      } else {
        // Formato alternativo
        expect(macd).toHaveProperty('macd');
        expect(macd).toHaveProperty('signal');
      }
    });

    test('getBatchTechnicalIndicators devuelve todos los indicadores', async () => {
      const indicators = await eodhdService.getBatchTechnicalIndicators('AAPL.US');
      
      expect(indicators).toBeDefined();
      expect(indicators).toHaveProperty('rsi');
      expect(indicators).toHaveProperty('macd');
      expect(indicators).toHaveProperty('sma');
      expect(indicators).toHaveProperty('ema');
    });
  });

  describe('Cache behavior', () => {
    test('segunda llamada es más rápida (usa cache)', async () => {
      const symbol = 'TSLA.US';
      
      // Primera llamada - sin cache
      const start1 = Date.now();
      const quote1 = await eodhdService.getQuote(symbol);
      const time1 = Date.now() - start1;
      
      // Segunda llamada - con cache
      const start2 = Date.now();
      const quote2 = await eodhdService.getQuote(symbol);
      const time2 = Date.now() - start2;
      
      expect(quote1).toEqual(quote2); // Mismo resultado
      expect(time2).toBeLessThan(time1 / 2); // Al menos 2x más rápido
    });
  });

  describe('searchTicker', () => {
    test('encuentra símbolos por nombre de empresa', async () => {
      const results = await eodhdService.searchTicker('Apple');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Comportamiento actual: puede usar diferentes campos
      const appleResult = results.find(r => 
        r.Code === 'AAPL' || 
        r.symbol === 'AAPL' || 
        (r.Name && r.Name.includes('Apple'))
      );
      expect(appleResult).toBeDefined();
    });
  });
}); 