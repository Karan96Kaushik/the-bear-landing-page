import React, { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
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

/**
 * @typedef {Object} TradeAction
 * @property {string} time - ISO timestamp of the trade action
 * @property {string} action - Type of action (e.g., 'Short', 'Stop Loss Hit', 'Target Hit', 'Auto Square-off')
 * @property {number} price - Price at which the action occurred
 */

/**
 * @typedef {Object} CandleData
 * @property {string} time - ISO timestamp
 * @property {number} open - Opening price
 * @property {number} high - Highest price
 * @property {number} low - Lowest price
 * @property {number} close - Closing price
 * @property {number} [sma44] - Simple Moving Average (44 periods), optional
 */

/**
 * Component to display simulation results including candlestick chart and trade actions
 * @param {Object} props
 * @param {CandleData[]} props.data - Array of candlestick data points
 * @param {TradeAction[]} props.tradeActions - Array of trade actions
 * @param {number} props.pnl - Final Profit/Loss value
 * @returns {JSX.Element}
 */
const SimulationResults = ({ data, tradeActions, pnl, nseiData }) => {
console.log({nseiData});
  // Add theme detection
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const chartData = useMemo(() => {
    let chartData = {
      datasets: [
        {
          label: 'Stock Price',
          data: data?.map((d) => ({
            x: d.time,
            o: d.open,
            h: d.high,
            l: d.low,
            c: d.close
          })) || [],
          color: {
            up: isDarkMode ? '#26a69a' : '#26a69a',    // Green for up candles
            down: isDarkMode ? '#ef5350' : '#ef5350',   // Red for down candles
          },
        },
        {
          label: 'SMA44',
          data: data?.map((d) => ({
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

    if (nseiData) {
      chartData.datasets.push({
        label: 'NSEI ',
        data: nseiData?.map((d) => ({
          x: d.time,
        //   y: d.close * (data[0].sma44 / nseiData[0].sma44)
          y: (d.close+d.open)/2 * (data[0].close / nseiData[0].close)
        })) || [],
        type: 'line',
        borderColor: 'rgba(25, 199, 132, 1)',
        borderWidth: 1,
        pointRadius: 0,
        yAxisID: 'y',
      });
    }

    return chartData;
  }, [data, nseiData, isDarkMode]);

  const candlestickOptions = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm',
          },
          tooltipFormat: 'MMM d, HH:mm',
          timezone: 'Asia/Kolkata'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#666666',
        }
      },
      y: {
        beginAtZero: false,
        min: (context) => {
          const data = context.chart.data?.datasets[0].data;
          if (!data) return 0;
          const validLows = data.map(d => d.l).filter(val => val !== null && val !== 0);
          const validNsei = nseiData?.map(d => d.l).filter(val => val !== null && val !== 0) || [];
          return Math.min(...validLows, ...validNsei) * 0.99;
        },
        max: (context) => {
          const data = context.chart.data?.datasets[0].data;
          if (!data) return 0;
          const validHighs = data.map(d => d.h).filter(val => val !== null && val !== 0);
          const validNsei = nseiData?.map(d => d.h).filter(val => val !== null && val !== 0) || [];
          return Math.max(...validHighs, ...validNsei) * 1.05;
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#666666',
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
        annotations: tradeActions?.map(action => ({
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
            yAdjust: action?.action.includes('Short') ? -40 : 
                action?.action === 'Stop Loss Hit' ? -50 :
                action?.action === 'Buy at Limit' ? -40 :
                action?.action === 'Target Hit' ? -50 :
                action?.action === 'Auto Square-off' ? -20 :
                -20, // Random value between -50 and 50
            backgroundColor: 
              action?.action.includes('Short') ? 'red' : 
              action?.action === 'Stop Loss Hit' ? 'orange' :
              action?.action === 'Buy at Limit' ? 'purple' :
              action?.action === 'Target Hit' ? 'green' :
              action?.action === 'Auto Square-off' ? 'blue' :
              'gray',
            font: {
              size: 12
            },
            padding: 4
          }
        })) || []
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

  const getActionColor = (action) => {
    return action?.action.includes('Short') ? 'text-red-600' :
    action?.action === 'Stop Loss Hit' ? 'text-orange-600' :
    action?.action === 'Target Hit' ? 'text-green-600' :
    action?.action === 'Buy at Limit' ? 'text-purple-600' :
    action?.action === 'Auto Square-off' ? 'text-blue-600' :
    'text-gray-600';
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow mb-8`}>
      <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
      <Chart
        type='candlestick'
        data={chartData}
        options={candlestickOptions}
      />
      <p className="mt-4">Final P&L: {pnl?.toFixed(2)}</p>
      <h3 className="text-lg font-semibold mt-4 mb-2">Trade Actions:</h3>
      <ul className="list-disc pl-5">
        {tradeActions?.map((action, index) => (
          <li key={index} className={`mb-1 ${getActionColor(action)}`}>
            {new Date(action.time).toLocaleString()}: {action?.action} at {action?.price?.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SimulationResults; 