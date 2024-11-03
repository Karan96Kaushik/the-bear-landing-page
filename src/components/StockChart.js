import React from 'react';
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
  yahooChartData,
  candlestickOptions,
  stocks,
  ordersData,
  sheetData,
  setSelectedStock
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="w-full md:w-auto mb-4 md:mb-0">
          <label htmlFor="stock-select" className="block text-sm font-medium text-gray-700 mb-1">Select Stock</label>
          <input
            list="stocks-list"
            id="stock-select"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="mt-1 border border-gray-300 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            placeholder="Select or type a stock symbol"
          />
          <datalist id="stocks-list" className="bg-gray-600">
            {[...stocks, ...new Set(ordersData?.map(o => o.tradingsymbol)), ...new Set(sheetData?.map(o => o.stockSymbol))].map((stock) => (
              <option key={stock} value={stock} />
            ))}
          </datalist>
        </div>
        <div className="w-full md:w-auto mb-4 md:mb-0">
          <label htmlFor="interval-select" className="block text-sm font-medium text-gray-700 mb-1">Select Interval</label>
          <select
            id="interval-select"
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {intervals.map((interval) => (
              <option key={interval} value={interval}>{interval}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto flex items-center">
          <div className="mr-4">
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
            <DatePicker
              id="start-date"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              timeFormat="HH:mm"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
            <DatePicker
              id="end-date"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              timeFormat="HH:mm"
            />
          </div>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-4">{selectedStock} Stock Price</h2>
      {selectedStock && (
        <div style={{ height: '600px' }}>
          <Chart
            type='candlestick'
            data={yahooChartData}
            options={candlestickOptions}
          />
        </div>
      )}
      {!selectedStock && <p className="text-gray-500">Please select a stock</p>}
    </div>
  );
};

export default StockChart; 