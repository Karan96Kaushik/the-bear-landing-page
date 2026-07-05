import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ExternalLink, Loader2 } from 'lucide-react';
import { postAuthorizedData } from '../api/api';

const DEFAULT_SPREADSHEET_ID = '1UQP4K5olCt8qfYpdNFGoJu3T0E357fH324kucK2IsNo';

export default function NseHistoricalPage() {
  const [symbol, setSymbol] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => Boolean(symbol.trim()), [symbol]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Please enter a symbol');
      return;
    }

    const payload = {
      symbol: symbol.trim().toUpperCase(),
    };

    if (showAdvanced && spreadsheetId.trim()) {
      payload.spreadsheetId = spreadsheetId.trim();
    }

    setLoading(true);
    setResult(null);

    try {
      const resp = await postAuthorizedData('/data/nse-historical-to-sheet', payload);
      setResult(resp.result || resp);
      toast.success(resp.message || `Historical data for ${payload.symbol} uploaded`);
    } catch (err) {
      const responseData = err?.response?.data;
      const msg =
        (typeof responseData === 'string' ? responseData : undefined) ||
        responseData?.message ||
        responseData?.error ||
        err?.message ||
        'Failed to fetch NSE historical data';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto pt-20 p-4 dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">NSE Historical Data</h1>
        <p className="text-gray-400 mb-6">
          Fetch 1 year of security-wise price/volume data from NSE and upload it to the Risk analyses spreadsheet.
        </p>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., TCS"
                disabled={loading}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-sm text-yellow-500 hover:text-yellow-400"
              >
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </button>
            </div>

            {showAdvanced ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Spreadsheet ID
                </label>
                <input
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  placeholder={DEFAULT_SPREADSHEET_ID}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Defaults to the Risk analyses spreadsheet. A new tab named after the symbol will be created or updated.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Fetching & uploading...' : 'Run'}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This may take up to a minute — fetching CSV from NSE and writing to Google Sheets...
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Result</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Symbol</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{result.symbol}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Sheet tab</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{result.sheetTab}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Trading days</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{result.rowCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Date range</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {result.firstDate} → {result.lastDate}
                </dd>
              </div>
            </dl>

            {result.spreadsheetUrl ? (
              <a
                href={result.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-yellow-500 hover:text-yellow-400 text-sm font-medium"
              >
                Open spreadsheet
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : null}

            <details className="mt-4">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                Raw API response
              </summary>
              <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 rounded p-3">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
      </div>
    </div>
  );
}
