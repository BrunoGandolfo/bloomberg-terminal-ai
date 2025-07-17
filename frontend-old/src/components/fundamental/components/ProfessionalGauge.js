import React, { useState, useEffect, useRef } from 'react';

const ProfessionalGauge = ({ score, size = 350 }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [needleRotation, setNeedleRotation] = useState(-90);
  const animationRef = useRef(null);
  
  useEffect(() => {
    // Animación suave del score
    const duration = 2000;
    const start = displayScore;
    const end = score;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function para movimiento más natural
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentScore = Math.round(start + (end - start) * easeOutQuart);
      setDisplayScore(currentScore);
      
      const rotation = -90 + (currentScore / 100) * 180;
      setNeedleRotation(rotation);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [score, displayScore]); // Agregar displayScore a dependencias
  
  const getZoneColor = (value) => {
    if (value >= 80) return '#00FF00';
    if (value >= 60) return '#FFFF00';
    if (value >= 40) return '#FF8800';
    return '#FF0000';
  };
  
  // Crear gradiente para las zonas
  const createGradient = (startColor, endColor, id) => (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor={startColor} stopOpacity="0.3" />
      <stop offset="100%" stopColor={endColor} stopOpacity="0.8" />
    </linearGradient>
  );
  
  const centerX = size / 2;
  const centerY = size / 2 + 20;
  const radius = size / 2 - 40;
  
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <svg width={size} height={size * 0.7} style={{ filter: 'drop-shadow(0 0 10px rgba(255, 136, 0, 0.3))' }}>
        <defs>
          {createGradient('#FF0000', '#FF4444', 'redZone')}
          {createGradient('#FF8800', '#FFAA00', 'orangeZone')}
          {createGradient('#FFFF00', '#FFFF44', 'yellowZone')}
          {createGradient('#00FF00', '#44FF44', 'greenZone')}
          
          {/* Filtro de brillo para la aguja */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Fondo del medidor */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="30"
        />
        
        {/* Zonas de color con gradientes */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX - radius * 0.7} ${centerY - radius * 0.7}`}
          fill="none"
          stroke="url(#redZone)"
          strokeWidth="28"
        />
        <path
          d={`M ${centerX - radius * 0.7} ${centerY - radius * 0.7} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY - radius}`}
          fill="none"
          stroke="url(#orangeZone)"
          strokeWidth="28"
        />
        <path
          d={`M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX + radius * 0.7} ${centerY - radius * 0.7}`}
          fill="none"
          stroke="url(#yellowZone)"
          strokeWidth="28"
        />
        <path
          d={`M ${centerX + radius * 0.7} ${centerY - radius * 0.7} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="url(#greenZone)"
          strokeWidth="28"
        />
        
        {/* Marcas de graduación */}
        {[0, 25, 50, 75, 100].map((value, i) => {
          const angle = -90 + (value / 100) * 180;
          const radian = (angle * Math.PI) / 180;
          const x1 = centerX + (radius - 35) * Math.cos(radian);
          const y1 = centerY + (radius - 35) * Math.sin(radian);
          const x2 = centerX + (radius - 20) * Math.cos(radian);
          const y2 = centerY + (radius - 20) * Math.sin(radian);
          
          return (
            <g key={value}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={centerX + (radius - 50) * Math.cos(radian)}
                y={centerY + (radius - 50) * Math.sin(radian)}
                fill="#808080"
                fontSize="14"
                fontFamily="Courier New"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {value}
              </text>
            </g>
          );
        })}
        
        {/* Aguja con animación */}
        <g transform={`rotate(${needleRotation} ${centerX} ${centerY})`} style={{ transition: 'transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
          {/* Sombra de la aguja */}
          <polygon
            points={`${centerX},${centerY - 5} ${centerX + radius - 20},${centerY} ${centerX},${centerY + 5}`}
            fill="#000000"
            opacity="0.3"
            transform="translate(2, 2)"
          />
          
          {/* Aguja principal */}
          <polygon
            points={`${centerX},${centerY - 5} ${centerX + radius - 20},${centerY} ${centerX},${centerY + 5}`}
            fill="#FFFFFF"
            filter="url(#glow)"
          />
          
          {/* Línea central de la aguja */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius - 25}
            y2={centerY}
            stroke="#FF8800"
            strokeWidth="2"
          />
        </g>
        
        {/* Centro de la aguja */}
        <circle cx={centerX} cy={centerY} r="12" fill="#1a1a1a" stroke="#FF8800" strokeWidth="3" />
        <circle cx={centerX} cy={centerY} r="6" fill="#FF8800" />
        
        {/* Arco de progreso */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 ${displayScore > 50 ? 1 : 0} 1 ${
            centerX + radius * Math.cos((-90 + (displayScore / 100) * 180) * Math.PI / 180)
          } ${
            centerY + radius * Math.sin((-90 + (displayScore / 100) * 180) * Math.PI / 180)
          }`}
          fill="none"
          stroke={getZoneColor(displayScore)}
          strokeWidth="3"
          opacity="0.8"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Display digital mejorado */}
      <div style={{ marginTop: '-50px', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          fontSize: '60px', 
          color: getZoneColor(displayScore), 
          fontWeight: 'bold',
          textShadow: `0 0 30px ${getZoneColor(displayScore)}`,
          letterSpacing: '2px'
        }}>
          {displayScore}
        </div>
        <div style={{ 
          fontSize: '16px', 
          color: '#808080',
          letterSpacing: '1px',
          marginTop: '-10px'
        }}>
          WARREN BUFFETT SCORE
        </div>
        
        {/* Indicador de calidad */}
        <div style={{
          marginTop: '10px',
          padding: '5px 15px',
          backgroundColor: getZoneColor(displayScore) + '20',
          border: `1px solid ${getZoneColor(displayScore)}`,
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          <span style={{ 
            color: getZoneColor(displayScore),
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {displayScore >= 80 ? 'INVERSIÓN EXCELENTE' :
             displayScore >= 60 ? 'INVERSIÓN BUENA' :
             displayScore >= 40 ? 'INVERSIÓN REGULAR' :
             'EVITAR INVERSIÓN'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalGauge; 