'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

const currencyOptions = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'LKR', label: 'LKR (Rs)' },
] as const;

export default function SystemSettings() {
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const [selected, setSelected] = useState(currency);

  useEffect(() => {
    setSelected(currency);
  }, [currency]);

  const handleSave = () => {
    setCurrency(selected);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
      <p className="text-gray-600 mb-6">Configure global settings for the application.</p>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Currency</h3>
          <p className="text-sm text-gray-600 mb-3">
            Select the default currency symbol displayed across the system.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currencyOptions.map((option) => (
              <label
                key={option.code}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selected === option.code
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="currency"
                    value={option.code}
                    checked={selected === option.code}
                    onChange={() => setSelected(option.code)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="text-gray-900 font-medium">{option.label}</p>
                    <p className="text-sm text-gray-500">Symbol: {option.code === 'LKR' ? 'Rs' : '$'}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600">Current currency symbol</p>
            <p className="text-lg font-semibold text-gray-900">{currencySymbol}</p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
