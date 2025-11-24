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
  category_name: string;
  breed_name: string;
  owner_name: string;
  owner_phone: string;
  owner_address: string;
  owner_nic: string;
  owner_email: string;
}

interface Veterinarian {
  vet_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
}

interface Drug {
  id: number;
  drug_name: string;
}

interface Service {
  id: number;
  service_name: string;
  price: number;
}

interface VaccinationType {
  id: number;
  name: string;
}

interface PrescriptionItem {
  id: string;
  drug_name: string;
  dose: string;
  dosage: string;
  duration: string;
}

interface VaccinationItem {
  id: string;
  vaccine_name: string;
  next_vaccination_date: string;
  duration_slots: string;
}

interface ServiceItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_amount: number;
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

interface Dose {
  id: number;
  name: string;
}

interface DosageType {
  id: number;
  dosage_type_name: string;
}

interface DurationType {
  id: number;
  duration_type_name: string;
}

export default function BillingTemplate() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vaccinationTypes, setVaccinationTypes] = useState<VaccinationType[]>([]);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [breeds, setBreeds] = useState<PetBreed[]>([]);
  const [filteredBreeds, setFilteredBreeds] = useState<PetBreed[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [dosageTypes, setDosageTypes] = useState<DosageType[]>([]);
  const [durationTypes, setDurationTypes] = useState<DurationType[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Form data
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedVeterinarian, setSelectedVeterinarian] = useState<string>('');
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextTreatmentDate, setNextTreatmentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Editable pet and owner information
  const [petInfo, setPetInfo] = useState({
    name: '',
    date_of_birth: '',
    age_months: '',
    category_id: '',
    category_name: '',
    breed_name: '',
    gender: '',
    weight: '',
    color: '',
    remarks: ''
  });
  
  const [ownerInfo, setOwnerInfo] = useState({
    owner_name: '',
    owner_phone: '',
    owner_address: '',
    owner_nic: '',
    owner_email: ''
  });
  
  // Treatment information
  const [historyComplaint, setHistoryComplaint] = useState('');
  const [clinicalObservation, setClinicalObservation] = useState('');
  const [treatmentRemarks, setTreatmentRemarks] = useState('');

  // Prescription items
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    { id: '1', drug_name: '', dose: '', dosage: '', duration: '' }
  ]);

  // Vaccination items
  const [vaccinations, setVaccinations] = useState<VaccinationItem[]>([
    { id: '1', vaccine_name: '', next_vaccination_date: '', duration_slots: '' }
  ]);

  // Service items
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    { id: '1', service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }
  ]);

  // Billing calculations
  const [netTotal, setNetTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [serviceItems]);

  useEffect(() => {
    console.log('petInfo updated:', petInfo);
  }, [petInfo]);

  useEffect(() => {
    console.log('Pets state updated:', pets);
  }, [pets]);

  const fetchData = async () => {
    try {
      setIsDataLoading(true);
      console.log('Fetching data...');
      const [petsRes, vetsRes, drugsRes, servicesRes, vaccinationsRes, categoriesRes, breedsRes, dosesRes, dosageTypesRes, durationTypesRes] = await Promise.all([
        fetch('/api/pets'),
        fetch('/api/veterinarians'),
        fetch('/api/drugs'),
        fetch('/api/services'),
        fetch('/api/vaccination-types'),
        fetch('/api/pet-categories'),
        fetch('/api/pet-breeds'),
        fetch('/api/doses'),
        fetch('/api/dosage-types'),
        fetch('/api/duration-types')
      ]);

      const [petsData, vetsData, drugsData, servicesData, vaccinationsData, categoriesData, breedsData, dosesData, dosageTypesData, durationTypesData] = await Promise.all([
        petsRes.json(),
        vetsRes.json(),
        drugsRes.json(),
        servicesRes.json(),
        vaccinationsRes.json(),
        categoriesRes.json(),
        breedsRes.json(),
        dosesRes.json(),
        dosageTypesRes.json(),
        durationTypesRes.json()
      ]);

      console.log('Pets response:', petsData);
      console.log('Pets data:', petsData.data);

      if (petsData.success) {
        setPets(petsData.data);
        console.log('Pets set successfully:', petsData.data);
      } else {
        console.error('Pets fetch failed:', petsData);
      }
      
      if (vetsData.success) setVeterinarians(vetsData.data);
      if (drugsData.success) setDrugs(drugsData.data);
      if (servicesData.success) setServices(servicesData.data);
      if (vaccinationsData.success) setVaccinationTypes(vaccinationsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (breedsData.success) {
        setBreeds(breedsData.data);
        setFilteredBreeds(breedsData.data);
      }
      if (dosesData.success) setDoses(dosesData.data);
      if (dosageTypesData.success) setDosageTypes(dosageTypesData.data);
      if (durationTypesData.success) setDurationTypes(durationTypesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setIsDataLoading(false);
    }
  };

  const calculateTotals = () => {
    const total = serviceItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const discount = (itemTotal * item.discount_percentage) / 100;
      return sum + (itemTotal - discount);
    }, 0);
    
    setNetTotal(total);
    setDiscountAmount(serviceItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      return sum + (itemTotal * item.discount_percentage) / 100;
    }, 0));
    setGrandTotal(total);
  };

  const handlePetChange = (petId: string) => {
    const pet = pets.find(p => p.pet_id.toString() === petId);
    setSelectedPet(pet || null);
    
    if (pet) {
      console.log('Selected pet:', pet);
      console.log('Pet date_of_birth:', pet.date_of_birth);
      
      // Find the category ID for the pet's category
      const category = categories.find(c => c.category_name === pet.category_name);
      
      // Format date for HTML date input (YYYY-MM-DD)
      const formattedDate = pet.date_of_birth ? new Date(pet.date_of_birth).toISOString().split('T')[0] : '';
      console.log('Formatted date:', formattedDate);
      
      // Populate pet information for editing
      setPetInfo({
        name: pet.name || '',
        date_of_birth: formattedDate,
        age_months: pet.age_months?.toString() || '',
        category_id: category?.id?.toString() || '',
        category_name: pet.category_name || '',
        breed_name: pet.breed_name || '',
        gender: pet.gender || '',
        weight: pet.weight?.toString() || '',
        color: pet.color || '',
        remarks: pet.remarks || ''
      });
      
      // Filter breeds based on pet's category
      if (category) {
        const filtered = breeds.filter(b => b.category_id === category.id);
        setFilteredBreeds(filtered);
      } else {
        setFilteredBreeds(breeds);
      }
      
      // Populate owner information for editing
      setOwnerInfo({
        owner_name: pet.owner_name || '',
        owner_phone: pet.owner_phone || '',
        owner_address: pet.owner_address || '',
        owner_nic: pet.owner_nic || '',
        owner_email: pet.owner_email || ''
      });
    } else {
      // Clear fields if no pet selected
      setPetInfo({
        name: '',
        date_of_birth: '',
        age_months: '',
        category_id: '',
        category_name: '',
        breed_name: '',
        gender: '',
        weight: '',
        color: '',
        remarks: ''
      });
      
      setOwnerInfo({
        owner_name: '',
        owner_phone: '',
        owner_address: '',
        owner_nic: '',
        owner_email: ''
      });
      
      // Reset breeds filter
      setFilteredBreeds(breeds);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id.toString() === categoryId);
    setPetInfo({
      ...petInfo, 
      category_id: categoryId,
      category_name: category?.category_name || '', 
      breed_name: ''
    });
    
    // Filter breeds based on selected category
    if (categoryId) {
      const filtered = breeds.filter(b => b.category_id.toString() === categoryId);
      setFilteredBreeds(filtered);
    } else {
      setFilteredBreeds(breeds);
    }
  };

  const addPrescription = () => {
    const newId = (prescriptions.length + 1).toString();
    setPrescriptions([...prescriptions, { id: newId, drug_name: '', dose: '', dosage: '', duration: '' }]);
  };

  const removePrescription = (id: string) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter(p => p.id !== id));
    }
  };

  const updatePrescription = (id: string, field: keyof PrescriptionItem, value: string) => {
    setPrescriptions(prescriptions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addVaccination = () => {
    const newId = (vaccinations.length + 1).toString();
    setVaccinations([...vaccinations, { id: newId, vaccine_name: '', next_vaccination_date: '', duration_slots: '' }]);
  };

  const removeVaccination = (id: string) => {
    if (vaccinations.length > 1) {
      setVaccinations(vaccinations.filter(v => v.id !== id));
    }
  };

  const updateVaccination = (id: string, field: keyof VaccinationItem, value: string) => {
    setVaccinations(vaccinations.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const addService = () => {
    const newId = (serviceItems.length + 1).toString();
    setServiceItems([...serviceItems, { id: newId, service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }]);
  };

  const removeService = (id: string) => {
    if (serviceItems.length > 1) {
      setServiceItems(serviceItems.filter(s => s.id !== id));
    }
  };

  const handleServiceNameChange = (id: string, serviceName: string) => {
    const service = services.find(s => s.service_name === serviceName);
    setServiceItems(serviceItems.map(item => 
      item.id === id 
        ? { ...item, service_name: serviceName, unit_price: service?.price || 0, total_amount: (service?.price || 0) * item.quantity }
        : item
    ));
  };

  const updateServiceItem = (id: string, field: keyof ServiceItem, value: number) => {
    setServiceItems(serviceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
          const itemTotal = updatedItem.quantity * updatedItem.unit_price;
          const discount = (itemTotal * updatedItem.discount_percentage) / 100;
          updatedItem.total_amount = itemTotal - discount;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!selectedPet) {
      setError('Please select a pet');
      return;
    }

    if (!selectedVeterinarian) {
      setError('Please select a veterinarian');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Generate bill number
      const billNumber = `BILL-${Date.now()}`;
      
      const billData = {
        bill_number: billNumber,
        pet_id: selectedPet?.pet_id,
        veterinarian_id: selectedVeterinarian,
        owner_id: selectedPet?.owner_id,
        billing_date: billingDate,
        next_treatment_date: nextTreatmentDate,
        history_complaint: historyComplaint,
        clinical_observation: clinicalObservation,
        treatment_remarks: treatmentRemarks,
        net_total: netTotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        prescriptions: prescriptions.filter(p => p.drug_name),
        vaccinations: vaccinations.filter(v => v.vaccine_name),
        services: serviceItems.filter(s => s.service_name),
        // Include updated pet and owner information
        pet_info: petInfo,
        owner_info: ownerInfo
      };

      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Bill created successfully!');
        // Reset form
        setSelectedPet(null);
        setSelectedVeterinarian('');
        setHistoryComplaint('');
        setClinicalObservation('');
        setTreatmentRemarks('');
        setPrescriptions([{ id: '1', drug_name: '', dose: '', dosage: '', duration: '' }]);
        setVaccinations([{ id: '1', vaccine_name: '', next_vaccination_date: '', duration_slots: '' }]);
        setServiceItems([{ id: '1', service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }]);
        // Reset pet and owner info
        setPetInfo({
          name: '',
          date_of_birth: '',
          age_months: '',
          category_id: '',
          category_name: '',
          breed_name: '',
          gender: '',
          weight: '',
          color: '',
          remarks: ''
        });
        setOwnerInfo({
          owner_name: '',
          owner_phone: '',
          owner_address: '',
          owner_nic: '',
          owner_email: ''
        });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to save bill');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Bill</h1>
          <p className="mt-2 text-gray-600">Create a new billing record for pet treatment</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Pet and Doctor Selection */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Pet & Doctor Selection</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet *</label>
                <select
                  value={selectedPet?.pet_id || ''}
                  onChange={(e) => handlePetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  style={{ color: '#1f2937' }}
                  disabled={isDataLoading}
                >
                  <option value="" style={{ color: '#1f2937' }}>
                    {isDataLoading ? 'Loading pets...' : 'Select Pet'}
                  </option>
                  {pets.length > 0 ? (
                    pets.map(pet => (
                      <option key={pet.pet_id} value={pet.pet_id} style={{ color: '#1f2937' }}>
                        {pet.pet_code} - {pet.name}
                      </option>
                    ))
                  ) : !isDataLoading ? (
                    <option value="" style={{ color: '#1f2937' }}>No pets available</option>
                  ) : null}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  value={selectedVeterinarian}
                  onChange={(e) => setSelectedVeterinarian(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  style={{ color: '#1f2937' }}
                >
                  <option value="" style={{ color: '#1f2937' }}>Select Doctor</option>
                  {veterinarians.map(vet => (
                    <option key={vet.vet_id} value={vet.vet_id} style={{ color: '#1f2937' }}>
                      Dr. {vet.first_name} {vet.last_name} - {vet.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet ID</label>
                <input
                  type="text"
                  value={selectedPet?.pet_code || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Pet Information Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Pet Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={petInfo.name}
                  onChange={(e) => setPetInfo({...petInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter pet name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={petInfo.date_of_birth}
                    onChange={(e) => setPetInfo({...petInfo, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 pr-10"
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (Months)</label>
                <input
                  type="number"
                  value={petInfo.age_months}
                  onChange={(e) => setPetInfo({...petInfo, age_months: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter age in months"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type/Category</label>
                <select
                  value={petInfo.category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  style={{ color: '#1f2937' }}
                >
                  <option value="" style={{ color: '#1f2937' }}>Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} style={{ color: '#1f2937' }}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <select
                  value={petInfo.breed_name}
                  onChange={(e) => setPetInfo({...petInfo, breed_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  style={{ color: '#1f2937' }}
                  disabled={!petInfo.category_id}
                >
                  <option value="" style={{ color: '#1f2937' }}>Select Breed</option>
                  {filteredBreeds.map((breed) => (
                    <option key={breed.id} value={breed.breed_name} style={{ color: '#1f2937' }}>
                      {breed.breed_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={petInfo.gender}
                  onChange={(e) => setPetInfo({...petInfo, gender: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  style={{ color: '#1f2937' }}
                >
                  <option value="" style={{ color: '#1f2937' }}>Select Gender</option>
                  <option value="male" style={{ color: '#1f2937' }}>Male</option>
                  <option value="female" style={{ color: '#1f2937' }}>Female</option>
                  <option value="other" style={{ color: '#1f2937' }}>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={petInfo.weight}
                  onChange={(e) => setPetInfo({...petInfo, weight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter weight in kg"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
                <input
                  type="text"
                  value={petInfo.color}
                  onChange={(e) => setPetInfo({...petInfo, color: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter color"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={petInfo.remarks}
                  onChange={(e) => setPetInfo({...petInfo, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter remarks"
                />
              </div>
            </div>
          </div>

          {/* Owner Information Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Owner Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={ownerInfo.owner_name}
                  onChange={(e) => setOwnerInfo({...ownerInfo, owner_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter owner name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={ownerInfo.owner_phone}
                  onChange={(e) => setOwnerInfo({...ownerInfo, owner_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number</label>
                <input
                  type="text"
                  value={ownerInfo.owner_nic}
                  onChange={(e) => setOwnerInfo({...ownerInfo, owner_nic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter NIC number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={ownerInfo.owner_email}
                  onChange={(e) => setOwnerInfo({...ownerInfo, owner_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter email address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={ownerInfo.owner_address}
                  onChange={(e) => setOwnerInfo({...ownerInfo, owner_address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter address"
                />
              </div>
            </div>
          </div>

          {/* Treatment Information Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Treatment Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">History & Complaint</label>
                <textarea
                  value={historyComplaint}
                  onChange={(e) => setHistoryComplaint(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter history and complaint details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Observation</label>
                <textarea
                  value={clinicalObservation}
                  onChange={(e) => setClinicalObservation(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter clinical observation details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Remarks</label>
                <textarea
                  value={treatmentRemarks}
                  onChange={(e) => setTreatmentRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Enter treatment remarks"
                />
              </div>
            </div>
          </div>

          {/* Prescription Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Prescription</h2>
              <button
                type="button"
                onClick={addPrescription}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                + Add Prescription
              </button>
            </div>
            <div className="p-6">
              {prescriptions.map((prescription, index) => (
                <div key={prescription.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                    <select
                      value={prescription.drug_name}
                      onChange={(e) => updatePrescription(prescription.id, 'drug_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      style={{ color: '#1f2937', backgroundColor: 'white' }}
                    >
                      <option value="" style={{ color: '#1f2937', backgroundColor: 'white' }}>Select Drug</option>
                      {drugs.map(drug => (
                        <option key={drug.id} value={drug.drug_name} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                          {drug.drug_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dose</label>
                    <select
                      value={prescription.dose}
                      onChange={(e) => updatePrescription(prescription.id, 'dose', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      style={{ color: '#1f2937', backgroundColor: 'white' }}
                    >
                      <option value="" style={{ color: '#1f2937', backgroundColor: 'white' }}>Select Dose</option>
                      {doses.map(dose => (
                        <option key={dose.id} value={dose.name} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                          {dose.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <select
                      value={prescription.dosage}
                      onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      style={{ color: '#1f2937', backgroundColor: 'white' }}
                    >
                      <option value="" style={{ color: '#1f2937', backgroundColor: 'white' }}>Select Dosage</option>
                      {dosageTypes.map(dosageType => (
                        <option key={dosageType.id} value={dosageType.dosage_type_name} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                          {dosageType.dosage_type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <select
                        value={prescription.duration}
                        onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        style={{ color: '#1f2937', backgroundColor: 'white' }}
                      >
                        <option value="" style={{ color: '#1f2937', backgroundColor: 'white' }}>Select Duration</option>
                        {durationTypes.map(durationType => (
                          <option key={durationType.id} value={durationType.duration_type_name} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                            {durationType.duration_type_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrescription(prescription.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vaccination Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Vaccination</h2>
              <button
                type="button"
                onClick={addVaccination}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                + Add Vaccination
              </button>
            </div>
            <div className="p-6">
              {vaccinations.map((vaccination, index) => (
                <div key={vaccination.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name</label>
                    <select
                      value={vaccination.vaccine_name}
                      onChange={(e) => updateVaccination(vaccination.id, 'vaccine_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      style={{ color: '#1f2937', backgroundColor: 'white' }}
                    >
                      <option value="" style={{ color: '#1f2937', backgroundColor: 'white' }}>Select Vaccine</option>
                      {vaccinationTypes.map(vaccine => (
                        <option key={vaccine.id} value={vaccine.name} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                          {vaccine.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Vaccination Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={vaccination.next_vaccination_date}
                        onChange={(e) => updateVaccination(vaccination.id, 'next_vaccination_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 pr-10"
                      />
                      <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration Slots</label>
                      <input
                        type="text"
                        value={vaccination.duration_slots}
                        onChange={(e) => updateVaccination(vaccination.id, 'duration_slots', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        placeholder="e.g., 3 months"
                      />
                    </div>
                    {vaccinations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVaccination(vaccination.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Items Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Service Items</h2>
              <button
                type="button"
                onClick={addService}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                + Add Service
              </button>
            </div>
            <div className="p-6">
              {serviceItems.map((service, index) => (
                <div key={service.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <select
                      value={service.service_name}
                      onChange={(e) => handleServiceNameChange(service.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      style={{ color: '#1f2937' }}
                    >
                      <option value="" style={{ color: '#1f2937' }}>Select Service</option>
                      {services.map(s => (
                        <option key={s.id} value={s.service_name} style={{ color: '#1f2937' }}>
                          {s.service_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                    <input
                      type="number"
                      value={service.quantity}
                      onChange={(e) => updateServiceItem(service.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      value={service.unit_price}
                      onChange={(e) => updateServiceItem(service.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                    <input
                      type="number"
                      value={service.discount_percentage}
                      onChange={(e) => updateServiceItem(service.id, 'discount_percentage', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <input
                      type="number"
                      value={service.total_amount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-end">
                    {serviceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(service.id)}
                        className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Treatment & Billing Dates */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Next Treatment & Billing Dates</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Treatment Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={nextTreatmentDate}
                    onChange={(e) => setNextTreatmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 pr-10"
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 pr-10"
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Billing Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Total</label>
                  <input
                    type="number"
                    value={netTotal}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    value={discountAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total</label>
                  <input
                    type="number"
                    value={grandTotal}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Bill'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
