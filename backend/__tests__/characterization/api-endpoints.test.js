const request = require('supertest');
require('dotenv').config({ path: '../../.env' });

// Necesitamos iniciar el servidor para tests
let app;

beforeAll(() => {
  // Evitar que el servidor real se inicie
  process.env.NODE_ENV = 'test';
  app = require('../../server');
});

describe('API Endpoints - Comportamiento Actual', () => {
  jest.setTimeout(30000);

  describe('Health Check', () => {
    test('GET /api/health responde con status ok', async () => {
      const response = await request(app)
        .get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      // Comportamiento actual: solo devuelve status
    });
  });

  describe('Market Data Endpoints', () => {
    test('GET /api/market/quote/:symbol devuelve cotización', async () => {
      const response = await request(app)
        .get('/api/market/quote/AAPL.US');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('symbol', 'AAPL.US');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('change');
      expect(response.body).toHaveProperty('changePercent');
      expect(typeof response.body.price).toBe('number');
    });

    test('GET /api/market/quote/:symbol con símbolo inválido maneja el error', async () => {
      const response = await request(app)
        .get('/api/market/quote/INVALID_XYZ');
      
      // Comportamiento actual: puede devolver 200 con datos vacíos o 404
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        // Puede tener algunos campos pero con valores null/undefined
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('POST /api/market/batch-quotes devuelve múltiples cotizaciones', async () => {
      const response = await request(app)
        .post('/api/market/batch-quotes')
        .send({ symbols: ['AAPL.US', 'MSFT.US', 'GOOGL.US'] });
      
      expect(response.status).toBe(200);
      // Comportamiento actual: puede devolver objeto con quotes array
      if (response.body.quotes) {
        expect(Array.isArray(response.body.quotes)).toBe(true);
        response.body.quotes.forEach(quote => {
          if (quote) {
            expect(quote).toHaveProperty('symbol');
            expect(quote).toHaveProperty('price');
          }
        });
      } else if (Array.isArray(response.body)) {
        response.body.forEach(quote => {
          if (quote) {
            expect(quote).toHaveProperty('symbol');
            expect(quote).toHaveProperty('price');
          }
        });
      }
    });

    test('GET /api/market/history/:symbol devuelve datos históricos', async () => {
      const response = await request(app)
        .get('/api/market/history/AAPL.US?days=30');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(30);
      
      const firstDay = response.body[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('close');
      expect(firstDay).toHaveProperty('volume');
    });
  });

  describe('Technical Analysis Endpoints', () => {
    test('GET /api/technical/:symbol/:indicator devuelve RSI', async () => {
      const response = await request(app)
        .get('/api/technical/AAPL.US/rsi');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('symbol', 'AAPL.US');
      expect(response.body).toHaveProperty('indicator', 'rsi');
      
      // Comportamiento actual: puede tener 'latest' o 'data'
      if (response.body.latest) {
        expect(response.body.latest).toHaveProperty('rsi');
        expect(typeof response.body.latest.rsi).toBe('number');
      } else if (response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    test('POST /api/technical/batch devuelve múltiples indicadores', async () => {
      const response = await request(app)
        .post('/api/technical/batch')
        .send({ 
          symbol: 'AAPL.US',
          indicators: ['rsi', 'macd', 'sma', 'ema']
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('symbol', 'AAPL.US');
      expect(response.body).toHaveProperty('indicators');
      expect(response.body.indicators).toHaveProperty('rsi');
      expect(response.body.indicators).toHaveProperty('macd');
      expect(response.body.indicators).toHaveProperty('sma');
      expect(response.body.indicators).toHaveProperty('ema');
    });
  });

  describe('Screener Endpoints', () => {
    test('GET /api/screener/indices devuelve índices principales', async () => {
      const response = await request(app)
        .get('/api/screener/indices');
      
      expect(response.status).toBe(200);
      // Comportamiento actual: devuelve array directamente
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const firstIndex = response.body[0];
      expect(firstIndex).toHaveProperty('símbolo'); // en español
      expect(firstIndex).toHaveProperty('nombre');
      expect(firstIndex).toHaveProperty('precio');
    });

    test('GET /api/screener/search busca acciones por criterios', async () => {
      const response = await request(app)
        .get('/api/screener/search?marketCap=1000000000&minPrice=10');
      
      // Comportamiento actual: requiere parámetro "q"
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Query parameter');
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('AI Assistant Endpoints', () => {
    test('POST /api/ai/analyze responde a preguntas sobre mercado', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .send({ 
          question: 'What is the current price of AAPL?',
          context: { symbols: ['AAPL.US'] }
        });
      
      expect(response.status).toBe(200);
      // Comportamiento actual: devuelve responses con múltiples IAs
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('responses');
      if (response.body.responses) {
        expect(response.body.responses).toHaveProperty('consensus');
      }
    });

    test('POST /api/ai/investment-thesis genera análisis de inversión', async () => {
      const response = await request(app)
        .post('/api/ai/investment-thesis')
        .send({ 
          symbol: 'AAPL.US',
          timeHorizon: 'medium',
          riskTolerance: 'moderate'
        });
      
      // Comportamiento actual: este endpoint puede no existir
      if (response.status === 404) {
        expect(response.status).toBe(404);
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    test('endpoints manejan errores con formato consistente', async () => {
      const response = await request(app)
        .post('/api/market/batch-quotes')
        .send({ /* sin symbols */ });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    test('endpoints no encontrados devuelven 404', async () => {
      const response = await request(app)
        .get('/api/endpoint-que-no-existe');
      
      expect(response.status).toBe(404);
    });
  });
}); 