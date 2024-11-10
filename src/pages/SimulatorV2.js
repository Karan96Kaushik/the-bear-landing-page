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

import SimulationResults from '../components/SimulationResults';
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
// 'i', 'data', 'stopLossPrice', 'position', 'logAction'
`;

const updateTriggerPriceFunction_text = `
// 'i', 'data', 'triggerPrice', 'position', 'logAction'
`;

const updateTargetPriceFunction_text = `
// 'i', 'data', 'targetPrice', 'position', 'logAction'
`;

const initialState = {
  timeRange: {
    start: new Date('2024-11-08'),
    end: new Date('2024-11-08')
  },
  simulation: {
    result: null,
    type: 'BEARISH',
    data_source: 'nifty',
    candle: '1',
    isMarketOrder: true,
    reEnterPosition: false
  },
  prices: {
    trigger: 0,
    stopLoss: 0,
    target: 0
  },
  editor: {
    height: '250px',
    functions: {
      stopLoss: {
        text: updateStopLossFunction_text,
        name: ''
      },
      target: {
        text: updateTargetPriceFunction_text,
        name: ''
      },
      trigger: {
        text: updateTriggerPriceFunction_text,
        name: ''
      }
    },
    savedFunctions: []
  }
};

const ShortSellingSimulatorPage = () => {
  const [state, setState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyPnL, setDailyPnL] = useState([]);
  const [activeTab, setActiveTab] = useState('stopLoss');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedResultData, setSelectedResultData] = useState(null);
  const [selectedFunctions, setSelectedFunctions] = useState([]);

  // Helper function to update nested state
  const updateState = (path, value) => {
    setState(prev => {
      const newState = { ...prev };
      let current = newState;
      const keys = path.split('.');
      const lastKey = keys.pop();
      
      for (const key of keys) {
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[lastKey] = value;
      return newState;
    });
  };

  const loadNseiData = async (result) => {
    try {

        const startOfDay = new Date(result.date);
        startOfDay.setUTCHours(0, 0, 0, 999);
        const endOfDay = new Date(result.date);
        endOfDay.setUTCHours(23, 59, 59, 999);
  
        // Fetch data for the selected stock
        let nseiData = await fetchAuthorizedData(
          `/data/yahoo?symbol=${'^NSEI'}&interval=1m&startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
        );

        nseiData = nseiData.filter(d => d.close && d.high && d.sma44);

      updateState('nseiData', nseiData);
    } catch (err) {
      console.error('Error fetching NSEI data:', err);
      toast.error('Failed to fetch NSEI data');
    }
  }

  useEffect(() => {
    // Dynamically import the JavaScript mode
    import('ace-builds/src-noconflict/mode-javascript')
      .then(() => {
        console.log('JavaScript mode loaded');
      })
      .catch(err => {
        console.error('Failed to load JavaScript mode:', err);
      });
      loadSavedFunctions();

  }, []);

  // useEffect(() => {
  //   if (stockSymbol.length < 2) return;
  //   const fetchYahooData = async () => {
  //     const timeDifference = endTime.getTime() - startTime.getTime();
  //     const daysDifference = timeDifference / (1000 * 3600 * 24);
      
  //     if (daysDifference > 1) return;

  //     setIsLoading(true);
  //     try {
  //       const [yahooResponse] = await Promise.all([
  //         fetchAuthorizedData(`/data/yahoo?symbol=${stockSymbol}&interval=1m&startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}`)
  //       ]);
  //       if (!yahooResponse) 
  //           throw new Error('No data found for the given time range');
  //       setYahooData(yahooResponse);
  //     } catch (err) {
  //       toast.error(err?.message || err || 'Failed to fetch data');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchYahooData();    
  // }, [stockSymbol, startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const updateStopLossFunction = new Function('i', 'data', 'stopLossPrice', 'position', 'logAction', state.editor.functions.stopLoss.text);
    const updateTriggerPriceFunction = new Function('i', 'data', 'triggerPrice', 'position', 'logAction', state.editor.functions.trigger.text);
    const updateTargetPriceFunction = new Function('i', 'data', 'targetPrice', 'position', 'logAction', state.editor.functions.target.text);

    const timeDifference = state.timeRange.end.getTime() - state.timeRange.start.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);
    
    try {
      const allResults = [];
      let currentDate = new Date(state.timeRange.start);
      
      while (currentDate <= state.timeRange.end) {
        // Skip weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        currentDate.setUTCHours(0, 0, 0, 999)

        if (state.simulation.candle === '1') {
          currentDate.setUTCHours(4, 1, 10, 0);
        } else if (state.simulation.candle === '2') {
          currentDate.setUTCHours(4, 16, 10, 0);
        } else if (state.simulation.candle === '3') {
          currentDate.setUTCHours(4, 31, 10, 0);
        }

        // Fetch stocks for current date
        const selectedStocks = await fetchAuthorizedData(`/zaire/selected-stocks?date=${currentDate.toISOString()}&source=${state.simulation.data_source}`);
        const runStocks = selectedStocks.stocks.filter(stock => stock.direction == (state.simulation.type))

        // For each stock on this date
        for (const stock of runStocks) {
          const startOfDay = new Date(currentDate);
          startOfDay.setUTCHours(0, 0, 0, 999);
          const endOfDay = new Date(currentDate);
          endOfDay.setUTCHours(23, 59, 59, 999);

          try {
            // Fetch data for the stock
            const yahooData = await fetchAuthorizedData(
              `/data/yahoo?symbol=${stock.sym}&interval=1m&startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
            );

            if (!yahooData || yahooData.length === 0) {
              console.warn(`No data found for ${stock.sym} on ${currentDate.toISOString().split('T')[0]}`);
              continue;
            }

            const SimulatorClass = state.simulation.type === 'BEARISH' ? ShortSellingSimulator : BuySimulator;
            const simulator = new SimulatorClass({
              stockSymbol: stock.sym,
              triggerPrice: null,
              stopLossPrice: null,
              targetPrice: null,
              quantity: stock.qty,
              updateStopLossFunction,
              updateTriggerPriceFunction,
              updateTargetPriceFunction,
              startTime: startOfDay,
              endTime: endOfDay,
              yahooData: yahooData
            });

            await simulator.run();

            allResults.push({
              symbol: stock.sym,
              date: currentDate.toISOString().split('T')[0],
              pnl: simulator.pnl,
              quantity: stock.qty
            });

          } catch (err) {
            console.error(`Error simulating ${stock.sym} on ${currentDate.toISOString().split('T')[0]}:`, err);
            toast.error(`Failed to simulate ${stock.sym} on ${currentDate.toISOString().split('T')[0]}`);
          }
        }
        toast.success(`Data fetched till ${currentDate.toISOString().split('T')[0]}`);
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Update state with results
      setState(prev => ({
        ...prev,
        simulation: {
          ...prev.simulation,
          result: {
            results: allResults
          }
        }
      }));

    } catch (err) {
      toast.error(err?.message || err || 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

//   const fetchSelectedStocks = async (date) => {
//     try {
//       const response = await fetchAuthorizedData(`/zaire/selected-stocks?date=${date.toISOString()}`);
//       setState(prev => ({
//         ...prev,
//         stocks: response.stocks.map(stock => ({
//           symbol: stock.sym,
//           quantity: stock.qty
//         }))
//       }));
//     } catch (error) {
//       toast.error('Failed to fetch selected stocks');
//       console.error('Error fetching selected stocks:', error);
//     }
//   };

//   useEffect(() => {
//     fetchSelectedStocks(state.timeRange.start);
//   }, [state.timeRange.start]);

  const handleResize = (e) => {
    const startY = e.clientY;
    const startHeight = parseInt(state.editor.height);

    const doDrag = (e) => {
      setState(prev => ({
        ...prev,
        editor: {
          ...prev.editor,
          height: `${startHeight + e.clientY - startY}px`
        }
      }));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const handleNextDay = () => {
    const newStartTime = new Date(state.timeRange.start);
    newStartTime.setDate(newStartTime.getDate() + 1);
    newStartTime.setUTCHours(0, 0, 0, 0);
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        start: newStartTime
      }
    }));

    const newEndTime = new Date(state.timeRange.end);
    newEndTime.setDate(newEndTime.getDate() + 1);
    newEndTime.setUTCHours(23, 59, 59, 999);
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        end: newEndTime
      }
    }));
  };

  const handlePreviousDay = () => {
    const newStartTime = new Date(state.timeRange.start);
    newStartTime.setDate(newStartTime.getDate() - 1);
    newStartTime.setUTCHours(0, 0, 0, 0);
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        start: newStartTime
      }
    }));

    const newEndTime = new Date(state.timeRange.end);
    newEndTime.setDate(newEndTime.getDate() - 1);
    newEndTime.setUTCHours(23, 59, 59, 999);
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        end: newEndTime
      }
    }));
  };

  const handleLastDay = () => {
    const now = new Date();
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      }
    }));
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      }
    }));
  };

  const handleLast30Days = () => {
    const now = new Date();
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1, 23, 59, 59)
      }
    }));
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    setState(prev => ({
      ...prev,
      timeRange: {
        ...prev.timeRange,
        start: new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate(), 0, 0, 0)
      }
    }));
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  // Add this function to calculate the grand total
  const calculateGrandTotal = (results) => {
    console.debug(results);
    return results.reduce((sum, result) => sum + (result.totalPnl || result.pnl || 0), 0);
  };

  const saveFunction = async () => {
    const activeFunction = state.editor.activeTab === 'stopLoss' ? state.editor.functions.stopLoss :
                          state.editor.activeTab === 'targetPrice' ? state.editor.functions.target :
                          state.editor.functions.trigger;

    if (!activeFunction.name) {
      toast.error('Please provide a function name');
      return;
    }

    try {
      await postAuthorizedData('/data/save-function', {
        name: activeFunction.name,
        code: activeFunction.text,
        type: state.editor.activeTab
      });
      toast.success('Function saved successfully');
      await loadSavedFunctions(); // Refresh the list
    } catch (error) {
      console.error('Error saving function:', error);
      toast.error('Failed to save function: ' + error?.response?.data?.message || error?.message || error);
    }
  };

  const viewSavedFunctions = async () => {
    try {
      await loadSavedFunctions();
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading saved functions:', error);
      toast.error('Failed to load saved functions');
    }
  };

  const loadSavedFunctions = async () => {
    try {
      const functions = await fetchAuthorizedData('/data/functions');
      updateState('editor.savedFunctions', functions);
    } catch (error) {
      console.error('Error fetching saved functions:', error);
      toast.error('Failed to fetch saved functions');
    }
  };

  const loadSelectedFunctions = () => {
    selectedFunctions.forEach(functionId => {
      const functionCode = state.editor.savedFunctions.find(f => f._id === functionId);
      if (functionCode) {
        const functionPath = functionCode.type === 'stopLoss' ? 'editor.functions.stopLoss' :
                            functionCode.type === 'targetPrice' ? 'editor.functions.target' :
                            'editor.functions.trigger';

        updateState(`${functionPath}.text`, functionCode.code);
        updateState(`${functionPath}.name`, functionCode.name);
      }
    });
    setSelectedFunctions([]); // Clear selections
    setIsModalOpen(false);
    toast.success('Selected functions loaded successfully');
  };

  const deleteFunction = async (functionId) => {
    if (window.confirm('Are you sure you want to delete this function?')) {
      try {
        await postAuthorizedData('/data/delete-function', { _id: functionId });
        toast.success('Function deleted successfully');
        await loadSavedFunctions(); // Refresh the list
      } catch (error) {
        console.error('Error deleting function:', error);
        toast.error('Failed to delete function');
      }
    }
  };

  const handleRowClick = async (result) => {
    setIsLoading(true);
    try {
      const startOfDay = new Date(result.date);
      startOfDay.setUTCHours(0, 0, 0, 999);
      const endOfDay = new Date(result.date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Fetch data for the selected stock
      const yahooData = await fetchAuthorizedData(
        `/data/yahoo?symbol=${result.symbol}&interval=1m&startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
      );

      await loadNseiData(result);

      if (!yahooData || yahooData.length === 0) {
        throw new Error('No data found for selected stock');
      }

      // Run simulation for this specific stock
      const SimulatorClass = state.simulation.type === 'BEARISH' ? ShortSellingSimulator : BuySimulator;
      const simulator = new SimulatorClass({
        stockSymbol: result.symbol,
        triggerPrice: null,
        stopLossPrice: null,
        targetPrice: null,
        quantity: result.quantity,
        updateStopLossFunction: new Function('i', 'data', 'stopLossPrice', 'position', 'logAction', state.editor.functions.stopLoss.text),
        updateTriggerPriceFunction: new Function('i', 'data', 'triggerPrice', 'position', 'logAction', state.editor.functions.trigger.text),
        updateTargetPriceFunction: new Function('i', 'data', 'targetPrice', 'position', 'logAction', state.editor.functions.target.text),
        startTime: startOfDay,
        endTime: endOfDay,
        yahooData: yahooData
      });

      await simulator.run();
      
      setSelectedResult(result);
      setSelectedResultData({
        data: yahooData,
        tradeActions: simulator.tradeActions,
        pnl: simulator.pnl
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-4 z-[5]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <DatePicker
                selected={state.timeRange.start}
                onChange={(date) => {
                  const roundedDate = new Date(date);
                  roundedDate.setUTCHours(0, 0, 0, 0);
                  updateState('timeRange.start', roundedDate);
                  updateState('timeRange.end', new Date(roundedDate.getTime() + 24 * 60 * 60 * 1000));
                }}
                dateFormat="MMM d, yyyy"
                className="w-full px-3 py-2 text-base z-[6] border border-gray-300 rounded-md"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4 z-[5]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
              <div className="flex items-center">
                <DatePicker
                  selected={state.timeRange.start}
                  onChange={(date) => {
                    const roundedDate = new Date(date);
                    roundedDate.setUTCHours(0, 0, 0, 0);
                    updateState('timeRange.start', roundedDate);
                  }}
                  showTimeSelect
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="w-full px-3 py-2 text-base z-[6] border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4 z-[5]">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <DatePicker
                selected={state.timeRange.end}
                onChange={(date) => {
                  const roundedDate = new Date(date);
                  roundedDate.setUTCHours(23, 59, 59, 999);
                  updateState('timeRange.end', roundedDate);
                }}
                showTimeSelect
                dateFormat="MMM d, yyyy h:mm aa"
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
                value={state.simulation.type}
                onChange={(e) => updateState('simulation.type', e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="BEARISH">Bearish</option>
                <option value="BULLISH">Bullish</option>
              </select>
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4"> 
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
              <select
                value={state.simulation.data_source}
                onChange={(e) => updateState('simulation.data_source', e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="nifty">Nifty</option>
                <option value="highbeta">HIGHBETA</option>
                <option value="roce">ROCE</option>
                <option value="roe">ROE</option>
              </select>
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4"> 
              <label className="block text-sm font-medium text-gray-700 mb-1">Candle</label>
              <select
                value={state.simulation.candle}
                onChange={(e) => updateState('simulation.candle', e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="1">1st Candle</option>
                <option value="2">2nd Candle</option>
                <option value="3">3rd Candle</option>
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
                value={state.editor.activeTab === 'stopLoss' ? state.editor.functions.stopLoss.name :
                       state.editor.activeTab === 'targetPrice' ? state.editor.functions.target.name : state.editor.functions.trigger.name}
                onChange={(e) => {
                  if (state.editor.activeTab === 'stopLoss') updateState('editor.functions.stopLoss.name', e.target.value);
                  else if (state.editor.activeTab === 'targetPrice') updateState('editor.functions.target.name', e.target.value);
                  else updateState('editor.functions.trigger.name', e.target.value);
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
            <Tab.Group selectedIndex={['stopLoss', 'targetPrice', 'triggerPrice'].indexOf(state.editor.activeTab)} onChange={(index) => updateState('editor.activeTab', ['stopLoss', 'targetPrice', 'triggerPrice'][index])}>
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
                    onChange={(value) => updateState('editor.functions.stopLoss.text', value)}
                    name="updateStopLossFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={state.editor.functions.stopLoss.text}
                    width="100%"
                    height={state.editor.height}
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
                    onChange={(value) => updateState('editor.functions.target.text', value)}
                    name="updateTargetPriceFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={state.editor.functions.target.text}
                    width="100%"
                    height={state.editor.height}
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
                    onChange={(value) => updateState('editor.functions.trigger.text', value)}
                    name="updateSellPriceFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={state.editor.functions.trigger.text}
                    width="100%"
                    height={state.editor.height}
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
            <button onClick={handleSubmit} className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600">
              Run Simulation
            </button>
          </div>
        </div>

        {state.simulation.result && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-2 px-4">Stock</th>
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-right py-2 px-4">Quantity</th>
                  <th className="text-right py-2 px-4">P&L</th>
                </tr>
              </thead>
              <tbody>
                {state.simulation.result.results.map((result, index) => (
                  <tr 
                    key={`${result.symbol}-${result.date}`} 
                    className={`${index % 2 === 0 ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-100`}
                    onClick={() => handleRowClick(result)}
                  >
                    <td className="py-2 px-4">{result.symbol}</td>
                    <td className="py-2 px-4">{result.date}</td>
                    <td className="text-right py-2 px-4">{result.quantity}</td>
                    <td className={`text-right py-2 px-4 ${result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.pnl?.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td className="py-2 px-4" colSpan="3">Grand Total</td>
                  <td className={`text-right py-2 px-4 ${calculateGrandTotal(state.simulation.result.results) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateGrandTotal(state.simulation.result.results).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {selectedResultData && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Chart for {selectedResult.symbol} on {selectedResult.date}
                </h3>
                <SimulationResults
                  data={selectedResultData.data}
                  tradeActions={selectedResultData.tradeActions}
                  pnl={selectedResultData.pnl}
                  nseiData={state.nseiData}
                />
              </div>
            )}
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
            {state.editor.savedFunctions.length > 0 ? (
              <div>
                <ul className="space-y-3 mb-4">
                  {state.editor.savedFunctions.map((functionCode) => (
                    <li 
                      key={functionCode._id} 
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        selectedFunctions.includes(functionCode._id) 
                          ? 'bg-blue-50 border-2 border-blue-200' 
                          : 'bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedFunctions(prev => {
                          if (prev.includes(functionCode._id)) {
                            return prev.filter(id => id !== functionCode._id);
                          } else {
                            // Only allow one function of each type to be selected
                            const existingTypeFunction = prev.find(id => 
                              state.editor.savedFunctions.find(f => 
                                f._id === id && f.type === functionCode.type
                              )
                            );
                            if (existingTypeFunction) {
                              return [...prev.filter(id => id !== existingTypeFunction), functionCode._id];
                            }
                            return [...prev, functionCode._id];
                          }
                        });
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFunctions.includes(functionCode._id)}
                          onChange={() => {}} // Handle change through li click
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <FileCode className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {functionCode.name} <span className="text-gray-500">({functionCode.type})</span>
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFunction(functionCode._id);
                        }}
                        className="bg-red-500 text-white text-sm px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={loadSelectedFunctions}
                    disabled={selectedFunctions.length === 0}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      selectedFunctions.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Load Selected ({selectedFunctions.length})
                  </button>
                </div>
              </div>
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
