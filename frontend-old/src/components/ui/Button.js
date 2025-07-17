// frontend/src/components/ui/Button.js
import React from 'react';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { tokens } from '../../styles/tokens';

const buttonVariants = {
  primary: {
    backgroundColor: colors.primary.orange,
    color: colors.primary.black,
    border: 'none',
    
    '&:hover': {
      backgroundColor: '#FF9900'
    }
  },
  
  secondary: {
    backgroundColor: 'transparent',
    color: colors.primary.orange,
    border: `1px solid ${colors.neutral.border}`,
    
    '&:hover': {
      borderColor: colors.primary.orange,
      backgroundColor: `${colors.primary.orange}10`
    }
  },
  
  danger: {
    backgroundColor: 'transparent',
    color: colors.special.strongRed,
    border: `1px solid ${colors.neutral.border}`,
    
    '&:hover': {
      backgroundColor: colors.special.strongRed,
      color: colors.primary.black
    }
  },
  
  success: {
    backgroundColor: colors.status.success,
    color: colors.primary.black,
    border: 'none',
    
    '&:hover': {
      backgroundColor: '#00DD00'
    }
  },
  
  ghost: {
    backgroundColor: 'transparent',
    color: colors.neutral.text,
    border: 'none',
    
    '&:hover': {
      color: colors.primary.orange,
      backgroundColor: `${colors.primary.orange}10`
    }
  }
};

const buttonSizes = {
  sm: {
    padding: '4px 12px',
    fontSize: typography.fontSize.sm
  },
  md: {
    padding: '8px 20px',
    fontSize: typography.fontSize.base
  },
  lg: {
    padding: '12px 28px',
    fontSize: typography.fontSize.lg
  }
};

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  disabled, 
  onClick,
  className = '',
  ...props 
}) => {
  const baseStyles = {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: tokens.transitions.base,
    borderRadius: tokens.radii.base,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.tight,
    opacity: disabled ? 0.5 : 1,
    ...buttonVariants[variant],
    ...buttonSizes[size]
  };

  return (
    <button
      style={baseStyles}
      disabled={disabled}
      onClick={onClick}
      className={`bloomberg-button ${className}`}
      onMouseEnter={(e) => {
        if (!disabled && buttonVariants[variant]['&:hover']) {
          Object.assign(e.target.style, buttonVariants[variant]['&:hover']);
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.target.style, buttonVariants[variant]);
      }}
      {...props}
    >
      {children}
    </button>
  );
};
