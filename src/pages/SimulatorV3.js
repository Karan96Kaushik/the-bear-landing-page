import React, { useState, useEffect } from 'react';
// import { ShortSellingSimulator } from '../simulator/ShortSellingSimulator';
// import { BuySimulator } from '../simulator/BuySimulator';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchAuthorizedData, postAuthorizedData } from '../api/api';
import { toast } from 'react-hot-toast';
// import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import annotationPlugin from 'chartjs-plugin-annotation';
import Switch from 'react-switch';
import zoomPlugin from 'chartjs-plugin-zoom';
// import AceEditor from 'react-ace';
// import Modal from 'react-modal';
// import { Tab } from '@headlessui/react';
import { Loader2 } from 'lucide-react';
import SimulationResults from '../components/SimulationResults';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-javascript';
import 'chartjs-adapter-date-fns';
import Select from 'react-select';

import _ from 'lodash';
import moment from 'moment/moment';
import TrialResults from '../components/TrialResults';

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

const trialStockColumns = [
	{key: 'symbol', label: 'Stock'},
	{key: 'datetime', label: 'Date'},
	{key: 'quantity', label: 'Quantity'},
	{key: 'direction', label: 'Direction'},
	{key: 'pnl', label: 'P&L', classRenderer: (pnl) => Number(pnl) >= 0 ? 'text-green-600' : 'text-red-600', renderer: (pnl) => pnl?.toFixed(2)},
	{key: 'triggerPrice', label: 'Trigger Price', renderer: (triggerPrice) => triggerPrice?.toFixed(2)},
	{key: 'targetPrice', label: 'Target Price', renderer: (targetPrice) => targetPrice?.toFixed(2)},
	{key: 'stopLossPrice', label: 'Stop Loss Price', renderer: (stopLossPrice) => stopLossPrice?.toFixed(2)}
]

const processTrialData = (trialData) => {
	const dailyPnl = Object.values(
		trialData.reduce((acc, curr) => {
		  const date = curr.timestamp.toISOString().split('T')[0];
		  acc[date] = acc[date] || [];
		  acc[date].push(curr.pnl);
		  return acc;
		}, {})
	  ).map(pnls => pnls.reduce((a, b) => a + b, 0))

	const totalPnl = dailyPnl.reduce((acc, curr) => acc + curr, 0)

	const totalTrades = trialData.filter(t => t.pnl !== 0).length

	const weeklyPnl = Object.values(
		trialData.reduce((acc, curr) => {
		  const date = new Date(curr.timestamp);
		  const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
		  acc[weekKey] = acc[weekKey] || [];
		  acc[weekKey].push(curr.pnl);
		  return acc;
		}, {})
	  ).map(pnls => pnls.reduce((a, b) => a + b, 0))

	  const hourWisePnl = trialData.reduce((acc, curr) => {
		  const date = new Date(curr.timestamp);
		  const hourKey = `${date.getUTCHours()}`;
		  acc[hourKey] = acc[hourKey] || [];
		  acc[hourKey].push(curr.pnl);
		  return acc;
		}, {})

	  const directionWisePnl = trialData.reduce((acc, curr) => {
		  acc[curr.direction] = acc[curr.direction] || [];
		  acc[curr.direction].push(curr.pnl);
		  return acc;
		}, {})

	const orderCountStats = Object.values(
		trialData.reduce((acc, curr) => {
		  const date = curr.timestamp.toISOString().split('T')[0];
		  acc[date] = acc[date] || 0;
		  acc[date]++;
		  return acc;
		}, {})
	  )

	const meanPnlPerTrade = (trialData.reduce((acc, curr) => acc + curr.pnl, 0) / trialData.length)
	const stdDevPnlPerTrade = Math.sqrt(trialData.reduce((acc, curr) => acc + Math.pow(curr.pnl - meanPnlPerTrade, 2), 0) / trialData.length)

	const positiveTrades = trialData.filter(trade => trade.pnl > 0).length

	return {
		dailyPnl,
		weeklyPnl,
		hourWisePnl,
		directionWisePnl,
		orderCountStats,
		positiveTrades,
		meanPnlPerTrade,
		stdDevPnlPerTrade,
		totalPnl,
		totalTrades,
	}
}

