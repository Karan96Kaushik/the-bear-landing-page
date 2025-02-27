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

const initialState = {
	timeRange: {
		start: new Date('2024-11-08'),
		end: new Date('2024-11-08')
	},
	simulation: {
		result: null,
		reEnterPosition: true,
		cancelInMins: 5,
		updateSL: true,
		updateSLInterval: 15,
		updateSLFrequency: 15,
		targetStopLossRatio: '2:1',
		marketOrder: false
	},
};

const ShortSellingSimulatorPage = () => {
	const [state, setState] = useState(initialState);
	const [isLoading, setIsLoading] = useState(false);
	// const [dailyPnL, setDailyPnL] = useState([]);
	// const [activeTab, setActiveTab] = useState('stopLoss');
	// const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedResult, setSelectedResult] = useState(null);
	const [selectedResultData, setSelectedResultData] = useState(null);
	// const [selectedFunctions, setSelectedFunctions] = useState([]);
	const [dateRange, setDateRange] = useState([new Date('2025-01-27'), new Date('2025-02-21')]);
	const [selectedSymbol, setSelectedSymbol] = useState([]);
	const [pollInterval, setPollInterval] = useState(null);
	const [pastResults, setPastResults] = useState(() => {
		const saved = localStorage.getItem('simulationHistory');
		return saved ? JSON.parse(saved) : [];
	});
	
	const stockOptions = [
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
		{ value: 'TATAPOWER', label: 'TATAPOWER' },
		{ value: 'TATACHEM', label: 'TATACHEM' },
		{ value: 'TATACOMM', label: 'TATACOMM' },
		
		// Add more stock options as needed
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
	
	const fetchSimulationData = async () => {
		setIsLoading(true);
		try {
			const simulation = _.merge({}, state.simulation);
			delete simulation.result;
			
			const requestParams = {
				startdate: dateRange[0].toISOString().split('T')[0],
				enddate: dateRange[1].toISOString().split('T')[0],
				symbol: selectedSymbol.join(','),
				simulation
			};
			
			// Start the simulation
			const response = await postAuthorizedData('/simulation/simulate/v2/start', requestParams);
			
			const { jobId } = response;
			
			// Set up polling
			const interval = setInterval(async () => {
				try {
					const statusResponse = await fetchAuthorizedData(`/simulation/simulate/v2/status/${jobId}`);
					
					if (statusResponse.status === 'completed') {
						// Clear polling interval
						clearInterval(interval);
						setPollInterval(null);
						setIsLoading(false);
						
						// Format and set the results
						const formattedData = statusResponse.result.map(item => ({
							symbol: item.sym,
							date: moment(item.placedAt).format('DD-MM-YYYY'),
							datetime: moment(+new Date(item.placedAt) + 5.5 * 60 * 60 * 1000).format('DD-MM-YYYY HH:mm'),
							pnl: item.pnl,
							direction: item.direction,
							quantity: item.quantity,
							data: item.data.filter(d => new Date(d.time).toISOString().split('T')[0] === new Date(item.placedAt).toISOString().split('T')[0]),
							actions: item.actions
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
						
						setPastResults(prev => {
							const updated = [historyEntry, ...prev];
							localStorage.setItem('simulationHistory', JSON.stringify(updated));
							return updated;
						});
						
						updateState('simulation.result', { results: formattedData });
					} else if (statusResponse.status === 'error') {
						clearInterval(interval);
						setPollInterval(null);
						setIsLoading(false);
						toast.error(statusResponse.error || 'Simulation failed');
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
				}
			}, 3000); // Poll every 3 seconds
			
			setPollInterval(interval);
			
		} catch (error) {
			setIsLoading(false);
			toast.error('Failed to start simulation');
			console.error('Error starting simulation:', error);
		}
	};
	
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
			// console.log(result.data.map(d => new Date(d.time)))
			setSelectedResultData({
				data: result.data,
				tradeActions: result.actions,
				pnl: result.pnl
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
	  <div className="container mx-auto px-4 py-20">
		<h1 className="text-3xl font-bold mb-6 text-white">Stock Trading Simulator</h1>
		<div className="bg-white p-6 rounded-lg shadow mb-8 ">
		  <div className="flex flex-wrap -mx-2 grid grid-cols-2 md:grid-cols-6 gap-4">
			<div className=" px-2 mb-4 col-span-2 ">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
			  <DatePicker
				selectsRange={true}
				startDate={dateRange[0]}
				endDate={dateRange[1]}
				onChange={(update) => {
				  setDateRange(update);
				}}
				dateFormat="yyyy-MM-dd"
				className="px-3 py-2 text-base border border-gray-300 rounded-md"
			  />
			</div>
			<div className=" px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
			  <Select
				isMulti
				value={stockOptions.filter(option => selectedSymbol.includes(option.value))}
				onChange={(selected) => setSelectedSymbol(selected.map(option => option.value))}
				options={stockOptions}
				className="text-base"
				placeholder="Select stocks..."
			  />
			</div>
			{/* <div className="w-full md:w-1/2 px-2 mb-4">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
			  <input
				value={state.simulation.type}
				onChange={(selected) => setState('simulation.type', selected.value)}
				options={['BEARISH', 'BULLISH']}
			  />
			</div> */}
			<div className=" px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Cancel Interval</label>
			  <input
				type="number"
				step={5}
				value={state.simulation.cancelInMins}
				onChange={(event) => updateState('simulation.cancelInMins', event.target.value)}
				className="px-3 py-2 text-base border border-gray-300 rounded-md w-1/2"

			  />
			</div>
			<div className=" px-2 mb-4 col-span-2">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Target:SL (candle length) Ratio</label>
			  <select
				value={state.simulation.targetStopLossRatio}
				className="px-3 py-2 text-base border border-gray-300 rounded-md bg-white"
				onChange={(event) => updateState('simulation.targetStopLossRatio', event.target.value)}
			  >
				<option value={'1:1'}>1:1</option>
				<option value={'2:1'}>2:1</option>
				<option value={'3:1'}>3:1</option>
				<option value={'2:2'}>2:2</option>
			  </select>
			</div>
			<div className=" px-2 mb-4 col-span-1">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Re-Enter Position</label>
			  <Switch
				checked={state.simulation.reEnterPosition}
				onChange={(checked) => updateState('simulation.reEnterPosition', checked)}
			  />
			</div>
			<div className=" px-2 mb-4 col-span-1">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Market Order</label>
			  <Switch
				checked={state.simulation.marketOrder}
				onChange={(checked) => updateState('simulation.marketOrder', checked)}
			  />
			</div>
			<div className=" px-2 mb-4 col-span-1">
			  <label className="block text-sm font-medium text-gray-700 mb-1">Update SL</label>
			  <Switch
				checked={state.simulation.updateSL}
				onChange={(checked) => updateState('simulation.updateSL', checked)}
				className="switch"

			  />
			</div>
			{state.simulation.updateSL && 
			  <> 
				<div className=" px-2 mb-4 col-span-2">
				  <label className="block text-sm font-medium text-gray-700 mb-1">Update SL Interval</label>
				  <input
					type="number"
					step={5}
					value={state.simulation.updateSLInterval}
					onChange={(event) => updateState('simulation.updateSLInterval', event.target.value)}
					className="px-3 py-2 text-base border border-gray-300 rounded-md w-1/2"
				  />
				</div>
				<div className=" px-2 mb-4 col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-1">Update SL Frequency</label>
					<input
					  type="number"
					  step={5}
					  value={state.simulation.updateSLFrequency}
					  onChange={(event) => updateState('simulation.updateSLFrequency', event.target.value)}
					  className="px-3 py-2 text-base border border-gray-300 rounded-md w-1/2"
					/>
				</div>
			
			</>
			}

		  </div>
		  <div className="mt-4">
			<button onClick={fetchSimulationData} className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600">
			  Fetch Simulation Data
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
				  <th className="text-right py-2 px-4">Direction</th>
				  <th className="text-right py-2 px-4">P&L</th>
				</tr>
			  </thead>
			  <tbody>
				{state.simulation.result.results.map((result, index) => (
				  <tr 
					key={`${result.symbol}-${result.datetime}`} 
					className={`${index % 2 === 0 ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-100`}
					onClick={() => handleRowClick(result)}
				  >
					<td className="py-2 px-4">{result.symbol}</td>
					<td className="py-2 px-4">{result.datetime}</td>
					<td className="text-right py-2 px-4">{result.quantity}</td>
					<td className="text-right py-2 px-4">{result.direction}</td>
					<td className={`text-right py-2 px-4 ${result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
					  {result.pnl?.toFixed(2)}
					</td>
				  </tr>
				))}
			  </tbody>
			</table>

			<div className='mt-4 space-y-4'>
			  <div className='space-y-2'>
				<div className='font-semibold'>Overall Statistics:</div>
				<div>Total PnL: {state.simulation.result.results.reduce((acc, curr) => acc + curr.pnl, 0)?.toFixed(2)}</div>
				<div>
				  Mean PnL per Trade: {(state.simulation.result.results.reduce((acc, curr) => acc + curr.pnl, 0) / state.simulation.result.results.length)?.toFixed(2)}
				</div>
				<div>
				  Std Dev PnL per Trade: {(Math.sqrt(
					state.simulation.result.results.reduce((acc, curr) => {
					  const mean = state.simulation.result.results.reduce((a, c) => a + c.pnl, 0) / state.simulation.result.results.length;
					  return acc + Math.pow(curr.pnl - mean, 2);
					}, 0) / state.simulation.result.results.length
				  ))?.toFixed(2)}
				</div>
			  </div>

			  <div className='space-y-2'>
				<div className='font-semibold'>Daily Statistics:</div>
				{(() => {
				  const dailyPnL = state.simulation.result.results.reduce((acc, curr) => {
					const date = curr.date;
					acc[date] = acc[date] || [];
					acc[date].push(curr.pnl);
					return acc;
				  }, {});

				  const dailyTotals = Object.values(dailyPnL).map(pnls => pnls.reduce((a, b) => a + b, 0));
				  const dailyMean = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length;
				  const dailyStdDev = Math.sqrt(
					dailyTotals.reduce((acc, val) => acc + Math.pow(val - dailyMean, 2), 0) / dailyTotals.length
				  );

				  return (
					<>
					  <div>Mean PnL per Day: {dailyMean.toFixed(2)}</div>
					  <div>Std Dev PnL per Day: {dailyStdDev.toFixed(2)}</div>
					</>
				  );
				})()}
			  </div>

			  <div className='space-y-2'>
				<div className='font-semibold'>Weekly Statistics:</div>
				{(() => {
				  const weeklyPnL = state.simulation.result.results.reduce((acc, curr) => {
					const date = new Date(curr.date);
					const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
					acc[weekKey] = acc[weekKey] || [];
					acc[weekKey].push(curr.pnl);
					return acc;
				  }, {});

				  const weeklyTotals = Object.values(weeklyPnL).map(pnls => pnls.reduce((a, b) => a + b, 0));
				  const weeklyMean = weeklyTotals.reduce((a, b) => a + b, 0) / weeklyTotals.length;
				  const weeklyStdDev = Math.sqrt(
					weeklyTotals.reduce((acc, val) => acc + Math.pow(val - weeklyMean, 2), 0) / weeklyTotals.length
				  );

				  return (
					<>
					  <div>Mean PnL per Week: {weeklyMean.toFixed(2)}</div>
					  <div>Std Dev PnL per Week: {weeklyStdDev.toFixed(2)}</div>
					</>
				  );
				})()}
			  </div>

			  <div className='space-y-2'>
				<div className='font-semibold'>Order Statistics:</div>
				{(() => {
				  const dailyOrders = state.simulation.result.results.reduce((acc, curr) => {
					const date = curr.date;
					acc[date] = acc[date] || 0;
					acc[date]++;
					return acc;
				  }, {});

				  const ordersPerDay = Object.values(dailyOrders);
				  const ordersMean = ordersPerDay.reduce((a, b) => a + b, 0) / ordersPerDay.length;
				  const ordersStdDev = Math.sqrt(
					ordersPerDay.reduce((acc, val) => acc + Math.pow(val - ordersMean, 2), 0) / ordersPerDay.length
				  );

				  return (
					<>
					  <div>Mean Orders per Day: {ordersMean.toFixed(2)}</div>
					  <div>Std Dev Orders per Day: {ordersStdDev.toFixed(2)}</div>
					</>
				  );
				})()}
			  </div>
			</div>

			{selectedResultData && (
			  <div className="mt-8">
				<div className='flex justify-between'>
				  <h3 className="text-lg font-semibold mb-4">
					Chart for {selectedResult.symbol} on {selectedResult.date}
				  </h3>
				  <button 
					className='bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600'
					onClick={() => setSelectedResultData(null)}>
					Close
				  </button>
				</div>
				<SimulationResults
				  data={selectedResultData.data}
				  tradeActions={selectedResultData.tradeActions}
				  pnl={selectedResultData.pnl}
				  symbol={selectedResult.symbol}
				/>
			  </div>
			)}
		  </div>
		)}

		{/* Add Past Results section after current results */}
		{pastResults.length > 0 && (
		  <div className="bg-white p-6 rounded-lg shadow mb-8">
			<h2 className="text-xl font-semibold mb-4">Past Simulation Results</h2>
			<table className="w-full">
			  <thead>
				<tr className="bg-gray-100">
				  <th className="text-left py-2 px-4">Date</th>
				  <th className="text-left py-2 px-4">Symbols</th>
				  <th className="text-left py-2 px-4">Params</th>
				  <th className="text-left py-2 px-4">Date Range</th>
				  <th className="text-right py-2 px-4">Total P&L</th>
				</tr>
			  </thead>
			  <tbody>
				{pastResults.map((result) => (
				  <tr key={result.id} className="hover:bg-gray-50">
					<td className="py-2 px-4">{new Date(result.timestamp).toLocaleString()}</td>
					<td className="py-2 px-4">{result.params.symbol}</td>
					<td className="py-2 px-4">
					  RE: {!!result.params.simulation.reEnterPosition ? 'Yes' : 'No'} | USL: {!!result.params.simulation.updateSL ? 'Yes' : 'No'} | TSLR: {result.params.simulation.targetStopLossRatio} | CI: {result.params.simulation.cancelInMins}
					</td>
					<td className="py-2 px-4">
					  {`${result.params.startdate} to ${result.params.enddate}`}
					</td>
					<td className={`text-right py-2 px-4 ${result.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
					  {result.totalPnl.toFixed(2)}
					</td>
				  </tr>
				))}
			  </tbody>
			</table>
			<div className='mt-4'>
			  <button 
				className='bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600'
				onClick={() => {
				  localStorage.removeItem('simulationHistory');
				  setPastResults([]);
				}}>
				Clear History
			  </button>
			</div>
		  </div>
		)}
	  </div>
	</div>
  );
};

export default ShortSellingSimulatorPage;