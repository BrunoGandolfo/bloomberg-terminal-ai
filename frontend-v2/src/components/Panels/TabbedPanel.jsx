// src/components/Panels/TabbedPanel.jsx
import React, { useState } from 'react';
import { PortfolioPanel } from './PortfolioPanel';
import { WatchlistPanel } from './WatchlistPanel';
import { ResearchPanel } from './ResearchPanel';
import { TABS } from '../../utils/constants';
import './TabbedPanel.css';

export const TabbedPanel = () => {
  const [activeTab, setActiveTab] = useState(TABS.PORTFOLIO);

  const tabs = [
    { id: TABS.PORTFOLIO, label: 'Portfolio', icon: '💼' },
    { id: TABS.WATCHLIST, label: 'Watchlist', icon: '👁️' },
    { id: TABS.RESEARCH, label: 'Research', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case TABS.PORTFOLIO:
        return <PortfolioPanel />;
      case TABS.WATCHLIST:
        return <WatchlistPanel />;
      case TABS.RESEARCH:
        return <ResearchPanel />;
      default:
        return <PortfolioPanel />;
    }
  };

  return (
    <div className="tabbed-panel">
      <div className="tab-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};
