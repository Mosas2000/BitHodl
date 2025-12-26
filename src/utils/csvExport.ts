import { SavingsTransaction, DCAPerformance } from '@/types';
import { microSTXToSTX } from './stacks';

export interface ExportOptions {
  includeHeaders?: boolean;
  dateFormat?: 'short' | 'long' | 'iso';
  includeMetadata?: boolean;
  includeFees?: boolean;
  includeBalances?: boolean;
  includeBTCPrices?: boolean;
}

export interface DCAExportOptions {
  includeComparison?: boolean;
  includeProjections?: boolean;
  projectionMonths?: number;
}

// Default export options
const defaultExportOptions: ExportOptions = {
  includeHeaders: true,
  dateFormat: 'short',
  includeMetadata: true,
  includeFees: true,
  includeBalances: true,
  includeBTCPrices: true
};

const defaultDCAExportOptions: DCAExportOptions = {
  includeComparison: true,
  includeProjections: false,
  projectionMonths: 12
};

/**
 * Exports savings transactions to a CSV file with customizable formatting options
 * @param transactions - Array of savings transactions to export
 * @param filename - Optional custom filename (defaults to date-based name)
 * @param options - Export configuration options
 */
export function exportTransactionsToCSV(
  transactions: SavingsTransaction[],
  filename?: string,
  options: ExportOptions = {}
) {
  if (transactions.length === 0) {
    return;
  }

  const opts = { ...defaultExportOptions, ...options };

  // Build headers based on options
  const headers = [];
  if (opts.includeHeaders) {
    headers.push('Date', 'Time', 'Type', 'Amount (STX)', 'Status');
    
    if (opts.includeMetadata) {
      headers.push('Transaction Hash', 'Block Height', 'Confirmations');
    }
    
    if (opts.includeFees) {
      headers.push('Fee (STX)');
    }
    
    if (opts.includeBTCPrices) {
      headers.push('BTC Price');
    }
    
    if (opts.includeBalances) {
      headers.push('STX Balance After');
    }
  }

  // Format date based on option
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (opts.dateFormat) {
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'iso':
        return date.toISOString().split('T')[0];
      case 'short':
      default:
        return date.toLocaleDateString();
    }
  };

  // Build rows based on options
  const rows = transactions.map(tx => {
    const row = [
      formatDate(tx.timestamp),
      new Date(tx.timestamp).toLocaleTimeString(),
      tx.type.replace('-', ' '),
      microSTXToSTX(tx.amount).toFixed(6),
      tx.status
    ];
    
    if (opts.includeMetadata) {
      row.push(
        tx.txHash,
        tx.blockHeight?.toString() || '',
        tx.confirmations?.toString() || ''
      );
    }
    
    if (opts.includeFees) {
      row.push(tx.fee ? microSTXToSTX(tx.fee).toFixed(6) : '');
    }
    
    if (opts.includeBTCPrices) {
      row.push(tx.btcPrice ? `$${tx.btcPrice.toLocaleString()}` : '');
    }
    
    if (opts.includeBalances) {
      row.push(tx.stxBalance ? microSTXToSTX(tx.stxBalance).toFixed(6) : '');
    }
    
    return row;
  });

  const csvContent = [
    opts.includeHeaders ? headers.join(',') : '',
    ...rows.map(row =>
      row.map(cell => {
        // Escape commas and quotes in cells
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].filter(Boolean).join('\n');

  downloadCSV(csvContent, filename || `savings-transactions-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Exports DCA performance metrics to a CSV file with comparison and projection options
 * @param performance - DCA performance data to export
 * @param filename - Optional custom filename (defaults to date-based name)
 * @param options - DCA export configuration options
 */
export function exportDCAPerformanceToCSV(
  performance: DCAPerformance,
  filename?: string,
  options: DCAExportOptions = {}
) {
  const opts = { ...defaultDCAExportOptions, ...options };

  // Build headers and rows based on options
  const headers = ['Metric', 'Value', 'Unit'];
  const rows = [
    ['Total Invested', performance.totalInvested.toFixed(6), 'STX'],
    ['Current Value', performance.currentValue.toFixed(6), 'STX'],
    ['Total Gain/Loss', performance.totalGain.toFixed(6), 'STX'],
    ['Return Percentage', `${performance.percentageGain.toFixed(2)}%`, ''],
    ['Average Purchase Price', `$${performance.averagePurchasePrice.toLocaleString()}`, 'USD'],
    ['Current BTC Price', `$${performance.currentPrice.toLocaleString()}`, 'USD']
  ];

  if (opts.includeComparison) {
    rows.push(
      ['DCA Value', performance.dcaValue.toFixed(6), 'STX'],
      ['Lump Sum Value', performance.lumpSumValue.toFixed(6), 'STX'],
      ['DCA vs Lump Sum', performance.dcaValue > performance.lumpSumValue ? 'DCA Better' : 'Lump Sum Better', '']
    );
  }

  if (opts.includeProjections) {
    const months = opts.projectionMonths || 12;
    const monthlyReturn = performance.totalGain / months;
    const projectedValue = performance.currentValue + (monthlyReturn * months);
    
    rows.push(
      [`Projected Value (${months} months)`, projectedValue.toFixed(6), 'STX'],
      ['Projected Monthly Return', monthlyReturn.toFixed(6), 'STX']
    );
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, filename || `dca-performance-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Exports summary data to a CSV file with automatic categorization
 * @param summaryData - Key-value pairs of summary metrics
 * @param filename - Optional custom filename (defaults to date-based name)
 */
export function exportSummaryToCSV(
  summaryData: Record<string, string | number>,
  filename?: string
) {
  const headers = ['Metric', 'Value', 'Category'];
  const rows = Object.entries(summaryData).map(([key, value]) => {
    const category = key.includes('Deposit') ? 'Deposits' :
                    key.includes('Withdrawal') ? 'Withdrawals' :
                    key.includes('Interest') ? 'Interest' :
                    key.includes('DCA') ? 'DCA' : 'Other';
    
    return [key, typeof value === 'number' ? value.toFixed(6) : value.toString(), category];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, filename || `summary-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Helper function to download CSV content as a file
 * @param csvContent - The CSV content to download
 * @param filename - The filename for the downloaded file
 */
function downloadCSV(csvContent: string, filename: string) {
  // Add BOM for proper UTF-8 handling in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}