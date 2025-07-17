// frontend/src/styles/tokens.js
import { colors } from './colors';

export const tokens = {
  // Espaciado (8px base)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px'
  },
  
  // Breakpoints
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Animaciones
  transitions: {
    fast: '150ms ease',
    base: '300ms ease',
    slow: '500ms ease',
    slowest: '1000ms ease'
  },
  
  // Sombras
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    base: '0 2px 4px rgba(0, 0, 0, 0.5)',
    md: '0 4px 8px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.5)',
    
    // Sombras de neón
    neonOrange: `0 0 10px ${colors.primary.orange}66`,
    neonGreen: `0 0 10px ${colors.status.success}66`,
    neonRed: `0 0 10px ${colors.status.danger}66`
  },
  
  // Border radius
  radii: {
    none: '0px',
    sm: '2px',
    base: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  
  // Z-index
  zIndices: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600
  }
};
