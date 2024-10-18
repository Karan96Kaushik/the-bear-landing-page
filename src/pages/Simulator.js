import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { ShortSellingSimulator } from '../simulator/ShortSellingSimulator'; // Adjust the import path as needed
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchAuthorizedData } from '../api/api';
import { toast } from 'react-hot-toast';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import annotationPlugin from 'chartjs-plugin-annotation';
import Switch from 'react-switch'; // Add this import
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  CandlestickController,
  CandlestickElement,
  annotationPlugin,
  zoomPlugin
);

const updateStopLossFunction = (timestamps, i, high, low, open, close, stopLossPrice) => {
    // console.log(i, i % 15 , i > 15)
    if (isNaN(i) || !timestamps.length || !high.length || !low.length || !stopLossPrice) {
        throw new Error("Incomplete params in updated SL function" + `${i} || ${timestamps.length} || ${high.length} || ${low.length} || ${stopLossPrice}`)
    }
    console.debug(i)
    if (i % 15 === 0 && i > 15) {
        const thirtyMinutesAgo = timestamps[i] - 30 * 60;
        const now = timestamps[i];
        const last30MinData = high.filter((_, index) => {
            if (timestamps[index] <= now && timestamps[index] >= thirtyMinutesAgo) {
                return true;
            }
            return false;
        });
        // console.log('last30MinData', last30MinData.length)
        const highestPrice = Math.max(...last30MinData);
        console.debug(highestPrice)
        if (highestPrice < stopLossPrice)
            return highestPrice;
    }
    return stopLossPrice;
}

const ShortSellingSimulatorPage = () => {
  const [stockSymbol, setStockSymbol] = useState('MOIL');
  const [sellPrice, setSellPrice] = useState();
  const [stopLossPrice, setStopLossPrice] = useState(389);
  const [targetPrice, setTargetPrice] = useState(347.2);
  const [quantity, setQuantity] = useState(239);
  const [startTime, setStartTime] = useState(new Date('2024-10-18'));
  const [endTime, setEndTime] = useState(new Date('2024-10-19'));
  const [simulationResult, setSimulationResult] = useState(null);
  const [yahooData, setYahooData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMarketOrder, setIsMarketOrder] = useState(true);

  useEffect(() => {
    if (stockSymbol.length < 2) return;
    const fetchYahooData = async () => {
      try {
        const [yahooResponse] = await Promise.all([
          fetchAuthorizedData(`/data/yahoo?symbol=${stockSymbol}&interval=1m&startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}`)
        ]);
        if (!yahooResponse?.chart) 
            throw new Error('No data found for the given time range');
        setYahooData(yahooResponse);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchYahooData();    
  }, [stockSymbol, startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const simulator = new ShortSellingSimulator({
      stockSymbol,
      sellPrice: isMarketOrder ? 'MKT' : sellPrice,
      stopLossPrice,
      targetPrice,
      quantity,
      updateStopLossFunction,
      startTime,
      endTime,
      yahooData
    });

    await simulator.run();
    setSimulationResult(simulator);
  };

  const chartData = {
    datasets: [{
        label: 'Stock Price',
        data: simulationResult?.timestamps.map((timestamp, i) => ({
            x: timestamp * 1000,
            o: simulationResult.indicators.open[i],
            h: simulationResult.indicators.high[i],
            l: simulationResult.indicators.low[i],
            c: simulationResult.indicators.close[i]
        })) || [],
    }]
  };

  const candlestickOptions = {
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'minute',
                displayFormats: {
                    minute: 'HH:mm',
                },
                tooltipFormat: 'MMM d, yyyy HH:mm',
                timezone: 'Asia/Kolkata'
            }
        },
        y: {
            beginAtZero: false,
            min: (context) => {
                const data = context.chart.data?.datasets[0].data;
                if (!data) return 0;
                const validLows = data.map(d => d.l).filter(val => val !== null && val !== 0);
                return Math.min(...validLows) * 0.998; // 0.5% below the lowest point
              },
              max: (context) => {
                const data = context.chart.data?.datasets[0].data;
                if (!data) return 0;
                const validHighs = data.map(d => d.h).filter(val => val !== null && val !== 0);
                return Math.max(...validHighs) * 1.002; // 0.5% above the highest point
              }
        }
    },
    plugins: {
        zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'x',
            },
          },
        annotation: {
            annotations: simulationResult?.tradeActions.map(action => ({
                type: 'line',
                xMin: action.time * 1000,
                xMax: action.time * 1000,
                borderColor: 
                    action.action.includes('Short') ? 'red' : 
                    action.action === 'Stop Loss Hit' ? 'orange' :
                    action.action === 'Target Hit' ? 'green' :
                    action.action === 'Auto Square-off' ? 'blue' :
                    'gray',
                borderWidth: 2,
                label: {
                    content: `${action.action} at ${action.price.toFixed(2)}`,
                    display: true,
                    position: 'start',
                    backgroundColor: 
                        action.action.includes('Short') ? 'red' : 
                        action.action === 'Stop Loss Hit' ? 'orange' :
                        action.action === 'Target Hit' ? 'green' :
                        action.action === 'Auto Square-off' ? 'blue' :
                        'gray',
                    font: {
                        size: 12
                    },
                    padding: 4
                }
            })) || []
        }
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Short Selling Simulator</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
              <input
                type="text"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
              <div className="flex items-center">
                {!isMarketOrder && (
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                {isMarketOrder && (
                  <span className="w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-100">
                    MKT
                  </span>
                )}
                <div className="ml-2 flex items-center">
                  <Switch
                    onChange={() => setIsMarketOrder(!isMarketOrder)}
                    checked={isMarketOrder}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={24}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={48}
                    className="react-switch"
                  />
                  <span className="ml-2 text-sm text-gray-600">Market Order</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss Price</label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Price</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
              <DatePicker
                selected={startTime}
                onChange={(date) => setStartTime(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <DatePicker
                selected={endTime}
                onChange={(date) => setEndTime(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">
              Run Simulation
            </button>
          </div>
        </form>

        {simulationResult && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
            <Chart
              type='candlestick'
              data={chartData}
              options={candlestickOptions}
            />
            <p className="mt-4">Final P&L: {simulationResult.pnl.toFixed(2)}</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">Trade Actions:</h3>
            <ul className="list-disc pl-5">
              {simulationResult.tradeActions.map((action, index) => (
                <li key={index} className={`mb-1 ${
                  action.action.includes('Short') ? 'text-red-600' :
                  action.action === 'Stop Loss Hit' ? 'text-orange-600' :
                  action.action === 'Target Hit' ? 'text-green-600' :
                  action.action === 'Auto Square-off' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {new Date(action.time * 1000).toLocaleString()}: {action.action} at {action.price.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortSellingSimulatorPage;
