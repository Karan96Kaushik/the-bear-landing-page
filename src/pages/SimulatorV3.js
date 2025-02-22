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
import qs from 'qs';
import _ from 'lodash';

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
    reEnterPosition: false,
    cancelInMins: 5,
    updateSL: false
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSymbol, setSelectedSymbol] = useState([]);

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
      const simulation = _.merge({}, state.simulation)
      delete simulation.result

      const queryParams = qs.stringify({
        date: selectedDate.toISOString().split('T')[0],
        symbol: selectedSymbol.join(','),
        simulation
      })

      const response = await fetchAuthorizedData(`/simulation/simulate/v2?${queryParams}`);
      console.log(response)
      const formattedData = response.map(item => ({
        symbol: item.sym,
        date: new Date(item.placedAt).toISOString().split('T')[0],
        pnl: item.pnl,
        direction: item.direction,
        quantity: item.quantity, // Assuming quantity is 1 for simplicity
        data: item.data.filter(d => new Date(d.time).toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]),
        actions: item.actions
      }));

      updateState('simulation.result', { results: formattedData });
    } catch (error) {
      toast.error('Failed to fetch simulation data');
      console.error('Error fetching simulation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   if (selectedDate && selectedSymbol.length > 0) {
  //     fetchSimulationData();
  //   }
  // }, [selectedDate, selectedSymbol]);

  const handleRowClick = async (result) => {
    setIsLoading(true);
    try {
      setSelectedResult(result);
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
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md"
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
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cancel Interval</label>
              <input
                type="number"
                step={5}
                value={state.simulation.cancelInMins}
                onChange={(selected) => updateState('simulation.cancelInMins', selected.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md"

              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Re-Enter Position</label>
              <Switch
                checked={state.simulation.reEnterPosition}
                onChange={(checked) => updateState('simulation.reEnterPosition', checked)}
                className="switch"
              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Update SL</label>
              <Switch
                checked={state.simulation.updateSL}
                onChange={(checked) => updateState('simulation.updateSL', checked)}
                className="switch"

              />
            </div>
            <div className="w-full md:w-1/2 px-2 mb-4">
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
                    key={`${result.symbol}-${result.date}`} 
                    className={`${index % 2 === 0 ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-100`}
                    onClick={() => handleRowClick(result)}
                  >
                    <td className="py-2 px-4">{result.symbol}</td>
                    <td className="py-2 px-4">{result.date}</td>
                    <td className="text-right py-2 px-4">{result.quantity}</td>
                    <td className="text-right py-2 px-4">{result.direction}</td>
                    <td className={`text-right py-2 px-4 ${result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.pnl?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className='mt-4'>
              Total PnL: {state.simulation.result.results.reduce((acc, curr) => acc + curr.pnl, 0)?.toFixed(2)}
            </div>

            {selectedResultData && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Chart for {selectedResult.symbol} on {selectedResult.date}
                </h3>
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
      </div>
    </div>
  );
};

export default ShortSellingSimulatorPage;