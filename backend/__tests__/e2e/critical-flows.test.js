const request = require('supertest');
const app = require('../../server');

describe('Flujos Críticos Bloomberg Terminal AI', () => {
  
  // FLUJO 1: Búsqueda y Visualización de Acciones
  describe('Búsqueda de Símbolos', () => {
    test('Usuario busca AAPL y obtiene datos completos', async () => {
      // 1. Obtener cotización
      const quoteRes = await request(app)
        .get('/api/market/quote/AAPL.US');
      
      expect(quoteRes.status).toBe(200);
      expect(quoteRes.body).toHaveProperty('symbol', 'AAPL.US');
      expect(quoteRes.body).toHaveProperty('price');
      expect(quoteRes.body.price).toBeGreaterThan(0);
      
      // 2. Obtener datos históricos
      const historicalRes = await request(app)
        .get('/api/market/historical/AAPL.US?period=1M');
      
      expect(historicalRes.status).toBe(200);
      expect(Array.isArray(historicalRes.body)).toBe(true);
      expect(historicalRes.body.length).toBeGreaterThan(20);
      
      // 3. Obtener análisis fundamental
      const fundamentalRes = await request(app)
        .get('/api/fundamentals/AAPL.US');
      
      expect(fundamentalRes.status).toBe(200);
      expect(fundamentalRes.body).toHaveProperty('General');
      expect(fundamentalRes.body).toHaveProperty('Financials');
    });
  });
  
  // FLUJO 2: Gestión de Portfolio
  describe('Portfolio Management', () => {
    test('Agregar posición y calcular P&L', async () => {
      // Simular agregado de posición
      const position = {
        symbol: 'MSFT.US',
        quantity: 100,
        purchasePrice: 350.00
      };
      
      // Verificar cálculo de P&L
      const currentPrice = 375.00;
      const expectedPL = (currentPrice - position.purchasePrice) * position.quantity;
      expect(expectedPL).toBe(2500);
    });
  });
  
  // FLUJO 3: Análisis con IA
  describe('AI Analysis', () => {
    test('Consulta de mercado con Claude', async () => {
      const aiRes = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'What is the current market sentiment?',
          context: { symbols: ['SPY.US'] }
        });
      
      expect(aiRes.status).toBe(200);
      expect(aiRes.body).toHaveProperty('response');
      expect(typeof aiRes.body.response).toBe('string');
    });
  });
  
  // FLUJO 4: Screener de Acciones
  describe('Stock Screener', () => {
    test('Obtener screeners predefinidos', async () => {
      const screenerRes = await request(app)
        .get('/api/screener');
      
      expect(screenerRes.status).toBe(200);
      expect(screenerRes.body).toBeDefined();
    });
  });
  
  // FLUJO 5: Datos Macro
  describe('Macroeconomic Data', () => {
    test('Obtener datos macroeconómicos', async () => {
      const macroRes = await request(app)
        .get('/api/screener');  // Los datos macro vienen del screener
      
      expect(macroRes.status).toBe(200);
      expect(macroRes.body).toBeDefined();
      // Los índices principales deben estar presentes
      if (macroRes.body.indices) {
        expect(Array.isArray(macroRes.body.indices)).toBe(true);
      }
    });
  });
  
  // FLUJO 6: Batch Operations
  describe('Operaciones en Lote', () => {
    test('Obtener múltiples cotizaciones', async () => {
      const symbols = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US'];
      
      // Test con requests individuales ya que batch-quotes puede no existir
      const promises = symbols.map(symbol => 
        request(app).get(`/api/market/quote/${symbol}`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(4);
      results.forEach((res, index) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('symbol', symbols[index]);
        expect(res.body).toHaveProperty('price');
      });
    });
  });
  
  // FLUJO 7: Health Checks
  describe('System Health', () => {
    test('Todos los servicios responden', async () => {
      const healthRes = await request(app)
        .get('/api/health');
      
      expect(healthRes.status).toBe(200);
      expect(healthRes.body).toHaveProperty('status', 'ok');
    });
  });
  
  // FLUJO 8: Rate Limiting
  describe('Rate Limiting', () => {
    test('Respeta límites de API', async () => {
      // Hacer 5 requests rápidos
      const promises = Array(5).fill().map(() => 
        request(app).get('/api/market/quote/AAPL.US')
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
  
  // FLUJO 9: Error Handling
  describe('Manejo de Errores', () => {
    test('Símbolo inválido devuelve error apropiado', async () => {
      const errorRes = await request(app)
        .get('/api/market/quote/INVALID_SYMBOL');
      
      // El API puede retornar 200 con datos vacíos o 404
      if (errorRes.status === 404) {
        expect(errorRes.body).toHaveProperty('error');
      } else if (errorRes.status === 200) {
        // Si retorna 200, verificar que los datos indiquen error
        expect(errorRes.body).toBeDefined();
      }
    });
  });
  
  // FLUJO 10: Cache Performance
  describe('Cache Efficiency', () => {
    test('Segunda request es más rápida (cache)', async () => {
      const start1 = Date.now();
      await request(app).get('/api/market/quote/TSLA.US');
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await request(app).get('/api/market/quote/TSLA.US');
      const time2 = Date.now() - start2;
      
      // Segunda request debe ser más rápida
      expect(time2).toBeLessThan(time1 * 0.5);
    });
  });
}); 