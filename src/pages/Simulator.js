import React, { useState, useEffect } from 'react';
// import { Line } from 'react-chartjs-2';
import { ShortSellingSimulator } from '../simulator/ShortSellingSimulator'; // Adjust the import path as needed
import { BuySimulator } from '../simulator/BuySimulator'; // Add this import
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchAuthorizedData, postAuthorizedData } from '../api/api';
import { toast } from 'react-hot-toast';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import annotationPlugin from 'chartjs-plugin-annotation';
import Switch from 'react-switch'; // Add this import
import zoomPlugin from 'chartjs-plugin-zoom';
import AceEditor from 'react-ace';
import Modal from 'react-modal'; // Add this import
import { Tab } from '@headlessui/react'
import { X, FileCode, Trash2, Loader2, ChevronRight, ChevronLeft, Plus, Minus } from 'lucide-react'; // Add this import

import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-javascript';

import 'chartjs-adapter-date-fns';
// Import the necessary mode and theme for the Ace editor

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

// Add this import at the top of the file

// const updateStopLossFunction = (timestamps, i, high, low, open, close, stopLossPrice) => {
    // console.log(i, i % 15 , i > 15)
const updateStopLossFunction_text = `
`;

const updateTriggerPriceFunction_text = `
// 'i', 'data', 'triggerPrice', 'position', 'logAction'
`;

const updateTargetPriceFunction_text = `
// 'i', 'data', 'targetPrice', 'position', 'logAction'
`;

