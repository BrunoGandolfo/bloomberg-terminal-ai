// frontend/src/components/ui/Card.js
import React from 'react';
import { colors } from '../../styles/colors';
import { tokens } from '../../styles/tokens';

export const Card = ({ 
  children, 
  variant = 'default',
  hoverable = false,
  glowing = false,
  neon = false,
  className = '',
  style = {},
  ...props 
}) => {
  const variants = {
    default: {
      backgroundColor: colors.neutral.background,
      border: `1px solid ${colors.neutral.border}`,
      boxShadow: 'none'
    },
    elevated: {
      backgroundColor: colors.neutral.surface,
      border: `1px solid ${colors.neutral.borderHover}`,
      boxShadow: tokens.shadows.base
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${colors.primary.orange}`,
      boxShadow: 'none'
    },
    neon: {
      backgroundColor: colors.neutral.surface,
      border: `2px solid ${colors.primary.orange}`,
      boxShadow: tokens.shadows.neonOrange
    }
  };
  
  const baseStyles = {
    borderRadius: tokens.radii.base,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[5],
    transition: tokens.transitions.base,
    position: 'relative',
    overflow: 'hidden',
    ...variants[neon ? 'neon' : variant],
    ...style
  };
  
  return (
    <div
      style={baseStyles}
      className={`bloomberg-card ${className}`}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = colors.primary.orange;
          e.currentTarget.style.boxShadow = tokens.shadows.neonOrange;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = variants[variant].border.split(' ')[2];
          e.currentTarget.style.boxShadow = variants[variant].boxShadow;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {glowing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at center, ${colors.primary.orange}10 0%, transparent 70%)`,
          animation: 'pulse 2s infinite',
          pointerEvents: 'none'
        }} />
      )}
      {children}
    </div>
  );
};
