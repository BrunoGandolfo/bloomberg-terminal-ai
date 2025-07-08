import React from 'react';

const CompanyLogo = ({ symbol, size = 30 }) => {
  if (!symbol) return null;

  const specialLogos = {
    'BTC': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg',
    'ETH': 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg'
  };

  const fallbackIcon = 'https://www.svgrepo.com/show/475631/chart-trends.svg'; 

  const isIndex = symbol.startsWith('^');
  
  // CORRECCIÓN DEFINITIVA: Separar por guion o barra y tomar la primera parte.
  const baseSymbol = symbol.toUpperCase().split(/[-/]/)[0];
  
  let logoUrl;
  let applyBg = !isIndex;

  if (isIndex) {
    logoUrl = fallbackIcon;
  } else if (specialLogos[baseSymbol]) {
    logoUrl = specialLogos[baseSymbol];
    // Para logos de cripto específicos, puede que no queramos fondo blanco si el SVG ya lo tiene
    // En este caso, el de BTC y ETH se ven mejor con él.
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
        e.target.src = fallbackIcon;
        e.target.style.backgroundColor = 'transparent';
        e.target.style.padding = '0';
      }}
    />
  );
};

export default CompanyLogo; 