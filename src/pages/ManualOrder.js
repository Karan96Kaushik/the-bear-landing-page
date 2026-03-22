import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { postAuthorizedData } from '../api/api';

export default function ManualOrder() {
  const [mode, setMode] = useState('direct'); // 'levels' | 'direct'
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState('BULLISH');
  const [targetPrice, setTargetPrice] = useState('');

  // direct mode
  const [triggerPrice, setTriggerPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [slUpdateInterval, setSlUpdateInterval] = useState('3');
  const [riskAmount, setRiskAmount] = useState(200);
  const [reviseSL, setReviseSL] = useState('9'); // optional

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => {
    if (!symbol.trim()) return false;
    if (!['BULLISH', 'BEARISH'].includes(direction)) return false;
    return triggerPrice !== '' && stopLossPrice !== '';
  }, [symbol, direction, triggerPrice, stopLossPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Please fill the required fields');
      return;
    }

    const payload = {
      symbol: symbol.trim().toUpperCase(),
      direction,
      riskAmount: Number(riskAmount),
    };

    payload.triggerPrice = Number(triggerPrice);
    payload.targetPrice = Number(targetPrice);
    payload.stopLossPrice = Number(stopLossPrice);
    if (quantity !== '') payload.quantity = Number(quantity);

    if (reviseSL !== '') payload.reviseSL = Number(reviseSL);
    if (slUpdateInterval !== '') payload.slInterval = Number(slUpdateInterval);

    setLoading(true);
    setResult(null);
    try {
      const resp = await postAuthorizedData('/manual-order', payload);
      setResult(resp.result || resp);
      toast.success('Manual order created (check API response)');
    } catch (err) {
      const responseData = err?.response?.data;
      const msg =
        (typeof responseData === 'string' ? responseData : undefined) ||
        responseData?.message ||
        responseData?.error ||
        responseData?.errors?.[0]?.message ||
        err?.message ||
        'Failed to create order';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto pt-20 p-4 dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">Manual Order</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
              <select
                value={mode}
                disabled={true}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="levels">Levels (High/Low)</option>
                <option value="direct">Direct (Trigger/Stop Loss)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., RELIANCE"
                list="symbols"
              />
              <datalist id="symbols" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="BULLISH">BULLISH</option>
                <option value="BEARISH">BEARISH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Amount</label>
              <input
                type="number"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger Price</label>
                  <input
                    type="number"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stop Loss Price</label>
                  <input
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Price</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity (optional)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SL Update Frequency</label>
              <input
                type="number"
                value={reviseSL}
                onChange={(e) => setReviseSL(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="leave empty to use default"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SL Update Backlook</label>
              <input
                type="number"
                value={slUpdateInterval}
                onChange={(e) => setSlUpdateInterval(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="leave empty to use default"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </form>

        {result ? (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">API Response</h2>
            <pre className="text-xs overflow-auto whitespace-pre-wrap text-gray-900 dark:text-gray-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

