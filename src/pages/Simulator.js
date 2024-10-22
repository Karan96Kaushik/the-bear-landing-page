import React, { useState, useEffect } from 'react';
// import { Line } from 'react-chartjs-2';
import { ShortSellingSimulator } from '../simulator/ShortSellingSimulator'; // Adjust the import path as needed
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
if (isNaN(i) || !data.length || !stopLossPrice ||!logAction) {
    throw new Error("Incomplete params in updated SL function" + \`\${i} || \${data.length} || \${stopLossPrice}\ || \${logAction}\`)
}
//logAction(data[i].time, "Running updateStopLossFunction")
if (i % 15 === 0 && i > 15) {
    const thirtyMinutesAgo = data[i].time - (1800 * 1000);
    const now = data[i].time;
    const last30MinData = data.filter((_, index) => {
        if (data[index].time <= now && data[index].time >= thirtyMinutesAgo) {
            return true;
        }
        return false;
    });
    // console.log('last30MinData', last30MinData.length)
    const highestPrice = Math.max(...last30MinData);
    if (highestPrice < stopLossPrice)
        return highestPrice;
}
return stopLossPrice;
`;

const updateTriggerPriceFunction_text = `
if (isNaN(i) || !data.length || !triggerPrice ||!logAction) {
    throw new Error("Incomplete params in updated Trigger Price function" + \`\${i} || \${data.length} || \${triggerPrice}\ || \${logAction}\`)
}
//logAction(data[i].time, "Running updateStopLossFunction")
if (i % 15 === 0 && i > 15) {
    const thirtyMinutesAgo = data[i].time - (1800 * 1000);
    const now = data[i].time;
    const last30MinData = data.filter((_, index) => {
        if (data[index].time <= now && data[index].time >= thirtyMinutesAgo) {
            return true;
        }
        return false;
    });
    // console.log('last30MinData', last30MinData.length)
    const highestPrice = Math.max(...last30MinData.map(d => d.high));
    // logAction(data[i].time, "Running trig " + highestPrice, triggerPrice)
    if (!(triggerPrice) || (highestPrice > triggerPrice))
        return highestPrice;
}
return triggerPrice;
`;
// }

const ShortSellingSimulatorPage = () => {
  const [stockSymbol, setStockSymbol] = useState('MOIL');
  const [triggerPrice, setTriggerPrice] = useState();
  const [stopLossPrice, setStopLossPrice] = useState(389);
  const [targetPrice, setTargetPrice] = useState(347.2);
  const [quantity, setQuantity] = useState(239);
  const [startTime, setStartTime] = useState(new Date('2024-10-18'));
  const [endTime, setEndTime] = useState(new Date('2024-10-19'));
  const [simulationResult, setSimulationResult] = useState(null);
  const [yahooData, setYahooData] = useState(null);
//   const [loading, setLoading] = useState(true);
  const [isMarketOrder, setIsMarketOrder] = useState(true);
  const [updateStopLossFunctionText, setUpdateStopLossFunctionText] = useState(updateStopLossFunction_text);
  const [functionName, setFunctionName] = useState('');
  const [editorHeight, setEditorHeight] = useState('200px');
  const [savedFunctions, setSavedFunctions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateTargetPriceFunctionText, setUpdateTargetPriceFunctionText] = useState('');
  const [updateTriggerPriceFunctionText, setUpdateTriggerPriceFunctionText] = useState(updateTriggerPriceFunction_text);
  const [activeTab, setActiveTab] = useState('stopLoss');

  useEffect(() => {
    // Dynamically import the JavaScript mode
    import('ace-builds/src-noconflict/mode-javascript')
      .then(() => {
        console.log('JavaScript mode loaded');
      })
      .catch(err => {
        console.error('Failed to load JavaScript mode:', err);
      });
  }, []);

  useEffect(() => {
    if (stockSymbol.length < 2) return;
    const fetchYahooData = async () => {
      try {
        const [yahooResponse] = await Promise.all([
          fetchAuthorizedData(`/data/yahoo?symbol=${stockSymbol}&interval=1m&startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}`)
        ]);
        if (!yahooResponse) 
            throw new Error('No data found for the given time range');
        setYahooData(yahooResponse);
        // setLoading(false);
      } catch (err) {
        toast.error(err?.message || err || 'Failed to fetch data');
        // setLoading(false);
      }
    };

    fetchYahooData();    
  }, [stockSymbol, startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updateStopLossFunction = new Function('i', 'data', 'stopLossPrice', 'logAction', updateStopLossFunctionText);
    const updateTriggerPriceFunction = new Function('i', 'data', 'triggerPrice', 'logAction', updateTriggerPriceFunctionText);
    const updateTargetPriceFunction = new Function('i', 'data', 'targetPrice', 'logAction', updateTargetPriceFunctionText);
    const simulator = new ShortSellingSimulator({
      stockSymbol,
      triggerPrice: isMarketOrder ? 'MKT' : triggerPrice,
      stopLossPrice,
      targetPrice,
      quantity,
      updateStopLossFunction,
      updateTriggerPriceFunction,
      updateTargetPriceFunction,
      startTime,
      endTime,
      yahooData
    });

    try {
      await simulator.run();
      setSimulationResult(simulator);
    } catch (err) {
      toast.error(err?.message || err || 'Failed to run simulation');
    }
  };

  const chartData = {
    datasets: [
      {
        label: 'Stock Price',
        data: simulationResult?.data.map((d, i) => ({
          x: d.time,
          o: d.open,
          h: d.high,
          l: d.low,
          c: d.close
        })) || [],
      },
      {
        label: 'SMA44',
        data: simulationResult?.data.map((d) => ({
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

  const candlestickOptions = {
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'minute',
                displayFormats: {
                    minute: 'HH:mm',
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
        annotation: {
            annotations: simulationResult?.tradeActions.map(action => ({
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
                    backgroundColor: 
                        action?.action.includes('Short') ? 'red' : 
                        action?.action === 'Stop Loss Hit' ? 'orange' :
                        action?.action === 'Target Hit' ? 'green' :
                        action?.action === 'Auto Square-off' ? 'blue' :
                        'gray',
                    font: {
                        size: 12
                    },
                    padding: 4
                }
            })) || []
        }
    }
  };

  const saveFunction = async () => {
    try {
      const functionType = activeTab === 'stopLoss' ? 'stopLoss' :
                           activeTab === 'targetPrice' ? 'targetPrice' : 'triggerPrice';
      const functionText = activeTab === 'stopLoss' ? updateStopLossFunctionText :
                           activeTab === 'targetPrice' ? updateTargetPriceFunctionText : updateTriggerPriceFunctionText;

      await postAuthorizedData('/data/save-function', {
        name: functionName,
        code: functionText,
        type: functionType,
      });
      toast.success('Function saved successfully');
    } catch (error) {
      console.error('Error saving function:', error);
      toast.error('Failed to save function');
    }
  };

  const viewSavedFunctions = async () => {
    try {
      const response = await fetchAuthorizedData('/data/functions');
      setSavedFunctions(response);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching saved functions:', error);
      toast.error('Failed to fetch saved functions');
    }
  };

  const loadFunction = (functionCode, functionType) => {
    if (functionType === 'stopLoss') {
      setUpdateStopLossFunctionText(functionCode);
      setActiveTab('stopLoss');
    } else if (functionType === 'targetPrice') {
      setUpdateTargetPriceFunctionText(functionCode);
      setActiveTab('targetPrice');
    } else if (functionType === 'triggerPrice') {
      setUpdateTriggerPriceFunctionText(functionCode);
      setActiveTab('triggerPrice');
    }
    setIsModalOpen(false);
  };

  const handleResize = (e) => {
    const startY = e.clientY;
    const startHeight = parseInt(editorHeight);

    const doDrag = (e) => {
      setEditorHeight(`${startHeight + e.clientY - startY}px`);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Short Selling Simulator</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
              <input
                type="text"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Price</label>
              <div className="flex items-center">
                {!isMarketOrder && (
                  <input
                    type="number"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                {isMarketOrder && (
                  <span className="w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-100">
                    MKT
                  </span>
                )}
                <div className="ml-2 flex items-center">
                  <Switch
                    onChange={() => setIsMarketOrder(!isMarketOrder)}
                    checked={isMarketOrder}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={24}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={48}
                    className="react-switch"
                  />
                  <span className="ml-2 text-sm text-gray-600">Market Order</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss Price</label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Price</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
              <DatePicker
                selected={startTime}
                onChange={(date) => setStartTime(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <DatePicker
                selected={endTime}
                onChange={(date) => setEndTime(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="w-full px-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Functions</label>
            <div className="flex items-center mb-2">
              <input
                type="text"
                placeholder="Function Name"
                className="w-1/3 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mr-2"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
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
            <Tab.Group selectedIndex={['stopLoss', 'targetPrice', 'triggerPrice'].indexOf(activeTab)} onChange={(index) => setActiveTab(['stopLoss', 'targetPrice', 'triggerPrice'][index])}>
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
                    onChange={setUpdateStopLossFunctionText}
                    name="updateStopLossFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={updateStopLossFunctionText}
                    width="100%"
                    height={editorHeight}
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
                    onChange={setUpdateTargetPriceFunctionText}
                    name="updateTargetPriceFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={updateTargetPriceFunctionText}
                    width="100%"
                    height={editorHeight}
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
                    onChange={setUpdateTriggerPriceFunctionText}
                    name="updateSellPriceFunction"
                    editorProps={{ $blockScrolling: true }}
                    value={updateTriggerPriceFunctionText}
                    width="100%"
                    height={editorHeight}
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
            <button type="submit" className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">
              Run Simulation
            </button>
          </div>
        </form>

        {simulationResult && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
            <Chart
              type='candlestick'
              data={chartData}
              options={candlestickOptions}
            />
            <p className="mt-4">Final P&L: {simulationResult.pnl.toFixed(2)}</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">Trade Actions:</h3>
            <ul className="list-disc pl-5">
              {simulationResult.tradeActions.map((action, index) => (
                <li key={index} className={`mb-1 ${
                  action?.action.includes('Short') ? 'text-red-600' :
                  action?.action === 'Stop Loss Hit' ? 'text-orange-600' :
                  action?.action === 'Target Hit' ? 'text-green-600' :
                  action?.action === 'Auto Square-off' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {new Date(action.time).toLocaleString()}: {action?.action} at {action?.price?.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Saved Functions"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Saved Functions</h2>
          <ul className="list-disc pl-5">
            {savedFunctions.map((functionCode, index) => (
              <li key={index} className="mb-2">
                <button
                  onClick={() => { loadFunction(functionCode.code, functionCode.type); setFunctionName(functionCode.name); }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Load {functionCode.name} ({functionCode.type})
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default ShortSellingSimulatorPage;
