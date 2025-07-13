/**
 * Componente de formulario para agregar símbolos a la watchlist
 * Usa TickerSearchInput para búsqueda inteligente
 */

import React, { useState } from 'react';
import TickerSearchInput from '../../TickerSearchInput';

const AddSymbolForm = ({ onAddSymbol, isLoading, styles }) => {
  const [newSymbol, setNewSymbol] = useState('');

  const handleAddSymbol = async () => {
    if (newSymbol.trim()) {
      const success = await onAddSymbol(newSymbol);
      if (success) {
        setNewSymbol('');
      }
    }
  };

  const handleSelectTicker = async (ticker) => {
    setNewSymbol(ticker.symbol);
    const success = await onAddSymbol(ticker.symbol);
    if (success) {
      setNewSymbol('');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <TickerSearchInput
        placeholder="Agregar Símbolo..."
        onSelectTicker={handleSelectTicker}
        style={{ width: '200px' }}
        value={newSymbol}
        onChange={(e) => setNewSymbol(e.target.value)}
      />
      <button 
        onClick={handleAddSymbol} 
        style={styles.button} 
        disabled={isLoading || !newSymbol.trim()}
      >
        {isLoading ? 'Agregando...' : 'AGREGAR'}
      </button>
    </div>
  );
};

export default AddSymbolForm; 