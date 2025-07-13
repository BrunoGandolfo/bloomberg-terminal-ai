import React from 'react';
import ProfessionalGauge from './ProfessionalGauge';
import { getScoreColor, getGrade, buffettMetrics, formatValue, getMetricColor, getMetricStatus } from '../utils/fundamentalFormatters';
import { styles } from '../utils/fundamentalStyles';

const BuffettScorePanel = ({ fundamentals }) => {
  const parsedData = fundamentals?.perplexityAnalysis;
  
  if (!parsedData || !parsedData.buffett_score) {
    return null;
  }

  const score = parsedData.buffett_score;
  const scoreColor = getScoreColor(score);
  const grade = getGrade(score);

  return (
    <div style={styles.panel}>
      <h3 style={{ ...styles.glowText, color: '#FF8800', fontSize: '24px', marginBottom: '20px' }}>
        ANÁLISIS WARREN BUFFETT
      </h3>
      
      <ProfessionalGauge score={score} size={350} />
      
      <div style={{ ...styles.scorePanel, marginTop: '30px' }}>
        <div style={{ ...styles.scoreNumber, color: scoreColor }}>
          {score}
        </div>
        <div style={{ fontSize: '18px', color: scoreColor, fontWeight: 'bold' }}>
          {grade}
        </div>
      </div>

      {/* Métricas individuales */}
      <div style={{ marginTop: '30px' }}>
        <h4 style={{ color: '#FF8800', marginBottom: '15px' }}>MÉTRICAS CLAVE</h4>
        {buffettMetrics.map((metric) => {
          const value = parsedData.metrics?.[metric.key];
          const formattedValue = formatValue(value);
          
          return (
            <div key={metric.key} style={styles.metricRow}>
              <div>
                <div style={styles.metricLabel}>{metric.name}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  Objetivo: {metric.threshold}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...styles.metricValue, ...getMetricColor(metric.key, value, styles) }}>
                  {formattedValue}
                  {metric.key !== 'debt_to_equity_ratio' && metric.key !== 'P_E_ratio' && formattedValue !== '-' ? '%' : ''}
                </div>
                <div style={{ fontSize: '10px', marginTop: '2px', ...getMetricColor(metric.key, value, styles) }}>
                  {getMetricStatus(metric.key, value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicación de métricas */}
      <div style={{ marginTop: '30px' }}>
        <h4 style={{ color: '#FF8800', marginBottom: '15px' }}>ENTENDER LAS MÉTRICAS</h4>
        {buffettMetrics.map((metric) => (
          <div key={`${metric.key}_explanation`} style={styles.explanation}>
            <div style={{ color: '#FF8800', fontWeight: 'bold', marginBottom: '5px' }}>
              {metric.name}
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              {metric.explanation}
            </div>
            <div style={{ fontSize: '10px', color: '#FFFF00', marginTop: '5px', fontStyle: 'italic' }}>
              💡 {metric.why}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuffettScorePanel; 