import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { apiCall } from '../services/api';

const formatNumber = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Estilos necesarios para el módulo
const styles = {
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #FF8800',
    padding: '8px',
    fontSize: '12px',
    width: '200px',
    marginRight: '10px'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000',
    border: 'none',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  priceUp: {
    color: '#00FF00'
  },
  priceDown: {
    color: '#FF0000'
  }
};

// Módulo de Portafolio
function PortfolioModule() {
  const [portfolioData, setPortfolioData] = useState({ positions: [] });
  const [newPosition, setNewPosition] = useState({ symbol: '', shares: '', avgCost: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshPortfolio = async () => {
    setIsLoading(true);
    try {
      const portfolio = await apiCall('/api/portfolio');
      if (portfolio && portfolio.positions.length > 0) {
        const symbols = portfolio.positions.map(p => p.symbol);
        const quotes = await apiCall('/api/market/batch-quotes', 'POST', { symbols });
        const updatedPositions = portfolio.positions.map(p => ({
          ...p,
          currentPrice: quotes[p.symbol]?.price || p.currentPrice,
        }));
        setPortfolioData({ ...portfolio, positions: updatedPositions });
      } else {
        setPortfolioData({ positions: [] }); // Asegurar que sea un array
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshPortfolio();
    const interval = setInterval(refreshPortfolio, 120000); // 2 minutos
    return () => clearInterval(interval);
  }, []);

  const handleAddPosition = async () => {
    if (newPosition.symbol && newPosition.shares && newPosition.avgCost) {
      const newPositionData = {
        symbol: newPosition.symbol.toUpperCase(),
        name: `${newPosition.symbol.toUpperCase()} Inc.`, // Nombre simulado
        shares: parseInt(newPosition.shares),
        avgCost: parseFloat(newPosition.avgCost),
        // El precio actual debería venir de una API de mercado; aquí lo simulamos
        currentPrice: parseFloat(newPosition.avgCost),
        lastUpdated: new Date().toISOString()
      };

      const updatedPortfolio = {
        ...portfolioData,
        positions: [...portfolioData.positions, newPositionData],
        lastModified: new Date().toISOString()
        // El totalValue podría recalcularse aquí o en el backend
      };

      // Actualiza el estado local primero para una UI responsiva
      setPortfolioData(updatedPortfolio);

      // Luego, envía el estado completo al backend
      try {
        await apiCall('/api/portfolio', 'POST', updatedPortfolio);
        setPortfolioData(updatedPortfolio);
        setNewPosition({ symbol: '', shares: '', avgCost: '' });
      } catch (error) {
        console.error('Error saving portfolio:', error);
      }
    }
  };

  const handleRemovePosition = async (symbol) => {
    // ... (lógica sin cambios)
  };

  const renderTimeAgo = () => {
    if (!lastUpdated) return 'Nunca';
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 10) return 'justo ahora';
    if (seconds < 60) return `hace ${seconds} segundos`;
    return `hace ${Math.floor(seconds / 60)} min`;
  };

  if (isLoading && portfolioData.positions.length === 0) {
    return <div>Cargando portafolio...</div>;
  }

  // Calcular métricas del portafolio a partir del estado local
  const totalCost = portfolioData.positions.reduce((acc, pos) => acc + (pos.shares * pos.avgCost), 0);
  const totalValue = portfolioData.totalValue; // Usar el valor del backend
  const totalGain = totalValue - totalCost;
  const totalReturn = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  
  const portfolioMetrics = {
    totalValue,
    totalCost,
    totalGain,
    totalReturn
  };

  // Datos para el gráfico de distribución
  const distributionData = portfolioData.positions.map(pos => ({
    name: pos.symbol,
    value: pos.shares * pos.currentPrice
  }));

  console.log('PortfolioData:', portfolioData);
  console.log('Métricas calculadas:', portfolioMetrics);

  return (
    <div>
      <div style={{...styles.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{ color: '#FF8800', margin: 0 }}>MI PORTAFOLIO</h2>
        <div>
          <span style={{ fontSize: '11px', color: '#888', marginRight: '10px' }}>
            Última actualización: {renderTimeAgo()}
          </span>
          <button onClick={refreshPortfolio} style={styles.button} disabled={isLoading}>
            {isLoading ? 'Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Resumen del Portafolio */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>RESUMEN GENERAL</h3>
          <div style={{ fontSize: '16px' }}>
            <div>Valor Total: <span style={portfolioMetrics.totalValue >= portfolioMetrics.totalCost ? styles.priceUp : styles.priceDown}>${formatNumber(portfolioMetrics.totalValue)}</span></div>
            <div>Costo Total: ${formatNumber(portfolioMetrics.totalCost)}</div>
            <div>Ganancia/Pérdida:
              <span style={portfolioMetrics.totalGain >= 0 ? styles.priceUp : styles.priceDown}>
                ${formatNumber(portfolioMetrics.totalGain)} ({portfolioMetrics.totalReturn.toFixed(2)}%)
              </span>
            </div>
            <div>Posiciones: {portfolioData.positions.length}</div>
          </div>
        </div>

        {/* Agregar Nueva Posición */}
        <div style={styles.panel}>
          <h3>AGREGAR POSICIÓN</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Símbolo (ej: AAPL)"
              value={newPosition.symbol}
              onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
              style={{ ...styles.input, width: '100%' }}
            />
            <input
              type="number"
              placeholder="Cantidad de acciones"
              value={newPosition.shares}
              onChange={(e) => setNewPosition({...newPosition, shares: e.target.value})}
              style={{ ...styles.input, width: '100%' }}
            />
            <input
              type="number"
              placeholder="Costo promedio por acción"
              value={newPosition.avgCost}
              onChange={(e) => setNewPosition({...newPosition, avgCost: e.target.value})}
              style={{ ...styles.input, width: '100%' }}
            />
            <button onClick={handleAddPosition} style={styles.button}>AGREGAR</button>
          </div>
        </div>
      </div>

      {/* Tabla de Posiciones */}
      <div style={styles.panel}>
        <h3>POSICIONES ACTUALES</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #FF8800' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Símbolo</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Acciones</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Costo Promedio</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Precio Actual</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Valor Total</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Ganancia/Pérdida</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>% Cambio</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.positions.map((pos, i) => {
                const totalCost = pos.shares * pos.avgCost;
                const currentValue = pos.shares * (pos.currentPrice || 0);
                const gain = currentValue - totalCost;
                const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{pos.symbol}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{pos.shares}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${pos.avgCost.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${pos.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${currentValue.toFixed(2)}</td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: gain >= 0 ? '#00FF00' : '#FF0000'
                    }}>
                      ${gain.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: gain >= 0 ? '#00FF00' : '#FF0000'
                    }}>
                      {gainPercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de Distribución */}
      <div style={styles.panel}>
        <h3>DISTRIBUCIÓN DEL PORTAFOLIO</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#FF8800', '#00FF00', '#00FFFF', '#FFFF00', '#FF00FF', '#FF0000'][index % 6]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PortfolioModule; 