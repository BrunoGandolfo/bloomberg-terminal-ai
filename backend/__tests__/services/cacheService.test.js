const { 
  cacheService, 
  CacheNamespace,
  quotes,
  fundamentals,
  screeners,
  clearAll
} = require('../../services/cacheService');
const logger = require('../../utils/logger');

// Silenciar logs durante tests
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Helper para esperar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('cacheService - Sistema de Cache', () => {
  // Limpiar todos los caches antes de cada test
  beforeEach(() => {
    clearAll();
    jest.clearAllMocks();
  });

  // Destruir el servicio después de todos los tests
  afterAll(() => {
    cacheService.destroy();
  });

  describe('Funcionalidad básica', () => {
    test('debe hacer set y get correctamente', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('key1', 'value1');
      expect(testCache.get('key1')).toBe('value1');
      
      testCache.set('key2', { data: 'complex', nested: { value: 123 } });
      expect(testCache.get('key2')).toEqual({ data: 'complex', nested: { value: 123 } });
    });

    test('debe retornar undefined para keys inexistentes', () => {
      const testCache = cacheService.namespace('test');
      
      expect(testCache.get('nonexistent')).toBeUndefined();
    });

    test('debe verificar existencia con has()', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('exists', 'yes');
      
      expect(testCache.has('exists')).toBe(true);
      expect(testCache.has('notexists')).toBe(false);
    });

    test('debe eliminar entradas con delete()', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('toDelete', 'value');
      expect(testCache.has('toDelete')).toBe(true);
      
      const deleted = testCache.delete('toDelete');
      expect(deleted).toBe(true);
      expect(testCache.has('toDelete')).toBe(false);
      
      // Intentar eliminar de nuevo
      expect(testCache.delete('toDelete')).toBe(false);
    });

    test('debe limpiar todo el namespace con clear()', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.set('key3', 'value3');
      
      expect(testCache.cache.size).toBe(3);
      
      testCache.clear();
      
      expect(testCache.cache.size).toBe(0);
      expect(testCache.get('key1')).toBeUndefined();
    });
  });

  describe('TTL y expiración', () => {
    test('debe expirar entradas después del TTL', async () => {
      const testCache = cacheService.namespace('test', { ttl: 100 }); // 100ms TTL
      
      testCache.set('expires', 'value');
      expect(testCache.get('expires')).toBe('value');
      
      await sleep(150); // Esperar más que el TTL
      
      expect(testCache.get('expires')).toBeUndefined();
      expect(testCache.stats.expirations).toBe(1);
    });

    test('debe permitir TTL personalizado por entrada', async () => {
      const testCache = cacheService.namespace('test', { ttl: 1000 }); // 1s default
      
      testCache.set('short', 'value1', 50); // 50ms TTL
      testCache.set('long', 'value2'); // usa default 1s
      
      await sleep(100); // Esperar 100ms
      
      expect(testCache.get('short')).toBeUndefined(); // debe haber expirado
      expect(testCache.get('long')).toBe('value2'); // aún debe existir
    });

    test('debe limpiar entradas expiradas automáticamente', async () => {
      const testCache = cacheService.namespace('test', { 
        ttl: 100, 
        cleanupInterval: 200 
      });
      
      testCache.set('auto1', 'value1');
      testCache.set('auto2', 'value2');
      
      expect(testCache.cache.size).toBe(2);
      
      await sleep(300); // Esperar a que expire y se limpie
      
      // La limpieza automática debe haber eliminado las entradas
      expect(testCache.cache.size).toBe(0);
    });
  });

  describe('Namespaces', () => {
    test('debe mantener namespaces independientes', () => {
      const cache1 = cacheService.namespace('ns1');
      const cache2 = cacheService.namespace('ns2');
      
      cache1.set('key', 'value1');
      cache2.set('key', 'value2');
      
      expect(cache1.get('key')).toBe('value1');
      expect(cache2.get('key')).toBe('value2');
    });

    test('debe reutilizar namespace existente', () => {
      const cache1 = cacheService.namespace('reuse');
      cache1.set('key', 'value');
      
      const cache2 = cacheService.namespace('reuse');
      expect(cache2.get('key')).toBe('value');
      
      // Deben ser la misma instancia
      expect(cache1).toBe(cache2);
    });

    test('debe permitir eliminar namespace completo', () => {
      const cache = cacheService.namespace('toDelete');
      cache.set('key', 'value');
      
      const deleted = cacheService.deleteNamespace('toDelete');
      expect(deleted).toBe(true);
      
      // Crear nuevo namespace con el mismo nombre
      const newCache = cacheService.namespace('toDelete');
      expect(newCache.get('key')).toBeUndefined();
    });
  });

  describe('Límites de memoria y evicción', () => {
    test('debe respetar límite de entradas (maxSize)', () => {
      const testCache = cacheService.namespace('test', { 
        maxSize: 3,
        evictionPolicy: 'lru' 
      });
      
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.set('key3', 'value3');
      
      expect(testCache.cache.size).toBe(3);
      
      // Agregar una cuarta debe evictar la menos usada
      testCache.set('key4', 'value4');
      
      expect(testCache.cache.size).toBe(3);
      expect(testCache.get('key1')).toBeUndefined(); // fue evictada (LRU)
      expect(testCache.get('key4')).toBe('value4');
      expect(testCache.stats.evictions).toBe(1);
    });

    test('debe evictar por LRU correctamente', () => {
      const testCache = cacheService.namespace('test', { 
        maxSize: 3,
        evictionPolicy: 'lru' 
      });
      
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.set('key3', 'value3');
      
      // Acceder a key1 y key3 para hacerlas más recientes
      testCache.get('key1');
      testCache.get('key3');
      
      // key2 ahora es la menos recientemente usada
      testCache.set('key4', 'value4');
      
      expect(testCache.get('key2')).toBeUndefined(); // fue evictada
      expect(testCache.get('key1')).toBe('value1');
      expect(testCache.get('key3')).toBe('value3');
    });

    test('debe respetar límite de memoria', () => {
      const testCache = cacheService.namespace('test', { 
        maxMemory: 1000 // 1KB límite muy pequeño para testing
      });
      
      // Crear un string grande
      const bigValue = 'x'.repeat(500);
      
      testCache.set('big1', bigValue);
      testCache.set('big2', bigValue);
      
      // El tercero debe causar evicción
      testCache.set('big3', bigValue);
      
      // Al menos uno debe haber sido evictado
      expect(testCache.stats.evictions).toBeGreaterThan(0);
      expect(testCache.stats.memoryUsed).toBeLessThanOrEqual(1000);
    });
  });

  describe('getOrSet helper', () => {
    test('debe obtener valor existente sin llamar factory', async () => {
      const testCache = cacheService.namespace('test');
      let factoryCalls = 0;
      
      testCache.set('key', 'existing');
      
      const value = await testCache.getOrSet('key', async () => {
        factoryCalls++;
        return 'new value';
      });
      
      expect(value).toBe('existing');
      expect(factoryCalls).toBe(0);
    });

    test('debe llamar factory y cachear si no existe', async () => {
      const testCache = cacheService.namespace('test');
      let factoryCalls = 0;
      
      const value = await testCache.getOrSet('key', async () => {
        factoryCalls++;
        await sleep(50); // Simular operación costosa
        return 'generated value';
      });
      
      expect(value).toBe('generated value');
      expect(factoryCalls).toBe(1);
      
      // Verificar que se cacheó
      expect(testCache.get('key')).toBe('generated value');
    });

    test('debe prevenir llamadas duplicadas a factory', async () => {
      const testCache = cacheService.namespace('test');
      let factoryCalls = 0;
      
      const factory = async () => {
        factoryCalls++;
        await sleep(100); // Operación lenta
        return `result-${factoryCalls}`;
      };
      
      // 10 llamadas simultáneas
      const promises = Array(10).fill(null).map(() => 
        testCache.getOrSet('key', factory)
      );
      
      const results = await Promise.all(promises);
      
      // Solo debe haber una llamada a factory
      expect(factoryCalls).toBe(1);
      
      // Todos deben recibir el mismo resultado
      results.forEach(result => {
        expect(result).toBe('result-1');
      });
    });

    test('debe manejar errores en factory', async () => {
      const testCache = cacheService.namespace('test');
      
      await expect(
        testCache.getOrSet('key', async () => {
          throw new Error('Factory failed');
        })
      ).rejects.toThrow('Factory failed');
      
      // No debe haber cacheado nada
      expect(testCache.get('key')).toBeUndefined();
    });
  });

  describe('Estadísticas', () => {
    test('debe trackear hits y misses', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('exists', 'value');
      
      // Reset stats
      testCache.stats.hits = 0;
      testCache.stats.misses = 0;
      
      testCache.get('exists'); // hit
      testCache.get('exists'); // hit
      testCache.get('notexists'); // miss
      testCache.get('notexists2'); // miss
      testCache.get('notexists3'); // miss
      
      const stats = testCache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(3);
      expect(stats.hitRate).toBe('40.00%');
    });

    test('debe trackear operaciones', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.delete('key1');
      
      const stats = testCache.getStats();
      expect(stats.sets).toBe(2);
      expect(stats.deletes).toBe(1);
    });

    test('debe calcular memoria usada', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('small', 'x');
      testCache.set('medium', 'x'.repeat(100));
      testCache.set('large', 'x'.repeat(1000));
      
      const stats = testCache.getStats();
      expect(stats.memoryUsed).toBeGreaterThan(0);
      expect(parseFloat(stats.memoryUsedMB)).toBeGreaterThan(0);
    });
  });

  describe('Namespaces pre-configurados', () => {
    test('quotes cache debe tener TTL corto', () => {
      quotes.set('AAPL', { price: 150.25, change: 2.5 });
      
      expect(quotes.config.ttl).toBe(2 * 60 * 1000); // 2 minutos
      expect(quotes.get('AAPL')).toEqual({ price: 150.25, change: 2.5 });
    });

    test('fundamentals cache debe tener TTL largo', () => {
      fundamentals.set('AAPL', { pe: 25.5, marketCap: 2.5e12 });
      
      expect(fundamentals.config.ttl).toBe(60 * 60 * 1000); // 1 hora
      expect(fundamentals.get('AAPL')).toBeDefined();
    });

    test('screeners cache debe tener configuración apropiada', () => {
      screeners.set('gainers', [{ symbol: 'XYZ', change: 25.5 }]);
      
      expect(screeners.config.ttl).toBe(5 * 60 * 1000); // 5 minutos
      expect(screeners.config.maxSize).toBe(100);
    });
  });

  describe('Eventos', () => {
    test('debe emitir eventos en operaciones', (done) => {
      const testCache = cacheService.namespace('test');
      const events = [];
      
      testCache.on('set', (data) => events.push({ type: 'set', data }));
      testCache.on('delete', (data) => events.push({ type: 'delete', data }));
      testCache.on('clear', (data) => events.push({ type: 'clear', data }));
      
      testCache.set('key1', 'value1');
      testCache.delete('key1');
      testCache.clear();
      
      // Dar tiempo para que se emitan los eventos
      setTimeout(() => {
        expect(events).toHaveLength(3);
        expect(events[0].type).toBe('set');
        expect(events[0].data.key).toBe('key1');
        expect(events[1].type).toBe('delete');
        expect(events[2].type).toBe('clear');
        done();
      }, 10);
    });
  });

  describe('Callbacks de evicción', () => {
    test('debe llamar onEvict cuando se evicta', (done) => {
      let evictedKey, evictedValue;
      
      const testCache = cacheService.namespace('test', {
        maxSize: 2,
        onEvict: (key, value) => {
          evictedKey = key;
          evictedValue = value;
        }
      });
      
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.set('key3', 'value3'); // Debe evictar key1
      
      setTimeout(() => {
        expect(evictedKey).toBe('key1');
        expect(evictedValue).toBe('value1');
        done();
      }, 10);
    });

    test('debe llamar onExpire cuando expira', async () => {
      let expiredKey, expiredValue;
      
      const testCache = cacheService.namespace('test', {
        ttl: 50,
        onExpire: (key, value) => {
          expiredKey = key;
          expiredValue = value;
        }
      });
      
      testCache.set('expires', 'value');
      
      await sleep(100);
      
      // Trigger check
      testCache.get('expires');
      
      expect(expiredKey).toBe('expires');
      expect(expiredValue).toBe('value');
    });
  });

  describe('Casos edge', () => {
    test('debe manejar valores undefined y null', () => {
      const testCache = cacheService.namespace('test');
      
      testCache.set('null', null);
      testCache.set('undefined', undefined);
      
      expect(testCache.get('null')).toBeNull();
      expect(testCache.get('undefined')).toBeUndefined();
      expect(testCache.has('null')).toBe(true);
      expect(testCache.has('undefined')).toBe(true);
    });

    test('debe manejar objetos circulares para cálculo de tamaño', () => {
      const testCache = cacheService.namespace('test');
      
      const circular = { name: 'test' };
      circular.self = circular; // Referencia circular
      
      // No debe lanzar error
      expect(() => {
        testCache.set('circular', circular);
      }).not.toThrow();
      
      // Debe usar tamaño por defecto
      const entry = testCache.cache.get('circular');
      expect(entry.size).toBe(1024); // tamaño por defecto
    });

    test('debe manejar múltiples operaciones concurrentes', async () => {
      const testCache = cacheService.namespace('test');
      const operations = [];
      
      // 100 operaciones mixtas simultáneas
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          operations.push(testCache.set(`key${i}`, `value${i}`));
        } else if (i % 3 === 1) {
          operations.push(testCache.get(`key${i-1}`));
        } else {
          operations.push(testCache.delete(`key${i-2}`));
        }
      }
      
      await Promise.all(operations);
      
      // Debe mantener consistencia
      const stats = testCache.getStats();
      expect(stats.sets).toBeGreaterThan(0);
      expect(stats.hits + stats.misses).toBeGreaterThan(0);
    });
  });
}); 