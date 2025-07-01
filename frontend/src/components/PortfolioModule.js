import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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
  // Estado para almacenar todos los datos del portafolio, coincidiendo con la estructura del JSON
  const [portfolioData, setPortfolioData] = useState({ positions: [], totalValue: 0 });

  // Estado para el formulario de nueva posición
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    shares: '',
    avgCost: '' // Cambiado de avgPrice a avgCost para coincidir con el JSON
  });

  // Cargar datos del portafolio desde el backend al montar el componente
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/portfolio');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPortfolioData(data);
        // Actualizar precios después de cargar el portfolio
        if (data.positions && data.positions.length > 0) {
          // updatePrices(data.positions, data);
        }
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
        // Opcional: manejar el estado de error en la UI, por ejemplo, mostrando un mensaje
      }
    };

    fetchPortfolio();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  if (!portfolioData.positions || portfolioData.positions.length === 0) {
    return <div><h2 style={{ color: '#FF8800', marginBottom: '20px' }}>MI PORTAFOLIO</h2><p>Cargando datos del portfolio...</p></div>;
  }

  // Función para actualizar precios desde la API
  const updatePrices = async (positions, fullPortfolioData) => {
    if (!positions || positions.length === 0) return;
    
    try {
      // Obtener todos los símbolos
      const symbols = positions.map(p => p.symbol);
      
      // Una sola llamada para todos los símbolos
      const response = await fetch('http://localhost:5000/api/market/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      
      if (response.ok) {
        const quotesMap = await response.json();
        
        // Actualizar posiciones con precios reales
        const updatedPositions = positions.map(position => ({
          ...position,
          currentPrice: quotesMap[position.symbol]?.price || position.currentPrice
        }));
        
        const updatedPortfolio = {
          ...fullPortfolioData,
          positions: updatedPositions,
          lastUpdated: new Date().toISOString()
        };
        
        setPortfolioData(updatedPortfolio);
        savePortfolio(updatedPortfolio);
      }
    } catch (error) {
      console.error('Error actualizando precios:', error);
    }
  };

  // Función genérica para guardar el estado completo del portafolio en el backend
  const savePortfolio = async (updatedPortfolio) => {
    try {
      const response = await fetch('http://localhost:5000/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPortfolio),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving portfolio data:", error);
    }
  };


  // Maneja la adición de una nueva posición
  const handleAddPosition = () => {
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
      savePortfolio(updatedPortfolio);

      // Actualizar precios después de agregar
      updatePrices(updatedPortfolio.positions, updatedPortfolio);

      // Limpia el formulario
      setNewPosition({ symbol: '', shares: '', avgCost: '' });
    }
  };

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
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>MI PORTAFOLIO</h2>

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