import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Switch from 'react-switch';
import { setSimulationConfig } from '../../redux/actions/simulatorActions';
import { ChevronDown, ChevronUp } from 'lucide-react';

function AdvancedSettings() {
  const dispatch = useDispatch();
  const config = useSelector(state => state.simulator.config);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateConfig = (key, value) => {
    dispatch(setSimulationConfig({ [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-xl font-semibold dark:text-white">Advanced Settings</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Re-Enter Position */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Re-Enter Position
            </label>
            <Switch
              checked={config.reEnterPosition}
              onChange={(checked) => updateConfig('reEnterPosition', checked)}
            />
          </div>

          {/* Market Order */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Market Order
            </label>
            <Switch
              checked={config.marketOrder}
              onChange={(checked) => updateConfig('marketOrder', checked)}
            />
          </div>

          {/* Enable Trigger Double Confirmation */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Trigger Double Confirmation
            </label>
            <Switch
              checked={config.enableTriggerDoubleConfirmation}
              onChange={(checked) => updateConfig('enableTriggerDoubleConfirmation', checked)}
            />
          </div>

          {/* Enable Stop Loss Double Confirmation */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Stop Loss Double Confirmation
            </label>
            <Switch
              checked={config.enableStopLossDoubleConfirmation}
              onChange={(checked) => updateConfig('enableStopLossDoubleConfirmation', checked)}
            />
          </div>

          {/* Double Confirmation Lookback Hours */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Double Confirmation Lookback (hours)
            </label>
            <input
              type="number"
              step={1}
              value={config.doubleConfirmationLookbackHours}
              onChange={(e) => updateConfig('doubleConfirmationLookbackHours', Number(e.target.value))}
              className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Update SL */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Update Stop Loss
            </label>
            <Switch
              checked={config.updateSL}
              onChange={(checked) => updateConfig('updateSL', checked)}
            />
          </div>

          {/* Conditional SL settings */}
          {config.updateSL && (
            <>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Update SL Interval (lookback minutes)
                </label>
                <input
                  type="number"
                  step={5}
                  value={config.updateSLInterval}
                  onChange={(e) => updateConfig('updateSLInterval', Number(e.target.value))}
                  className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Update SL Frequency (minutes)
                </label>
                <input
                  type="number"
                  step={5}
                  value={config.updateSLFrequency}
                  onChange={(e) => updateConfig('updateSLFrequency', Number(e.target.value))}
                  className="px-3 py-2 text-base border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdvancedSettings;
