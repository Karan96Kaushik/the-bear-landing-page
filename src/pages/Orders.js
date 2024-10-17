import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { postAuthorizedData, fetchAuthorizedData } from '../api/api';
import Switch from "react-switch";
import Autosuggest from 'react-autosuggest';

const sheetFields = [
      { key: 'stockSymbol', label: 'Stock' },
      { key: 'sellAtMarket', label: 'Sell At Market (MKT)', type: 'checkbox' },
      { key: 'sellPrice', label: 'Sell Price', type: 'number', validate: (value) => value > 0 },
      { key: 'stopLossPrice', label: 'Stop Loss', type: 'number', validate: (value) => value > 0 },
      { key: 'targetPrice', label: 'Target', type: 'number', validate: (value) => value > 0 },
      { key: 'quantity', label: 'Quantity', type: 'number', validate: (value) => value > 0 },
      { key: 'reviseSL', label: 'Revise SL', type: 'checkbox' },
      { key: 'ignore', label: 'Ignore', type: 'checkbox' },
];

function Orders() {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [ltp, setLtp] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.debug(name, value);
    if (name === 'stockSymbol') {
      fetchStockLtp(value);
    }
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSwitchChange = (checked, key) => {
    setFormData((prevData) => {
      const newData = { ...prevData, [key]: checked };
      
      // Clear and disable sell price when sellAtMarket is checked
      if (key === 'sellAtMarket' && checked) {
        newData.sellPrice = '';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate inputs
    const errors = sheetFields.reduce((acc, field) => {
      if (field.validate && !field.validate(formData[field.key])) {
        if (field.key === 'sellPrice' && !formData.sellAtMarket) 
          acc[field.key] = `Invalid ${field.label}`;
      }
      return acc;
    }, {});

    if (Object.keys(errors).length > 0) {
      setIsLoading(false);
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    try {
        const _formData = {
            ...formData,
            sellPrice: formData.sellAtMarket ? 'MKT' : formData.sellPrice
        }
      await postAuthorizedData('/orders/create-sell-orders', _formData);
      console.log('Form submitted:', formData);
      toast.success('Order submitted successfully!');
      setFormData({});
    } catch (error) {
      toast.error('Failed to submit order. ' + error?.response?.data?.error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStockLtp = async (value) => {
    if (value.length < 2) return;
    try {
      const response = await fetchAuthorizedData(`/data/stocks/ltp?symbol=${value}`);
      setLtp(response.ltp);
    } catch (error) {
      console.error('Failed to fetch stock LTP:', error);
    }
  }

  const fetchStockSuggestions = useCallback(async (value) => {
    if (value.length < 2) return;
    try {
      const response = await fetchAuthorizedData(`/data/stocks/suggest?query=${value}`);
      setSuggestions(response);
    } catch (error) {
      console.error('Failed to fetch stock suggestions:', error);
    }
  }, []);

  const onSuggestionsFetchRequested = ({ value }) => {
    fetchStockSuggestions(value);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = (suggestion) => suggestion.tradingSymbol;

  const renderSuggestion = (suggestion) => (
    <div className="p-2 hover:bg-gray-100">
      {suggestion.tradingSymbol} - {suggestion.name}
    </div>
  );

  const inputProps = {
    placeholder: 'Enter stock symbol',
    value: formData.stockSymbol || '',
    onChange: (_, { newValue }) => {
      setFormData((prevData) => ({ ...prevData, stockSymbol: newValue }));
    },
    className: 'w-full p-3 mt-1 border rounded-lg focus:outline-none focus:border-yellow-500',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <motion.div 
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mt-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create MIS Sell Order</h2>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {sheetFields.map(({ key, label, type }) => (
            <div key={key} className="flex flex-col">
              {type !== 'checkbox' && <label htmlFor={key} className="text-sm font-bold text-gray-700 mb-1">{label}</label>}
              {key === 'stockSymbol' ? (
                <div className="flex flex-col">
                  <Autosuggest
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSuggestionsClearRequested}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    inputProps={inputProps}
                    onSuggestionSelected={(_, { suggestionValue }) => {
                      fetchStockLtp(suggestionValue);
                      setFormData((prevData) => ({ ...prevData, stockSymbol: suggestionValue }));
                    }}
                  />
                  {ltp > 0 && <div className="mt-1 text-sm text-gray-600">LTP: {ltp}</div>}
                </div>
              ) : type === 'checkbox' ? (
                <div className="flex items-center">
                  <Switch
                    onChange={(checked) => handleSwitchChange(checked, key)}
                    checked={formData[key] || false}
                    onColor="#EAB308"
                    offColor="#D1D5DB"
                    handleDiameter={24}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    height={28}
                    width={56}
                    className="react-switch"
                  />
                  <span className="text-sm font-bold text-gray-700 ml-2">{label}</span>
                </div>
              ) : (
                <input
                  type={type || 'text'}
                  id={key}
                  name={key}
                  value={formData[key] || ''}
                  onChange={handleInputChange}
                  required={key !== 'sellPrice' || !formData.sellAtMarket}
                  disabled={key === 'sellPrice' && formData.sellAtMarket}
                  className={`p-2 border rounded-lg focus:outline-none focus:border-yellow-500 ${
                    key === 'sellPrice' && formData.sellAtMarket ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              )}
            </div>
          ))}
          <motion.button
            type="submit"
            className={`py-3 mt-4 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Order'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default Orders;
