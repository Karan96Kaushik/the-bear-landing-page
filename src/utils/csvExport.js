import { processTrialsForExport } from './simulationHelpers';

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
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
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
