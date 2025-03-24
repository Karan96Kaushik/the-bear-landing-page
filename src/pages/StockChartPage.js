import React, { useState, useEffect } from 'react';
import StockChart from '../components/StockChart';
import { fetchAuthorizedData } from '../api/api';
import { toast } from 'react-hot-toast';

/** @type {string[]} Available stock symbols */
const stocks = ['ONGC', 'SBIN', 'RALLIS', 'INFY', 'ZOMATO', 'BAJFINANCE'];

/**
 * @typedef {Object} YahooDataPoint
 * @property {Date} time - Timestamp of the data point
 * @property {number} open - Opening price
 * @property {number} high - Highest price
 * @property {number} low - Lowest price
 * @property {number} close - Closing price
 * @property {number} sma44 - 44-period Simple Moving Average
 */

/**
 * Page component that displays a stock chart with various controls
 * @returns {React.ReactElement} The rendered StockChartPage component
 */
const StockChartPage = () => {
  const [yahooData, setYahooData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('15m');
  const [startDate, setStartDate] = useState(new Date('2025-03-20'));
  const [endDate, setEndDate] = useState(new Date('2025-03-21'));

  // Copy the useEffect hooks and other necessary functions from Dashboard.js
  useEffect(() => {
    if (selectedStock.length < 2) return;
    const fetchYahooData = async () => {
      try {
        let _startDate = new Date(startDate);
        _startDate.setDate(_startDate.getDate() - 5);
        const [yahooResponse] = await Promise.all([
          fetchAuthorizedData(`/data/yahoo?symbol=${selectedStock}&interval=${selectedInterval}&startDate=${_startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        ]);
        yahooResponse.filter(d => d.time > startDate);
        setYahooData(yahooResponse.filter(d => d.time > startDate));
        setLoading(false);
      } catch (err) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchYahooData();    
  }, [selectedStock, startDate, endDate, selectedInterval]);

  // Copy other necessary state and data processing logic from Dashboard.js

  const yahooChartData = {
    datasets: [{
      label: selectedStock + ' Stock Price',
      data: yahooData?.map((c, i) => ({
        x: c.time,
        o: c.open,
        h: c.high,
        l: c.low,
        c: c.close
      }))
    },
    {
      label: 'SMA44',
      data: yahooData?.map((d) => ({
        x: d.time,
        y: d.sma44
      })) || [],
      type: 'line',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      pointRadius: 0,
      yAxisID: 'y',
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
        },
        ticks: {
          source: 'data'
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
            const chartStartTime = yahooData?.[0].time;
            const chartEndTime = yahooData?.[yahooData.length - 1].time;
            
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
        limits: {
          x: {min: 'original', max: 'original'},
        },
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',  // Optional: require ctrl key for panning
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
    },
    responsive: true,
    maintainAspectRatio: false,
    // Add interaction configuration
    interaction: {
      mode: 'x',
      intersect: false,
    },
  };

  return (
    <div className="bg-gray-900 h-screen dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 dark:text-white dark:bg-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-white dark:text-white dark:bg-gray-900">Stock Chart</h1>
        <StockChart
          selectedStock={selectedStock}
          selectedInterval={selectedInterval}
          setSelectedInterval={setSelectedInterval}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          yahooChartData={yahooChartData}
          candlestickOptions={candlestickOptions}
          stocks={stocks}
          ordersData={ordersData}
          sheetData={sheetData}
          setSelectedStock={setSelectedStock}
        />
      </div>
    </div>
  );
};

export default StockChartPage; 