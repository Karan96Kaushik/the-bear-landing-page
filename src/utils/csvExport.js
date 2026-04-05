import { processTrialsForExport } from './simulationHelpers';

const escapeCsvCell = (value) => {
  if (value == null || value === '') return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const buildSymbolStatsRows = (statsBySymbol, direction) => {
  const entries = Object.entries(statsBySymbol || {});
  const sorted = [...entries].sort(
    ([, a], [, b]) => (b?.totalPnl ?? 0) - (a?.totalPnl ?? 0)
  );
  return sorted.map(([symbol, stats]) => {
    const trades = stats?.trades ?? 0;
    const positiveTrades = stats?.positiveTrades ?? 0;
    const positivePct = trades > 0 ? (positiveTrades * 100) / trades : 0;
    return {
      direction,
      symbol,
      totalPnl: stats?.totalPnl ?? 0,
      trades,
      positiveTrades,
      positivePct: Number(positivePct.toFixed(2)),
      meanPnlPerTrade: stats?.meanPnlPerTrade ?? '',
      stdDevPnlPerTrade: stats?.stdDevPnlPerTrade ?? '',
    };
  });
};

/**
 * Export per-symbol statistics (bullish + bearish) for one trial to CSV.
 */
export const exportSymbolStatsToCSV = (results, trialStartTime) => {
  const bullish = buildSymbolStatsRows(results?.symbolWiseBullishStats, 'BULLISH');
  const bearish = buildSymbolStatsRows(results?.symbolWiseBearishStats, 'BEARISH');
  const rows = [...bullish, ...bearish];
  if (rows.length === 0) return;

  const headers = [
    'direction',
    'symbol',
    'totalPnl',
    'trades',
    'positiveTrades',
    'positivePct',
    'meanPnlPerTrade',
    'stdDevPnlPerTrade',
  ];
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const stamp = trialStartTime
    ? new Date(trialStartTime).toISOString().replace(/[:.]/g, '-')
    : new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('download', `symbol_statistics_${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export trials data to CSV file
 */
export const exportTrialsToCSV = (trials) => {
  const processedData = processTrialsForExport(trials);
  if (processedData.length === 0) return;

  const headers = Object.keys(processedData[0]);
  const csvContent = [
    headers.join(','),
    ...processedData.map(row =>
      headers.map(header => escapeCsvCell(row[header])).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `trials_export_${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
