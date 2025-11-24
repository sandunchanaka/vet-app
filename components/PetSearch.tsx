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

export default function PetSearch() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [breeds, setBreeds] = useState<PetBreed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPet, setViewingPet] = useState<Pet | null>(null);

  const [searchFilters, setSearchFilters] = useState({
    pet_code: '',
    pet_name: '',
    pet_category: '',
    breed: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    owner_nic: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchBreeds();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/pet-categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      console.error('Error fetching breeds:', error);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build search query with filters
      const searchParams = new URLSearchParams();
      
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value.trim()) {
          searchParams.append(key, value.trim());
        }
      });

      const response = await fetch(`/api/pets/search?${searchParams.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setPets(result.data);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to search pets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchFilters({
      pet_code: '',
      pet_name: '',
      pet_category: '',
      breed: '',
      owner_name: '',
      owner_phone: '',
      owner_email: '',
      owner_nic: ''
    });
    setPets([]);
    setError(null);
  };

  const handleView = (pet: Pet) => {
    setViewingPet(pet);
    setShowViewModal(true);
  };

  const handleDelete = async (petId: number) => {
    if (!confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove the deleted pet from the list
        setPets(pets.filter(pet => pet.pet_id !== petId));
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to delete pet');
    }
  };

  const handleEdit = (pet: Pet) => {
    // This would typically navigate to an edit page or open an edit modal
    // For now, we'll just show an alert
    alert(`Edit functionality for ${pet.pet_code} - ${pet.name} would be implemented here`);
  };

  const getFilteredBreeds = () => {
    if (!searchFilters.pet_category) return breeds;
    return breeds.filter(breed => breed.category_id === parseInt(searchFilters.pet_category));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pet Search</h2>
          <p className="text-gray-600">Search pets using multiple criteria and filters</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Criteria</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pet Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Pet Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Code</label>
              <input
                type="text"
                placeholder="e.g., CV0001"
                value={searchFilters.pet_code}
                onChange={(e) => setSearchFilters({...searchFilters, pet_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name</label>
              <input
                type="text"
                placeholder="Pet name"
                value={searchFilters.pet_name}
                onChange={(e) => setSearchFilters({...searchFilters, pet_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={searchFilters.pet_category}
                onChange={(e) => setSearchFilters({...searchFilters, pet_category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <select
                value={searchFilters.breed}
                onChange={(e) => setSearchFilters({...searchFilters, breed: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                disabled={!searchFilters.pet_category}
              >
                <option value="">Select Breed</option>
                {getFilteredBreeds().map(breed => (
                  <option key={breed.id} value={breed.id}>
                    {breed.breed_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Owner Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <input
                type="text"
                placeholder="Owner name"
                value={searchFilters.owner_name}
                onChange={(e) => setSearchFilters({...searchFilters, owner_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="Phone number"
                value={searchFilters.owner_phone}
                onChange={(e) => setSearchFilters({...searchFilters, owner_phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Email address"
                value={searchFilters.owner_email}
                onChange={(e) => setSearchFilters({...searchFilters, owner_email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number</label>
              <input
                type="text"
                placeholder="NIC number"
                value={searchFilters.owner_nic}
                onChange={(e) => setSearchFilters({...searchFilters, owner_nic: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Search Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search Pets'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {pets.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({pets.length} found)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pet Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category & Breed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pets.map((pet) => (
                  <tr key={pet.pet_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pet.pet_code} - {pet.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pet.gender} • {pet.age_months} months • {pet.weight}kg
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {pet.pet_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pet.owner_name}</div>
                        <div className="text-sm text-gray-500">{pet.owner_phone}</div>
                        <div className="text-sm text-gray-500">{pet.owner_email}</div>
                        <div className="text-xs text-gray-400">NIC: {pet.owner_nic}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{pet.category_name}</div>
                        <div className="text-sm text-gray-500">{pet.breed_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {pets.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or clear all filters to start over.
          </p>
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
                        : 'bg-pink-100 text-pink-800'
                    }`}>
                      {viewingPet.gender}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.age_months} months</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.weight} kg</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.color}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingPet.owner_nic}</p>
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
