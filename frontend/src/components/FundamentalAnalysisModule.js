import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { apiCall } from '../services/api';
import TickerSearchInput from './TickerSearchInput';

// Estilos Bloomberg exactos mejorados
const styles = {
  terminal: {
    backgroundColor: '#000000',
    color: '#FF8800',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    minHeight: '100vh',
    padding: '20px',
    position: 'relative'
  },
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  panelHover: {
    '&:hover': {
      borderColor: '#FF8800',
      boxShadow: '0 0 10px rgba(255, 136, 0, 0.3)'
    }
  },
  neonBorder: {
    border: '1px solid #FF8800',
    boxShadow: '0 0 5px rgba(255, 136, 0, 0.3), inset 0 0 5px rgba(255, 136, 0, 0.1)'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '2px solid #FF8800',
    borderRadius: '4px',
    padding: '10px',
    fontFamily: 'Courier New, monospace',
    fontSize: '14px',
    width: '200px',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000000',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'all 0.3s ease'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  scorePanel: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FF8800',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(255, 136, 0, 0.4)'
  },
  scoreNumber: {
    fontSize: '72px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textShadow: '0 0 20px currentColor'
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #333',
    transition: 'background-color 0.3s ease'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: 'bold'
  },
  excellent: { color: '#00FF00' },
  good: { color: '#FFFF00' },
  warning: { color: '#FFA500' },
  poor: { color: '#FF0000' },
  explanation: {
    backgroundColor: '#0f0f0f',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '10px',
    fontSize: '11px',
    color: '#CCC'
  },
  glowText: {
    textShadow: '0 0 10px rgba(255, 136, 0, 0.8)',
    animation: 'pulse 2s infinite'
  },
  comparisonTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  comparisonHeader: {
    backgroundColor: '#1a1a1a',
    borderBottom: '2px solid #FF8800'
  },
  strengthWeaknessGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  }
};

// Animaciones CSS
const animationStyles = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }
  
  @keyframes dataUpdate {
    0% { background-color: rgba(255, 136, 0, 0.2); }
    100% { background-color: transparent; }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(255, 136, 0, 0.3); }
    50% { box-shadow: 0 0 20px rgba(255, 136, 0, 0.6); }
    100% { box-shadow: 0 0 5px rgba(255, 136, 0, 0.3); }
  }
  
  @keyframes needleMove {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(var(--rotation)); }
  }
