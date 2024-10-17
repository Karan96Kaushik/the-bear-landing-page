import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { postAuthorizedData, fetchAuthorizedData } from '../api/api';
import Switch from "react-switch";
import Autosuggest from 'react-autosuggest';

const sheetFields = [
      { key: 'stockSymbol', label: 'Stock' },
      { key: 'sellPrice', label: 'Sell Price', type: 'number' },
      { key: 'stopLossPrice', label: 'Stop Loss', type: 'number' },
      { key: 'targetPrice', label: 'Target', type: 'number' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
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
    setFormData((prevData) => ({ ...prevData, [key]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Here you would typically send the data to your backend
      await postAuthorizedData('/orders/create-sell-orders', formData); // Simulating API call
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-cover bg-center" style={{ backgroundImage: 'url(/path-to-orders-background.jpg)' }}>
        <div className="bg-black opacity-60"></div>
      </div>

      <motion.div 
        className="relative z-10 bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 100 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create New Order</h2>

        <form onSubmit={handleSubmit}>
          {sheetFields.map(({ key, label, type }) => (
            <div key={key} className="mb-4">
              <label htmlFor={key} className="block text-sm font-bold text-gray-700">{label}</label>
              {key === 'stockSymbol' ? (
                <>
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
                    {ltp > 0 && <div className="mt-1">LTP: {ltp}</div>}
                </>
              ) : type === 'checkbox' ? (
                <div className="mt-1">
                  <label className="flex items-center">
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
                    <span className="ml-2 text-gray-700">{label}</span>
                  </label>
                </div>
              ) : (
                <input
                  type={type || 'text'}
                  id={key}
                  name={key}
                  value={formData[key] || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 mt-1 border rounded-lg focus:outline-none focus:border-yellow-500"
                />
              )}
            </div>
          ))}
          <motion.button
            type="submit"
            className={`w-full py-3 mt-4 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
