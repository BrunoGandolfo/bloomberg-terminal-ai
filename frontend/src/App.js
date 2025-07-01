import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import FundamentalAnalysisModule from './components/FundamentalAnalysisModule';
import GlobalIndicesTicker from './components/GlobalIndicesTicker';
import DocumentAnalysisModule from './components/DocumentAnalysisModule';
import AIAssistantModule from './components/AIAssistantModule';
import WatchlistModule from './components/WatchlistModule';
import PortfolioModule from './components/PortfolioModule';
import ScreenerPanel from './components/ScreenerPanel';
import MarketModule from './components/MarketModule';
import PersonalFinanceModule from './components/PersonalFinanceModule';

// Estilos Bloomberg Terminal
const styles = {
  terminal: {
    backgroundColor: '#000000',
    color: '#FF8800',
    minHeight: '100vh',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '10px 20px',
    borderBottom: '2px solid #FF8800',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FF8800',
    letterSpacing: '2px'
  },
  navbar: {
    backgroundColor: '#0a0a0a',
    padding: '5px',
    display: 'flex',
    borderBottom: '1px solid #333'
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#FF8800',
    border: '1px solid #333',
    padding: '8px 15px',
    margin: '0 5px',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.3s'
  },
  navButtonActive: {
    backgroundColor: '#FF8800',
    color: '#000',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto'
  },
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #FF8800',
    padding: '8px',
    fontSize: '12px',
    width: '200px',
    marginRight: '10px'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000',
    border: 'none',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  priceUp: {
    color: '#00FF00'
  },
  priceDown: {
    color: '#FF0000'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  }
};



// Componente Principal
export default function BloombergTerminal() {
  const [activeModule, setActiveModule] = useState('market');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.terminal}>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>BLOOMBERG TERMINAL AI</div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>{currentTime.toLocaleTimeString()}</span>
          <span>{currentTime.toLocaleDateString()}</span>
          <span style={{ color: '#00FF00' }}>● ONLINE</span>
        </div>
      </div>

      {/* Ticker de Índices Globales */}
      <GlobalIndicesTicker />

      {/* Navigation */}
      <div style={styles.navbar}>
        {[
          { id: 'market', name: 'MERCADOS [F1]' },
          { id: 'portfolio', name: 'PORTAFOLIO [F2]' },
          { id: 'watchlist', name: 'WATCHLIST [F3]' },
          { id: 'personal', name: 'FINANZAS [F4]' },
          { id: 'analysis', name: 'ANÁLISIS [F5]' },
          { id: 'ai', name: 'IA [F6]' },
          { id: 'fundamental', name: 'FUNDAMENTAL [F7]' }
        ].map(module => (
          <button
            key={module.id}
            style={{
              ...styles.navButton,
              ...(activeModule === module.id ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule(module.id)}
          >
            {module.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={{ display: activeModule === 'market' ? 'block' : 'none' }}>
          <MarketModule />
        </div>
        <div style={{ display: activeModule === 'portfolio' ? 'block' : 'none' }}>
          <PortfolioModule />
        </div>
        <div style={{ display: activeModule === 'watchlist' ? 'block' : 'none' }}>
          <WatchlistModule />
        </div>
        <div style={{ display: activeModule === 'personal' ? 'block' : 'none' }}>
          <PersonalFinanceModule />
        </div>
        <div style={{ display: activeModule === 'analysis' ? 'block' : 'none' }}>
          <DocumentAnalysisModule />
        </div>
        <div style={{ display: activeModule === 'ai' ? 'block' : 'none' }}>
          <AIAssistantModule />
        </div>
        <div style={{ display: activeModule === 'fundamental' ? 'block' : 'none' }}>
          <FundamentalAnalysisModule />
        </div>
      </div>
    </div>
  );
}