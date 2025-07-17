import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { styles, CHART_COLORS } from '../utils/personalFinanceStyles';

const ExpenseChart = ({ categoryChartData }) => {
  if (!categoryChartData || categoryChartData.length === 0) {
    return (
      <div style={styles.panel}>
        <h3>DISTRIBUCIÓN DE GASTOS</h3>
        <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
          No hay gastos para mostrar este mes
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <h3>DISTRIBUCIÓN DE GASTOS</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryChartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #FF8800',
              borderRadius: '4px'
            }}
            labelStyle={{ color: '#FF8800' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart; 