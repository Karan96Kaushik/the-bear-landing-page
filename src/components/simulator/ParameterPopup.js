import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectionParams } from '../../redux/actions/simulatorActions';

function ParameterPopup({ selectionParams, type }) {
  const dispatch = useDispatch();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [tempParams, setTempParams] = useState({});
  const [newOptionValue, setNewOptionValue] = useState('');
  const [selectedKeyForNewOption, setSelectedKeyForNewOption] = useState('');

  const openPopup = () => {
    setTempParams({ ...selectionParams });
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const saveChanges = () => {
    dispatch(setSelectionParams(tempParams));
    closePopup();
  };

  const addNewOptionToKey = () => {
    if (selectedKeyForNewOption && newOptionValue) {
      const newValue = parseFloat(newOptionValue.trim()) || newOptionValue.trim(); // Handle numbers and strings
      setTempParams((prev) => ({
        ...prev,
        [selectedKeyForNewOption]: {
          ...prev[selectedKeyForNewOption],
          options: [...prev[selectedKeyForNewOption].options, newValue],
        },
      }));
      setNewOptionValue('');
    }
  };

  const removeOptionFromKey = (key, optionToRemove) => {
    setTempParams((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        options: prev[key].options.filter((option) => option !== optionToRemove),
      },
    }));
  };

  return (
    <div className="p-4 w-full">
      <button
        onClick={openPopup}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Change Parameters
      </button>

      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-7xl">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Edit Parameters</h2>

            <div className="space-y-4 grid grid-cols-3 gap-4">
              {Object.keys(tempParams).map((key) => (
                <div key={key} className="flex flex-col gap-2 col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {key}
                  </label>
                  <div className="flex flex-row gap-2 items-center">
                    <input
                      type="text"
                      placeholder="New Option Value"
                      value={selectedKeyForNewOption === key ? newOptionValue : ''}
                      onChange={(e) => {
                        setSelectedKeyForNewOption(key);
                        setNewOptionValue(e.target.value);
                      }}
                      className="w-1/3 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      onClick={addNewOptionToKey}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tempParams[key].options.map((option) => (
                      <div
                        key={option}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg"
                      >
                        <span className="dark:text-gray-300">{option}</span>
                        <button
                          onClick={() => removeOptionFromKey(key, option)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closePopup}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParameterPopup;
