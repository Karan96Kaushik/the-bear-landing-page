import React, { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    LineController,
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { enIN } from 'date-fns/locale';
  

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

// Register the controllers and elements
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    CandlestickController,
    LineController,
);

const intervals = ['1m', '5m', '15m', '1d'];

/**
 * @typedef {Object} ChartDataset
 * @property {string} label - The label for the dataset
 * @property {Array<{x: Date, o: number, h: number, l: number, c: number}>} data - Candlestick data points
 */

/**
 * @typedef {Object} StockChartProps
 * @property {string} selectedStock - Currently selected stock symbol
 * @property {string} selectedInterval - Selected time interval for the chart
 * @property {function} setSelectedInterval - Function to update the selected interval
 * @property {Date} startDate - Start date for the chart data
 * @property {function} setStartDate - Function to update the start date
 * @property {Date} endDate - End date for the chart data
 * @property {function} setEndDate - Function to update the end date
 * @property {Object} yahooChartData - Processed chart data object
 * @property {Object} candlestickOptions - Chart configuration options
 * @property {string[]} stocks - Array of available stock symbols
 * @property {Array<Object>} ordersData - Array of order data
 * @property {Array<Object>} sheetData - Array of sheet data
 * @property {function} setSelectedStock - Function to update the selected stock
 */

let is_timezone = 0;

/**
 * A reusable stock chart component that displays candlestick data and allows for stock/time selection
 * 
 * @param {StockChartProps} props - Component props
 * @returns {React.ReactElement} The rendered StockChart component
 */
