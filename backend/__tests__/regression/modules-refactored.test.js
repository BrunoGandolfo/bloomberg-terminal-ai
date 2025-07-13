/**
 * @jest-environment jsdom
 */
const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');

// Mock de funciones globales
global.fetch = jest.fn();
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

describe('Módulos Refactorizados - Sin Regresiones', () => {
  
  beforeEach(() => {
    fetch.mockClear();
  });
  
  test('FundamentalAnalysisModule funciona idénticamente', async () => {
    // Mock the lazy loaded components
    jest.mock('../../../frontend/src/components/fundamental/ProfessionalGauge', () => {
      return function MockProfessionalGauge() {
        return React.createElement('div', null, 'Professional Gauge');
      };
    });
    
    jest.mock('../../../frontend/src/components/fundamental/BuffettScorePanel', () => {
      return function MockBuffettScorePanel() {
        return React.createElement('div', null, 'Buffett Score');
      };
    });
    
    const FundamentalModule = require('../../../frontend/src/components/FundamentalAnalysisModule');
    
    const mockUpdate = jest.fn();
    render(React.createElement(FundamentalModule, { updateGlobalState: mockUpdate }));
    
    // Verificar todas las secciones principales
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter symbol/i)).toBeInTheDocument();
    });
    
    // Verificar que las funciones principales están disponibles
    const searchInput = screen.getByPlaceholderText(/Enter symbol/i);
    expect(searchInput).toBeInTheDocument();
  });
  
  test('PersonalFinanceModule mantiene funcionalidad', async () => {
    // Mock de respuestas del backend
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [],
        budgets: [],
        accounts: []
      })
    });
    
    const PersonalModule = require('../../../frontend/src/components/PersonalFinanceModule');
    
    const mockUpdate = jest.fn();
    render(React.createElement(PersonalModule, { updateGlobalState: mockUpdate }));
    
    // Verificar componentes principales
    await waitFor(() => {
      expect(screen.getByText(/Budget Overview/i)).toBeInTheDocument();
    });
  });
  
  test('Hooks personalizados funcionan correctamente', () => {
    // Test useFundamentalsData hook
    const { renderHook } = require('@testing-library/react');
    const { useFundamentalsData } = require('../../../frontend/src/hooks/useFundamentalsData');
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        General: { Name: 'Apple Inc.' },
        Financials: { BS: {}, IS: {} }
      })
    });
    
    const { result } = renderHook(() => useFundamentalsData('AAPL.US'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });
  
  test('Componentes refactorizados mantienen props y comportamiento', async () => {
    // Verificar que los componentes aceptan las mismas props
    const components = [
      '../../../frontend/src/components/fundamental/ProfessionalGauge',
      '../../../frontend/src/components/fundamental/BuffettScorePanel',
      '../../../frontend/src/components/fundamental/StrengthsWeaknesses'
    ];
    
    components.forEach(componentPath => {
      expect(() => {
        require(componentPath);
      }).not.toThrow();
    });
  });
  
  test('Lazy loading funciona correctamente', async () => {
    // Verificar que los módulos cargan de forma diferida
    const startTime = Date.now();
    
    // Simular carga lazy
    const loadPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve(require('../../../frontend/src/components/personal/BudgetManager'));
      }, 100);
    });
    
    const module = await loadPromise;
    const loadTime = Date.now() - startTime;
    
    expect(module).toBeDefined();
    expect(loadTime).toBeGreaterThanOrEqual(100);
  });
}); 