const initialSelectionParamOptions = {
  TOUCHING_SMA_TOLERANCE: { type: 'category', options: [0.0003] },
  TOUCHING_SMA_15_TOLERANCE: { type: 'category', options: [0.0003] },
  NARROW_RANGE_TOLERANCE: { type: 'category', options: [0.0046] },
  WIDE_RANGE_TOLERANCE: { type: 'category', options: [0.0015] },
  CANDLE_CONDITIONS_SLOPE_TOLERANCE: { type: 'category', options: [1] },
  BASE_CONDITIONS_SLOPE_TOLERANCE: { type: 'category', options: [1] },
  MA_WINDOW: { type: 'category', options: [44] },
  MA_WINDOW_5: { type: 'category', options: [22] },
  CHECK_75MIN: { type: 'category', options: [1] },
  CHECK_NIFTY_50: { type: 'category', options: [1] },
  STOCK_LIST: { type: 'category', options: ['HIGHBETA!D2:D550'] },
};

function ParameterPopup({ selectionParams, setSelectionParams }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [tempParams, setTempParams] = useState(initialSelectionParamOptions);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [selectedKeyForNewOption, setSelectedKeyForNewOption] = useState('');

  const openPopup = () => {
    setTempParams({ ...selectionParams });
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const saveChanges = () => {
    setSelectionParams(tempParams);
    closePopup();
  };

  const addNewOptionToKey = () => {
    if (selectedKeyForNewOption && newOptionValue) {
      const newValue = parseFloat(newOptionValue.trim()) || newOptionValue.trim(); // Handle numbers and strings
      setTempParams((prev) => ({
        ...prev,
        [selectedKeyForNewOption]: {
          ...prev[selectedKeyForNewOption],
          options: [...prev[selectedKeyForNewOption].options, newValue],
        },
      }));
      setNewOptionValue('');
    }
  };

  const removeOptionFromKey = (key, optionToRemove) => {
    setTempParams((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        options: prev[key].options.filter((option) => option !== optionToRemove),
      },
    }));
  };

  return (
    <div className="p-4 w-full">
      <button
        onClick={openPopup}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Change Parameters
      </button>

      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-7xl">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Edit Parameters</h2>

            <div className="space-y-4 grid grid-cols-3 gap-4">
              {Object.keys(tempParams).map((key) => (
                <div key={key} className="flex flex-col gap-2 col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {key}
                  </label>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="text"
                      placeholder="New Option Value"
                      value={selectedKeyForNewOption === key ? newOptionValue : ''}
                      onChange={(e) => {
                        setSelectedKeyForNewOption(key);
                        setNewOptionValue(e.target.value);
                      }}
                      className="w-1/3 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      onClick={addNewOptionToKey}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tempParams[key].options.map((option) => (
                      <div
                        key={option}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg"
                      >
                        <span className="dark:text-gray-300">{option}</span>
                        <button
                          onClick={() => removeOptionFromKey(key, option)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closePopup}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateCombinations(options) {
    const keys = Object.keys(options);
    
    // Generate value ranges for each parameter
    const values = keys.map(key => {
        const param = options[key];
        if (param.type === 'number') {
            const range = [];
            for (let val = param.start; val <= param.end; val += param.step) {
                range.push(Number(val.toFixed(6))); // Ensuring precision
            }
            return range;
        } else if (param.type === 'category') {
            return param.options;
        }
    });
    
    // Generate all possible combinations
    const combinations = [];
    function combine(index, current) {
        if (index === keys.length) {
            combinations.push({ ...current });
            return;
        }
        for (const value of values[index]) {
            current[keys[index]] = value;
            combine(index + 1, current);
        }
    }
    
    combine(0, {});
    return combinations;
}

// ... existing code ...

// Add this function near the top of the file, after other imports
const processTrialsForExport = (trials) => {
	return trials.map(trial => ({
	  startTime: trial.startTime,
	  totalPnl: trial.results.totalPnl,
	  totalTrades: trial.results.totalTrades,
	  meanPnlPerTrade: trial.results.meanPnlPerTrade,
	  stdDevPnlPerTrade: trial.results.stdDevPnlPerTrade,
	  positiveTrades: trial.results.positiveTrades,
	  totalTrades: trial.results.totalTrades,
	  positivePercent: (trial.results.positiveTrades/trial.results.totalTrades).toFixed(2),

	  ...trial.selectionParams,
	  
	  reEnterPosition: trial.params.reEnterPosition,
	  cancelInMins: trial.params.cancelInMins,
	  updateSL: trial.params.updateSL,
	  updateSLInterval: trial.params.updateSLInterval,
	  updateSLFrequency: trial.params.updateSLFrequency,
	  targetStopLossRatio: trial.params.targetStopLossRatio,
	  marketOrder: trial.params.marketOrder,
	}));
  };
  
const exportTrialsToCSV = (trials) => {
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

const initialState = {
	// timeRange: {
	// 	start: new Date('2024-11-08'),
	// 	end: new Date('2024-11-08')
	// },
	simulation: {
		result: null,
		reEnterPosition: true,
		cancelInMins: 5,
		updateSL: false,
		updateSLInterval: 15,
		updateSLFrequency: 15,
		targetStopLossRatio: '2:1',
		marketOrder: false,
		type: 'zaire'
	},
	trials: []
};

const ShortSellingSimulatorPage = () => {
	const [selectionParams, setSelectionParams] = useState(initialSelectionParamOptions);
	const [state, setState] = useState(initialState);
	const [isLoading, setIsLoading] = useState(false);
	// const [dailyPnL, setDailyPnL] = useState([]);
	// const [activeTab, setActiveTab] = useState('stopLoss');
	// const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedResult, setSelectedResult] = useState(null);
	const [selectedResultData, setSelectedResultData] = useState(null);
	// const [selectedFunctions, setSelectedFunctions] = useState([]);
	const [dateRange, setDateRange] = useState([new Date('2025-08-04'), new Date('2025-08-08')]);
	const [selectedSymbol, setSelectedSymbol] = useState([]);
	const [pollInterval, setPollInterval] = useState(null);
	const [pastResults, setPastResults] = useState(() => {
		const saved = localStorage.getItem('simulationHistory');
		return saved ? JSON.parse(saved) : [];
	});

	const [pastTrials, setPastTrials] = useState(() => {
		const saved = localStorage.getItem('simulationTrials');
		return saved ? JSON.parse(saved) : [];
	});

	const [inputValue, setInputValue] = useState('');

	const stockOptions = [
		{ value: 'AUROPHARMA', label: 'AUROPHARMA' },
		{ value: 'HCLTECH', label: 'HCLTECH' },
		{ value: 'TCS', label: 'TCS' },
		{ value: 'INFY', label: 'INFY' },
		{ value: 'WIPRO', label: 'WIPRO' },
		{ value: 'TECHM', label: 'TECHM' },
		{ value: 'CUMMINSIND', label: 'CUMMINSIND' },
		{ value: 'HEROMOTOCO', label: 'HEROMOTOCO' },
		{ value: 'HINDUNILVR', label: 'HINDUNILVR' },
		{ value: 'INDHOTEL', label: 'INDHOTEL' },
		{ value: 'LT', label: 'LT' },
		{ value: 'MANKIND', label: 'MANKIND' },
		{ value: 'M&M', label: 'M&M' },
		{ value: 'NESTLEIND', label: 'NESTLEIND' },
		{ value: 'EICHERMOT', label: 'EICHERMOT' },
		{ value: 'GODREJPROP', label: 'GODREJPROP' },
		{ value: 'TATAMOTORS', label: 'TATAMOTORS' },
		{ value: 'NETWEB', label: 'NETWEB' },
		{ value: 'MOTILALOFS', label: 'MOTILALOFS' },
		{ value: 'HDFCBANK', label: 'HDFCBANK' },
		{ value: 'ICICIBANK', label: 'ICICIBANK' },
	];
	
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
	
	const fetchSimulationData = (requestParams) => new Promise(async (resolve, reject) => {
		setIsLoading(true);
		try {
			
			// Start the simulation
			const response = await postAuthorizedData('/simulation/simulate/v2/start', requestParams);

			setSelectedResult(null);
			setSelectedResultData(null);
			
			const { jobId } = response;
			
			// Set up polling
			const interval = setInterval(async () => {
				try {
					const statusResponse = await fetchAuthorizedData(`/simulation/simulate/v2/status/${jobId}?type=${requestParams.simulation.type}`);
					
					if (statusResponse.status === 'completed') {
						// Clear polling interval
						clearInterval(interval);
						setPollInterval(null);
						setIsLoading(false);
						
						// Format and set the results
						const formattedData = statusResponse.result.map(item => ({
							symbol: item.sym,
							date: moment( item.scannedCandleAt || item.placedAt).format('DD-MM-YYYY'),
							timestamp: new Date(item.scannedCandleAt || item.placedAt),
							datetime: moment(+new Date(item.scannedCandleAt || item.placedAt) + 5.5 * 60 * 60 * 1000).format('DD-MM-YYYY HH:mm'),
							pnl: item.pnl,
							direction: item.direction,
							quantity: item.quantity,
							data: state.simulation.type === 'lightyear' ? [] : item.data.filter(d => new Date(d.time).toISOString().split('T')[0] === new Date(item.scannedCandleAt || item.placedAt).toISOString().split('T')[0]),
							actions: item.actions,
							perDayResults: item.perDayResults,
							triggerPrice: item.triggerPrice,
							targetPrice: item.targetPrice,
							stopLossPrice: item.stopLossPrice
						}));
						
						const totalPnl = formattedData.reduce((acc, curr) => acc + curr.pnl, 0);
						
						// Save to history
						const historyEntry = {
							id: Date.now(),
							timestamp: new Date().toISOString(),
							params: requestParams,
							dateRange: [dateRange[0].toISOString(), dateRange[1].toISOString()],
							totalPnl,
							// results: formattedData
						};

						const trialData = processTrialData(formattedData)
						
						setPastResults(prev => {
							const updated = [historyEntry, ...prev];
							localStorage.setItem('simulationHistory', JSON.stringify(updated));
							return updated;
						});

						setPastTrials(prev => {
							let data = {
								results: trialData,
								params: requestParams.simulation,
								selectionParams: requestParams.selectionParams,
								startTime: statusResponse.startTime
							}
							const updated = [data, ...prev];
							localStorage.setItem('simulationTrials', JSON.stringify(updated));
							return updated;
						});
						
						updateState('simulation.result', { results: formattedData });

						return resolve();

						// updateState('trials', [{
						// 	data: formattedData,
						// 	params: requestParams.simulation,
						// 	selectionParams: requestParams.selectionParams,
						// 	startTime: statusResponse.startTime
						// },...state.trials]);
					} else if (statusResponse.status === 'error') {
						clearInterval(interval);
						setPollInterval(null);
						setIsLoading(false);
						toast.error(statusResponse.error || 'Simulation failed');
						return reject(statusResponse.error || 'Simulation failed');
					}
					else {
						const currentDateTime = new Date(statusResponse.currentDate);
						const timeSinceStart = new Date() - new Date(statusResponse.startTime);
						const timeSinceStartInMins = timeSinceStart / (1000 * 60);
						
						// Define trading day start and end times
						const startTime = new Date(currentDateTime);
						startTime.setUTCHours(3, 51, 0, 0);
						
						const endTime = new Date(currentDateTime);
						endTime.setUTCHours(9, 50, 0, 0);
						
						// Calculate daily progress percentage
						const totalDuration = endTime - startTime;
						const elapsed = currentDateTime - startTime;
						const dailyProgress = Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 0), 100);
						
						// Calculate overall progress based on weekdays in date range
						const getWeekdayCount = (start, end) => {
							let count = 0;
							let current = new Date(start);
							while (current <= end) {
								if (current.getDay() !== 0 && current.getDay() !== 6) {
									count++;
								}
								current.setDate(current.getDate() + 1);
							}
							return count;
						};
						
						const totalWeekdays = getWeekdayCount(dateRange[0], dateRange[1]);
						const completedWeekdays = getWeekdayCount(dateRange[0], currentDateTime);
						const overallProgress = Math.round(((completedWeekdays - 1 + (dailyProgress / 100)) / totalWeekdays) * 100);

						const timeLeft = (100 - overallProgress) * timeSinceStartInMins / overallProgress;
						
						toast(`Simulation running: (${overallProgress}%) | ${parseInt(timeLeft)}m ${parseInt((timeLeft - parseInt(timeLeft)) * 60)}s left`, {
							duration: 3000,
							icon: '🔍',
							style: {
								background: '#abb53f',
								color: 'black'
							}
						});
					}
				} catch (err) {
					console.error('Error polling simulation status:', err);
					toast.error('Error polling simulation status: ' + err.message);
					setIsLoading(false);
					clearInterval(interval);
					setPollInterval(null);
				}
			}, 3000); // Poll every 3 seconds
			
			setPollInterval(interval);
			
		} catch (error) {
			setIsLoading(false);
			toast.error('Failed to start simulation');
			console.error('Error starting simulation:', error);
		}
	})

	const startTrials = async () => {
		const combinations = generateCombinations(selectionParams);
		let simulation;


		// Set the start and end date to 6 AM to handle UTC tz difference
		let startDate = new Date(dateRange[0].setUTCHours(6, 0, 0, 0)).toISOString().split('T')[0];
		let endDate = new Date(dateRange[1].setUTCHours(6, 0, 0, 0)).toISOString().split('T')[0];

		toast.success(`Starting ${combinations.length} simulations...`);

		for (const combination of combinations) {
			try {
				simulation = _.merge({}, state.simulation);
				delete simulation.result;
				let requestParams = {
					startdate: startDate,
					enddate: endDate,
					symbol: selectedSymbol.join(','),
					simulation,
					selectionParams: combination
				};
				toast.success('Started simulation for ' + Object.keys(combination).join(', '));
				await fetchSimulationData(requestParams);
			} catch (err) {
				console.error('Error starting simulation:', err);
				toast.error('Error running simulation:', err);
			}
		}
	}
	
	// Cleanup polling on component unmount
	useEffect(() => {
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	}, [pollInterval]);
	
	const handleRowClick = async (result) => {
		setIsLoading(true);
		try {
			setSelectedResult(result);

			setSelectedResultData({
				data: result.data,
				tradeActions: result.actions,
				pnl: result.pnl,
				perDayResults: result.perDayResults
			});
			
		} catch (err) {
			toast.error(err?.message || 'Failed to load chart data');
		} finally {
			setIsLoading(false);
		}
	};

  return (
	<div className="bg-gray-900 dark:bg-gray-950 min-h-screen relative">
	  
	  <div className="container mx-auto px-4 py-20">
		<h1 className="text-3xl font-bold mb-6 text-white">Simulator V3</h1>
		<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
		  <div className="flex flex-wrap -mx-2 grid grid-cols-2 md:grid-cols-6 gap-4">
			<div className="px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
			  <DatePicker
				selectsRange={true}
				startDate={dateRange[0]}
				endDate={dateRange[1]}
				onChange={(update) => {
				  setDateRange(update);
				}}
				dateFormat="yyyy-MM-dd"
				className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
			  />
			</div>
			<div className="px-2 mb-4 col-span-2 dark:text-white">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
			  <select
				value={state.simulation.type}
				onChange={(event) => updateState('simulation.type', event.target.value)}
				className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
			  >
				<option value={'zaire'}>Zaire</option>
				<option value={'lightyear'}>Lightyear</option>
				<option value={'bailey'}>Bailey</option>
			  </select>
			</div>
			
			<div className="px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
			  <div className="flex flex-col">
				<div className="relative">
				  <input
					type="text"
					value={inputValue || ""}
					onChange={(e) => {
					  setInputValue(e.target.value);
					}}
					onKeyDown={(e) => {
					  if (e.key === 'Enter') {
						e.preventDefault();
						const value = e.target.value.trim().toUpperCase();
						if (value && !selectedSymbol.includes(value)) {
						  setSelectedSymbol([...selectedSymbol, value]);
						  setInputValue('');
						}
					  }
					}}
					className="px-3 py-2 text-base border border-gray-300 rounded-md w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
					placeholder="Type symbol and press Enter..."
				  />
				  <div className="mt-2">
					<span className="text-sm text-gray-500 dark:text-gray-400">Suggestions:</span>
					<div className="flex flex-wrap gap-1 mt-1">
					  {stockOptions.filter(option => !selectedSymbol.includes(option.value)).slice(0, 8).map(option => (
						<button
						  key={option.value}
						  onClick={() => setSelectedSymbol([...selectedSymbol, option.value])}
						  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md dark:text-gray-200"
						>
						  {option.label}
						</button>
					  ))}
					</div>
				  </div>
				</div>
				<div className="flex flex-wrap gap-2 mt-2">
				  {selectedSymbol.map(symbol => (
					<div 
					  key={symbol} 
					  className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md"
					>
					  <span className="text-blue-800 dark:text-blue-200">{symbol}</span>
					  <button
						onClick={() => setSelectedSymbol(selectedSymbol.filter(s => s !== symbol))}
						className="text-blue-800 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold"
					  >
						×
					  </button>
					</div>
				  ))}
				</div>
			  </div>
			</div>
			<div className="px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cancel Interval</label>
			  <input
				type="number"
				step={5}
				value={state.simulation.cancelInMins}
				onChange={(event) => updateState('simulation.cancelInMins', event.target.value)}
				className="px-3 py-2 text-base border border-gray-300 rounded-md w-1/2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
			  />
			</div>
			<div className="px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target:SL (candle length) Ratio</label>
			  <select
				value={state.simulation.targetStopLossRatio}
				className="px-3 py-2 text-base border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
				onChange={(event) => updateState('simulation.targetStopLossRatio', event.target.value)}
			  >
				<option value={'1:1'}>1:1</option>
				<option value={'2:1'}>2:1</option>
				<option value={'2:1.5'}>2:1.5</option>
				<option value={'3:2'}>3:2</option>
				<option value={'2:2'}>2:2</option>
				<option value={'4:2'}>4:2</option>
				<option value={'3:1'}>3:1</option>
			  </select>
			</div>
			<div className="px-2 mb-4 col-span-1">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Re-Enter Position</label>
			  <Switch
				checked={state.simulation.reEnterPosition}
				onChange={(checked) => updateState('simulation.reEnterPosition', checked)}
			  />
			</div>
			<div className="px-2 mb-4 col-span-1">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Market Order</label>
			  <Switch
				checked={state.simulation.marketOrder}
				onChange={(checked) => updateState('simulation.marketOrder', checked)}
			  />
			</div>
			<div className="px-2 mb-4 col-span-1">
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update SL</label>
			  <Switch
				checked={state.simulation.updateSL}
				onChange={(checked) => updateState('simulation.updateSL', checked)}
				className="switch"
			  />
			</div>
			{state.simulation.updateSL && 
			  <> 
				<div className="px-2 mb-4 col-span-2">
				  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update SL Bucket</label>
				  <input
					type="number"
					step={5}
					value={state.simulation.updateSLInterval}
					onChange={(event) => updateState('simulation.updateSLInterval', event.target.value)}
					className="px-3 py-2 text-base border border-gray-300 rounded-md w-1/2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
				  />
				</div>
				<div className="px-2 mb-4 col-span-2">
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update SL Frequency</label>
					<input
					  type="number"
					  step={5}
					  value={state.simulation.updateSLFrequency}
					  onChange={(event) => updateState('simulation.updateSLFrequency', event.target.value)}
					  className="px-3 py-2 text-base border border-gray-300 rounded-md w-1/2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
					/>
				</div>
			  </>
			}

			<ParameterPopup selectionParams={selectionParams} setSelectionParams={setSelectionParams} />
		  </div>
		  <div className="mt-4">
			<button onClick={startTrials} disabled={isLoading} className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 items-center justify-center flex">
			  { !isLoading ? 'Run Trials' : <><Loader2 className="h-8 w-8 text-white animate-spin" /> </>}
			</button>
		  </div>
		</div>

		{state.simulation.result && (
			<>
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
			  <h2 className="text-xl font-semibold my-4 dark:text-white">Last Trial Results</h2>
			  <table className="w-full">
				<thead>
				  <tr className="bg-gray-100 dark:bg-gray-700">
					{trialStockColumns.map(column => (
					  <th key={column.key} className="text-left py-2 px-4 dark:text-gray-300">{column.label}</th>
					))}
				  </tr>
				</thead>
				<tbody>
				  {state.simulation.result.results.map((result, index) => (
					<tr 
					  key={`${result.symbol}-${result.datetime}`} 
					  className={`dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600`}
					  onClick={() => handleRowClick(result)}
					>
					  {trialStockColumns.map(column => (
						  <td key={column.key} className={`py-2 px-4 ${column.classRenderer ? column.classRenderer(result[column.key]) : ''} text-gray-300`}>{column.renderer ? column.renderer(result[column.key]) : result[column.key]}</td>
					  ))}
					</tr>
				  ))}
				</tbody>
			  </table>
			</div>
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
			  {selectedResultData && (
				<div className="mt-8">
				  <div className='flex justify-between'>
					<h3 className="text-lg font-semibold mb-4 dark:text-white">
					  Chart for {selectedResult.symbol} on {selectedResult.date}
					</h3>
					<button 
					  className='bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'
					  onClick={() => setSelectedResultData(null)}>
						Close
				  </button>
				</div>
				<SimulationResults
				  data={selectedResultData.data}
				  tradeActions={selectedResultData.tradeActions}
				  pnl={selectedResultData.pnl}
				  symbol={selectedResult.symbol}
				  perDayResults={selectedResultData.perDayResults}
				/>
			  </div>
			)}
		  </div>
		  </>
		)}

		{/* Add Past Results section after current results */}
		{pastResults.length > 0 && (
		  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
			<h2 className="text-xl font-semibold mb-4 dark:text-white">Past Simulation Results</h2>
			<table className="w-full">
			  <thead>
				<tr className="bg-gray-100 dark:bg-gray-700">
				  <th className="text-left py-2 px-4 dark:text-gray-300">Date</th>
				  <th className="text-left py-2 px-4 dark:text-gray-300">Symbols</th>
				  <th className="text-left py-2 px-4 dark:text-gray-300">Params</th>
				  <th className="text-left py-2 px-4 dark:text-gray-300">Date Range</th>
				  <th className="text-right py-2 px-4 dark:text-gray-300">Total P&L</th>
				</tr>
			  </thead>
			  <tbody>
				{pastResults.map((result) => (
				  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
					<td className="py-2 px-4 dark:text-gray-300">{new Date(result.timestamp).toLocaleString()}</td>
					<td className="py-2 px-4 dark:text-gray-300">{result.params.symbol}</td>
					<td className="py-2 px-4 dark:text-gray-300">
					  RE: {!!result.params.simulation.reEnterPosition ? 'Yes' : 'No'} | USL: {!!result.params.simulation.updateSL ? 'Yes' : 'No'} | TSLR: {result.params.simulation.targetStopLossRatio} | CI: {result.params.simulation.cancelInMins}
					</td>
					<td className="py-2 px-4 dark:text-gray-300">
					  {`${result.params.startdate} to ${result.params.enddate}`}
					</td>
					<td className={`text-right py-2 px-4 ${result.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
					  {result.totalPnl.toFixed(2)}
					</td>
				  </tr>
				))}
			  </tbody>
			</table>
			<div className='mt-4 flex gap-4'>
			  <button 
				className='bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'
				onClick={() => {
				  localStorage.removeItem('simulationHistory');
				  localStorage.removeItem('simulationTrials');
				  setPastResults([]);
				  setPastTrials([]);
				}}>
				Clear History
			  </button>
			  <button
				className='bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
				onClick={() => exportTrialsToCSV(pastTrials)}>
				Export Trials to CSV
			  </button>
			</div>
		  </div>
		)}


		{pastTrials && (
			<>
		  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
			<h2 className="text-xl font-semibold mb-4 dark:text-white">Trial Results</h2>
			<div className='mt-4'>
					{pastTrials.map(trial => (
						<div className='mt-4'>
							<TrialResults
								data={trial}
							/>
						</div>
					))}
				</div>
			</div>
			</>
		)}

	  </div>
	</div>
  );
};

export default ShortSellingSimulatorPage;