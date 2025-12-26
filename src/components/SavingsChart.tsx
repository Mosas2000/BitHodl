import { microSTXToSTX, formatSTX } from '@/utils/stacks';

interface ChartDataPoint {
  date: string;
  balance: number;
  deposits: number;
  interest: number;
}

interface SavingsChartProps {
  data: ChartDataPoint[];
}

export function SavingsChart({ data }: SavingsChartProps) {
  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.balance));
  
  // Generate chart points
  const chartHeight = 200;
  const chartWidth = 100;
  const padding = 5;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Savings Growth</h2>
      
      <div className="relative">
        {/* Chart */}
        <div className="h-48 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-gray-200 w-full"></div>
            ))}
          </div>
          
          {/* Chart data */}
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {/* Balance line */}
            <polyline
              fill="none"
              stroke="#2A5ADA"
              strokeWidth="2"
              points={data.map((point, index) => {
                const x = (index / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
                const y = chartHeight - ((point.balance / maxValue) * (chartHeight - 2 * padding) + padding);
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Area under balance line */}
            <polygon
              fill="#2A5ADA"
              fillOpacity="0.1"
              points={`${data.map((point, index) => {
                const x = (index / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
                const y = chartHeight - ((point.balance / maxValue) * (chartHeight - 2 * padding) + padding);
                return `${x},${y}`;
              }).join(' ')} ${chartWidth - padding},${chartHeight - padding} ${padding},${chartHeight - padding}`}
            />
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
              const y = chartHeight - ((point.balance / maxValue) * (chartHeight - 2 * padding) + padding);
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#2A5ADA"
                    className="hover:r-4 transition-all cursor-pointer"
                  />
                  <title>{`${point.date}: ${formatSTX(microSTXToSTX(point.balance))} STX`}</title>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {data.map((point, index) => (
            <div key={index} className="text-center">
              {index === 0 || index === data.length - 1 || index % Math.ceil(data.length / 5) === 0
                ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-stacks-blue rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Total Balance</span>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-sm text-gray-600">Starting Balance</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatSTX(microSTXToSTX(data[0]?.balance || 0))} STX
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Current Balance</p>
          <p className="text-lg font-semibold text-stacks-blue">
            {formatSTX(microSTXToSTX(data[data.length - 1]?.balance || 0))} STX
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Growth</p>
          <p className="text-lg font-semibold text-green-600">
            {data.length > 1 
              ? formatSTX(microSTXToSTX(data[data.length - 1].balance - data[0].balance)) 
              : '0'
            } STX
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate mock data for the chart
export function generateMockChartData() {
  const data = [];
  const now = Date.now();
  const days = 30; // Last 30 days
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const baseBalance = 500000; // 0.5 STX in microSTX
    const dailyInterest = baseBalance * 0.05 / 365; // 5% APY
    const daysPassed = days - i;
    const balance = baseBalance + (dailyInterest * daysPassed);
    
    data.push({
      date: date.toISOString(),
      balance: Math.floor(balance),
      deposits: 0,
      interest: Math.floor(dailyInterest * daysPassed),
    });
  }
  
  return data;
}
