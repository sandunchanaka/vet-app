'use client';

import React, { useState, useEffect } from 'react';

interface DosageType {
  id: number;
  name: string;
  abbreviation: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Dose {
  id: number;
  name: string;
  dosage_type: string;
  ml_equivalent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DurationType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DurationWeek {
  id: number;
  name: string;
  weeks: number;
  days: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DosageMasterManagement() {
  const [activeTab, setActiveTab] = useState('dosage-types');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [dosageTypes, setDosageTypes] = useState<DosageType[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [durationTypes, setDurationTypes] = useState<DurationType[]>([]);
  const [durationWeeks, setDurationWeeks] = useState<DurationWeek[]>([]);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      let result;
      
      switch (activeTab) {
        case 'dosage-types':
          response = await fetch('/api/dosage-types');
          result = await response.json();
          if (result.success) setDosageTypes(result.data);
          break;
        case 'doses':
          response = await fetch('/api/doses');
          result = await response.json();
          if (result.success) setDoses(result.data);
          break;
        case 'duration-types':
          response = await fetch('/api/duration-types');
          result = await response.json();
          if (result.success) setDurationTypes(result.data);
          break;
        case 'duration-weeks':
          response = await fetch('/api/duration-weeks');
          result = await response.json();
          if (result.success) setDurationWeeks(result.data);
          break;
      }
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'dosage-types': return dosageTypes;
      case 'doses': return doses;
      case 'duration-types': return durationTypes;
      case 'duration-weeks': return durationWeeks;
      default: return [];
    }
  };

  const getFilteredData = () => {
    const data = getCurrentData();
    if (!searchTerm) return data;
    
    return data.filter((item: any) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.abbreviation && item.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'dosage-types':
        return ['Name', 'Abbreviation', 'Description', 'Actions'];
      case 'doses':
        return ['Name', 'Type', 'ML Equivalent', 'Actions'];
      case 'duration-types':
        return ['Name', 'Description', 'Actions'];
      case 'duration-weeks':
        return ['Name', 'Weeks', 'Days', 'Description', 'Actions'];
      default:
        return [];
    }
  };

  const renderTableRow = (item: any) => {
    switch (activeTab) {
      case 'dosage-types':
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {item.abbreviation || 'N/A'}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
              {item.description || 'No description'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors" title="View Details">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        );
      case 'doses':
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                {item.dosage_type}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {item.ml_equivalent ? `${item.ml_equivalent} ml` : 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors" title="View Details">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        );
      case 'duration-types':
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {item.name}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
              {item.description || 'No description'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors" title="View Details">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        );
      case 'duration-weeks':
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {item.weeks || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {item.days || 'N/A'}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
              {item.description || 'No description'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors" title="View Details">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dosage-types': return 'Dosage Types';
      case 'doses': return 'Doses';
      case 'duration-types': return 'Duration Types';
      case 'duration-weeks': return 'Duration Weeks';
      default: return 'Master Data';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'dosage-types': return 'Manage medication frequency and timing instructions';
      case 'doses': return 'Manage specific dosage amounts and units';
      case 'duration-types': return 'Manage treatment duration categories';
      case 'duration-weeks': return 'Manage specific duration periods';
      default: return 'Manage master data for dosage and duration';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading {getTabTitle().toLowerCase()}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dosage Master Data</h2>
          <p className="text-gray-600">Manage medication dosage and duration master data</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'dosage-types', name: 'Dosage Types', count: dosageTypes.length },
              { id: 'doses', name: 'Doses', count: doses.length },
              { id: 'duration-types', name: 'Duration Types', count: durationTypes.length },
              { id: 'duration-weeks', name: 'Duration Weeks', count: durationWeeks.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Current Tab Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{getTabTitle()}</h3>
            <p className="text-gray-600">{getTabDescription()}</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder={`Search ${getTabTitle().toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {getTableHeaders().map((header, index) => (
                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredData().map((item: any) => renderTableRow(item))}
              </tbody>
            </table>
          </div>

          {/* No Results */}
          {getFilteredData().length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No {getTabTitle().toLowerCase()} found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No data available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
