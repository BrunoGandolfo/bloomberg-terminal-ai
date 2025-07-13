import React, { forwardRef, useImperativeHandle } from 'react';
import styles from './watchlist/constants/styles';
import { useWatchlistData } from './watchlist/hooks/useWatchlistData';
import { useRealtimeUpdates } from './portfolio/hooks/useRealtimeUpdates';
import WatchlistHeader from './watchlist/components/WatchlistHeader';
import AddSymbolForm from './watchlist/components/AddSymbolForm';
import WatchlistTable from './watchlist/components/WatchlistTable';

const WatchlistModule = forwardRef((props, ref) => {
  // Hook para manejo de datos de watchlist
  const {
    watchlist,
    watchlistData,
    isLoading,
    refreshWatchlist,
    handleAddSymbol,
    handleRemoveSymbol,
    renderTimeAgo
  } = useWatchlistData();

  // Hook para actualizaciones en tiempo real
  const { setIsHovering, priceChanges } = useRealtimeUpdates(refreshWatchlist, 1000);

  // Exponer función refreshData al componente padre
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      console.log('🔄 WatchlistModule: Actualizando datos...');
      await refreshWatchlist(true);
      console.log('✅ WatchlistModule: Datos actualizados');
    }
  }));

  return (
    <div
      style={styles.panel}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <WatchlistHeader
        refreshWatchlist={refreshWatchlist}
        isLoading={isLoading}
        renderTimeAgo={renderTimeAgo}
        styles={styles}
      />

      <AddSymbolForm
        onAddSymbol={handleAddSymbol}
        isLoading={isLoading}
        styles={styles}
      />

      <WatchlistTable
        watchlist={watchlist}
        watchlistData={watchlistData}
        priceChanges={priceChanges}
        onRemove={handleRemoveSymbol}
        isLoading={isLoading}
        styles={styles}
      />
    </div>
  );
});

export default WatchlistModule;
