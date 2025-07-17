import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import styles from './portfolio/constants/styles';
import { calculatePortfolioMetrics, prepareDistributionData } from './portfolio/utils/calculations';
import { usePortfolioData } from './portfolio/hooks/usePortfolioData';
import { useRealtimeUpdates } from './portfolio/hooks/useRealtimeUpdates';
import PortfolioHeader from './portfolio/components/PortfolioHeader';
import PortfolioSummary from './portfolio/components/PortfolioSummary';
import AddPositionForm from './portfolio/components/AddPositionForm';
import PositionsTable from './portfolio/components/PositionsTable';
import DistributionChart from './portfolio/components/DistributionChart';
const PortfolioModule = forwardRef((props, ref) => {
  const [newPosition, setNewPosition] = useState({ symbol: '', shares: '', avgCost: '' });

  const {
    portfolioData,
    isLoading,
    refreshPortfolio,
    handleAddPosition: addPosition,
    handleRemovePosition: removePosition,
    renderTimeAgo
  } = usePortfolioData();

  const { setIsHovering, priceChanges } = useRealtimeUpdates(refreshPortfolio, 1000);

  useImperativeHandle(ref, () => ({
    refreshData: () => refreshPortfolio()
  }));

  const handleAddPosition = async () => {
    const success = await addPosition(newPosition);
    if (success) setNewPosition({ symbol: '', shares: '', avgCost: '' });
  };

  const portfolioMetrics = useMemo(() => 
    calculatePortfolioMetrics(portfolioData.positions, portfolioData.totalValue ?? 0),
  [portfolioData]);

  const distributionData = useMemo(() => 
    prepareDistributionData(portfolioData.positions),
  [portfolioData.positions]);

  if (isLoading && portfolioData.positions.length === 0) {
    return <div>Cargando portafolio...</div>;
  }

  return (
    <div onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <PortfolioHeader
        renderTimeAgo={renderTimeAgo}
        refreshPortfolio={refreshPortfolio}
        isLoading={isLoading}
        styles={styles}
      />

      <div style={styles.grid}>
        <PortfolioSummary
          portfolioMetrics={portfolioMetrics}
          positionsCount={portfolioData.positions.length}
          styles={styles}
        />
        
        <AddPositionForm
          newPosition={newPosition}
          setNewPosition={setNewPosition}
          onSubmit={handleAddPosition}
          styles={styles}
        />
      </div>

      <PositionsTable
        positions={portfolioData.positions}
        priceChanges={priceChanges}
        onRemove={removePosition}
        styles={styles}
        isLoading={isLoading}
      />

      <DistributionChart data={distributionData} styles={styles} />
    </div>
  );
});

export default PortfolioModule;
