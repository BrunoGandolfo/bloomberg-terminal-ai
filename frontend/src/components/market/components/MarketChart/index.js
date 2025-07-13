import React, { useState, useRef, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { colors } from '../../../../styles/colors';
import { typography } from '../../../../styles/typography';
import { tokens } from '../../../../styles/tokens';
import ChartControls from './ChartControls';
import ComparisonPanel from './ComparisonPanel';

const MarketChart = ({ 
  historicalData = [], 
  selectedRange, 
  onRangeChange,
  currentSymbol,
  marketData,
  daysMap
}) => {
  // Estados locales para modo comparación
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonLines, setComparisonLines] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(null); // 'start' o 'end'
  
  // Ref para el contenedor del gráfico
  const chartContainerRef = useRef(null);

  // Función para manejar clicks en el gráfico
  const handleChartClick = (event) => {
    if (!comparisonMode || !historicalData.length) return;
    
    let index = null;
    
    // Si Recharts provee activeTooltipIndex, úsalo
    if (event.activeTooltipIndex !== undefined) {
      index = event.activeTooltipIndex;
    } else if (event.activePayload && event.activePayload.length > 0) {
      // Buscar el índice basado en los datos
      const clickedDate = event.activeLabel;
      index = historicalData.findIndex(item => item.date === clickedDate);
    }
    
    // Si no pudimos obtener un índice válido, salir
    if (index === null || index === -1) {
      return;
    }
    
    if (!comparisonLines.start) {
      // Establecer línea de inicio
      setComparisonLines({ start: index, end: null });
    } else if (!comparisonLines.end) {
      // Establecer línea de fin
      setComparisonLines(prev => ({ ...prev, end: index }));
    } else {
      // Resetear a nueva posición de inicio
      setComparisonLines({ start: index, end: null });
    }
  };

  // Función para manejar el arrastre de líneas
  const handleMouseMove = (event) => {
    if (!isDragging || !comparisonMode || !historicalData.length) return;
    
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = event.clientX - rect.left;
    const chartWidth = rect.width;
    const mouseRatio = mouseX / chartWidth;
    const dataIndex = Math.round(mouseRatio * (historicalData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, historicalData.length - 1));
    
    setComparisonLines(prev => ({
      ...prev,
      [isDragging]: clampedIndex
    }));
  };

  // Calcular ticks para el eje X según el rango de datos
  const calculateXAxisTicks = useCallback(() => {
    if (!historicalData || historicalData.length === 0) return [];
    
    const firstDate = new Date(historicalData[0].date);
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const totalYears = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365);
    
    // Para rangos de 30 años o más, crear ticks cada 5 años
    if (totalYears >= 25) {
      const ticks = [];
      const startYear = firstDate.getFullYear();
      const endYear = lastDate.getFullYear();
      
      // Encontrar el año inicial divisible por 5
      let currentYear = Math.ceil(startYear / 5) * 5;
      
      // Agregar ticks cada 5 años
      while (currentYear <= endYear) {
        // Encontrar la primera fecha de este año en los datos
        const yearData = historicalData.find(d => {
          const year = new Date(d.date).getFullYear();
          return year === currentYear;
        });
        
        if (yearData) {
          ticks.push(yearData.date);
        }
        currentYear += 5;
      }
      
      // Asegurar que el primer y último año estén incluidos
      if (!ticks.includes(historicalData[0].date)) {
        ticks.unshift(historicalData[0].date);
      }
      if (!ticks.includes(historicalData[historicalData.length - 1].date)) {
        ticks.push(historicalData[historicalData.length - 1].date);
      }
      
      return ticks;
    }
    
    // Para rangos de 10-25 años, crear ticks cada 2 años
    if (totalYears >= 8) {
      const ticks = [];
      const startYear = firstDate.getFullYear();
      const endYear = lastDate.getFullYear();
      
      // Encontrar el año inicial par
      let currentYear = Math.ceil(startYear / 2) * 2;
      
      // Agregar ticks cada 2 años
      while (currentYear <= endYear) {
        const yearData = historicalData.find(d => {
          const year = new Date(d.date).getFullYear();
          return year === currentYear;
        });
        
        if (yearData) {
          ticks.push(yearData.date);
        }
        currentYear += 2;
      }
      
      // Asegurar que el primer y último año estén incluidos
      if (!ticks.includes(historicalData[0].date)) {
        ticks.unshift(historicalData[0].date);
      }
      if (!ticks.includes(historicalData[historicalData.length - 1].date)) {
        ticks.push(historicalData[historicalData.length - 1].date);
      }
      
      return ticks;
    }
    
    // Para rangos de 5-8 años, crear ticks cada año
    if (totalYears >= 4) {
      const ticks = [];
      const startYear = firstDate.getFullYear();
      const endYear = lastDate.getFullYear();
      
      // Agregar ticks para cada año
      for (let year = startYear; year <= endYear; year++) {
        // Encontrar la primera fecha de cada año en los datos
        const yearData = historicalData.find(d => new Date(d.date).getFullYear() === year);
        if (yearData) {
          ticks.push(yearData.date);
        }
      }
      
      return ticks;
    }
    
    // Para rangos menores, dejar que Recharts maneje los ticks automáticamente
    return undefined;
  }, [historicalData]);

  // Calcular porcentaje de cambio entre líneas
  const calculateComparison = () => {
    if (!comparisonLines.start || !comparisonLines.end || !historicalData.length) return null;
    
    const startPrice = historicalData[comparisonLines.start]?.close;
    const endPrice = historicalData[comparisonLines.end]?.close;
    const startDate = historicalData[comparisonLines.start]?.date;
    const endDate = historicalData[comparisonLines.end]?.date;
    
    if (!startPrice || !endPrice) return null;
    
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;
    const changeAmount = endPrice - startPrice;
    
    return {
      startPrice,
      endPrice,
      startDate,
      endDate,
      changePercent,
      changeAmount
    };
  };

  // Manejar el cambio de modo comparación
  const handleComparisonModeToggle = () => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode) {
      setComparisonLines({ start: null, end: null });
      setIsDragging(null);
    }
  };

  // Estilos
  const styles = {
    chartSection: {
      border: '1px solid #333333',
      padding: '15px',
      backgroundColor: '#0a0a0a',
      borderRadius: '4px',
      marginBottom: tokens.spacing[4]
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    chartTitle: {
      fontSize: typography.fontSize.xl,
      color: colors.primary.orange
    },
    chartContainer: {
      width: '100%',
      height: '400px',
      marginBottom: tokens.spacing[3]
    },
    chartInfo: {
      fontSize: typography.fontSize.sm,
      color: colors.neutral.text
    }
  };

  return (
    <div style={styles.chartSection}>
      <div style={styles.chartHeader}>
        <h4 style={styles.chartTitle}>Gráfico de Precios</h4>
        <ChartControls
          comparisonMode={comparisonMode}
          onComparisonModeToggle={handleComparisonModeToggle}
          selectedRange={selectedRange}
          onRangeChange={onRangeChange}
          daysMap={daysMap}
        />
      </div>

      {/* Panel de comparación */}
      {comparisonMode && calculateComparison() && (
        <ComparisonPanel comparison={calculateComparison()} />
      )}

      {/* Gráfico Recharts */}
      <div style={styles.chartContainer} ref={chartContainerRef}>
        {historicalData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={historicalData}
              onMouseDown={(e) => {
                if (e && e.activeCoordinate) {
                  handleChartClick(e);
                }
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(null)}
              onMouseLeave={() => setIsDragging(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#FF8800"
                tick={{ fill: '#FF8800', fontSize: 11 }}
                ticks={calculateXAxisTicks()}
                interval={calculateXAxisTicks() ? 0 : "preserveStartEnd"}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  
                  // Para rangos de 5 años o más, mostrar solo el año
                  if (['5 años', '10 años', '20 años', '30 años'].includes(selectedRange)) {
                    return date.getFullYear().toString();
                  }
                  
                  // Para 1 año, mostrar mes abreviado
                  if (selectedRange === '1 año') {
                    // Solo mostrar algunos meses para evitar superposición
                    const month = date.getMonth();
                    if (month % 3 === 0) { // Cada 3 meses
                      return date.toLocaleDateString('es-ES', { month: 'short' });
                    }
                    return '';
                  }
                  
                  // Para 6 meses, mostrar mes/día
                  if (selectedRange === '6 meses') {
                    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                  }
                  
                  // Para 3 meses, mostrar día/mes cada semana
                  if (selectedRange === '3 meses') {
                    const dayOfWeek = date.getDay();
                    if (dayOfWeek === 1) { // Solo lunes
                      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    }
                    return '';
                  }
                  
                  // Para rangos cortos (1 día, 5 días, 1 mes), mostrar día/mes
                  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                }}
                angle={['6 meses', '1 año', '5 años', '10 años', '20 años', '30 años'].includes(selectedRange) ? -45 : 0}
                textAnchor={['6 meses', '1 año', '5 años', '10 años', '20 años', '30 años'].includes(selectedRange) ? "end" : "middle"}
                height={['6 meses', '1 año', '5 años', '10 años', '20 años', '30 años'].includes(selectedRange) ? 70 : 40}
                domain={['dataMin', 'dataMax']}
                tickMargin={5}
              />
              <YAxis 
                stroke="#FF8800" 
                domain={['auto', 'auto']}
                tick={{ fill: '#FF8800', fontSize: 11 }}
                tickFormatter={(value) => {
                  // Formatear valores grandes con sufijos K, M, B
                  if (value >= 1000000000) {
                    return `$${(value / 1000000000).toFixed(1)}B`;
                  } else if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}K`;
                  }
                  return `$${value.toFixed(0)}`;
                }}
                width={80}
              />
              <Tooltip
                cursor={comparisonMode ? false : true}
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #FF8800' 
                }}
                formatter={(value, name, props) => {
                  return [value.toFixed(2), name];
                }}
                labelFormatter={(label) => {
                  return label ? new Date(label).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : '';
                }}
              />
              
              {/* Líneas de comparación */}
              {comparisonMode && comparisonLines.start !== null && (
                <ReferenceLine 
                  x={historicalData[comparisonLines.start]?.date}
                  stroke="#FFA500"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.cursor = 'ew-resize';
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging('start');
                  }}
                />
              )}
              
              {comparisonMode && comparisonLines.end !== null && (
                <ReferenceLine 
                  x={historicalData[comparisonLines.end]?.date}
                  stroke="#00BFFF"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.cursor = 'ew-resize';
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging('end');
                  }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#00FF00" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: colors.neutral.text 
          }}>
            No hay datos históricos disponibles
          </div>
        )}
      </div>

      {historicalData.length > 0 && (
        <div style={styles.chartInfo}>
          <p>
            Mostrando {historicalData.length} días de datos 
            ({historicalData[0]?.date} - {historicalData[historicalData.length - 1]?.date})
          </p>
          <p>Fuente: Twelve Data | Última actualización: {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default MarketChart; 