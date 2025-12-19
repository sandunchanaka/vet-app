'use client';

import React, { useState, useEffect } from 'react';

interface VaccinationType {
  id: number;
  vaccine_name: string;
  vaccine_type: string;
  target_species: string;
  age_requirement_months: number;
  frequency_months: number;
  description: string;
  side_effects: string;
  contraindications: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function VaccinationTypesManagement() {
  const [vaccinationTypes, setVaccinationTypes] = useState<VaccinationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVaccinationType, setEditingVaccinationType] = useState<VaccinationType | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingVaccinationType, setViewingVaccinationType] = useState<VaccinationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    vaccine_name: '',
    vaccine_type: 'core',
    target_species: '',
    age_requirement_months: '',
    frequency_months: '',
    description: '',
    side_effects: '',
    contraindications: ''
  });

  // Fetch vaccination types
  const fetchVaccinationTypes = async () => {
    try {
      const response = await fetch('/api/vaccination-types');
      const result = await response.json();

      if (result.success) {
        setVaccinationTypes(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch vaccination types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinationTypes();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingVaccinationType 
        ? `/api/vaccination-types/${editingVaccinationType.id}`
        : '/api/vaccination-types';
      
      const method = editingVaccinationType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          age_requirement_months: formData.age_requirement_months ? parseInt(formData.age_requirement_months) : null,
          frequency_months: formData.frequency_months ? parseInt(formData.frequency_months) : null
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingVaccinationType ? 'Vaccination type updated successfully' : 'Vaccination type created successfully');
        setShowModal(false);
        setEditingVaccinationType(null);
        setFormData({
          vaccine_name: '',
          vaccine_type: 'core',
          target_species: '',
          age_requirement_months: '',
          frequency_months: '',
          description: '',
          side_effects: '',
          contraindications: ''
        });
        fetchVaccinationTypes();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An error occurred while saving the vaccination type');
    }
  };

  // Handle edit
  const handleEdit = (vaccinationType: VaccinationType) => {
    setEditingVaccinationType(vaccinationType);
    setFormData({
      vaccine_name: vaccinationType.vaccine_name,
      vaccine_type: vaccinationType.vaccine_type,
      target_species: vaccinationType.target_species || '',
      age_requirement_months: vaccinationType.age_requirement_months?.toString() || '',
      frequency_months: vaccinationType.frequency_months?.toString() || '',
      description: vaccinationType.description || '',
      side_effects: vaccinationType.side_effects || '',
      contraindications: vaccinationType.contraindications || ''
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vaccination type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/vaccination-types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Vaccination type deleted successfully');
        fetchVaccinationTypes();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to delete vaccination type');
    }
  };

  // Handle view
  const handleView = (vaccinationType: VaccinationType) => {
    setViewingVaccinationType(vaccinationType);
    setShowViewModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVaccinationType(null);
    setFormData({
      vaccine_name: '',
      vaccine_type: 'core',
      target_species: '',
      age_requirement_months: '',
      frequency_months: '',
      description: '',
      side_effects: '',
      contraindications: ''
    });
    setError(null);
  };

  // Filter vaccination types based on search term
  const filteredVaccinationTypes = vaccinationTypes.filter(vaccinationType =>
    vaccinationType.vaccine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaccinationType.vaccine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vaccinationType.target_species && vaccinationType.target_species.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vaccinations</h2>
          <p className="text-gray-600">Manage vaccination types and schedules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add vaccinations</span>
        </button>
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

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search vaccination types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Vaccination Types Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vaccine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Species
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age Requirement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVaccinationTypes.map((vaccinationType) => (
                <tr key={vaccinationType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vaccinationType.vaccine_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vaccinationType.vaccine_type === 'core' 
                        ? 'bg-red-100 text-red-800' 
                        : vaccinationType.vaccine_type === 'non_core'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vaccinationType.vaccine_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {vaccinationType.target_species || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vaccinationType.age_requirement_months ? `${vaccinationType.age_requirement_months} months` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vaccinationType.frequency_months ? `${vaccinationType.frequency_months} months` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(vaccinationType)}
                        className="p-2 bg-blue-500/20 text-blue-600 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="Edit Vaccination Type"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(vaccinationType.id)}
                        className="p-2 bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Delete Vaccination Type"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* View Button */}
                      <button
                        onClick={() => handleView(vaccinationType)}
                        className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="View Vaccination Type Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingVaccinationType ? 'Edit Vaccination Type' : 'Add New Vaccination Type'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccine Name *
                  </label>
                  <input
                    type="text"
                    value={formData.vaccine_name}
                    onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter vaccine name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccine Type
                  </label>
                  <select
                    value={formData.vaccine_type}
                    onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="core">Core</option>
                    <option value="non_core">Non-Core</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Species
                  </label>
                  <input
                    type="text"
                    value={formData.target_species}
                    onChange={(e) => setFormData({ ...formData, target_species: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Dogs, Cats"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Requirement (months)
                  </label>
                  <input
                    type="number"
                    value={formData.age_requirement_months}
                    onChange={(e) => setFormData({ ...formData, age_requirement_months: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter age requirement"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency (months)
                </label>
                <input
                  type="number"
                  value={formData.frequency_months}
                  onChange={(e) => setFormData({ ...formData, frequency_months: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter frequency in months"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Side Effects
                  </label>
                  <textarea
                    value={formData.side_effects}
                    onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter side effects"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraindications
                  </label>
                  <textarea
                    value={formData.contraindications}
                    onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter contraindications"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingVaccinationType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Vaccination Type Modal */}
      {showViewModal && viewingVaccinationType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Vaccination Type Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingVaccinationType.vaccine_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Type</label>
                  <span className="inline-flex px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
                    {viewingVaccinationType.vaccine_type}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Species</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {viewingVaccinationType.target_species || 'Not specified'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Requirement</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {viewingVaccinationType.age_requirement_months 
                      ? `${viewingVaccinationType.age_requirement_months} months` 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {viewingVaccinationType.frequency_months 
                      ? `Every ${viewingVaccinationType.frequency_months} months` 
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[60px]">
                  {viewingVaccinationType.description || 'No description provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(viewingVaccinationType.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(viewingVaccinationType.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
