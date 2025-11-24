'use client';

import React, { useState, useEffect } from 'react';

interface Drug {
  id: number;
  drug_name: string;
  generic_name: string;
  manufacturer: string;
  drug_type: string;
  dosage_form: string;
  strength: string;
  unit: string;
  description: string;
  side_effects: string;
  contraindications: string;
  storage_conditions: string;
  expiry_date: string;
  is_prescription_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DrugsManagement() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDrug, setViewingDrug] = useState<Drug | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    drug_name: '',
    generic_name: '',
    manufacturer: '',
    drug_type: 'other',
    dosage_form: 'tablet',
    strength: '',
    unit: 'mg',
    description: '',
    side_effects: '',
    contraindications: '',
    storage_conditions: '',
    expiry_date: '',
    is_prescription_required: true
  });

  // Fetch drugs
  const fetchDrugs = async () => {
    try {
      const response = await fetch('/api/drugs');
      const result = await response.json();

      if (result.success) {
        setDrugs(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch drugs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingDrug 
        ? `/api/drugs/${editingDrug.id}`
        : '/api/drugs';
      
      const method = editingDrug ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingDrug ? 'Drug updated successfully' : 'Drug created successfully');
        setShowModal(false);
        setEditingDrug(null);
        setFormData({
          drug_name: '',
          generic_name: '',
          manufacturer: '',
          drug_type: 'other',
          dosage_form: 'tablet',
          strength: '',
          unit: 'mg',
          description: '',
          side_effects: '',
          contraindications: '',
          storage_conditions: '',
          expiry_date: '',
          is_prescription_required: true
        });
        fetchDrugs();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An error occurred while saving the drug');
    }
  };

  // Handle edit
  const handleEdit = (drug: Drug) => {
    setEditingDrug(drug);
    setFormData({
      drug_name: drug.drug_name,
      generic_name: drug.generic_name || '',
      manufacturer: drug.manufacturer || '',
      drug_type: drug.drug_type,
      dosage_form: drug.dosage_form,
      strength: drug.strength || '',
      unit: drug.unit || 'mg',
      description: drug.description || '',
      side_effects: drug.side_effects || '',
      contraindications: drug.contraindications || '',
      storage_conditions: drug.storage_conditions || '',
      expiry_date: drug.expiry_date || '',
      is_prescription_required: drug.is_prescription_required
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this drug?')) {
      return;
    }

    try {
      const response = await fetch(`/api/drugs/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Drug deleted successfully');
        fetchDrugs();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to delete drug');
    }
  };

  // Handle view
  const handleView = (drug: Drug) => {
    setViewingDrug(drug);
    setShowViewModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDrug(null);
    setFormData({
      drug_name: '',
      generic_name: '',
      manufacturer: '',
      drug_type: 'other',
      dosage_form: 'tablet',
      strength: '',
      unit: 'mg',
      description: '',
      side_effects: '',
      contraindications: '',
      storage_conditions: '',
      expiry_date: '',
      is_prescription_required: true
    });
    setError(null);
  };

  // Filter drugs based on search term
  const filteredDrugs = drugs.filter(drug =>
    drug.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (drug.generic_name && drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (drug.manufacturer && drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h2 className="text-2xl font-bold text-gray-900">Drugs Management</h2>
          <p className="text-gray-600">Manage pharmaceutical inventory and drug information</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Drug</span>
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
          placeholder="Search drugs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Drugs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drug Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generic Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strength
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrugs.map((drug) => (
                <tr key={drug.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {drug.drug_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {drug.generic_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {drug.drug_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {drug.strength} {drug.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {drug.manufacturer || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(drug)}
                        className="p-2 bg-blue-500/20 text-blue-600 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="Edit Drug"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(drug.id)}
                        className="p-2 bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Delete Drug"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* View Button */}
                      <button
                        onClick={() => handleView(drug)}
                        className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="View Drug Details"
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
              {editingDrug ? 'Edit Drug' : 'Add New Drug'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drug Name *
                  </label>
                  <input
                    type="text"
                    value={formData.drug_name}
                    onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter drug name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter generic name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter manufacturer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drug Type
                  </label>
                  <select
                    value={formData.drug_type}
                    onChange={(e) => setFormData({ ...formData, drug_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="antibiotic">Antibiotic</option>
                    <option value="painkiller">Painkiller</option>
                    <option value="vaccine">Vaccine</option>
                    <option value="supplement">Supplement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="injection">Injection</option>
                    <option value="liquid">Liquid</option>
                    <option value="cream">Cream</option>
                    <option value="powder">Powder</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter strength"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                    <option value="units">Units</option>
                  </select>
                </div>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="prescription_required"
                  checked={formData.is_prescription_required}
                  onChange={(e) => setFormData({ ...formData, is_prescription_required: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="prescription_required" className="ml-2 block text-sm text-gray-900">
                  Prescription Required
                </label>
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
                  {editingDrug ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Drug Modal */}
      {showViewModal && viewingDrug && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Drug Details</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingDrug.drug_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingDrug.generic_name || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingDrug.manufacturer || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drug Type</label>
                  <span className="inline-flex px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
                    {viewingDrug.drug_type}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Form</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingDrug.dosage_form}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {viewingDrug.strength ? `${viewingDrug.strength} ${viewingDrug.unit}` : 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[60px]">
                  {viewingDrug.description || 'No description provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Required</label>
                  <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium ${
                    viewingDrug.is_prescription_required 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {viewingDrug.is_prescription_required ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {viewingDrug.expiry_date ? new Date(viewingDrug.expiry_date).toLocaleDateString() : 'Not specified'}
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
