import React, { useState } from 'react';
import { stockOptions } from '../../constants/simulatorConstants';

function StockSelector({ selectedSymbols, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim().toUpperCase();
      if (value && !selectedSymbols.includes(value)) {
        onChange([...selectedSymbols, value]);
        setInputValue('');
      }
    }
  };

  const handleRemoveSymbol = (symbol) => {
    onChange(selectedSymbols.filter(s => s !== symbol));
  };

  const handleAddSuggestion = (symbol) => {
    if (!selectedSymbols.includes(symbol)) {
      onChange([...selectedSymbols, symbol]);
    }
  };

  const availableSuggestions = stockOptions
    .filter(option => !selectedSymbols.includes(option.value))
    .slice(0, 8);

  return (
    <div className="flex flex-col">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-3 py-2 text-base border border-gray-300 rounded-md w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Type symbol and press Enter..."
        />
        <div className="mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Suggestions:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {availableSuggestions.map(option => (
              <button
                key={option.value}
                onClick={() => handleAddSuggestion(option.value)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md dark:text-gray-200"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedSymbols.map(symbol => (
          <div 
            key={symbol} 
            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md"
          >
            <span className="text-blue-800 dark:text-blue-200">{symbol}</span>
            <button
              onClick={() => handleRemoveSymbol(symbol)}
              className="text-blue-800 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StockSelector;
