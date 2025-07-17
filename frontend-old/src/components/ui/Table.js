// frontend/src/components/ui/Table.js
import React from 'react';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { tokens } from '../../styles/tokens';

export const Table = ({ columns, data, onRowClick, hoverable = true }) => {
  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: typography.fontFamily.monospace,
    fontSize: typography.fontSize.base
  };
  
  const headerStyles = {
    borderBottom: `2px solid ${colors.primary.orange}`,
    padding: tokens.spacing[2],
    textAlign: 'left',
    color: colors.primary.orange,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    fontSize: typography.fontSize.sm
  };
  
  const cellStyles = {
    padding: tokens.spacing[2],
    borderBottom: `1px solid ${colors.neutral.border}`,
    color: colors.neutral.textLight
  };
  
  const rowStyles = {
    transition: tokens.transitions.fast,
    cursor: onRowClick ? 'pointer' : 'default'
  };
  
  return (
    <table style={tableStyles}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={{
              ...headerStyles,
              textAlign: col.align || 'left'
            }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            style={rowStyles}
            onClick={() => onRowClick && onRowClick(row)}
            onMouseEnter={(e) => {
              if (hoverable) {
                e.currentTarget.style.backgroundColor = colors.neutral.surface;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {columns.map((col, j) => (
              <td key={j} style={{
                ...cellStyles,
                textAlign: col.align || 'left',
                color: col.colorFn ? col.colorFn(row[col.key]) : cellStyles.color
              }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
