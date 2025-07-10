import React from 'react';

const CompanyLogo = ({ symbol, size = 30, change = null }) => {
  if (!symbol) return null;

  const specialLogos = {
    'BTC': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg',
    'ETH': 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg'
  };

  // ✅ CORREGIDO: Data URI local para eliminar ERR_BLOCKED_BY_ORB
  const fallbackIcon = "data:image/svg+xml,%3csvg width='24' height='24' fill='%23FF8800' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='2' y='12' width='4' height='8'/%3e%3crect x='8' y='8' width='4' height='12'/%3e%3crect x='14' y='4' width='4' height='16'/%3e%3c/svg%3e";

  // ✅ NUEVO: Barras dinámicas verdes/rojas para índices
  const getDynamicChart = (change) => {
    if (change === null) return fallbackIcon;
    const color = change >= 0 ? '%2300FF00' : '%23FF0000'; // Verde o Rojo
    return `data:image/svg+xml,%3csvg width='24' height='24' fill='${color}' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='2' y='12' width='4' height='8'/%3e%3crect x='8' y='8' width='4' height='12'/%3e%3crect x='14' y='4' width='4' height='16'/%3e%3c/svg%3e`;
  };

  const isIndex = symbol.startsWith('^');

  // CORRECCIÓN DEFINITIVA: Separar por guion o barra y tomar la primera parte.
  const baseSymbol = symbol.toUpperCase().split(/[-/]/)[0];

  let logoUrl;
  let applyBg = !isIndex;

  if (isIndex) {
    logoUrl = getDynamicChart(change); // ✅ CAMBIO: Barras dinámicas para índices
  } else if (specialLogos[baseSymbol]) {
    logoUrl = specialLogos[baseSymbol];
  } else {
    logoUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(baseSymbol)}`;
  }

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'contain',
    borderRadius: '4px',
    marginRight: '8px',
    verticalAlign: 'middle',
    ...(applyBg && {
      backgroundColor: 'white',
      padding: '2px'
    })
  };

  return (
    <img
      src={logoUrl}
      alt={`${symbol} logo`}
      style={style}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = fallbackIcon; // ✅ Ahora usa data URI local
        e.target.style.backgroundColor = 'transparent';
        e.target.style.padding = '0';
      }}
    />
  );
};

export default CompanyLogo;
