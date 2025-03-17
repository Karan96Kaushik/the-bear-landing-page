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
import { enIN } from 'date-fns/locale';
import { ChevronRightIcon } from 'lucide-react';
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
const SimulationResults = ({ data, tradeActions, pnl, nseiData, symbol }) => {
  // console.log({nseiData});
  // Add theme detection
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Add state for annotation type
  const [showVerticalAnnotations, setShowVerticalAnnotations] = React.useState(true);

  const chartData = useMemo(() => {
    let chartData = {
      datasets: [
        {
          label: 'Stock Price',
          data: data?.map((d) => ({
            x: +d.time + 5.5*60*60*1000,
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
            x: +d.time + 5.5*60*60*1000,
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
          const validLows = data.map(d => d.l).filter(val => val !== null && val !== 0);
          const validNsei = nseiData?.map(d => d.l).filter(val => val !== null && val !== 0) || [];
          return Math.min(...validLows, ...validNsei) * 0.999;
        },
        max: (context) => {
          const data = context.chart.data?.datasets[0].data;
          if (!data) return 0;
          const validHighs = data.map(d => d.h).filter(val => val !== null && val !== 0);
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
        annotations: tradeActions?.map(action => ({
          type: 'line',
          // Conditional x/y min/max based on annotation type
          ...(showVerticalAnnotations ? {
            xMin: +action.time + 5.5*60*60*1000,
            xMax: +action.time + 5.5*60*60*1000,
          } : {
            yMin: action.price,
            yMax: action.price,
            xMin: Math.min(...data.map(d => +d.time + 5.5*60*60*1000)),
            xMax: Math.max(...data.map(d => +d.time + 5.5*60*60*1000)),
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

  const getActionColor = (action) => {
    // return action?.action.includes('Short') ? 'text-red-600' :
    return action?.action === 'Stop Loss Hit' ? 'text-red-600' :
    action?.action === 'Target Hit' ? 'text-green-600' :
    action?.action === 'Trigger Hit' ? 'text-purple-300' :
    action?.action === 'Auto Square-off' ? 'text-blue-600' :
    action?.action === 'Target Placed' ? 'text-yellow-600' :
    action?.action === 'Stop Loss Placed' ? 'text-orange-600' :
    action?.action === 'Trigger Placed' ? 'text-purple-600' :
    action?.action === 'Cancelled' ? 'text-gray-600' :
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
            {new Date(action.time + 5.5*60*60*1000).toLocaleString()}: {action?.action} at {action?.price?.toFixed(2)}
          </li>
        ))}
      </ul>
      <div className='mt-4 flex justify-between items-center'>
        <div className='flex items-center gap-2'>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showVerticalAnnotations}
              onChange={(e) => setShowVerticalAnnotations(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium">
              {showVerticalAnnotations ? 'Vertical' : 'Horizontal'} Annotations
            </span>
          </label>
        </div>
        <div className='flex items-end gap-2 bg-blue-600 text-gray-100 p-2 rounded-md'>
          <button className='' onClick={() => {
            window.open(`https://finance.yahoo.com/chart/${symbol}.NS`, '_blank');
          }}>View Yahoo Chart for {symbol}.NS</button>
          <ChevronRightIcon className='w-6 h-6 ml-2' />
        </div>
      </div>

    </div>
  );
};

export default SimulationResults; 