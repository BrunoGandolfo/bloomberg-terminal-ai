// frontend/src/components/ui/Input.js
import React, { useState } from 'react';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { tokens } from '../../styles/tokens';

export const Input = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  error = false,
  icon = null,
  className = '',
  onKeyPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const inputStyles = {
    backgroundColor: colors.neutral.surface,
    color: error ? colors.status.danger : colors.primary.orange,
    border: `1px solid ${
      error ? colors.status.danger : 
      isFocused ? colors.primary.orange : 
      colors.neutral.border
    }`,
    borderRadius: tokens.radii.base,
    padding: icon ? '8px 8px 8px 36px' : tokens.spacing[2],
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base,
    width: '100%',
    transition: tokens.transitions.base,
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    boxShadow: isFocused ? tokens.shadows.neonOrange : 'none'
  };
  
  const containerStyles = {
    position: 'relative',
    display: 'inline-block',
    width: '100%'
  };
  
  const iconStyles = {
    position: 'absolute',
    left: tokens.spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.neutral.text,
    fontSize: typography.fontSize.lg
  };
  
  return (
    <div style={containerStyles} className={className}>
      {icon && <span style={iconStyles}>{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={inputStyles}
        {...props}
      />
    </div>
  );
};
