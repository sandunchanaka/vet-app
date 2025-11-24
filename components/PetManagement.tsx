'use client';

import React, { useState, useEffect } from 'react';

interface Pet {
  pet_id: number;
  pet_code: string;
  name: string;
  gender: string;
  date_of_birth: string;
  age_months: number;
  weight: number;
  color: string;
  remarks: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string;
  breed_name: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  pet_category_id: number;
  breed_id: number;
  owner_id: number;
  owner_nic: string;
  owner_address: string;
}

interface PetCategory {
  id: number;
  category_name: string;
}

interface PetBreed {
  id: number;
  breed_name: string;
  category_id: number;
}

export default function PetManagement() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [breeds, setBreeds] = useState<PetBreed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPet, setViewingPet] = useState<Pet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    date_of_birth: '',
    age_months: '',
    pet_category_id: '',
    breed_id: '',
    weight: '',
    color: '',
    remarks: '',
    owner_name: '',
    owner_nic: '',
    owner_phone: '',
    owner_address: '',
    owner_email: ''
  });

  useEffect(() => {
    fetchPets();
    fetchCategories();
    fetchBreeds();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets');
      const result = await response.json();
      
      if (result.success) {
        setPets(result.data);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to fetch pets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/pet-categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBreeds = async () => {
    try {
      const response = await fetch('/api/pet-breeds');
      const result = await response.json();
      
      if (result.success) {
        setBreeds(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch breeds:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPet ? `/api/pets/${editingPet.pet_id}` : '/api/pets';
      const method = editingPet ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(editingPet ? 'Pet updated successfully' : 'Pet created successfully');
        setShowModal(false);
        resetForm();
        fetchPets();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(editingPet ? 'Failed to update pet' : 'Failed to create pet');
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      gender: pet.gender,
      date_of_birth: pet.date_of_birth || '',
      age_months: pet.age_months?.toString() || '',
      pet_category_id: pet.pet_category_id?.toString() || '',
      breed_id: pet.breed_id?.toString() || '',
      weight: pet.weight?.toString() || '',
      color: pet.color || '',
      remarks: pet.remarks || '',
      owner_name: pet.owner_name || '',
      owner_nic: pet.owner_nic || '',
      owner_phone: pet.owner_phone || '',
      owner_address: pet.owner_address || '',
      owner_email: pet.owner_email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (petId: number) => {
    if (!confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Pet deleted successfully');
        fetchPets();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to delete pet');
    }
  };

  const handleView = (pet: Pet) => {
    setViewingPet(pet);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPet(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'male',
      date_of_birth: '',
      age_months: '',
      pet_category_id: '',
      breed_id: '',
      weight: '',
      color: '',
      remarks: '',
      owner_name: '',
      owner_nic: '',
      owner_phone: '',
      owner_address: '',
      owner_email: ''
    });
  };

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.pet_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed_name && pet.breed_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFilteredBreeds = () => {
    if (!formData.pet_category_id) return breeds;
    return breeds.filter(breed => breed.category_id === parseInt(formData.pet_category_id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading pets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pet Management</h2>
          <p className="text-gray-600">Manage pets and their owners</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New Pet</span>
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
          placeholder="Search pets by name, code, owner, category, or breed..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        />
        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Pets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pet Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPets.map((pet) => (
                <tr key={pet.pet_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>
                      <div className="font-semibold">{pet.pet_code} - {pet.name}</div>
                      <div className="text-xs text-gray-500">ID: {pet.pet_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium">{pet.owner_name}</div>
                      <div className="text-xs text-gray-400">{pet.owner_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {pet.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pet.breed_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      pet.gender === 'male' 
                        ? 'bg-blue-100 text-blue-800' 
                        : pet.gender === 'female'
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pet.gender}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pet.age_months ? `${Math.floor(pet.age_months / 12)}y ${pet.age_months % 12}m` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(pet)}
                        className="p-2 bg-blue-500/20 text-blue-600 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="Edit Pet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(pet.pet_id)}
                        className="p-2 bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Delete Pet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* View Button */}
                      <button
                        onClick={() => handleView(pet)}
                        className="p-2 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="View Pet Details"
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

      {/* Add/Edit Pet Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingPet ? 'Edit Pet' : 'Add New Pet'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pet Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Pet Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age (months)</label>
                      <input
                        type="number"
                        value={formData.age_months}
                        onChange={(e) => setFormData({...formData, age_months: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pet Category *</label>
                      <select
                        value={formData.pet_category_id}
                        onChange={(e) => setFormData({...formData, pet_category_id: e.target.value, breed_id: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.category_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                      <select
                        value={formData.breed_id}
                        onChange={(e) => setFormData({...formData, breed_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select Breed</option>
                        {getFilteredBreeds().map(breed => (
                          <option key={breed.id} value={breed.id}>{breed.breed_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Owner Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Owner Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                    <input
                      type="text"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
                    <input
                      type="text"
                      value={formData.owner_nic}
                      onChange={(e) => setFormData({...formData, owner_nic: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.owner_phone}
                      onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.owner_address}
                      onChange={(e) => setFormData({...formData, owner_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                  {editingPet ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Pet Modal */}
      {showViewModal && viewingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Pet Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Pet Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Pet Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pet Code</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono font-semibold">{viewingPet.pet_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium ${
                      viewingPet.gender === 'male' 
                        ? 'bg-blue-100 text-blue-800' 
                        : viewingPet.gender === 'female'
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingPet.gender}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewingPet.date_of_birth ? new Date(viewingPet.date_of_birth).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewingPet.age_months ? `${Math.floor(viewingPet.age_months / 12)} years ${viewingPet.age_months % 12} months` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.category_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.breed_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewingPet.weight ? `${viewingPet.weight} kg` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.color || 'Not specified'}</p>
                  </div>
                </div>
                {viewingPet.remarks && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.remarks}</p>
                  </div>
                )}
              </div>

              {/* Owner Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Owner Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_nic || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_email || 'Not provided'}</p>
                  </div>
                </div>
                {viewingPet.owner_address && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_address}</p>
                  </div>
                )}
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
