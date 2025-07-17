// src/components/Panels/ChatPanel.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDataStream } from '../../hooks/useDataStream';
import { formatPrice, formatPercent } from '../../utils/formatters';
import './ChatPanel.css';

export const ChatPanel = () => {
  const { currentSymbol, getStockData, portfolio, watchlist } = useDataStream();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Welcome to Bloomberg Terminal AI! I can help you analyze your portfolio, track market trends, and provide investment insights. Currently monitoring ${currentSymbol || 'AAPL'}.`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = useCallback(
    (userMessage) => {
      const lowerMessage = userMessage.toLowerCase();
      const stockData = getStockData(currentSymbol);

      if (lowerMessage.includes('portfolio')) {
        const positions = Object.entries(portfolio);
        const totalValue = positions.reduce(
          (sum, [_, stock]) => sum + stock.currentPrice * stock.shares,
          0
        );
        return `Your portfolio contains ${positions.length} positions worth ${formatPrice(totalValue)} in total. Your top holding is ${positions[0]?.[0] || 'N/A'}.`;
      }

      if (lowerMessage.includes('analysis')) {
        if (stockData) {
          const change = stockData.change || 0;
          const changePercent = stockData.changePercent || 0;
          return `${currentSymbol} is trading at ${formatPrice(
            stockData.currentPrice || stockData.price
          )} (${change >= 0 ? '+' : ''}${formatPercent(changePercent)}).`;
        }
        return 'Please select a symbol to analyze.';
      }

      if (lowerMessage.includes('buy') || lowerMessage.includes('sell')) {
        return `Based on current technicals, ${currentSymbol} has neutral momentum. Consider watching for confirmation signals.`;
      }

      if (lowerMessage.includes('market')) {
        return 'Markets show mixed signals today. Tech is up, energy is down. VIX remains low.';
      }

      if (lowerMessage.includes('watchlist')) {
        const watchlistSymbols = Object.keys(watchlist);
        if (watchlistSymbols.length > 0) {
          return `You are tracking ${watchlistSymbols.length} symbols: ${watchlistSymbols.join(', ')}.`;
        }
        return 'Your watchlist is currently empty.';
      }

      return `I understand you're asking about "${userMessage}". I can help analyze ${currentSymbol || 'your portfolio'}. Try asking about a stock, your portfolio, or market trends.`;
    },
    [currentSymbol, getStockData, portfolio, watchlist]
  );

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: generateAIResponse(input),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  }, [input, messages.length, generateAIResponse]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    `Analyze ${currentSymbol || 'AAPL'}`,
    'Portfolio summary',
    'Market overview',
    "Today's movers",
  ];

  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => {
      inputRef.current?.focus();
      sendMessage();
    }, 100);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>AI Assistant</h3>
        <div className="chat-status">
          <span className="status-dot online"></span>
          <span>Online</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message ai typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action)}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about stocks, portfolio, or market trends..."
          rows="1"
        />
        <button
          className="send-button"
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
        >
          Send
        </button>
      </div>
    </div>
  );
};
