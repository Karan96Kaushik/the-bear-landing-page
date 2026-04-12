import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { setSimulationConfig, setDateRange, setSelectedSymbols } from '../../redux/actions/simulatorActions';
import StockSelector from './StockSelector';
import ParameterPopup from './ParameterPopup';

function SimulationForm() {
  const dispatch = useDispatch();
  const { config, dateRange, selectedSymbols, selectionParams } = useSelector(state => state.simulator);

  const updateConfig = (key, value) => {
    dispatch(setSimulationConfig({ [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Simulation Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date Range
          </label>
          <DatePicker
            selectsRange={true}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={(update) => dispatch(setDateRange(update))}
            dateFormat="yyyy-MM-dd"
            className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
          />
        </div>

        {/* Type Selector */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type
          </label>
          <select
            value={config.type}
            onChange={(e) => updateConfig('type', e.target.value)}
            className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
          >
            <option value="benoit">Benoit</option>
            <option value="baxter">Baxter</option>
            <option value="zaire">Zaire</option>
            <option value="lightyear">Lightyear</option>
            <option value="bailey">Bailey</option>
          </select>
        </div>

        {/* Symbol Selector */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Symbols
          </label>
          <StockSelector
            selectedSymbols={selectedSymbols}
            onChange={(symbols) => dispatch(setSelectedSymbols(symbols))}
          />
        </div>

        {/* Cancel Interval */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cancel Interval (minutes)
          </label>
          <input
            type="number"
            step={5}
            value={config.cancelInMins}
            onChange={(e) => updateConfig('cancelInMins', Number(e.target.value))}
            className="px-3 py-2 text-base border border-gray-300 rounded-md w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Target:SL Ratio */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target:SL Ratio
          </label>
          <select
            value={config.targetStopLossRatio}
            onChange={(e) => updateConfig('targetStopLossRatio', e.target.value)}
            className="px-3 py-2 text-base border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
          >
            <option value="1:1">1:1</option>
            <option value="2:1">2:1</option>
            <option value="5:1">5:1</option>
            <option value="2:1.5">2:1.5</option>
            <option value="3:2">3:2</option>
            <option value="2:2">2:2</option>
            <option value="4:2">4:2</option>
            <option value="3:1">3:1</option>
          </select>
        </div>

        {/* Parameter Popup */}
        <div className="col-span-1 md:col-span-3">
          <ParameterPopup selectionParams={selectionParams} type={config.type} />
        </div>
      </div>
    </div>
  );
}

export default SimulationForm;
