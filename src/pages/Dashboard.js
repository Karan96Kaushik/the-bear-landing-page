import React, { useState, useEffect } from 'react';
import { Bar, Line, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fetchAuthorizedData } from '../api/api';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GeneralTable from '../components/GeneralTable';
import annotationPlugin from 'chartjs-plugin-annotation';
import moment from 'moment';
import {toast} from 'react-hot-toast'
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  TimeScale,
  annotationPlugin,
  zoomPlugin
);

const stocks = [''];
const intervals = ['1m', '5m', '15m', '1d'];

const ordersFields = [
  { key: 'tradingsymbol', label: 'Symbol' },
  { key: 'order_timestamp_ist', label: 'Date' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'average_price', label: 'Price' },
  { key: 'trigger_price', label: 'Trigger' },
  { key: 'order_type', label: 'Type' },
  { key: 'transaction_type', label: 'B/S' },
  { key: 'placed_by', label: 'Placed By' },
  { key: 'status', label: 'Status' }
];

const sheetFields = [
{ key: 'id', label: 'ID' },
  { key: 'stockSymbol', label: 'Stock' },
  { key: 'sellPrice', label: 'Sell Price' },
  { key: 'stopLossPrice', label: 'Stop Loss' },
  { key: 'targetPrice', label: 'Target' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'lastAction', label: 'Last Action' },
  { key: 'reviseSL', label: 'Revise SL' },
  { key: 'ignore', label: 'Ignore' },
];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [yahooData, setYahooData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('15m');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    if (selectedStock.length < 2) return;
    const fetchYahooData = async () => {
      try {
        const [yahooResponse] = await Promise.all([
          fetchAuthorizedData(`/data/yahoo?symbol=${selectedStock}&interval=${selectedInterval}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        ]);
        setYahooData(yahooResponse);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchYahooData();    
  }, [selectedStock, startDate, endDate, selectedInterval]);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        let _startDate = new Date(startDate);
        let _endDate = new Date(endDate);

        let [orderResponse] = await Promise.all([
          fetchAuthorizedData(`/orders/kite-orders`)
        ]);

        let sheetData = orderResponse.sheetData.map(o => ({
            ...o,
            reviseSL: o.reviseSL && '🔄',
            ignore: o.ignore && '🚫',
        }));
        setSheetData(sheetData);

        let orders = orderResponse.orders.map(o => ({
            ...o,
            order_timestamp_ist: moment(o.order_timestamp).add(5.5,'h').format('YYYY-MM-DD HH:mm:ss'),
            order_timestamp: +new Date(o.order_timestamp),
        }));
        setOrdersData(orders);

        setLoading(false);
      } catch (err) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchBaseData();    
  }, []);

  useEffect(() => {
    let _startDate = new Date(startDate);
    let _endDate = new Date(endDate);

    if (selectedInterval.endsWith('m') && !selectedInterval.includes('d') && (_endDate - _startDate > 24 * 60 * 60 * 1000)) {
      _endDate = new Date();
      _startDate = new Date(_endDate.getTime() - 24 * 60 * 60 * 1000);
      setStartDate(_startDate);
      setEndDate(_endDate);
    }
  }, [selectedInterval])


  const yahooChartData = {
    datasets: [{
      label: selectedStock + ' Stock Price',
      data: yahooData?.chart.result[0].indicators.quote[0].close.map((c, i) => ({
        x: yahooData?.chart.result[0].timestamp[i] * 1000,
        o: yahooData?.chart.result[0].indicators.quote[0].open[i],
        h: yahooData?.chart.result[0].indicators.quote[0].high[i],
        l: yahooData?.chart.result[0].indicators.quote[0].low[i],
        c: c
      }))
    }]
  };

  const candlestickOptions = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: selectedInterval.endsWith('m') ? 'hour' : 'day',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d'
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
      legend: {
        display: false
      },
      annotation: {
        annotations: ordersData
          ?.filter(order => order.tradingsymbol === selectedStock && order.status === 'COMPLETE')
          .map(order => {
            const orderTimestamp = order.order_timestamp;
            const chartStartTime = yahooData?.chart.result[0].timestamp[0] * 1000;
            const chartEndTime = yahooData?.chart.result[0].timestamp[yahooData.chart.result[0].timestamp.length - 1] * 1000;
            
            // Only include annotations within the chart's time range
            if (orderTimestamp >= chartStartTime && orderTimestamp <= chartEndTime) {
              return {
                type: 'line',
                xMin: orderTimestamp,
                xMax: orderTimestamp,
                borderColor: order.transaction_type === 'BUY' ? 'green' : 'red',
                borderWidth: 2,
                label: {
                  content: `${order.transaction_type} at ${order.average_price.toFixed(2)}`,
                  display: true,
                  position: 'start',
                  backgroundColor: order.transaction_type === 'BUY' ? 'green' : 'red',
                  font: {
                    size: 12
                  },
                  padding: 4
                }
              };
            }
            return null;
          })
          .filter(Boolean) // Remove any null entries
      },
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
    }
  };

  const handleChartUpdate = (chart) => {
    const { min, max } = chart.scales.x;
    // setStartDate(new Date(min));
    // setEndDate(new Date(max));
  };

  return (
    <div className="bg-gray-900">
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            <label htmlFor="stock-select" className="block text-sm font-medium text-gray-700 mb-1">Select Stock</label>
            <select
              id="stock-select"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {[...stocks, ...new Set(ordersData?.map(o => o.tradingsymbol)), ...new Set(sheetData?.map(o => o.stockSymbol))].map((stock) => (
                <option key={stock} value={stock}>{stock}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-auto mb-4 md:mb-0">
            <label htmlFor="stock-select" className="block text-sm font-medium text-gray-700 mb-1">Select Stock</label>
            <select
              id="stock-select"
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
          <Chart
            type='candlestick'
            data={yahooChartData}
            options={candlestickOptions}
            plugins={[
              {
                id: 'chartUpdateHandler',
                afterUpdate: (chart) => handleChartUpdate(chart),
              },
            ]}
          />
        )}
        {!selectedStock && <p className="text-gray-500">Please select a stock</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <GeneralTable data={selectedStock ? ordersData?.filter(order => order.tradingsymbol === selectedStock) : ordersData} fields={ordersFields} />
      </div>

    <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Sheet Data</h2>
        <GeneralTable data={sheetData} fields={sheetFields} />
    </div>
    </div>
    </div>
  );
};

export default Dashboard;