const StockChart = ({
  selectedStock,
  selectedInterval,
  setSelectedInterval,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  data,
  // candlestickOptions,
  stocks,
  ordersData,
  sheetData,
  setSelectedStock
}) => {

  // const [selectedStock, setSelectedStock] = useState('');
	const [inputValue, setInputValue] = useState('');

  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [showVerticalAnnotations, setShowVerticalAnnotations] = useState(false);

  const nseiData = [];

  const tradeActions = [];

  console.log('data', data);


  const candlestickOptions = {
    animation: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm',
          },
          tooltipFormat: 'MMM d, HH:mm',
          // timezone: 'Asia/Kolkata'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#666666',
        },
        adapters: {
          date: {
            zone: 'Asia/Kolkata', // Set Indian timezone
            locale: enIN
          }
        }
      },
      y: {
        beginAtZero: false,
        min: (context) => {
          const data = context.chart.data?.datasets[0].data;
          if (!data) return 0;
          const validLows = data?.map(d => d.l).filter(val => val !== null && val !== 0);
          const validNsei = nseiData?.map(d => d.l).filter(val => val !== null && val !== 0) || [];
          return Math.min(...validLows, ...validNsei) * 0.999;
        },
        max: (context) => {
          const data = context.chart.data?.datasets[0].data;
          if (!data) return 0;
          const validHighs = data?.map(d => d.h).filter(val => val !== null && val !== 0);
          const validNsei = nseiData?.map(d => d.h).filter(val => val !== null && val !== 0) || [];
          return Math.max(...validHighs, ...validNsei) * 1.001;
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#666666',
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const datasetLabel = context.dataset.label;
              if (datasetLabel === 'Stock Price') {
                const point = context.raw;
                return [
                  `Open: ${point.o?.toFixed(2)}`,
                  `High: ${point.h?.toFixed(2)}`,
                  `Low: ${point.l?.toFixed(2)}`,
                  `Close: ${point.c?.toFixed(2)}`
                ];
              } else {
                return `${datasetLabel}: ${context.raw.y?.toFixed(2)}`;
              }
            }
          }
        }
      }
    },
    
    plugins: {
      zoom: {
        limits: {
          x: {min: 'original', max: 'original'},
        },
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
          drag: {
            enabled: true,
            backgroundColor: 'rgba(127,127,127,0.2)',
          },
        },
      },
      annotation: {
        animations: {
          numbers: {
            duration: 0, // Disable animation for numbers
          },
          colors: {
            duration: 0, // Disable animation for colors
          },
        },
        annotations: tradeActions?.map(action => ({
          type: 'line',
          // Conditional x/y min/max based on annotation type
          ...(showVerticalAnnotations ? {
            xMin: +action.time + (5.5*60*60*1000 * is_timezone),
            xMax: +action.time + (5.5*60*60*1000 * is_timezone),
          } : {
            yMin: action.price,
            yMax: action.price,
            xMin: Math.min(...data?.map(d => +d.time + (5.5*60*60*1000 * is_timezone))),
            xMax: Math.max(...data?.map(d => +d.time + (5.5*60*60*1000 * is_timezone))),
          }),
          borderColor: 
            action?.action.includes('Short') ? 'red' : 
            action?.action === 'Stop Loss Hit' ? 'red' :
            action?.action === 'Target Hit' ? 'green' :
            action?.action === 'Auto Square-off' ? 'blue' :
            action?.action === 'Target Placed' ? 'black' :
            action?.action === 'Stop Loss Placed' ? 'orange' :
            action?.action === 'Trigger Placed' ? 'purple' :
            action?.action === 'Cancelled' ? 'gray' :
            'gray',
          borderWidth: 2,
          label: !showVerticalAnnotations ? {} : {
            content: `${action?.action} at ${action?.price?.toFixed(2)}`,
            display: true,
            position: showVerticalAnnotations ? 'start' : 'end',
            yAdjust: showVerticalAnnotations ? (action?.action === 'Stop Loss Hit' ? -50 :
                action?.action === 'Trigger Hit' ? -20 :
                action?.action === 'Target Hit' ? -40 :
                action?.action === 'Auto Square-off' ? -20 :
                action?.action === 'Target Placed' ? -40 :
                action?.action === 'Stop Loss Placed' ? -60 :
                action?.action === 'Trigger Placed' ? -40 :
                action?.action === 'Cancelled' ? -0 :
                -20) : 0, // Random value between -50 and 50
            backgroundColor: 
              action?.action === 'Stop Loss Hit' ? 'red' :
              action?.action === 'Trigger Hit' ? 'purple' :
              action?.action === 'Target Hit' ? 'green' :
              action?.action === 'Target Placed' ? 'black' :
              action?.action === 'Stop Loss Placed' ? 'orange' :
              action?.action === 'Trigger Placed' ? 'purple' :
              action?.action === 'Cancelled' ? 'gray' :
              'gray',
            font: {
              size: 12
            },
            padding: 4
          }
        })) || []
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            if (datasetLabel === 'Stock Price') {
              const point = context.raw;
              return [
                `Open: ${point.o?.toFixed(2)}`,
                `High: ${point.h?.toFixed(2)}`,
                `Low: ${point.l?.toFixed(2)}`,
                `Close: ${point.c?.toFixed(2)}`
              ];
            } else {
              return `${datasetLabel}: ${context.raw.y?.toFixed(2)}`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: true,
      },
      legend: {
        labels: {
          color: isDarkMode ? '#ffffff' : '#666666',
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8 dark:bg-gray-800 dark:text-white">
      <div className="flex flex-wrap items-center justify-between mb-4">

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
						if (value) {
						  setSelectedStock(value);
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
					  {stockOptions.filter(option => option.value !== selectedStock).slice(0, 8).map(option => (
						<button
						  key={option.value}
						  onClick={() => setSelectedStock(option.value)}
						  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md dark:text-gray-200"
						>
						  {option.label}
						</button>
					  ))}
					</div>
				  </div>
				</div>
				<div className="flex flex-wrap gap-2 mt-2">
				  {selectedStock && (
					<div 
					  key={selectedStock} 
					  className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md"
					>
					  <span className="text-blue-800 dark:text-blue-200">{selectedStock}</span>
					  <button
						onClick={() => setSelectedStock('')}
						className="text-blue-800 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold"
					  >
						×
					  </button>
					</div>
				  )}
				</div>
			  </div>
			</div>
        <div className="w-full md:w-auto mb-4 md:mb-0 dark:text-white dark:bg-gray-800">
          <label htmlFor="interval-select" className="block text-sm font-medium text-gray-700 mb-1 dark:text-white dark:bg-gray-800">Select Interval</label>
          <select
            id="interval-select"
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:text-white dark:bg-gray-800 dark:border-gray-600"
          >
            {intervals.map((interval) => (
              <option key={interval} value={interval}>{interval}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto flex items-center dark:text-white dark:bg-gray-800">
          <div className="mr-4">
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1 dark:text-white dark:bg-gray-800">End Date</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => {setEndDate(e.target.value) }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:text-white dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-4 dark:text-white dark:bg-gray-800">{selectedStock} Stock Price</h2>
      {selectedStock && (
        <div style={{ height: '600px' }}>
          <Chart
            type='candlestick'
            data={data}
            options={candlestickOptions}
          />
        </div>
      )}
      {!selectedStock && <p className="text-gray-500">Please select a stock</p>}
    </div>
  );
};

export default StockChart; 