/**
 * Componente de gráfico de distribución del portfolio
 * Muestra un gráfico de pastel con la distribución por valor de cada posición
 */

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const DistributionChart = ({ data, styles }) => {
  // Colores para el gráfico
  const COLORS = ['#FF8800', '#FF6600', '#CC5500', '#994400', '#663300', '#332200'];

  // Custom tooltip para mostrar el valor formateado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #FF8800',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <p style={{ color: '#FF8800', margin: 0 }}>
            {data.name}: ${data.value.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
          <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>
            {((data.value / data.payload.percent) * 100).toFixed(1)}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <div style={styles.panel}>
        <h3>DISTRIBUCIÓN DEL PORTAFOLIO</h3>
        <div style={{ 
          height: 300, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#666'
        }}>
          No hay datos para mostrar
        </div>
      </div>
    );
  }

  // Calcular el total para porcentajes
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div style={styles.panel}>
      <h3>DISTRIBUCIÓN DEL PORTAFOLIO</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data.map(item => ({ ...item, percent: total }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionChart; 