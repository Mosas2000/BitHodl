import { useMemo, useState } from 'react';
import { SavingsTransaction, DCAPerformance } from '@/types';
import { microSTXToSTX } from '@/utils/stacks';

interface DCAPerformanceChartProps {
  transactions: SavingsTransaction[];
  currentBTCPrice: number;
}

interface ChartDataPoint {
  date: Date;
  dcaValue: number;
  lumpSumValue: number;
  btcPrice: number;
}

export function DCAPerformanceChart({ transactions, currentBTCPrice }: DCAPerformanceChartProps) {
  const [chartView, setChartView] = useState<'value' | 'price'>('value');
  
  const performance = useMemo(() => {
    // Filter for DCA purchases only
    const dcaPurchases = transactions.filter(tx => tx.type === 'dca-purchase' && tx.status === 'success');
    
    if (dcaPurchases.length === 0) {
      return null;
    }

    // Sort by timestamp
    dcaPurchases.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate total invested in STX
    const totalInvestedSTX = dcaPurchases.reduce((sum, tx) => sum + tx.amount, 0);
    const totalInvested = microSTXToSTX(totalInvestedSTX);

    // Calculate average purchase price (weighted by amount)
    let weightedSum = 0;
    dcaPurchases.forEach(tx => {
      if (tx.btcPrice) {
        weightedSum += microSTXToSTX(tx.amount) * tx.btcPrice;
      }
    });
    const averagePurchasePrice = weightedSum / totalInvested;

    // Calculate current value
    const currentValue = totalInvested * (currentBTCPrice / averagePurchasePrice);
    const totalGain = currentValue - totalInvested;
    const percentageGain = (totalGain / totalInvested) * 100;

    // Simulate lump sum investment (all invested at first purchase price)
    const firstPurchasePrice = dcaPurchases[0]?.btcPrice || averagePurchasePrice;
    const lumpSumValue = totalInvested * (currentBTCPrice / firstPurchasePrice);

    return {
      totalInvested,
      currentValue,
      totalGain,
      percentageGain,
      averagePurchasePrice,
      currentPrice: currentBTCPrice,
      lumpSumValue,
      dcaValue: currentValue
    } as DCAPerformance;
  }, [transactions, currentBTCPrice]);

  const chartData = useMemo(() => {
    const dcaPurchases = transactions.filter(tx => tx.type === 'dca-purchase' && tx.status === 'success');
    
    if (dcaPurchases.length === 0) {
      return [];
    }

    // Sort by timestamp
    dcaPurchases.sort((a, b) => a.timestamp - b.timestamp);
    
    const firstPurchasePrice = dcaPurchases[0]?.btcPrice || currentBTCPrice;
    const dataPoints: ChartDataPoint[] = [];
    
    let cumulativeInvestment = 0;
    let weightedSum = 0;
    
    dcaPurchases.forEach((purchase) => {
      cumulativeInvestment += microSTXToSTX(purchase.amount);
      if (purchase.btcPrice) {
        weightedSum += microSTXToSTX(purchase.amount) * purchase.btcPrice;
      }
      
      const avgPrice = weightedSum / cumulativeInvestment;
      const dcaValue = cumulativeInvestment * (currentBTCPrice / avgPrice);
      const lumpSumValue = cumulativeInvestment * (currentBTCPrice / firstPurchasePrice);
      
      dataPoints.push({
        date: new Date(purchase.timestamp),
        dcaValue,
        lumpSumValue,
        btcPrice: purchase.btcPrice || currentBTCPrice
      });
    });
    
    return dataPoints;
  }, [transactions, currentBTCPrice]);

  if (!performance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">DCA Performance Analysis</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-600">No DCA purchases found for performance analysis</p>
        </div>
      </div>
    );
  }

  const gainLossColor = performance.totalGain >= 0 ? 'text-green-600' : 'text-red-600';
  const gainLossBgColor = performance.totalGain >= 0 ? 'bg-green-50' : 'bg-red-50';

  // Calculate chart dimensions
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.dcaValue, d.lumpSumValue)),
    performance.totalInvested
  );
  
  const chartHeight = 200;
  const chartBars = chartData.map((point, index) => {
    const dcaHeight = (point.dcaValue / maxValue) * chartHeight;
    const lumpSumHeight = (point.lumpSumValue / maxValue) * chartHeight;
    
    return {
      index,
      dcaHeight,
      lumpSumHeight,
      date: point.date,
      btcPrice: point.btcPrice
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">DCA Performance Analysis</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartView('value')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartView === 'value'
                ? 'bg-stacks-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Value Over Time
          </button>
          <button
            onClick={() => setChartView('price')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartView === 'price'
                ? 'bg-stacks-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Purchase Price
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Invested</p>
          <p className="text-xl font-bold text-gray-900">
            {performance.totalInvested.toFixed(6)} STX
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Current Value</p>
          <p className="text-xl font-bold text-gray-900">
            {performance.currentValue.toFixed(6)} STX
          </p>
        </div>
        
        <div className={`text-center p-4 ${gainLossBgColor} rounded-lg`}>
          <p className="text-sm text-gray-600 mb-1">Total Gain/Loss</p>
          <p className={`text-xl font-bold ${gainLossColor}`}>
            {performance.totalGain >= 0 ? '+' : ''}{performance.totalGain.toFixed(6)} STX
          </p>
        </div>
        
        <div className={`text-center p-4 ${gainLossBgColor} rounded-lg`}>
          <p className="text-sm text-gray-600 mb-1">Return %</p>
          <p className={`text-xl font-bold ${gainLossColor}`}>
            {performance.percentageGain >= 0 ? '+' : ''}{performance.percentageGain.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Average Purchase Price */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600 font-medium">Average Purchase Price</p>
            <p className="text-2xl font-bold text-blue-900">
              ${performance.averagePurchasePrice.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600 font-medium">Current BTC Price</p>
            <p className="text-2xl font-bold text-blue-900">
              ${performance.currentPrice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* DCA vs Lump Sum Comparison */}
      <div className="mb-6">
        <h4 className="text-md font-semibold mb-3">DCA vs Lump Sum Performance</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">DCA Strategy</span>
              <span className="text-sm font-medium">
                {performance.dcaValue.toFixed(6)} STX
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((performance.dcaValue / performance.totalInvested) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Lump Sum (First Purchase)</span>
              <span className="text-sm font-medium">
                {performance.lumpSumValue.toFixed(6)} STX
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((performance.lumpSumValue / performance.totalInvested) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {performance.dcaValue > performance.lumpSumValue ? (
              <span className="text-green-600 font-medium">
                DCA outperformed lump sum by {((performance.dcaValue - performance.lumpSumValue) / performance.lumpSumValue * 100).toFixed(2)}%
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                Lump sum would have outperformed DCA by {((performance.lumpSumValue - performance.dcaValue) / performance.dcaValue * 100).toFixed(2)}%
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Enhanced Chart Visualization */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">
          {chartView === 'value' ? 'Investment Value Over Time' : 'BTC Purchase Prices'}
        </h4>
        
        {chartBars.length > 0 ? (
          <div className="space-y-4">
            {/* Chart */}
            <div className="relative h-48 bg-gray-50 rounded-lg p-4">
              <div className="h-full flex items-end justify-between gap-1">
                {chartBars.map((bar) => (
                  <div key={bar.index} className="flex-1 flex flex-col items-center max-w-12">
                    {chartView === 'value' ? (
                      <>
                        <div className="w-full flex gap-0.5">
                          <div
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${bar.dcaHeight}px` }}
                            title={`DCA: ${bar.dcaHeight.toFixed(2)}`}
                          ></div>
                          <div
                            className="bg-purple-500 rounded-t"
                            style={{ height: `${bar.lumpSumHeight}px` }}
                            title={`Lump Sum: ${bar.lumpSumHeight.toFixed(2)}`}
                          ></div>
                        </div>
                      </>
                    ) : (
                      <div
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${(bar.btcPrice / 60000) * chartHeight}px` }}
                        title={`BTC Price: $${bar.btcPrice.toLocaleString()}`}
                      ></div>
                    )}
                    <span className="text-xs text-gray-500 mt-1 truncate">
                      {bar.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Y-axis labels */}
              <div className="absolute left-0 top-4 bottom-8 flex flex-col justify-between text-xs text-gray-500 -ml-2">
                <span>{maxValue.toFixed(2)}</span>
                <span>{(maxValue / 2).toFixed(2)}</span>
                <span>0</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 text-sm">
              {chartView === 'value' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">DCA Value</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-gray-600">Lump Sum Value</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">BTC Purchase Price</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
}