const ShortSellingSimulatorPage = () => {
  const [stockSymbol, setStockSymbol] = useState('KNRCON');
  const [triggerPrice, setTriggerPrice] = useState();
  const [stopLossPrice, setStopLossPrice] = useState(10000);
  const [targetPrice, setTargetPrice] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [startTime, setStartTime] = useState(new Date('2024-10-23'));
  const [endTime, setEndTime] = useState(new Date('2024-10-24'));
  const [simulationResult, setSimulationResult] = useState(null);
  const [yahooData, setYahooData] = useState(null);
  const [isMarketOrder, setIsMarketOrder] = useState(true);
  const [functionName, setFunctionName] = useState('');
  const [editorHeight, setEditorHeight] = useState('400px');
  const [savedFunctions, setSavedFunctions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [updateStopLossFunctionText, setUpdateStopLossFunctionText] = useState(updateStopLossFunction_text);
  const [updateTargetPriceFunctionText, setUpdateTargetPriceFunctionText] = useState(updateTargetPriceFunction_text);
  const [updateTriggerPriceFunctionText, setUpdateTriggerPriceFunctionText] = useState(updateTriggerPriceFunction_text);

  const [activeTab, setActiveTab] = useState('stopLoss');
  const [stopLossFunctionName, setStopLossFunctionName] = useState('');
  const [targetPriceFunctionName, setTargetPriceFunctionName] = useState('');
  const [triggerPriceFunctionName, setTriggerPriceFunctionName] = useState('');
  const [dailyPnL, setDailyPnL] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationType, setSimulationType] = useState('short'); // Add this state
  const [stocks, setStocks] = useState([{ symbol: 'KNRCON', quantity: 100 }]);

  useEffect(() => {
    // Dynamically import the JavaScript mode
    import('ace-builds/src-noconflict/mode-javascript')
      .then(() => {
        console.log('JavaScript mode loaded');
      })
      .catch(err => {
        console.error('Failed to load JavaScript mode:', err);
      });
  }, []);

  useEffect(() => {
    if (stockSymbol.length < 2) return;
    const fetchYahooData = async () => {
      const timeDifference = endTime.getTime() - startTime.getTime();
      const daysDifference = timeDifference / (1000 * 3600 * 24);
      
      if (daysDifference > 1) return;

      setIsLoading(true);
      try {
        const [yahooResponse] = await Promise.all([
          fetchAuthorizedData(`/data/yahoo?symbol=${stockSymbol}&interval=1m&startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}`)
        ]);
        if (!yahooResponse) 
            throw new Error('No data found for the given time range');
        setYahooData(yahooResponse);
      } catch (err) {
        toast.error(err?.message || err || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchYahooData();    
  }, [stockSymbol, startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const updateStopLossFunction = new Function('i', 'data', 'stopLossPrice', 'position', 'logAction', updateStopLossFunctionText);
    const updateTriggerPriceFunction = new Function('i', 'data', 'triggerPrice', 'position', 'logAction', updateTriggerPriceFunctionText);
    const updateTargetPriceFunction = new Function('i', 'data', 'targetPrice', 'position', 'logAction', updateTargetPriceFunctionText);

    const timeDifference = endTime.getTime() - startTime.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    const simulateStock = async (stock) => {
      if (daysDifference > 1) {
        const dailyResults = [];
        let currentDate = new Date(startTime);

        while (currentDate < endTime) {
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);

          currentDate.setHours(1, 59, 59, 999);
          nextDate.setHours(11, 59, 59, 999);

          // Skip weekends
          if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          const dailyEndTime = nextDate < endTime ? nextDate : endTime;

          try {
            // Fetch data for each day
            const dailyYahooData = await fetchAuthorizedData(`/data/yahoo?symbol=${stock.symbol}&interval=1m&startDate=${currentDate.toISOString()}&endDate=${dailyEndTime.toISOString()}`);

            if (!dailyYahooData || dailyYahooData.length === 0) {
              throw new Error('No data found for the given time range');
            }

            const SimulatorClass = simulationType === 'short' ? ShortSellingSimulator : BuySimulator;
            const simulator = new SimulatorClass({
              stockSymbol: stock.symbol,
              triggerPrice: isMarketOrder ? 'MKT' : triggerPrice,
              stopLossPrice,
              targetPrice,
              quantity: stock.quantity,
              updateStopLossFunction,
              updateTriggerPriceFunction,
              updateTargetPriceFunction,
              startTime: currentDate,
              endTime: dailyEndTime,
              yahooData: dailyYahooData
            });

            await simulator.run();
            dailyResults.push({
              date: currentDate.toISOString().split('T')[0],
              pnl: simulator.pnl,
              tradeActions: simulator.tradeActions,
              data: simulator.data
            });
          } catch (err) {
            toast.error(`Failed to run simulation for ${currentDate.toISOString().split('T')[0]}: ${err.message}`);
          }

          currentDate = new Date(nextDate);
        }

        return {
          symbol: stock.symbol,
          quantity: stock.quantity,
          dailyResults,
          totalPnl: dailyResults.reduce((sum, day) => sum + day.pnl, 0),
          tradeActions: dailyResults.flatMap(day => day.tradeActions),
          data: dailyResults.flatMap(day => day.data)
        };
      } else {
        try {
          // Fetch data for the stock
          const stockYahooData = await fetchAuthorizedData(`/data/yahoo?symbol=${stock.symbol}&interval=1m&startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}`);

          if (!stockYahooData || stockYahooData.length === 0) {
            throw new Error(`No data found for ${stock.symbol}`);
          }

          const SimulatorClass = simulationType === 'short' ? ShortSellingSimulator : BuySimulator;
          const simulator = new SimulatorClass({
            stockSymbol: stock.symbol,
            triggerPrice: isMarketOrder ? 'MKT' : triggerPrice,
            stopLossPrice,
            targetPrice,
            quantity: stock.quantity,
            updateStopLossFunction,
            updateTriggerPriceFunction,
            updateTargetPriceFunction,
            startTime,
            endTime,
            yahooData: stockYahooData
          });

          await simulator.run();
          return {
            symbol: stock.symbol,
            quantity: stock.quantity,
            pnl: simulator.pnl,
            tradeActions: simulator.tradeActions,
            data: simulator.data
          };
        } catch (err) {
          console.error(`Error simulating ${stock.symbol}:`, err);
          return { symbol: stock.symbol, quantity: stock.quantity, error: err.message };
        }
      }
    };

    try {
      const results = await Promise.all(stocks.map(simulateStock));
      const multipleStocks = stocks.length > 1;

      if (multipleStocks) {
        setSimulationResult({
          multipleStocks: true,
          results: results.map(result => ({
            ...result,
            dailyResults: result.dailyResults || [{ date: startTime.toISOString().split('T')[0], pnl: result.pnl }]
          }))
        });
      } else {
        const singleResult = results[0];
        setSimulationResult({
          multipleStocks: false,
          ...singleResult,
          pnl: singleResult.totalPnl || singleResult.pnl,
          tradeActions: singleResult.tradeActions,
          data: singleResult.data
        });
      }

      setDailyPnL(multipleStocks ? [] : results[0].dailyResults || []);
    } catch (err) {
      toast.error(err?.message || err || 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    datasets: [
      {
        label: 'Stock Price',
        data: simulationResult?.data?.map((d, i) => ({
          x: d.time,
          o: d.open,
          h: d.high,
          l: d.low,
          c: d.close
        })) || [],
      },
      {
        label: 'SMA44',
        data: simulationResult?.data?.map((d) => ({
          x: d.time,
          y: d.sma44
        })) || [],
        type: 'line',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        pointRadius: 0,
        yAxisID: 'y',
      }
    ]
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
            annotations: simulationResult?.tradeActions?.map(action => ({
                type: 'line',
                xMin: action.time,
                xMax: action.time,
                borderColor: 
                    action?.action.includes('Short') ? 'red' : 
                    action?.action === 'Stop Loss Hit' ? 'orange' :
                    action?.action === 'Target Hit' ? 'green' :
                    action?.action === 'Auto Square-off' ? 'blue' :
                    'gray',
                borderWidth: 2,
                label: {
                    content: `${action?.action} at ${action?.price?.toFixed(2)}`,
                    display: true,
                    position: 'start',
                    backgroundColor: 
                        action?.action.includes('Short') ? 'red' : 
                        action?.action === 'Stop Loss Hit' ? 'orange' :
                        action?.action === 'Target Hit' ? 'green' :
                        action?.action === 'Auto Square-off' ? 'blue' :
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

  const saveFunction = async () => {
    try {
      const functionType = activeTab;
      const functionText = activeTab === 'stopLoss' ? updateStopLossFunctionText :
                           activeTab === 'targetPrice' ? updateTargetPriceFunctionText : updateTriggerPriceFunctionText;
      const functionName = activeTab === 'stopLoss' ? stopLossFunctionName :
                           activeTab === 'targetPrice' ? targetPriceFunctionName : triggerPriceFunctionName;

      await postAuthorizedData('/data/save-function', {
        name: functionName,
        code: functionText,
        type: functionType,
      });
      toast.success('Function saved successfully');
    } catch (error) {
      console.error('Error saving function:', error);
      toast.error('Failed to save function: ' + error?.response?.data?.message || error?.message || error);
    }
  };

  const viewSavedFunctions = async () => {
    try {
      const response = await fetchAuthorizedData('/data/functions');
      setSavedFunctions(response);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching saved functions:', error);
      toast.error('Failed to fetch saved functions');
    }
  };

  const loadFunction = (functionCode, functionType, functionName) => {
    if (functionType === 'stopLoss') {
      setUpdateStopLossFunctionText(functionCode);
      setStopLossFunctionName(functionName);
      setActiveTab('stopLoss');
    } else if (functionType === 'targetPrice') {
      setUpdateTargetPriceFunctionText(functionCode);
      setTargetPriceFunctionName(functionName);
      setActiveTab('targetPrice');
    } else if (functionType === 'triggerPrice') {
      setUpdateTriggerPriceFunctionText(functionCode);
      setTriggerPriceFunctionName(functionName);
      setActiveTab('triggerPrice');
    }
    setIsModalOpen(false);
  };

  const deleteFunction = async (functionId) => {
    if (window.confirm('Are you sure you want to delete this function?')) {
      try {
        await postAuthorizedData('/data/delete-function', { _id: functionId });
        toast.success('Function deleted successfully');
        // Refresh the list of saved functions
        const response = await fetchAuthorizedData('/data/functions');
        setSavedFunctions(response);
      } catch (error) {
        console.error('Error deleting function:', error);
        toast.error('Failed to delete function');
      }
    }
  };

  const handleResize = (e) => {
    const startY = e.clientY;
    const startHeight = parseInt(editorHeight);

    const doDrag = (e) => {
      setEditorHeight(`${startHeight + e.clientY - startY}px`);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const handleNextDay = () => {
    const newStartTime = new Date(startTime);
    newStartTime.setDate(newStartTime.getDate() + 1);
    setStartTime(newStartTime);

    const newEndTime = new Date(endTime);
    newEndTime.setDate(newEndTime.getDate() + 1);
    setEndTime(newEndTime);
  };

  const handlePreviousDay = () => {
    const newStartTime = new Date(startTime);
    newStartTime.setDate(newStartTime.getDate() - 1);
    setStartTime(newStartTime);

    const newEndTime = new Date(endTime);
    newEndTime.setDate(newEndTime.getDate() - 1);
    setEndTime(newEndTime);
  };

  const handleLastDay = () => {
    const now = new Date();
    setEndTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
    setStartTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
  };

  const handleLast30Days = () => {
    const now = new Date();
    setEndTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()-1, 23, 59, 59));
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    setStartTime(new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate(), 0, 0, 0));
  };

  const addStock = () => {
    setStocks([...stocks, { symbol: '', quantity: 100 }]);
  };

  const removeStock = (index) => {
    const newStocks = [...stocks];
    newStocks.splice(index, 1);
    setStocks(newStocks);
  };

  const updateStock = (index, field, value) => {
    const newStocks = [...stocks];
    newStocks[index][field] = value;
    setStocks(newStocks);
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <div className="bg-gray-900 min-h-screen relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-lg font-semibold text-gray-700">Loading...</span>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Stock Trading Simulator</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="mb-6 bg-gray-50 p-6 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Stocks</h3>
            {stocks.map((stock, index) => (
              <div key={index} className="flex flex-wrap items-center mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                <div className="w-full sm:w-2/5 pr-2 mb-2 sm:mb-0">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={stock.symbol}
                    onChange={(e) => updateStock(index, 'symbol', e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="e.g., AAPL"
                  />
                </div>
                <div className="w-full sm:w-2/5 px-2 mb-2 sm:mb-0">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={stock.quantity}
                    onChange={(e) => updateStock(index, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="w-full sm:w-1/5 pl-2 flex justify-end items-end">
                  <button 
                    type="button" 
                    onClick={() => removeStock(index)} 
                    className="bg-red-500 hover:bg-red-600 focus:ring-red-400 text-white p-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-4">
              <button 
                type="button" 
                onClick={addStock} 
                className="bg-green-500 hover:bg-green-600 focus:ring-green-400 text-white p-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Price</label>
              <div className="flex items-center">
                {!isMarketOrder && (
                  <input
                    type="number"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(Number(e.target.value))}
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
            <div className="w-full md:w-1/2 px-2 mb-4 z-[5]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
              <div className="flex items-center">
                <DatePicker
                  selected={startTime}
                  onChange={(date) => setStartTime(date)}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full px-3 py-2 text-base z-[6] border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4 z-[5]">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <DatePicker
                selected={endTime}
                onChange={(date) => setEndTime(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 text-base z-[6] border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4 z-[1]">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePreviousDay}
                  className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                  title="Next Day"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={handleLastDay}
                  className="flex items-center bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                  title="Last 1 Day"
                >
                  Last 1 Day
                </button>
                <button
                  type="button"
                  onClick={handleLast30Days}
                  className="flex items-center bg-purple-500 text-white px-3 py-2 rounded-md hover:bg-purple-600 transition-colors text-sm font-medium"
                  title="Last 30 Days"
                >
                  Last 30 Days
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4"> 
              <label className="block text-sm font-medium text-gray-700 mb-1">Simulation Type</label>
              <select
                value={simulationType}
                onChange={(e) => setSimulationType(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="short">Bear</option>
                <option value="buy">Bull</option>
              </select>
            </div>
          </div>
          <div className="w-full px-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Functions</label>
            <div className="flex items-center mb-2">
              <input
                type="text"
                placeholder="Function Name"
                className="w-1/3 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mr-2"
                value={activeTab === 'stopLoss' ? stopLossFunctionName :
                       activeTab === 'targetPrice' ? targetPriceFunctionName : triggerPriceFunctionName}
                onChange={(e) => {
                  if (activeTab === 'stopLoss') setStopLossFunctionName(e.target.value);
                  else if (activeTab === 'targetPrice') setTargetPriceFunctionName(e.target.value);
                  else setTriggerPriceFunctionName(e.target.value);
                }}
              />
              <button
                onClick={saveFunction}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors mr-2"
              >
                Save
              </button>
              <button
                onClick={viewSavedFunctions}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                View Saved Functions
              </button>
            </div>
            <Tab.Group selectedIndex={['stopLoss', 'targetPrice', 'triggerPrice'].indexOf(activeTab)} onChange={(index) => setActiveTab(['stopLoss', 'targetPrice', 'triggerPrice'][index])}>
              <Tab.List className="flex p-1 space-x-1 bg-blue-900/20 rounded-xl">
                {['Stop Loss', 'Target Price', 'Trigger Price'].map((category) => (
                  <Tab
                    key={category}
                    className={({ selected }) =>
                      classNames(
                        'w-full py-2.5 text-sm font-medium leading-5 text-blue-700 rounded-lg',
                        'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                        selected
                          ? 'bg-white shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                      )
                    }
                  >
                    {category}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="mt-2">
                <Tab.Panel>
                  <AceEditor
                    mode="javascript"
                    theme="monokai"
                    onChange={setUpdateStopLossFunctionText}
                    name="updateStopLossFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={updateStopLossFunctionText}
                    width="100%"
                    height={editorHeight}
                    fontSize={12}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    style={{ resize: 'vertical' }}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: false,
                      showLineNumbers: true,
                      tabSize: 2,
                    }}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <AceEditor
                    mode="javascript"
                    theme="monokai"
                    onChange={setUpdateTargetPriceFunctionText}
                    name="updateTargetPriceFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={updateTargetPriceFunctionText}
                    width="100%"
                    height={editorHeight}
                    fontSize={12}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    style={{ resize: 'vertical' }}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: false,
                      showLineNumbers: true,
                      tabSize: 2,
                    }}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <AceEditor
                    mode="javascript"
                    theme="monokai"
                    onChange={setUpdateTriggerPriceFunctionText}
                    name="updateSellPriceFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={updateTriggerPriceFunctionText}
                    width="100%"
                    height={editorHeight}
                    fontSize={12}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    style={{ resize: 'vertical' }}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: false,
                      showLineNumbers: true,
                      tabSize: 2,
                    }}
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={handleResize}></div>
          </div>
          <div className="mt-4">
            <button type="submit" className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">
              Run Simulation
            </button>
          </div>
        </form>

        {simulationResult && !simulationResult.multipleStocks && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
            <Chart
              type='candlestick'
              data={chartData}
              options={candlestickOptions}
            />
            <p className="mt-4">Final P&L: {simulationResult.pnl?.toFixed(2)}</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">Trade Actions:</h3>
            <ul className="list-disc pl-5">
              {simulationResult.tradeActions?.map((action, index) => (
                <li key={index} className={`mb-1 ${
                  action?.action.includes('Short') ? 'text-red-600' :
                  action?.action === 'Stop Loss Hit' ? 'text-orange-600' :
                  action?.action === 'Target Hit' ? 'text-green-600' :
                  action?.action === 'Auto Square-off' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {new Date(action.time).toLocaleString()}: {action?.action} at {action?.price?.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {simulationResult && simulationResult.multipleStocks && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
            {simulationResult.results.map((stockResult, stockIndex) => (
              <div key={stockIndex} className="mb-8">
                <h3 className="text-lg font-semibold mb-2">{stockResult.symbol}</h3>
                <table className="w-full mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-2 px-4">Date</th>
                      <th className="text-right py-2 px-4">Quantity</th>
                      <th className="text-right py-2 px-4">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockResult.dailyResults?.map((day, dayIndex) => (
                      <tr key={dayIndex} className={dayIndex % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4">{day.date}</td>
                        <td className="text-right py-2 px-4">{stockResult.quantity}</td>
                        <td className={`text-right py-2 px-4 ${day.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {day.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-100">
                      <td className="py-2 px-4" colSpan="2">Total for {stockResult.symbol}</td>
                      <td className={`text-right py-2 px-4 ${stockResult.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stockResult.totalPnl?.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Overall Results</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left py-2 px-4">Stock Symbol</th>
                    <th className="text-right py-2 px-4">Total P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-4">{result.symbol}</td>
                      <td className={`text-right py-2 px-4 ${result.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.totalPnl?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td className="py-2 px-4">Grand Total</td>
                    <td className={`text-right py-2 px-4 ${simulationResult.results.reduce((sum, result) => sum + result.totalPnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {simulationResult.results.reduce((sum, result) => sum + result.totalPnl, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dailyPnL.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Daily P&L Results</h2>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {dailyPnL.map((day, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                    <td className="py-2">{day.date}</td>
                    <td className={`text-right ${day.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {day.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2">Total</td>
                  <td className={`text-right ${dailyPnL.reduce((sum, day) => sum + day.pnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dailyPnL.reduce((sum, day) => sum + day.pnl, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Saved Functions"
        className="fixed inset-0 flex items-center justify-center z-[1000]"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[999]"
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Saved Functions</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {savedFunctions.length > 0 ? (
              <ul className="space-y-3">
                {savedFunctions.map((functionCode) => (
                  <li key={functionCode.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <FileCode className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {functionCode.name} <span className="text-gray-500">({functionCode.type})</span>
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadFunction(functionCode.code, functionCode.type, functionCode.name)}
                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteFunction(functionCode._id)}
                        className="bg-red-500 text-white text-sm px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No saved functions found.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShortSellingSimulatorPage;
