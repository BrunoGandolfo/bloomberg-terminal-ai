
// Landing Page Component - Código será agregado manualmente 
// frontend/src/components/LandingPage.js
import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

const LandingPage = ({ onEnterTerminal }) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [tickerData, setTickerData] = useState([]);

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear fecha y hora
  const formatDateTime = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateStr = dateTime.toLocaleDateString('en-US', options).toUpperCase();
    const timeStr = dateTime.toTimeString().split(' ')[0];
    return `${dateStr} | ${timeStr}`;
  };

  // Cargar datos reales del ticker
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const data = await apiCall('/api/screener/indices');

        // Obtener cotizaciones de crypto - SOLO BTC/USD para optimizar API calls
        try {
          const cryptoSymbols = ['BTC/USD'];
          const cryptoNames = ['BITCOIN'];
          const cryptoPromises = cryptoSymbols.map(sym => apiCall(`/api/market/quote/${encodeURIComponent(sym)}`));
          const cryptoResults = await Promise.allSettled(cryptoPromises);
          const cryptoIndices = cryptoResults
            .filter(r => r.status === 'fulfilled' && r.value)
            .map((r, idx) => {
              const quote = r.value;
              return {
                symbol: cryptoNames[idx],
                price: quote.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00',
                change: quote.changePercent || 0,
                positive: (quote.changePercent || 0) >= 0
              };
            });

          // Formatear datos de índices
          const formattedIndices = data.map(index => ({
            symbol: getIndexDisplayName(index.símbolo),
            price: index.precio?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00',
            change: index.cambio_porcentual || 0,
            positive: (index.cambio || 0) >= 0
          }));

          setTickerData([...formattedIndices, ...cryptoIndices]);
        } catch (cryptoError) {
          console.error('Error fetching crypto indices:', cryptoError);
          // Si falla crypto, usar solo índices
          const formattedIndices = data.map(index => ({
            symbol: getIndexDisplayName(index.símbolo),
            price: index.precio?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00',
            change: index.cambio_porcentual || 0,
            positive: (index.cambio || 0) >= 0
          }));
          setTickerData(formattedIndices);
        }
      } catch (error) {
        console.error('Error fetching indices:', error);
        // Usar datos de respaldo si falla la API
        setTickerData([
          { symbol: 'S&P 500', price: '0.00', change: 0, positive: true },
          { symbol: 'DOW JONES', price: '0.00', change: 0, positive: true },
          { symbol: 'NASDAQ', price: '0.00', change: 0, positive: true }
        ]);
      }
    };
    
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, []);

  const getIndexDisplayName = (symbol) => {
    const names = {
      '^GSPC': 'S&P 500',
      '^DJI': 'DOW JONES',
      '^IXIC': 'NASDAQ',
      '^RUT': 'RUSSELL 2000'
    };
    return names[symbol] || symbol;
  };

  // Módulos del terminal
  const modules = [
    {
      key: 'market',
      icon: '[F1]',
      title: 'MERCADOS',
      description: 'Cotizaciones en tiempo real, gráficos avanzados, análisis técnico y screener profesional de acciones'
    },
    {
      key: 'portfolio',
      icon: '[F2]',
      title: 'PORTFOLIO',
      description: 'Gestión profesional de carteras, seguimiento de rendimiento y análisis de riesgo en tiempo real'
    },
    {
      key: 'fundamental',
      icon: '[F7]',
      title: 'ANÁLISIS FUNDAMENTAL',
      description: 'Rating empresarial, ratios financieros, estados contables y valoración DCF automatizada'
    },
    {
      key: 'watchlist',
      icon: '[F3]',
      title: 'WATCHLIST',
      description: 'Seguimiento personalizado de activos, alertas de precio y notificaciones de eventos corporativos'
    },
    {
      key: 'ai',
      icon: '[F6]',
      title: 'ASISTENTE IA',
      description: 'Análisis avanzado con GPT-4, Claude y Gemini. Recomendaciones personalizadas y consenso de IAs'
    },
    {
      key: 'news',
      icon: '[F8]',
      title: 'NOTICIAS',
      description: 'Feed profesional de noticias financieras, análisis de sentimiento y eventos de mercado en tiempo real'
    }
  ];

  const stats = [
    { number: '15,432', label: 'Cotizaciones/Hora' },
    { number: '50+', label: 'Indicadores Técnicos' },
    { number: '24/7', label: 'Cobertura Global' },
    { number: '99.9%', label: 'Uptime Garantizado' }
  ];

  const features = [
    {
      title: 'DATOS INSTITUCIONALES',
      text: 'Acceso a fuentes de datos de grado institucional con actualización en milisegundos'
    },
    {
      title: 'ANÁLISIS CUANTITATIVO',
      text: 'Modelos financieros avanzados y backtesting con datos históricos de 30 años'
    },
    {
      title: 'INTEGRACIÓN API',
      text: 'Compatible con Financial Modeling Prep, Yahoo Finance y Twelve Data'
    },
    {
      title: 'SEGURIDAD BANCARIA',
      text: 'Encriptación de grado militar y cumplimiento con estándares financieros globales'
    }
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      fontFamily: "'Courier New', monospace",
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    // Ticker Styles
    ticker: {
      backgroundColor: '#000000',
      borderBottom: '1px solid #333333',
      padding: '8px 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      overflow: 'hidden'
    },
    tickerContent: {
      display: 'flex',
      animation: 'scroll 15s linear infinite',
      whiteSpace: 'nowrap',
      paddingLeft: '100%'
    },
    tickerItem: {
      padding: '0 30px',
      fontSize: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    tickerSymbol: {
      color: '#FF8800',
      fontWeight: 'bold'
    },
    tickerPrice: {
      color: '#FFFFFF'
    },
    tickerChangePositive: {
      color: '#00FF00'
    },
    tickerChangeNegative: {
      color: '#FF0000'
    },
    // Header Styles
    header: {
      backgroundColor: '#000000',
      padding: '40px 20px',
      textAlign: 'center',
      borderBottom: '2px solid #FF8800',
      position: 'relative'
    },
    logo: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#FF8800',
      letterSpacing: '4px',
      marginBottom: '10px',
      textTransform: 'uppercase'
    },
    tagline: {
      fontSize: '14px',
      color: '#808080',
      letterSpacing: '2px',
      textTransform: 'uppercase'
    },
    datetime: {
      position: 'absolute',
      top: '50px',
      right: '20px',
      fontSize: '12px',
      color: '#808080'
    },
    // Hero Styles
    hero: {
      padding: '60px 20px',
      textAlign: 'center',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)'
    },
    heroTitle: {
      fontSize: '24px',
      color: '#FFFFFF',
      marginBottom: '20px',
      letterSpacing: '1px'
    },
    heroSubtitle: {
      fontSize: '16px',
      color: '#808080',
      marginBottom: '40px',
      lineHeight: 1.6
    },
    ctaButton: {
      backgroundColor: '#FF8800',
      color: '#000000',
      border: 'none',
      padding: '15px 40px',
      fontSize: '16px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: "'Courier New', monospace"
    },
    // Stats Styles
    statsSection: {
      backgroundColor: '#0a0a0a',
      padding: '40px 20px',
      borderTop: '1px solid #333333',
      borderBottom: '1px solid #333333'
    },
    statsContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '30px'
    },
    statBox: {
      textAlign: 'center',
      padding: '20px',
      border: '1px solid #333333',
      transition: 'all 0.3s ease'
    },
    statNumber: {
      fontSize: '32px',
      color: '#FF8800',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    statLabel: {
      fontSize: '12px',
      color: '#808080',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    // Modules Styles
    modulesSection: {
      padding: '60px 20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    sectionTitle: {
      fontSize: '24px',
      color: '#FF8800',
      textAlign: 'center',
      marginBottom: '40px',
      textTransform: 'uppercase',
      letterSpacing: '2px'
    },
    modulesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    moduleCard: {
      backgroundColor: '#0a0a0a',
      border: '1px solid #333333',
      padding: '30px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    moduleIcon: {
      fontSize: '14px',
      color: '#FF8800',
      marginBottom: '15px',
      fontWeight: 'bold'
    },
    moduleTitle: {
      fontSize: '18px',
      color: '#FFFFFF',
      marginBottom: '10px',
      textTransform: 'uppercase'
    },
    moduleDescription: {
      fontSize: '12px',
      color: '#808080',
      lineHeight: 1.6
    },
    // Features Styles
    featuresSection: {
      backgroundColor: '#0a0a0a',
      padding: '60px 20px',
      borderTop: '1px solid #333333'
    },
    featuresGrid: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px'
    },
    featureItem: {
      textAlign: 'center'
    },
    featureTitle: {
      fontSize: '16px',
      color: '#FF8800',
      marginBottom: '10px',
      textTransform: 'uppercase'
    },
    featureText: {
      fontSize: '12px',
      color: '#808080',
      lineHeight: 1.6
    },
    // Footer Styles
    footer: {
      backgroundColor: '#000000',
      padding: '40px 20px',
      textAlign: 'center',
      borderTop: '2px solid #FF8800',
      marginTop: 'auto'
    },
    footerLinks: {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'center',
      gap: '40px',
      flexWrap: 'wrap'
    },
    footerLink: {
      color: '#808080',
      textDecoration: 'none',
      fontSize: '12px',
      textTransform: 'uppercase',
      transition: 'color 0.3s ease'
    },
    copyright: {
      fontSize: '12px',
      color: '#808080',
      marginTop: '20px'
    },
    poweredBy: {
      fontSize: '11px',
      color: '#666666',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Ticker Global de Índices */}
      <div style={styles.ticker}>
        <div style={styles.tickerContent}>
          {tickerData.length > 0 ? (
            [...tickerData, ...tickerData].map((item, index) => (
              <span key={index} style={styles.tickerItem}>
                <span style={styles.tickerSymbol}>{item.symbol}</span>
                <span style={styles.tickerPrice}>{item.price}</span>
                <span style={item.positive ? styles.tickerChangePositive : styles.tickerChangeNegative}>
                  {item.positive ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                </span>
              </span>
            ))
          ) : (
            <span style={styles.tickerItem}>
              <span style={styles.tickerSymbol}>Cargando datos del mercado...</span>
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.datetime}>{formatDateTime()}</div>
        <h1 style={styles.logo}>TERMINAL FINANCIERA POWER IA</h1>
        <p style={styles.tagline}>Análisis Profesional de Mercados Potenciado por Inteligencia Artificial</p>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <h2 style={styles.heroTitle}>ACCESO INSTANTÁNEO A DATOS FINANCIEROS GLOBALES</h2>
        <p style={styles.heroSubtitle}>
          Sistema profesional de análisis de mercados con datos en tiempo real,<br />
          análisis fundamental avanzado y asistencia de inteligencia artificial
        </p>
        <button 
          style={styles.ctaButton}
          onClick={onEnterTerminal}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FF9900';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 5px 20px rgba(255, 136, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FF8800';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          INICIAR TERMINAL
        </button>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              style={styles.statBox}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF8800';
                e.currentTarget.style.backgroundColor = 'rgba(255, 136, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={styles.statNumber}>{stat.number}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Section */}
      <section style={styles.modulesSection}>
        <h2 style={styles.sectionTitle}>MÓDULOS PROFESIONALES</h2>
        <div style={styles.modulesGrid}>
          {modules.map((module, index) => (
            <div 
              key={index} 
              style={styles.moduleCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF8800';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 136, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.moduleIcon}>{module.icon}</div>
              <h3 style={styles.moduleTitle}>{module.title}</h3>
              <p style={styles.moduleDescription}>{module.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>CARACTERÍSTICAS PROFESIONALES</h2>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} style={styles.featureItem}>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureText}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <a 
            href="#" 
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#FF8800'}
            onMouseLeave={(e) => e.target.style.color = '#808080'}
          >
            DOCUMENTACIÓN
          </a>
          <a 
            href="#" 
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#FF8800'}
            onMouseLeave={(e) => e.target.style.color = '#808080'}
          >
            API
          </a>
          <a 
            href="#" 
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#FF8800'}
            onMouseLeave={(e) => e.target.style.color = '#808080'}
          >
            GITHUB
          </a>
          <a 
            href="#" 
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#FF8800'}
            onMouseLeave={(e) => e.target.style.color = '#808080'}
          >
            SOPORTE
          </a>
          <a 
            href="#" 
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#FF8800'}
            onMouseLeave={(e) => e.target.style.color = '#808080'}
          >
            CONTACTO
          </a>
        </div>
        <div style={styles.copyright}>
          © 2025 BRUNO GANDOLFO. TODOS LOS DERECHOS RESERVADOS.
        </div>
        <div style={styles.poweredBy}>
          POWERED BY FINANCIAL MODELING PREP & ADVANCED AI SYSTEMS
        </div>
      </footer>

      {/* CSS para animación del ticker */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
