// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { Ticker } from './components/Layout/Ticker';
import { TabbedPanel } from './components/Panels/TabbedPanel';
import { ChartPanel } from './components/Panels/ChartPanel';
import { AnalysisPanel } from './components/Panels/AnalysisPanel';
import { ChatPanel } from './components/Panels/ChatPanel';
import { useDataStream } from './hooks/useDataStream';
import { DISPLAY_MODES, STORAGE_KEYS } from './utils/constants';
import './styles/global.css';

function App() {
  const [displayMode, setDisplayMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (saved) {
      const prefs = JSON.parse(saved);
      return prefs.displayMode || DISPLAY_MODES.TRADING;
    }
    return DISPLAY_MODES.TRADING;
  });

  const { isConnected, error, reconnect } = useDataStream();

  useEffect(() => {
    const preferences = {
      displayMode,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }, [displayMode]);

  const handleModeChange = (mode) => {
    setDisplayMode(mode);
  };

  if (error && !isConnected) {
    return (
      <div className="bloomberg-terminal error-state">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button onClick={reconnect} className="reconnect-button">
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bloomberg-terminal loading-state">
        <div className="loading-container">
          <div className="loading-logo">BLOOMBERG TERMINAL AI</div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Connecting to market data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-terminal">
      <Header mode={displayMode} onModeChange={handleModeChange} />
      <main className={`main-content ${displayMode}-mode`}>
        {displayMode === DISPLAY_MODES.TRADING ? (
          <div className="trading-layout">
            <div className="panel panel-tl">
              <TabbedPanel />
            </div>
            <div className="panel panel-tr">
              <ChartPanel />
            </div>
            <div className="panel panel-bl">
              <AnalysisPanel expanded={false} />
            </div>
            <div className="panel panel-br">
              <ChatPanel />
            </div>
          </div>
        ) : (
          <div className="research-layout">
            <div className="panel panel-left">
              <AnalysisPanel expanded={true} />
            </div>
            <div className="panel panel-right-top">
              <TabbedPanel />
            </div>
            <div className="panel panel-bottom">
              <ChartPanel />
            </div>
          </div>
        )}
      </main>
      <Ticker />
    </div>
  );
}

export default App;
