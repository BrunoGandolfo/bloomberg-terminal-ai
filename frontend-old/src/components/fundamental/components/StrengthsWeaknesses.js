import React from 'react';
import { formatValue } from '../utils/fundamentalFormatters';
import { styles } from '../utils/fundamentalStyles';

const StrengthsWeaknesses = ({ fundamentals }) => {
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

export default StrengthsWeaknesses; 