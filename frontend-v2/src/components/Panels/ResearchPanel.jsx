// src/components/Panels/ResearchPanel.jsx
import React, { useState, useCallback, useRef } from 'react';
import { useDataStream } from '../../hooks/useDataStream';
import { formatDate } from '../../utils/formatters';
import './ResearchPanel.css';

export const ResearchPanel = () => {
  const { currentSymbol } = useDataStream();
  const [documents, setDocuments] = useState([
    { id: 1, name: 'AAPL_10K_2024.pdf', symbol: 'AAPL', type: '10-K', date: new Date('2024-10-30'), size: '3.2 MB' },
    { id: 2, name: 'MSFT_10Q_Q3.pdf', symbol: 'MSFT', type: '10-Q', date: new Date('2024-10-24'), size: '1.8 MB' },
    { id: 3, name: 'GOOGL_8K_latest.pdf', symbol: 'GOOGL', type: '8-K', date: new Date('2024-11-15'), size: '524 KB' },
    { id: 4, name: 'TSLA_earnings_transcript.pdf', symbol: 'TSLA', type: 'Earnings', date: new Date('2024-10-23'), size: '156 KB' },
  ]);
  const [filter, setFilter] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files) => {
    const newDocs = files.map((file, index) => ({
      id: documents.length + index + 1,
      name: file.name,
      symbol: currentSymbol || 'UNKNOWN',
      type: detectDocumentType(file.name),
      date: new Date(),
      size: formatFileSize(file.size),
    }));
    
    setDocuments(prev => [...newDocs, ...prev]);
  }, [documents.length, currentSymbol]);

  const detectDocumentType = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes('10-k')) return '10-K';
    if (lower.includes('10-q')) return '10-Q';
    if (lower.includes('8-k')) return '8-K';
    if (lower.includes('earnings')) return 'Earnings';
    if (lower.includes('proxy')) return 'Proxy';
    return 'Other';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    if (filter === 'current') return doc.symbol === currentSymbol;
    return doc.type === filter;
  });

  const documentTypes = ['all', 'current', '10-K', '10-Q', '8-K', 'Earnings', 'Other'];

  return (
    <div className="research-panel">
      <div className="research-header">
        <h3>Research Documents</h3>
        <div className="filter-buttons">
          {documentTypes.map(type => (
            <button
              key={type}
              className={`filter-button ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All' : type === 'current' ? `${currentSymbol || 'Current'}` : type}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <div className="upload-content">
          <div className="upload-icon">📄</div>
          <p className="upload-text">
            {isDragging ? 'Drop files here' : 'Drag & drop documents here'}
          </p>
          <p className="upload-subtext">or click to browse</p>
          <p className="upload-formats">PDF, DOC, XLSX, TXT</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <div className="documents-list">
        <div className="list-header">
          <span>Recent Documents ({filteredDocuments.length})</span>
        </div>
        
        {filteredDocuments.length === 0 ? (
          <div className="empty-documents">
            <p>No documents found</p>
          </div>
        ) : (
          <div className="documents-grid">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <div className="document-name">{doc.name}</div>
                  <div className="document-meta">
                    <span className="doc-symbol">{doc.symbol}</span>
                    <span className="doc-type">{doc.type}</span>
                    <span className="doc-size">{doc.size}</span>
                  </div>
                  <div className="document-date">{formatDate(doc.date)}</div>
                </div>
                <div className="document-actions">
                  <button className="action-icon" title="Open">👁️</button>
                  <button className="action-icon" title="Download">⬇</button>
                  <button className="action-icon" title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="research-footer">
        <div className="storage-info">
          <span>Storage: 47.3 MB / 1 GB used</span>
          <div className="storage-bar">
            <div className="storage-used" style={{ width: '4.73%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
