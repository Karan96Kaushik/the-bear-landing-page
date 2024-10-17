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
import { getDataFromYahoo } from '../api/external';
import yahooData from '../samples/yahoo-charts.json';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GeneralTable from '../components/GeneralTable';
import annotationPlugin from 'chartjs-plugin-annotation';
import moment from 'moment';

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
  annotationPlugin
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
  { key: 'status', label: 'Status' }
];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [yahooData, setYahooData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('15m');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    const fetchYahooData = async () => {
      try {
        let _startDate = new Date(startDate);
        let _endDate = new Date(endDate);

        const [yahooResponse] = await Promise.all([
          fetchAuthorizedData(`/dashboard/yahoo?symbol=${selectedStock}&interval=${selectedInterval}&startDate=${_startDate.toISOString()}&endDate=${_endDate.toISOString()}`)
        ]);
        setYahooData(yahooResponse);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchYahooData();    
  }, [selectedStock, startDate, endDate]);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        let _startDate = new Date(startDate);
        let _endDate = new Date(endDate);

        let [orderResponse] = await Promise.all([
          fetchAuthorizedData(`/dashboard/orders`)
        ]);
        orderResponse = orderResponse.map(o => ({
            ...o,
            order_timestamp_ist: moment(o.order_timestamp).add(5.5,'h').format('YYYY-MM-DD HH:mm:ss')
        }));
        setOrdersData(orderResponse);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchBaseData();    
  }, []);

  useEffect(() => {
    let _startDate = new Date(startDate);
    let _endDate = new Date(endDate);

    if (selectedInterval.endsWith('m') && !selectedInterval.includes('d')) {
      _endDate = new Date();
      _startDate = new Date(_endDate.getTime() - 24 * 60 * 60 * 1000);
      setStartDate(_startDate);
      setEndDate(_endDate);
    } else {
      _startDate.setHours(0, 0, 0, 0);
      setStartDate(_startDate);

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
        beginAtZero: false
      }
    },
    plugins: {
      legend: {
        display: false
      },
      annotation: {
        annotations: ordersData
          ?.filter(order => order.tradingsymbol === selectedStock && order.status === 'COMPLETE')
          .map(order => ({
            type: 'line',
            xMin: new Date(order.order_timestamp),
            xMax: new Date(order.order_timestamp),
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
          }))
      }
    }
  };

  return (
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
              {[...stocks, ...new Set(ordersData?.map(o => o.tradingsymbol))].map((stock) => (
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
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                id="start-date"
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                showTimeSelect={selectedInterval === '10m'}
                timeIntervals={15}
                dateFormat={selectedInterval === '10m' ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                id="end-date"
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                showTimeSelect={selectedInterval === '10m'}
                timeIntervals={15}
                dateFormat={selectedInterval === '10m' ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
              />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-4">{selectedStock} Stock Price</h2>
        {selectedStock && <Chart type='candlestick' data={yahooChartData} options={candlestickOptions} />}
        {!selectedStock && <p className="text-gray-500">Please select a stock</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <GeneralTable data={selectedStock ? ordersData?.filter(order => order.tradingsymbol === selectedStock) : ordersData} fields={ordersFields} />
      </div>
    </div>
  );
};

export default Dashboard;