`;

// VELOCÍMETRO PROFESIONAL MEJORADO
const ProfessionalGauge = ({ score, size = 350 }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [needleRotation, setNeedleRotation] = useState(-90);
  const animationRef = useRef(null);
  
  useEffect(() => {
    // Animación suave del score
    const duration = 2000;
    const start = displayScore;
    const end = score;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function para movimiento más natural
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentScore = Math.round(start + (end - start) * easeOutQuart);
      setDisplayScore(currentScore);
      
      const rotation = -90 + (currentScore / 100) * 180;
      setNeedleRotation(rotation);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [score, displayScore]); // Agregar displayScore a dependencias
  
  const getZoneColor = (value) => {
    if (value >= 80) return '#00FF00';
    if (value >= 60) return '#FFFF00';
    if (value >= 40) return '#FF8800';
    return '#FF0000';
  };
  
  // Crear gradiente para las zonas
  const createGradient = (startColor, endColor, id) => (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor={startColor} stopOpacity="0.3" />
      <stop offset="100%" stopColor={endColor} stopOpacity="0.8" />
    </linearGradient>
  );
  
  const centerX = size / 2;
  const centerY = size / 2 + 20;
  const radius = size / 2 - 40;
  
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <svg width={size} height={size * 0.7} style={{ filter: 'drop-shadow(0 0 10px rgba(255, 136, 0, 0.3))' }}>
        <defs>
          {createGradient('#FF0000', '#FF4444', 'redZone')}
          {createGradient('#FF8800', '#FFAA00', 'orangeZone')}
          {createGradient('#FFFF00', '#FFFF44', 'yellowZone')}
          {createGradient('#00FF00', '#44FF44', 'greenZone')}
          
          {/* Filtro de brillo para la aguja */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Fondo del medidor */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="30"
        />
        
        {/* Zonas de color con gradientes */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX - radius * 0.7} ${centerY - radius * 0.7}`}
          fill="none"
          stroke="url(#redZone)"
          strokeWidth="28"
        />
        <path
          d={`M ${centerX - radius * 0.7} ${centerY - radius * 0.7} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY - radius}`}
          fill="none"
          stroke="url(#orangeZone)"
          strokeWidth="28"
        />
        <path
          d={`M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX + radius * 0.7} ${centerY - radius * 0.7}`}
          fill="none"
          stroke="url(#yellowZone)"
          strokeWidth="28"
        />
        <path
          d={`M ${centerX + radius * 0.7} ${centerY - radius * 0.7} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="url(#greenZone)"
          strokeWidth="28"
        />
        
        {/* Marcas de graduación */}
        {[0, 25, 50, 75, 100].map((value, i) => {
          const angle = -90 + (value / 100) * 180;
          const radian = (angle * Math.PI) / 180;
          const x1 = centerX + (radius - 35) * Math.cos(radian);
          const y1 = centerY + (radius - 35) * Math.sin(radian);
          const x2 = centerX + (radius - 20) * Math.cos(radian);
          const y2 = centerY + (radius - 20) * Math.sin(radian);
          
          return (
            <g key={value}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={centerX + (radius - 50) * Math.cos(radian)}
                y={centerY + (radius - 50) * Math.sin(radian)}
                fill="#808080"
                fontSize="14"
                fontFamily="Courier New"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {value}
              </text>
            </g>
          );
        })}
        
        {/* Aguja con animación */}
        <g transform={`rotate(${needleRotation} ${centerX} ${centerY})`} style={{ transition: 'transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
          {/* Sombra de la aguja */}
          <polygon
            points={`${centerX},${centerY - 5} ${centerX + radius - 20},${centerY} ${centerX},${centerY + 5}`}
            fill="#000000"
            opacity="0.3"
            transform="translate(2, 2)"
          />
          
          {/* Aguja principal */}
          <polygon
            points={`${centerX},${centerY - 5} ${centerX + radius - 20},${centerY} ${centerX},${centerY + 5}`}
            fill="#FFFFFF"
            filter="url(#glow)"
          />
          
          {/* Línea central de la aguja */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius - 25}
            y2={centerY}
            stroke="#FF8800"
            strokeWidth="2"
          />
        </g>
        
        {/* Centro de la aguja */}
        <circle cx={centerX} cy={centerY} r="12" fill="#1a1a1a" stroke="#FF8800" strokeWidth="3" />
        <circle cx={centerX} cy={centerY} r="6" fill="#FF8800" />
        
        {/* Arco de progreso */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 ${displayScore > 50 ? 1 : 0} 1 ${
            centerX + radius * Math.cos((-90 + (displayScore / 100) * 180) * Math.PI / 180)
          } ${
            centerY + radius * Math.sin((-90 + (displayScore / 100) * 180) * Math.PI / 180)
          }`}
          fill="none"
          stroke={getZoneColor(displayScore)}
          strokeWidth="3"
          opacity="0.8"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Display digital mejorado */}
      <div style={{ marginTop: '-50px', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          fontSize: '60px', 
          color: getZoneColor(displayScore), 
          fontWeight: 'bold',
          textShadow: `0 0 30px ${getZoneColor(displayScore)}`,
          letterSpacing: '2px'
        }}>
          {displayScore}
        </div>
        <div style={{ 
          fontSize: '16px', 
          color: '#808080',
          letterSpacing: '1px',
          marginTop: '-10px'
        }}>
          WARREN BUFFETT SCORE
        </div>
        
        {/* Indicador de calidad */}
        <div style={{
          marginTop: '10px',
          padding: '5px 15px',
          backgroundColor: getZoneColor(displayScore) + '20',
          border: `1px solid ${getZoneColor(displayScore)}`,
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          <span style={{ 
            color: getZoneColor(displayScore),
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {displayScore >= 80 ? 'INVERSIÓN EXCELENTE' :
             displayScore >= 60 ? 'INVERSIÓN BUENA' :
             displayScore >= 40 ? 'INVERSIÓN REGULAR' :
             'EVITAR INVERSIÓN'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Función para obtener color según el score
const getScoreColor = (score) => {
  if (score >= 80) return '#00FF00';
  if (score >= 60) return '#FFFF00';
  if (score >= 40) return '#FFA500';
  return '#FF0000';
};

// Función para obtener el grado
const getGrade = (score) => {
  if (score >= 80) return 'A - EXCELENTE';
  if (score >= 60) return 'B - BUENA';
  if (score >= 40) return 'C - REGULAR';
  return 'D - EVITAR';
};

// Datos de las métricas de Buffett con explicaciones
const buffettMetrics = [
  {
    key: 'ROE',
    name: 'Return on Equity (ROE)',
    description: 'Retorno sobre Patrimonio',
    threshold: '>15%',
    explanation: 'Mide qué tan bien usa la compañía el dinero de los accionistas para generar ganancias. Buffett busca compañías que generen consistentemente >15% anual.',
    why: 'Una compañía con alto ROE significa que es muy eficiente convirtiendo la inversión de accionistas en ganancias.'
  },
  {
    key: 'ROA',
    name: 'Return on Assets (ROA)',
    description: 'Retorno sobre Activos',
    threshold: '>5%',
    explanation: 'Indica qué tan eficientemente la compañía usa TODOS sus activos para generar ganancias. Incluye deuda y patrimonio.',
    why: 'Compañías con alto ROA son expertas en generar ganancias sin necesidad de muchos activos o deuda excesiva.'
  },
  {
    key: 'P_E_ratio',
    name: 'Price to Earnings (P/E)',
    description: 'Precio sobre Ganancias',
    threshold: '<25',
    explanation: 'Cuánto pagas por cada $1 de ganancia anual. Un P/E de 20 significa que pagas $20 por cada $1 que gana la compañía.',
    why: 'Buffett evita compañías sobrevaloradas. Un P/E bajo sugiere que puedes comprar ganancias futuras a precio razonable.'
  },
  {
    key: 'debt_to_equity_ratio',
    name: 'Debt to Equity Ratio',
    description: 'Ratio Deuda/Patrimonio',
    threshold: '<0.5',
    explanation: 'Cuánta deuda tiene la compañía vs su patrimonio. 0.5 significa 50 cents de deuda por cada $1 de patrimonio.',
    why: 'Compañías muy endeudadas son riesgosas. Buffett prefiere compañías conservadoras que no dependan de deuda para crecer.'
  },
  {
    key: 'profit_margin',
    name: 'Profit Margin',
    description: 'Margen de Ganancia',
    threshold: '>15%',
    explanation: 'Qué porcentaje de cada venta se convierte en ganancia neta. 20% significa que de cada $100 vendidos, $20 son ganancia.',
    why: 'Márgenes altos indican que la compañía tiene ventajas competitivas y puede controlar costos efectivamente.'
  },
  {
    key: 'operating_margin',
    name: 'Operating Margin',
    description: 'Margen Operativo',
    threshold: '>20%',
    explanation: 'Ganancia operativa como % de ventas, antes de intereses e impuestos. Mide eficiencia operativa pura.',
    why: 'Buffett busca compañías que operen eficientemente. Alto margen operativo = excelente control de costos.'
  }
];

// Función helper para parsear el response de Perplexity
const parsePerplexityResponse = (perplexityData) => {
  if (!perplexityData || !perplexityData.choices || !perplexityData.choices[0]) {
    return null;
  }
  
  try {
    const content = perplexityData.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Si no encuentra JSON, intentar parsear directamente
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing Perplexity response:', error);
    return null;
  }
};

// Función helper para formatear valores
const formatValue = (value, defaultValue = '-') => {
  if (!value || 
      value === 'N/A' || 
      value === 'No disponible' || 
      value === 'Not available' ||
      value === 'Not available in search results' ||
      (typeof value === 'string' && value.includes('No disponible')) ||
      (typeof value === 'string' && value.includes('Not available')) ||
      (typeof value === 'string' && value.includes('Not provided')) ||
      (typeof value === 'string' && value.includes('search results'))) {
    return defaultValue;
  }
  return value;
};

function FundamentalAnalysisModule() {
  const [symbol, setSymbol] = useState('AAPL');
  const [fundamentals, setFundamentals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para modo comparación
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonSymbols, setComparisonSymbols] = useState([]);
  const [comparisonData, setComparisonData] = useState({});
  const [newComparisonSymbol, setNewComparisonSymbol] = useState('');
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Cargar AAPL automáticamente al iniciar
  useEffect(() => {
    // Solo cargar una vez al montar el componente
    // No incluimos analyzeFundamentals en las dependencias porque
    // queremos que se ejecute solo una vez con el valor inicial
    analyzeFundamentals('AAPL');
  }, []); // Array vacío = solo ejecuta una vez al montar

  const analyzeFundamentals = async (symbolParam) => {
    const targetSymbol = (symbolParam || symbol || '').toUpperCase();
    if (!targetSymbol) return;
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const data = await apiCall(`/api/fundamentals-perplexity/${targetSymbol}`);
      setFundamentals(data);
      
      // Si estamos en modo comparación, actualizar también los datos de comparación
      if (comparisonMode && comparisonSymbols.includes(targetSymbol)) {
        setComparisonData(prev => ({
          ...prev,
          [targetSymbol]: data
        }));
      }
    } catch (err) {
      setError(`Error al obtener datos de ${targetSymbol}: ${err.message}`);
    }

    setLoading(false);
  };

  // Función para agregar empresa a comparación
  const addToComparison = async (symbolToAdd) => {
    if (!symbolToAdd || comparisonSymbols.length >= 3 || comparisonSymbols.includes(symbolToAdd)) {
      return;
    }
    
    setLoadingComparison(true);
    setComparisonSymbols([...comparisonSymbols, symbolToAdd]);
    
    try {
      const data = await apiCall(`/api/fundamentals-perplexity/${symbolToAdd}`);
      setComparisonData(prev => ({
        ...prev,
        [symbolToAdd]: data
      }));
    } catch (error) {
      console.error('Error adding to comparison:', error);
      // Remover el símbolo si falló
      setComparisonSymbols(prev => prev.filter(s => s !== symbolToAdd));
    }
    
    setLoadingComparison(false);
    setNewComparisonSymbol('');
  };

  const getMetricColor = (key, value) => {
    const numValue = parseFloat(value);

    switch(key) {
      case 'ROE':
        return numValue >= 15 ? styles.excellent : styles.poor;
      case 'ROA':
        return numValue >= 5 ? styles.excellent : styles.poor;
      case 'P_E_ratio':
        return numValue <= 25 ? styles.excellent : styles.poor;
      case 'debt_to_equity_ratio':
        return numValue <= 0.5 ? styles.excellent : styles.poor;
      case 'profit_margin':
        return numValue >= 15 ? styles.excellent : styles.poor;
      case 'operating_margin':
        return numValue >= 20 ? styles.excellent : styles.poor;
      default:
        return { color: '#FF8800' };
    }
  };

  const getMetricStatus = (key, value) => {
    const numValue = parseFloat(value);

    switch(key) {
      case 'ROE':
        return numValue >= 15 ? '✓ EXCELENTE' : '✗ BAJO';
      case 'ROA':
        return numValue >= 5 ? '✓ EXCELENTE' : '✗ BAJO';
      case 'P_E_ratio':
        return numValue <= 25 ? '✓ RAZONABLE' : '✗ ALTO';
      case 'debt_to_equity_ratio':
        return numValue <= 0.5 ? '✓ CONSERVADOR' : '✗ ALTO RIESGO';
      case 'profit_margin':
        return numValue >= 15 ? '✓ EXCELENTE' : '✗ BAJO';
      case 'operating_margin':
        return numValue >= 20 ? '✓ EXCELENTE' : '✗ BAJO';
      default:
        return '';
    }
  };

  // Panel de Fortalezas y Debilidades
  const renderStrengthsWeaknesses = () => {
    if (!fundamentals?.financials) return null;
    
    const strengths = [];
    const weaknesses = [];
    
    // Análisis automático con formatValue y null checks
    const cleanROE = formatValue(fundamentals.financials.ROE);
    const cleanROA = formatValue(fundamentals.financials.ROA);
    const cleanPE = formatValue(fundamentals.financials.P_E_ratio);
    const cleanDebtToEquity = formatValue(fundamentals.financials.debt_to_equity_ratio);
    const cleanProfitMargin = formatValue(fundamentals.financials.profit_margin);
    const cleanOperatingMargin = formatValue(fundamentals.financials.operating_margin);
    
    const roe = cleanROE !== '-' ? parseFloat(cleanROE) : null;
    const roa = cleanROA !== '-' ? parseFloat(cleanROA) : null;
    const pe = cleanPE !== '-' ? parseFloat(cleanPE) : null;
    const debtToEquity = cleanDebtToEquity !== '-' ? parseFloat(cleanDebtToEquity) : null;
    const profitMargin = cleanProfitMargin !== '-' ? parseFloat(cleanProfitMargin) : null;
    const operatingMargin = cleanOperatingMargin !== '-' ? parseFloat(cleanOperatingMargin) : null;
    
    if (roe !== null && !isNaN(roe) && roe > 15) {
      strengths.push({
        title: 'ROE EXCEPCIONAL',
        value: `${roe.toFixed(1)}%`,
        detail: 'Supera meta Buffett (>15%)'
      });
    } else if (roe !== null && !isNaN(roe)) {
      weaknesses.push({
        title: 'ROE BAJO',
        value: `${roe.toFixed(1)}%`,
        detail: 'Por debajo del objetivo Buffett'
      });
    }
    
    if (debtToEquity !== null && !isNaN(debtToEquity) && debtToEquity < 0.5) {
      strengths.push({
        title: 'BAJO APALANCAMIENTO',
        value: `D/E: ${debtToEquity.toFixed(2)}`,
        detail: 'Empresa conservadora'
      });
    } else if (debtToEquity !== null && !isNaN(debtToEquity)) {
      weaknesses.push({
        title: 'ALTO APALANCAMIENTO',
        value: `D/E: ${debtToEquity.toFixed(2)}`,
        detail: 'Riesgo por deuda elevada'
      });
    }
    
    if (profitMargin !== null && !isNaN(profitMargin) && profitMargin > 15) {
      strengths.push({
        title: 'MÁRGENES ALTOS',
        value: `${profitMargin.toFixed(1)}%`,
        detail: 'Ventaja competitiva fuerte'
      });
    }
    
    if (pe !== null && !isNaN(pe) && pe > 25) {
      weaknesses.push({
        title: 'VALORACIÓN ELEVADA',
        value: `P/E: ${pe.toFixed(1)}`,
        detail: 'Por encima del promedio'
      });
    }
    
    if (operatingMargin !== null && !isNaN(operatingMargin) && operatingMargin > 20) {
      strengths.push({
        title: 'EFICIENCIA OPERATIVA',
        value: `${operatingMargin.toFixed(1)}%`,
        detail: 'Excelente control de costos'
      });
    }
    
    return (
      <div style={{...styles.panel, ...styles.neonBorder}}>
        <div style={styles.strengthWeaknessGrid}>
          {/* Fortalezas */}
          <div style={{ borderRight: '1px solid #333', paddingRight: '20px' }}>
            <h3 style={{ color: '#00FF00', marginBottom: '15px', textShadow: '0 0 10px #00FF00' }}>
              ▲ FORTALEZAS DETECTADAS
            </h3>
            {strengths.map((item, index) => (
              <div key={index} style={{ marginBottom: '15px', animation: 'pulse 2s infinite' }}>
                <div style={{ color: '#00FF00', fontSize: '14px', fontWeight: 'bold' }}>
                  {item.title}
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '20px', margin: '5px 0' }}>
                  {item.value}
                </div>
                <div style={{ color: '#808080', fontSize: '11px' }}>
                  {item.detail}
                </div>
              </div>
            ))}
            {strengths.length === 0 && (
              <div style={{ color: '#808080', fontSize: '12px' }}>
                No se detectaron fortalezas significativas
              </div>
            )}
          </div>
          
          {/* Debilidades */}
          <div style={{ paddingLeft: '20px' }}>
            <h3 style={{ color: '#FF0000', marginBottom: '15px', textShadow: '0 0 10px #FF0000' }}>
              ▼ ALERTAS Y RIESGOS
            </h3>
            {weaknesses.map((item, index) => (
              <div key={index} style={{ marginBottom: '15px', animation: 'pulse 2s infinite' }}>
                <div style={{ color: '#FF0000', fontSize: '14px', fontWeight: 'bold' }}>
                  {item.title}
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '20px', margin: '5px 0' }}>
                  {item.value}
                </div>
                <div style={{ color: '#808080', fontSize: '11px' }}>
                  {item.detail}
                </div>
              </div>
            ))}
            {weaknesses.length === 0 && (
              <div style={{ color: '#808080', fontSize: '12px' }}>
                No se detectaron riesgos significativos
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Tabla comparativa ARREGLADA
  const renderComparisonTable = () => {
    if (!comparisonMode || comparisonSymbols.length === 0) return null;
    
    const metrics = [
      { key: 'buffettScore', label: 'WARREN SCORE', suffix: '/100', path: ['analysis', 'buffettScore'] },
      { key: 'ROE', label: 'ROE', suffix: '%', path: ['financials', 'ROE'] },
      { key: 'ROA', label: 'ROA', suffix: '%', path: ['financials', 'ROA'] },
      { key: 'debt_to_equity_ratio', label: 'DEUDA/PATRIMONIO', suffix: '', path: ['financials', 'debt_to_equity_ratio'] },
      { key: 'profit_margin', label: 'MARGEN NETO', suffix: '%', path: ['financials', 'profit_margin'] },
      { key: 'operating_margin', label: 'MARGEN OPERATIVO', suffix: '%', path: ['financials', 'operating_margin'] }
    ];
    
    return (
      <div style={{...styles.panel, ...styles.neonBorder}}>
        <h2 style={{ color: '#FF8800', marginBottom: '20px', textShadow: '0 0 10px #FF8800' }}>
          MODO COMPARACIÓN BUFFETT
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={newComparisonSymbol}
            onChange={(e) => setNewComparisonSymbol(e.target.value.toUpperCase())}
            placeholder="Agregar símbolo..."
            style={{...styles.input, width: '150px'}}
            onKeyPress={(e) => e.key === 'Enter' && addToComparison(newComparisonSymbol)}
          />
          <button 
            onClick={() => addToComparison(newComparisonSymbol)}
            style={styles.button}
            disabled={comparisonSymbols.length >= 3 || loadingComparison}
          >
            {loadingComparison ? 'CARGANDO...' : 'AGREGAR'}
          </button>
          <span style={{ marginLeft: '20px', color: '#808080', fontSize: '11px' }}>
            {comparisonSymbols.length}/3 empresas
          </span>
        </div>
        
        <table style={styles.comparisonTable}>
          <thead>
            <tr style={styles.comparisonHeader}>
              <th style={{ textAlign: 'left', padding: '10px', color: '#FF8800' }}>
                MÉTRICA
              </th>
              {comparisonSymbols.map(sym => (
                <th key={sym} style={{ textAlign: 'center', padding: '10px', color: '#FF8800' }}>
                  {sym}
                  <button
                    onClick={() => {
                      setComparisonSymbols(comparisonSymbols.filter(s => s !== sym));
                      const newData = {...comparisonData};
                      delete newData[sym];
                      setComparisonData(newData);
                    }}
                    style={{
                      marginLeft: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#FF0000',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => (
              <tr key={metric.key} style={{ 
                borderBottom: '1px solid #333',
                backgroundColor: idx % 2 === 0 ? '#0a0a0a' : 'transparent'
              }}>
                <td style={{ padding: '10px', color: '#808080' }}>
                  {metric.label}
                </td>
                {comparisonSymbols.map(sym => {
                  let value = comparisonData[sym];
                  metric.path.forEach(p => {
                    value = value?.[p];
                  });
                  
                  // Aplicar formatValue primero para limpiar "N/A"
                  const cleanValue = formatValue(value);
                  const numValue = cleanValue !== '-' ? parseFloat(cleanValue) : null;
                  let color = '#808080';
                  
                  if (cleanValue !== '-' && numValue !== null && !isNaN(numValue)) {
                    if (metric.key === 'buffettScore') {
                      color = getScoreColor(numValue);
                    } else {
                      color = getMetricColor(metric.key, cleanValue).color;
                    }
                  }
                  
                  return (
                    <td key={sym} style={{ 
                      textAlign: 'center', 
                      padding: '10px',
                      color: color,
                      fontWeight: 'bold'
                    }}>
                      {cleanValue !== '-' && numValue !== null && !isNaN(numValue) ? `${numValue.toFixed(1)}${metric.suffix}` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          onClick={() => {
            setComparisonMode(false);
            setComparisonSymbols([]);
            setComparisonData({});
          }}
          style={{
            ...styles.button,
            marginTop: '20px',
            backgroundColor: '#FF0000'
          }}
        >
          CERRAR COMPARACIÓN
        </button>
      </div>
    );
  };

  return (
    <div style={styles.terminal}>
      <style>{animationStyles}</style>
      
      <h2 style={{ color: '#FF8800', marginBottom: '20px', fontSize: '18px', textShadow: '0 0 10px #FF8800' }}>
        ANÁLISIS FUNDAMENTAL [F7] - MÉTODO WARREN BUFFETT
      </h2>

      {/* Panel de Input */}
      <div style={{...styles.panel, ...styles.neonBorder}}>
        <h3 style={{ marginBottom: '15px' }}>CONSULTAR COMPAÑÍA</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <TickerSearchInput
              placeholder="AAPL"
              onSelectTicker={(t) => {
                setSymbol(t.symbol);
                analyzeFundamentals(t.symbol);
              }}
              style={{ width: '200px' }}
            />
            <button
              onClick={() => analyzeFundamentals()}
              style={styles.button}
              disabled={loading}
            >
              {loading ? 'ANALIZANDO...' : 'ANALIZAR'}
            </button>
          </div>
          
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            style={{
              ...styles.button,
              backgroundColor: comparisonMode ? '#00FF00' : '#808080'
            }}
          >
            MODO COMPARACIÓN {comparisonMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {error && (
          <div style={{ color: '#FF0000', marginTop: '10px' }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* Modo Comparación */}
      {comparisonMode && renderComparisonTable()}

      {/* Resultados del Análisis */}
      {fundamentals && !comparisonMode && (
        <>
          {/* Header de la Compañía */}
          <div style={{...styles.panel, animation: 'glow 3s infinite'}}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
              {fundamentals.ticker} - {fundamentals.company}
            </h3>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Análisis actualizado: {fundamentals.date} | Datos: Perplexity AI + SEC Filings
            </div>
          </div>

          <div style={styles.grid}>
            {/* Panel Score Buffett con Velocímetro PROFESIONAL */}
            <div style={styles.scorePanel}>
              <h3 style={{ marginBottom: '20px', textShadow: '0 0 10px #FF8800' }}>WARREN BUFFETT SCORE</h3>
              <ProfessionalGauge score={fundamentals?.analysis?.buffettScore || 0} />
              <div style={{ fontSize: '18px', color: '#FF8800', marginBottom: '10px' }}>
                {formatValue(fundamentals?.analysis?.grade)}
              </div>
              <div style={{ fontSize: '14px', color: '#00FF00' }}>
                {formatValue(fundamentals?.analysis?.recommendation)}
              </div>

              <div style={styles.explanation}>
                <strong>¿Qué significa este score?</strong><br/>
                El Score Buffett evalúa la compañía según los 6 criterios que Warren Buffett
                usa para identificar inversiones de calidad. Cada métrica vale hasta 16.67 puntos.
              </div>
            </div>

            {/* Panel Métricas Principales */}
            <div style={styles.panel}>
              <h3 style={{ marginBottom: '15px', textShadow: '0 0 5px #FF8800' }}>MÉTRICAS WARREN BUFFETT</h3>

              {buffettMetrics.map((metric) => {
                const value = fundamentals?.financials?.[metric.key];
                if (!value) return null;

                return (
                  <div key={metric.key}>
                    <div style={{...styles.metricRow, '&:hover': { backgroundColor: '#1a1a1a' }}}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#FF8800' }}>
                          {metric.description}
                        </div>
                        <div style={styles.metricLabel}>
                          Meta Buffett: {metric.threshold}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          ...styles.metricValue,
                          ...getMetricColor(metric.key, value)
                        }}>
                          {value}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          ...getMetricColor(metric.key, value)
                        }}>
                          {getMetricStatus(metric.key, value)}
                        </div>
                      </div>
                    </div>

                    <div style={styles.explanation}>
                      <strong>¿Por qué es importante?</strong><br/>
                      {metric.why}
                      <br/><br/>
                      <strong>Explicación técnica:</strong><br/>
                      {metric.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel de Fortalezas y Debilidades */}
          {renderStrengthsWeaknesses()}

          {/* Panel Datos Adicionales */}
          <div style={styles.panel}>
            <h3 style={{ marginBottom: '15px', textShadow: '0 0 5px #FF8800' }}>DATOS ADICIONALES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

              <div>
                <div style={styles.metricLabel}>Market Cap</div>
                <div style={{ fontSize: '16px', color: '#00FF00' }}>
                  {formatValue(fundamentals?.financials?.market_cap)}
                </div>
              </div>

              <div>
                <div style={styles.metricLabel}>Revenue TTM</div>
                <div style={{ fontSize: '16px', color: '#00FF00' }}>
                  {formatValue(fundamentals?.financials?.revenue_TTM)}
                </div>
              </div>

              <div>
                <div style={styles.metricLabel}>Free Cash Flow</div>
                <div style={{ fontSize: '16px', color: '#00FF00' }}>
                  {formatValue(fundamentals?.financials?.free_cash_flow)}
                </div>
              </div>

              <div>
                <div style={styles.metricLabel}>EPS</div>
                <div style={{ fontSize: '16px', color: '#00FF00' }}>
                  ${formatValue(fundamentals?.financials?.EPS)}
                </div>
              </div>

              <div>
                <div style={styles.metricLabel}>Dividend Yield</div>
                <div style={{ fontSize: '16px', color: '#FFFF00' }}>
                  {formatValue(fundamentals?.financials?.dividend_yield)}
                </div>
              </div>
            </div>

            <div style={styles.explanation}>
              <strong>Fuentes de datos:</strong> SEC Filings, stockanalysis.com, Bloomberg Terminal<br/>
              <strong>Metodología:</strong> Análisis basado en los criterios de inversión de Warren Buffett<br/>
              <strong>Actualización:</strong> Datos financieros TTM (Trailing Twelve Months)
            </div>
          </div>

          {/* Panel Interpretación para No-Financieros */}
          <div style={{...styles.panel, ...styles.neonBorder}}>
            <h3 style={{ marginBottom: '15px', textShadow: '0 0 5px #FF8800' }}>INTERPRETACIÓN PARA INVERSORES</h3>

            <div style={styles.explanation}>
              <strong>En términos simples:</strong><br/>
              • <strong style={{ color: '#00FF00' }}>ROE alto</strong> = La compañía es muy buena convirtiendo tu inversión en ganancias<br/>
              • <strong style={{ color: '#00FF00' }}>ROA alto</strong> = La compañía es eficiente usando todos sus recursos<br/>
              • <strong style={{ color: '#FFFF00' }}>P/E moderado</strong> = No estás pagando demasiado por las ganancias futuras<br/>
              • <strong style={{ color: '#FF0000' }}>Deuda baja</strong> = La compañía no depende de préstamos para funcionar<br/>
              • <strong style={{ color: '#00FF00' }}>Márgenes altos</strong> = La compañía tiene ventajas competitivas<br/><br/>

              <strong>Para {fundamentals.ticker}:</strong><br/>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                marginTop: '10px',
                borderLeft: `4px solid ${getScoreColor(fundamentals?.analysis?.buffettScore || 0)}`
              }}>
                {fundamentals?.analysis?.buffettScore >= 80 ?
                  "✅ Compañía de ALTA CALIDAD según criterios Buffett. Ideal para inversión a largo plazo. Esta empresa demuestra excelencia operativa y financiera." :
                fundamentals?.analysis?.buffettScore >= 60 ?
                  "⚠️ Compañía con BUENOS fundamentals pero algunos aspectos a considerar. Analizar precio de entrada y monitorear las debilidades identificadas." :
                fundamentals?.analysis?.buffettScore >= 40 ?
                  "⚡ Compañía con fundamentals MIXTOS. Requiere análisis adicional de riesgos y seguimiento cercano de métricas clave." :
                  "❌ Compañía que NO CUMPLE los criterios conservadores de Buffett. Alto riesgo. Considerar otras opciones de inversión."
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FundamentalAnalysisModule;
