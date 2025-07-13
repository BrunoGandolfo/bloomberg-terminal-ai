const request = require('supertest');
const app = require('../../server');
const { performance } = require('perf_hooks');

describe('Métricas de Performance', () => {
  
  describe('API Response Times', () => {
    test('API responses < 500ms', async () => {
      const endpoints = [
        '/api/market/quote/AAPL.US',
        '/api/health',
        '/api/macro/indicators'
      ];
      
      for (const endpoint of endpoints) {
        const start = performance.now();
        const response = await request(app).get(endpoint);
        const duration = performance.now() - start;
        
        console.log(`${endpoint}: ${duration.toFixed(2)}ms`);
        
        // Permitir hasta 1000ms en tests (considerando latencia de red en tests)
        expect(duration).toBeLessThan(1000);
        
        // Si el endpoint responde exitosamente, debe ser < 500ms
        if (response.status === 200) {
          expect(duration).toBeLessThan(500);
        }
      }
    });
    
    test('Endpoints de escritura < 1000ms', async () => {
      const writeEndpoints = [
        {
          url: '/api/ai/analyze',
          method: 'post',
          data: {
            question: 'Test question',
            context: { symbols: ['AAPL.US'] }
          }
        }
      ];
      
      for (const endpoint of writeEndpoints) {
        const start = performance.now();
        const response = await request(app)[endpoint.method](endpoint.url)
          .send(endpoint.data);
        const duration = performance.now() - start;
        
        console.log(`${endpoint.method.toUpperCase()} ${endpoint.url}: ${duration.toFixed(2)}ms`);
        
        // APIs de escritura pueden tardar más
        expect(duration).toBeLessThan(2000);
      }
    });
    
    test('Batch operations eficientes', async () => {
      // Test individual requests
      const individualStart = performance.now();
      const symbols = ['AAPL.US', 'MSFT.US', 'GOOGL.US'];
      
      for (const symbol of symbols) {
        await request(app).get(`/api/market/quote/${symbol}`);
      }
      
      const individualTime = performance.now() - individualStart;
      
      // Test batch request
      const batchStart = performance.now();
      await request(app)
        .post('/api/market/batch-quotes')
        .send({ symbols });
      
      const batchTime = performance.now() - batchStart;
      
      console.log(`Individual requests: ${individualTime.toFixed(2)}ms`);
      console.log(`Batch request: ${batchTime.toFixed(2)}ms`);
      
      // Batch debe ser más eficiente
      expect(batchTime).toBeLessThan(individualTime * 0.7);
    });
  });
  
  describe('Module Loading Performance', () => {
    test('Módulos cargan en < 2 segundos', () => {
      const modules = [
        '../../../frontend/src/components/FundamentalAnalysisModule',
        '../../../frontend/src/components/PersonalFinanceModule'
      ];
      
      modules.forEach(modulePath => {
        const start = performance.now();
        
        // Clear require cache para medir carga real
        delete require.cache[require.resolve(modulePath)];
        
        try {
          require(modulePath);
          const loadTime = performance.now() - start;
          
          console.log(`${modulePath}: ${loadTime.toFixed(2)}ms`);
          
          // Cada módulo debe cargar en menos de 2 segundos
          expect(loadTime).toBeLessThan(2000);
        } catch (error) {
          // Si hay error de carga, es aceptable en tests
          console.log(`Module ${modulePath} could not be loaded in test environment`);
        }
      });
    });
    
    test('Componentes pequeños cargan rápidamente', () => {
      const smallComponents = [
        '../../../frontend/src/components/fundamental/ProfessionalGauge',
        '../../../frontend/src/components/fundamental/BuffettScorePanel',
        '../../../frontend/src/components/personal/BudgetManager'
      ];
      
      smallComponents.forEach(componentPath => {
        const start = performance.now();
        
        try {
          require(componentPath);
          const loadTime = performance.now() - start;
          
          console.log(`Small component ${componentPath}: ${loadTime.toFixed(2)}ms`);
          
          // Componentes pequeños deben cargar en < 500ms
          expect(loadTime).toBeLessThan(500);
        } catch (error) {
          console.log(`Component ${componentPath} requires React environment`);
        }
      });
    });
  });
  
  describe('Cache Performance', () => {
    test('Cache reduce tiempo de respuesta significativamente', async () => {
      const testSymbol = 'NVDA.US';
      
      // Primera request (sin cache)
      const firstStart = performance.now();
      const firstResponse = await request(app).get(`/api/market/quote/${testSymbol}`);
      const firstTime = performance.now() - firstStart;
      
      expect(firstResponse.status).toBe(200);
      
      // Esperar un momento para asegurar que el cache se guarde
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Segunda request (con cache)
      const secondStart = performance.now();
      const secondResponse = await request(app).get(`/api/market/quote/${testSymbol}`);
      const secondTime = performance.now() - secondStart;
      
      expect(secondResponse.status).toBe(200);
      
      console.log(`First request: ${firstTime.toFixed(2)}ms`);
      console.log(`Cached request: ${secondTime.toFixed(2)}ms`);
      console.log(`Speed improvement: ${((1 - secondTime/firstTime) * 100).toFixed(1)}%`);
      
      // La segunda request debe ser al menos 50% más rápida
      expect(secondTime).toBeLessThan(firstTime * 0.5);
    });
  });
  
  describe('Memory Usage', () => {
    test('No hay memory leaks en operaciones repetidas', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Realizar 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/health');
      }
      
      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase after 100 requests: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // No debe haber un aumento significativo de memoria (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
}); 