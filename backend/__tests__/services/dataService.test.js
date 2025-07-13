const fs = require('fs').promises;
const path = require('path');
const dataService = require('../../services/dataService');
const logger = require('../../utils/logger');

// Silenciar logs durante tests
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Rutas de archivos
const portfolioPath = path.join(__dirname, '../../data/portfolio.json');
const watchlistPath = path.join(__dirname, '../../data/watchlist.json');
const portfolioBackupPath = path.join(__dirname, '../../data/portfolio.backup.test.json');
const watchlistBackupPath = path.join(__dirname, '../../data/watchlist.backup.test.json');

// Datos de prueba
const testPortfolio = {
  positions: [
    {
      symbol: 'TEST1',
      name: 'Test Stock 1',
      shares: 100,
      avgCost: 50.00,
      currentPrice: 55.00,
      lastUpdated: '2025-01-01T00:00:00.000Z'
    },
    {
      symbol: 'TEST2',
      name: 'Test Stock 2',
      shares: 200,
      avgCost: 25.00,
      currentPrice: 30.00,
      lastUpdated: '2025-01-01T00:00:00.000Z'
    }
  ],
  lastModified: '2025-01-01T00:00:00.000Z',
  totalValue: 11500
};

const testWatchlist = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];

describe('dataService - Protección de datos reales', () => {
  // Backup antes de TODOS los tests
  beforeAll(async () => {
    // Hacer backup del portfolio real
    try {
      await fs.copyFile(portfolioPath, portfolioBackupPath);
      console.log('✅ Backup del portfolio real creado');
    } catch (error) {
      console.error('❌ Error creando backup del portfolio:', error);
      throw error;
    }

    // Hacer backup de la watchlist si existe
    try {
      await fs.access(watchlistPath);
      await fs.copyFile(watchlistPath, watchlistBackupPath);
      console.log('✅ Backup de la watchlist real creado');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error creando backup de watchlist:', error);
      }
    }
  });

  // Restaurar después de TODOS los tests
  afterAll(async () => {
    // Restaurar portfolio real
    try {
      await fs.copyFile(portfolioBackupPath, portfolioPath);
      await fs.unlink(portfolioBackupPath);
      console.log('✅ Portfolio real restaurado');
    } catch (error) {
      console.error('❌ ERROR CRÍTICO: No se pudo restaurar el portfolio real:', error);
      throw error;
    }

    // Restaurar watchlist si había backup
    try {
      await fs.access(watchlistBackupPath);
      await fs.copyFile(watchlistBackupPath, watchlistPath);
      await fs.unlink(watchlistBackupPath);
      console.log('✅ Watchlist real restaurada');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error restaurando watchlist:', error);
      }
    }
  });

  // Usar datos de prueba para cada test
  beforeEach(async () => {
    await fs.writeFile(portfolioPath, JSON.stringify(testPortfolio, null, 2));
    await fs.writeFile(watchlistPath, JSON.stringify(testWatchlist, null, 2));
    // Limpiar mocks para cada test
    jest.clearAllMocks();
  });

  describe('readPortfolio', () => {
    test('debe leer el portfolio correctamente', async () => {
      const portfolio = await dataService.readPortfolio();
      
      expect(portfolio).toEqual(testPortfolio);
      expect(portfolio.positions).toHaveLength(2);
      expect(portfolio.totalValue).toBe(11500);
    });

    test('debe manejar error si el archivo no existe', async () => {
      // Temporalmente renombrar el archivo
      await fs.rename(portfolioPath, portfolioPath + '.tmp');
      
      await expect(dataService.readPortfolio()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
      const errorCall = logger.error.mock.calls[0];
      expect(errorCall[0]).toBe('Error al leer el archivo del portafolio:');
      expect(errorCall[1]).toBeDefined();
      expect(errorCall[1].message).toContain('ENOENT');
      
      // Restaurar archivo
      await fs.rename(portfolioPath + '.tmp', portfolioPath);
    });

    test('debe manejar archivo JSON corrupto', async () => {
      await fs.writeFile(portfolioPath, 'JSON inválido {]');
      
      await expect(dataService.readPortfolio()).rejects.toThrow(SyntaxError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('writePortfolio', () => {
    test('debe escribir el portfolio correctamente', async () => {
      const newPortfolio = {
        ...testPortfolio,
        positions: [
          ...testPortfolio.positions,
          {
            symbol: 'TEST3',
            name: 'Test Stock 3',
            shares: 50,
            avgCost: 100.00,
            currentPrice: 110.00,
            lastUpdated: new Date().toISOString()
          }
        ],
        totalValue: 17000
      };

      await dataService.writePortfolio(newPortfolio);
      
      const savedData = JSON.parse(await fs.readFile(portfolioPath, 'utf8'));
      expect(savedData).toEqual(newPortfolio);
      expect(savedData.positions).toHaveLength(3);
    });

    test('debe formatear el JSON con indentación', async () => {
      await dataService.writePortfolio(testPortfolio);
      
      const fileContent = await fs.readFile(portfolioPath, 'utf8');
      // Verificar que tiene saltos de línea y espacios (está formateado)
      expect(fileContent).toContain('\n');
      expect(fileContent).toContain('  '); // indentación
    });

    test('debe manejar error de escritura', async () => {
      // Crear un mock temporal del fs.writeFile para simular error
      const originalWriteFile = fs.writeFile;
      fs.writeFile = jest.fn().mockRejectedValue(new Error('EACCES: permission denied'));
      
      await expect(dataService.writePortfolio(testPortfolio)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Error al escribir en el archivo del portafolio:',
        expect.any(Error)
      );
      
      // Restaurar función original
      fs.writeFile = originalWriteFile;
    });
  });

  describe('readWatchlist', () => {
    test('debe leer la watchlist correctamente', async () => {
      const watchlist = await dataService.readWatchlist();
      
      expect(watchlist).toEqual(testWatchlist);
      expect(watchlist).toHaveLength(4);
      expect(watchlist).toContain('AAPL');
    });

    test('debe devolver array vacío si el archivo no existe', async () => {
      await fs.unlink(watchlistPath);
      
      const watchlist = await dataService.readWatchlist();
      
      expect(watchlist).toEqual([]);
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('debe manejar archivo JSON corrupto', async () => {
      await fs.writeFile(watchlistPath, 'JSON inválido [}');
      
      await expect(dataService.readWatchlist()).rejects.toThrow(SyntaxError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('writeWatchlist', () => {
    test('debe escribir la watchlist correctamente', async () => {
      const newWatchlist = ['FB', 'AMZN', 'NFLX', 'GOOGL'];
      
      await dataService.writeWatchlist(newWatchlist);
      
      const savedData = JSON.parse(await fs.readFile(watchlistPath, 'utf8'));
      expect(savedData).toEqual(newWatchlist);
      expect(savedData).toHaveLength(4);
    });

    test('debe manejar watchlist vacía', async () => {
      await dataService.writeWatchlist([]);
      
      const savedData = JSON.parse(await fs.readFile(watchlistPath, 'utf8'));
      expect(savedData).toEqual([]);
    });
  });

  describe('Integridad de datos', () => {
    test('nunca debe perder posiciones existentes al leer y escribir', async () => {
      // Leer portfolio original
      const original = await dataService.readPortfolio();
      const originalPositions = [...original.positions];
      
      // Agregar nueva posición y escribir
      original.positions.push({
        symbol: 'NEW',
        name: 'New Stock',
        shares: 10,
        avgCost: 100,
        currentPrice: 100,
        lastUpdated: new Date().toISOString()
      });
      
      await dataService.writePortfolio(original);
      
      // Leer de nuevo y verificar
      const updated = await dataService.readPortfolio();
      
      // Verificar que todas las posiciones originales siguen ahí
      originalPositions.forEach(pos => {
        const found = updated.positions.find(p => p.symbol === pos.symbol);
        expect(found).toBeDefined();
        expect(found).toEqual(pos);
      });
      
      // Verificar que la nueva también está
      expect(updated.positions).toHaveLength(originalPositions.length + 1);
      expect(updated.positions.find(p => p.symbol === 'NEW')).toBeDefined();
    });

    test('debe preservar todos los campos al escribir', async () => {
      const complexPortfolio = {
        positions: [{
          symbol: 'COMPLEX',
          name: 'Complex Stock',
          shares: 123.456789,
          avgCost: 98.7654321,
          currentPrice: 102.345678,
          lastUpdated: '2025-01-01T12:34:56.789Z',
          // Campos adicionales que podrían existir
          notes: 'Compra importante',
          sector: 'Technology',
          customField: { nested: 'value' }
        }],
        lastModified: '2025-01-01T12:34:56.789Z',
        totalValue: 12638.95,
        // Campos adicionales del portfolio
        currency: 'USD',
        metadata: {
          version: '1.0',
          source: 'manual'
        }
      };

      await dataService.writePortfolio(complexPortfolio);
      const saved = await dataService.readPortfolio();
      
      expect(saved).toEqual(complexPortfolio);
      expect(saved.positions[0].notes).toBe('Compra importante');
      expect(saved.positions[0].customField).toEqual({ nested: 'value' });
      expect(saved.metadata).toEqual(complexPortfolio.metadata);
    });
  });

  describe('Concurrencia', () => {
    test('debe manejar escrituras simultáneas sin corrupción', async () => {
      const promises = [];
      
      // 10 escrituras simultáneas con diferentes datos
      for (let i = 0; i < 10; i++) {
        const portfolio = {
          positions: [{
            symbol: `CONC${i}`,
            name: `Concurrent Stock ${i}`,
            shares: i * 10,
            avgCost: 50 + i,
            currentPrice: 55 + i,
            lastUpdated: new Date().toISOString()
          }],
          lastModified: new Date().toISOString(),
          totalValue: (i * 10) * (55 + i)
        };
        
        promises.push(dataService.writePortfolio(portfolio));
      }
      
      await Promise.all(promises);
      
      // Verificar que el archivo final es JSON válido
      const finalPortfolio = await dataService.readPortfolio();
      expect(finalPortfolio).toBeDefined();
      expect(finalPortfolio.positions).toBeDefined();
      expect(Array.isArray(finalPortfolio.positions)).toBe(true);
    });

    test('debe manejar lecturas simultáneas', async () => {
      const promises = [];
      
      // 20 lecturas simultáneas
      for (let i = 0; i < 20; i++) {
        promises.push(dataService.readPortfolio());
      }
      
      const results = await Promise.all(promises);
      
      // Todas deben devolver el mismo resultado
      results.forEach(result => {
        expect(result).toEqual(testPortfolio);
      });
    });
  });

  describe('Validación de datos', () => {
    test('debe preservar precisión numérica de decimales', async () => {
      const precisionPortfolio = {
        positions: [{
          symbol: 'BTC',
          name: 'Bitcoin',
          shares: 0.123456789012345,  // 15 decimales
          avgCost: 45678.9012345678,  // muchos decimales
          currentPrice: 98765.4321098765,
          lastUpdated: new Date().toISOString()
        }],
        lastModified: new Date().toISOString(),
        totalValue: 12193.185938829813  // resultado preciso
      };

      await dataService.writePortfolio(precisionPortfolio);
      const saved = await dataService.readPortfolio();
      
      expect(saved.positions[0].shares).toBe(0.123456789012345);
      expect(saved.positions[0].avgCost).toBe(45678.9012345678);
      expect(saved.totalValue).toBe(12193.185938829813);
    });
  });
}); 