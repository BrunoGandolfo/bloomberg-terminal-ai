import React from 'react';
import { colors } from '../../../../styles/colors';
import { typography } from '../../../../styles/typography';
import { tokens } from '../../../../styles/tokens';
import { SCREENER_OPTIONS } from './screenerOptions';

// Componente ScreenerModal (anteriormente ScreenerPanel)
const ScreenerModal = ({ onSelectSymbol }) => {
  const screenerStyles = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '800px',
    maxHeight: '600px',
    backgroundColor: colors.neutral.background || '#0a0a0a',
    border: `2px solid ${colors.primary.orange || '#FF8800'}`,
    borderRadius: tokens.radii?.base || '4px',
    padding: tokens.spacing?.[5] || '20px',
    overflowY: 'auto',
    zIndex: tokens.zIndices?.modal || 9999,
    boxShadow: tokens.shadows?.xl || '0 20px 50px rgba(0,0,0,0.8)'
  };

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: tokens.zIndices?.modalBackdrop || 9998
  };

  const screenerItemStyle = {
    border: '1px solid #333333',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#000000',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <>
      <div style={overlayStyles} onClick={() => onSelectSymbol(null)} />
      <div style={screenerStyles}>
        <h3 style={{ 
          color: colors.primary.orange || '#FF8800', 
          marginBottom: tokens.spacing?.[3] || '12px',
          fontSize: typography.fontSize?.xl || '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          Stock Screener
        </h3>
        
        <p style={{ 
          color: colors.neutral?.text || '#999999', 
          marginBottom: tokens.spacing?.[4] || '16px',
          fontSize: '14px'
        }}>
          Seleccione un screener para explorar diferentes categorías de acciones:
        </p>

        <div>
          {SCREENER_OPTIONS.map((screener) => (
            <div
              key={screener.id}
              style={screenerItemStyle}
              onClick={() => onSelectSymbol(screener.symbol)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.border = '1px solid #FF8800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.border = '1px solid #333333';
              }}
            >
              <div>
                <h4 style={{ 
                  color: '#FF8800', 
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {screener.name}
                </h4>
                <p style={{ 
                  color: '#CCCCCC', 
                  margin: '5px 0 0 0',
                  fontSize: '12px'
                }}>
                  {screener.description}
                </p>
              </div>
              <div style={{
                color: '#FF8800',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Demo: {screener.symbol}
              </div>
            </div>
          ))}
        </div>

        <p style={{ 
          color: '#666666', 
          marginTop: tokens.spacing?.[4] || '16px',
          fontSize: '11px',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Nota: Los screeners completos con datos en tiempo real se integrarán próximamente
        </p>
      </div>
    </>
  );
};

export default ScreenerModal; 