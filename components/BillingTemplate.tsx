'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';

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
  owner_id?: number;
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
  base_price: number | string;
}

interface VaccinationType {
  id: number;
  name: string;
  vaccine_name: string;
   price?: number | string | null;
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
  vaccine_id: string;
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
  name: string;
  abbreviation: string;
}

interface DurationType {
  id: number;
  name: string;
}

interface DurationWeek {
  id: number;
  name: string;
}

interface BillingTemplateProps {
  mode?: 'create' | 'edit';
  billId?: string;
  onSuccessRedirect?: string;
}

const QUICK_TREATMENT_OFFSETS = [
  { label: '1W', days: 7, description: '1 Week' },
  { label: '2W', days: 14, description: '2 Weeks' },
  { label: '3W', days: 21, description: '3 Weeks' },
  { label: '4W', days: 28, description: '4 Weeks' },
  { label: '1Y', days: 365, description: '1 Year' }
];

export default function BillingTemplate(props: BillingTemplateProps = {}) {
  const { mode = 'create', billId, onSuccessRedirect } = props;
  const isEditMode = mode === 'edit';
  const router = useRouter();
  const { currencySymbol } = useCurrency();
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
  const [durationWeeks, setDurationWeeks] = useState<DurationWeek[]>([]);
  
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
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  
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
    { id: '1', vaccine_id: '', vaccine_name: '', next_vaccination_date: '', duration_slots: '' }
  ]);

  // Service items
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    { id: '1', service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }
  ]);

  // Billing calculations
  const [netTotal, setNetTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInputValue, setDiscountInputValue] = useState('0');
  const [grandTotal, setGrandTotal] = useState(0);
  const [isEditPrefillLoading, setIsEditPrefillLoading] = useState(isEditMode);
  const [hasLoadedEditData, setHasLoadedEditData] = useState(false);
  const [currentBillNumber, setCurrentBillNumber] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [serviceItems, discountAmount]);

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
      const [petsRes, vetsRes, drugsRes, servicesRes, vaccinationsRes, categoriesRes, breedsRes, dosesRes, dosageTypesRes, durationTypesRes, durationWeeksRes] = await Promise.all([
        fetch('/api/pets'),
        fetch('/api/veterinarians'),
        fetch('/api/drugs'),
        fetch('/api/services'),
        fetch('/api/vaccination-types'),
        fetch('/api/pet-categories'),
        fetch('/api/pet-breeds'),
        fetch('/api/doses'),
        fetch('/api/dosage-types'),
        fetch('/api/duration-types'),
        fetch('/api/duration-weeks')
      ]);

      const [petsData, vetsData, drugsData, servicesData, vaccinationsData, categoriesData, breedsData, dosesData, dosageTypesData, durationTypesData, durationWeeksData] = await Promise.all([
        petsRes.json(),
        vetsRes.json(),
        drugsRes.json(),
        servicesRes.json(),
        vaccinationsRes.json(),
        categoriesRes.json(),
        breedsRes.json(),
        dosesRes.json(),
        dosageTypesRes.json(),
        durationTypesRes.json(),
        durationWeeksRes.json()
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
      if (durationWeeksData.success) setDurationWeeks(durationWeeksData.data);
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
    const effectiveDiscount = Number.isFinite(discountAmount) ? Math.max(discountAmount, 0) : 0;
    setGrandTotal(Math.max(total - effectiveDiscount, 0));
  };

  const normalizeDateForInput = (value?: string | null) => {
    if (!value) return '';
    return value.split('T')[0];
  };

  const populatePetDetails = useCallback((pet: Pet | null) => {
    setSelectedPet(pet);

    if (pet) {
      setSelectedOwnerId(pet.owner_id ?? null);
      const category = categories.find(c => c.category_name === pet.category_name);
      const formattedDate = pet.date_of_birth ? normalizeDateForInput(pet.date_of_birth) : '';

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

      if (category) {
        const filtered = breeds.filter(b => b.category_id === category.id);
        setFilteredBreeds(filtered);
      } else {
        setFilteredBreeds(breeds);
      }

      setOwnerInfo({
        owner_name: pet.owner_name || '',
        owner_phone: pet.owner_phone || '',
        owner_address: pet.owner_address || '',
        owner_nic: pet.owner_nic || '',
        owner_email: pet.owner_email || ''
      });
    } else {
      setSelectedOwnerId(null);
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
      
      setFilteredBreeds(breeds);
    }
  }, [breeds, categories]);

  const handleDiscountInputChange = (value: string) => {
    setDiscountInputValue(value);

    if (value === '' || value === '.') {
      setDiscountAmount(0);
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      return;
    }

    setDiscountAmount(Math.max(parsedValue, 0));
  };

  const handlePetChange = (petId: string) => {
    const pet = pets.find(p => p.pet_id.toString() === petId);
    populatePetDetails(pet || null);
  };

  useEffect(() => {
    if (!isEditMode) {
      if (isEditPrefillLoading) {
        setIsEditPrefillLoading(false);
      }
      return;
    }

    if (!billId) {
      setIsEditPrefillLoading(false);
      return;
    }

    if (isDataLoading || hasLoadedEditData) {
      return;
    }

    let isCancelled = false;

    const loadBillForEdit = async () => {
      setIsEditPrefillLoading(true);
      try {
        const response = await fetch(`/api/bills/${billId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bill details');
        }
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Bill data unavailable');
        }

        if (isCancelled) return;

        const billData = result.data;
        setCurrentBillNumber(billData.bill_number || '');

        const pet = pets.find(p => p.pet_id === billData.pet_id);
        populatePetDetails(pet || null);

        setSelectedOwnerId(billData.owner_id || null);
        setOwnerInfo(prev => ({
          ...prev,
          owner_name: billData.owner_name || prev.owner_name || '',
          owner_phone: billData.owner_phone || prev.owner_phone || '',
          owner_address: billData.owner_address || prev.owner_address || '',
          owner_nic: billData.owner_nic || prev.owner_nic || '',
          owner_email: billData.owner_email || prev.owner_email || ''
        }));

        setSelectedVeterinarian(billData.veterinarian_id?.toString() || '');
        setBillingDate(normalizeDateForInput(billData.billing_date) || new Date().toISOString().split('T')[0]);
        setNextTreatmentDate(normalizeDateForInput(billData.next_treatment_date) || new Date().toISOString().split('T')[0]);
        setHistoryComplaint(billData.history_complaint || '');
        setClinicalObservation(billData.clinical_observation || '');
        setTreatmentRemarks(billData.treatment_remarks || '');

        setServiceItems(
          (billData.services && billData.services.length
            ? billData.services
            : [{ service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }]
          ).map((service: any, index: number) => ({
            id: (index + 1).toString(),
            service_name: service.service_name || '',
            quantity: Number(service.quantity) || 1,
            unit_price: Number(service.unit_price) || 0,
            discount_percentage: Number(service.discount_percentage) || 0,
            total_amount: Number(service.total_amount) || 0
          }))
        );

        setPrescriptions(
          (billData.prescriptions && billData.prescriptions.length
            ? billData.prescriptions
            : [{ drug_name: '', dose: '', dosage: '', duration: '' }]
          ).map((prescription: any, index: number) => ({
            id: (index + 1).toString(),
            drug_name: prescription.drug_name || '',
            dose: prescription.dose || '',
            dosage: prescription.dosage?.toString() || '',
            duration: prescription.duration?.toString() || ''
          }))
        );

        setVaccinations(
          (billData.vaccinations && billData.vaccinations.length
            ? billData.vaccinations
            : [{ vaccine_name: '', next_vaccination_date: '', duration_slots: '', vaccine_id: '' }]
          ).map((vaccination: any, index: number) => ({
            id: (index + 1).toString(),
            vaccine_id:
              vaccination.vaccine_id?.toString() ||
              vaccinationTypes.find(vt => vt.vaccine_name === vaccination.vaccine_name)?.id?.toString() ||
              '',
            vaccine_name: vaccination.vaccine_name || '',
            next_vaccination_date: vaccination.next_vaccination_date ? normalizeDateForInput(vaccination.next_vaccination_date) : '',
            duration_slots: vaccination.duration_slots || ''
          }))
        );

        const discountValue = Number(billData.discount_amount) || 0;
        setDiscountAmount(discountValue);
        setDiscountInputValue(discountValue.toString());
        setNetTotal(Number(billData.net_total) || 0);
        setGrandTotal(Number(billData.grand_total) || 0);

        setHasLoadedEditData(true);
      } catch (err) {
        console.error('Failed to load bill for editing:', err);
        if (!isCancelled) {
          setError('Failed to load bill details for editing');
        }
      } finally {
        if (!isCancelled) {
          setIsEditPrefillLoading(false);
        }
      }
    };

    loadBillForEdit();

    return () => {
      isCancelled = true;
    };
  }, [isEditMode, billId, isDataLoading, hasLoadedEditData, pets, populatePetDetails, vaccinationTypes]);

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
    setVaccinations([...vaccinations, { id: newId, vaccine_id: '', vaccine_name: '', next_vaccination_date: '', duration_slots: '' }]);
  };

  const removeVaccination = (id: string) => {
    setServiceItems(prev => {
      const filtered = prev.filter(item => item.id !== `vaccination-${id}`);
      if (filtered.length === 0) {
        return [{ id: '1', service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }];
      }
      return filtered;
    });
    if (vaccinations.length > 1) {
      setVaccinations(vaccinations.filter(v => v.id !== id));
    }
  };

  const updateVaccination = (id: string, field: keyof VaccinationItem, value: string) => {
    let selectedVaccine: VaccinationType | undefined;

    setVaccinations(prev =>
      prev.map(v => {
        if (v.id !== id) return v;
        const updated = { ...v, [field]: value };
        if (field === 'vaccine_id') {
          selectedVaccine = vaccinationTypes.find(vt => vt.id.toString() === value);
          updated.vaccine_name = selectedVaccine?.vaccine_name || '';
        } else if (field === 'vaccine_name') {
          selectedVaccine = vaccinationTypes.find(vt => vt.vaccine_name === value);
          updated.vaccine_id = selectedVaccine?.id?.toString() || updated.vaccine_id || '';
        }
        return updated;
      })
    );

    if (field === 'vaccine_id' || field === 'vaccine_name') {
      const serviceId = `vaccination-${id}`;
      const vaccine =
        selectedVaccine ||
        vaccinationTypes.find(vt =>
          field === 'vaccine_id' ? vt.id.toString() === value : vt.vaccine_name === value
        );

      if (!value) {
        setServiceItems(prev => prev.filter(item => item.id !== serviceId));
        return;
      }

      const unitPrice = vaccine && vaccine.price !== undefined && vaccine.price !== null && !Number.isNaN(Number(vaccine.price))
        ? Number(vaccine.price)
        : 0;
      const updatedItem: ServiceItem = {
        id: serviceId,
        service_name: 'Vaccination',
        quantity: 1,
        unit_price: unitPrice,
        discount_percentage: 0,
        total_amount: unitPrice
      };

      setServiceItems(prev => {
        const existingIndex = prev.findIndex(item => item.id === serviceId);
        if (existingIndex >= 0) {
          return prev.map((item, idx) => (idx === existingIndex ? updatedItem : item));
        }
        const emptyIndex = prev.findIndex(item => !item.service_name);
        if (emptyIndex >= 0) {
          const updated = [...prev];
          updated[emptyIndex] = updatedItem;
          return updated;
        }
        return [...prev, updatedItem];
      });
    }
  };

  const addService = () => {
    const newId = (serviceItems.length + 1).toString();
    setServiceItems([...serviceItems, { id: newId, service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }]);
  };

  const removeService = (id: string) => {
    setServiceItems(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        return [{ id: '1', service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }];
      }
      return filtered;
    });

    if (id.startsWith('vaccination-')) {
      const vaccinationId = id.replace('vaccination-', '');
      setVaccinations(prev =>
        prev.map(v =>
          v.id === vaccinationId ? { ...v, vaccine_id: '', vaccine_name: '' } : v
        )
      );
    }
  };

  const handleServiceNameChange = (id: string, serviceName: string) => {
    const service = services.find(s => s.service_name === serviceName);
    const unitPrice = service ? Number(service.base_price) || 0 : 0;
    
    setServiceItems(serviceItems.map(item => {
      if (item.id !== id) return item;
      
      const itemTotal = item.quantity * unitPrice;
      const discount = (itemTotal * item.discount_percentage) / 100;
      
      return {
        ...item,
        service_name: serviceName,
        unit_price: unitPrice,
        total_amount: itemTotal - discount
      };
    }));
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

  const handleQuickTreatmentDate = (daysFromToday: number) => {
    const calculatedDate = new Date();
    calculatedDate.setDate(calculatedDate.getDate() + daysFromToday);
    setNextTreatmentDate(calculatedDate.toISOString().split('T')[0]);
  };

  const openBillPrint = (id?: string | number | null) => {
    if (!id) {
      setError('Bill ID not available for printing. Please save the bill first.');
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(`/billing/print/${id}`, '_blank');
    }
  };

  const openPrescriptionPrint = (id?: string | number | null) => {
    if (!id) {
      setError('Bill ID not available for prescription print. Please save the bill first.');
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(`/billing/prescription/${id}`, '_blank');
    }
  };

  const handleCancel = () => {
    const target = onSuccessRedirect || '/dashboard?tab=list-bills';
    router.push(target);
  };

  const handleSave = async (postSaveAction?: 'print' | 'prescription') => {
    if (!selectedPet) {
      setError('Please select a pet');
      return;
    }

    if (!selectedVeterinarian) {
      setError('Please select a veterinarian');
      return;
    }

    if (!selectedPet?.pet_id) {
      setError('Selected pet is invalid');
      return;
    }

    const ownerIdForBill = selectedOwnerId ?? selectedPet?.owner_id ?? null;
    if (!ownerIdForBill) {
      setError('Owner information is missing for this pet');
      return;
    }

    if (isEditMode && !billId) {
      setError('Bill identifier missing. Please reload and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const billNumberValue = isEditMode
        ? currentBillNumber || ''
        : `BILL-${Date.now()}`;

      if (!billNumberValue) {
        throw new Error('Unable to determine bill number');
      }

      const endpoint = isEditMode && billId ? `/api/bills/${billId}` : '/api/bills';
      const method = isEditMode && billId ? 'PUT' : 'POST';
      
      const billData = {
        bill_number: billNumberValue,
        pet_id: selectedPet?.pet_id,
        veterinarian_id: selectedVeterinarian,
        owner_id: ownerIdForBill,
        billing_date: billingDate,
        next_treatment_date: nextTreatmentDate,
        history_complaint: historyComplaint,
        clinical_observation: clinicalObservation,
        treatment_remarks: treatmentRemarks,
        net_total: netTotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        prescriptions: prescriptions.filter(p => p.drug_name),
        vaccinations: vaccinations
          .filter(v => v.vaccine_id || v.vaccine_name)
          .map(v => ({
            vaccine_id: v.vaccine_id ? Number(v.vaccine_id) || null : null,
            vaccine_name: v.vaccine_name,
            next_vaccination_date: v.next_vaccination_date,
            duration_slots: v.duration_slots
          })),
        services: serviceItems.filter(s => s.service_name),
        // Include updated pet and owner information
        pet_info: petInfo,
        owner_info: ownerInfo
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(isEditMode ? 'Bill updated successfully!' : 'Bill created successfully!');
        const savedBillId = billId || result?.data?.bill_id || null;

        if (postSaveAction === 'print') {
          openBillPrint(savedBillId);
        } else if (postSaveAction === 'prescription') {
          openPrescriptionPrint(savedBillId);
        }

        if (isEditMode) {
          if (onSuccessRedirect) {
            router.push(onSuccessRedirect);
          }
        } else {
          // Reset form
          setSelectedPet(null);
          setSelectedOwnerId(null);
          setCurrentBillNumber('');
          setSelectedVeterinarian('');
          setHistoryComplaint('');
          setClinicalObservation('');
          setTreatmentRemarks('');
          setPrescriptions([{ id: '1', drug_name: '', dose: '', dosage: '', duration: '' }]);
          setVaccinations([{ id: '1', vaccine_id: '', vaccine_name: '', next_vaccination_date: '', duration_slots: '' }]);
          setServiceItems([{ id: '1', service_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, total_amount: 0 }]);
          setDiscountAmount(0);
          setDiscountInputValue('0');
          setNetTotal(0);
          setGrandTotal(0);
          setBillingDate(new Date().toISOString().split('T')[0]);
          setNextTreatmentDate(new Date().toISOString().split('T')[0]);
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
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to save bill');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditMode && isEditPrefillLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg font-semibold text-gray-700">Loading bill details...</div>
          <p className="text-gray-500 mt-2">Please wait while we prepare the form.</p>
        </div>
      </div>
    );
  }

  const headerTitle = isEditMode ? 'Edit Bill' : 'New Bill';
  const headerSubtitle = isEditMode
    ? 'Update the billing record with the latest treatment details'
    : 'Create a new billing record for pet treatment';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{headerTitle}</h1>
          <p className="mt-2 text-gray-600">{headerSubtitle}</p>
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
                        <option key={dosageType.id} value={dosageType.id} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                          {dosageType.name} ( {dosageType.abbreviation})
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
                          <option key={durationType.id} value={durationType.id} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                            {durationType.name}
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
                      value={vaccination.vaccine_id}
                      onChange={(e) => updateVaccination(vaccination.id, 'vaccine_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      style={{ color: '#1f2937', backgroundColor: 'white' }}
                    >
                      <option value="" style={{ color: '#1f2937', backgroundColor: 'white' }}>Select Vaccine</option>
                      {vaccinationTypes.map(vaccine => (
                        <option key={vaccine.id} value={vaccine.id} style={{ color: '#1f2937', backgroundColor: 'white' }}>
                          {vaccine.vaccine_name}
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
                      <select
                        value={vaccination.duration_slots}
                        onChange={(e) => updateVaccination(vaccination.id, 'duration_slots', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                        disabled={durationWeeks.length === 0}
                      >
                        <option value="">
                          {durationWeeks.length === 0 ? 'No duration options available' : 'Select duration'}
                        </option>
                        {durationWeeks.map((duration) => (
                          <option key={duration.id} value={duration.name}>
                            {duration.name}
                          </option>
                        ))}
                      </select>
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

          {/* Next Treatment & Billing Dates */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Next Treatment & Billing Dates</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Treatment Date</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TREATMENT_OFFSETS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleQuickTreatmentDate(option.days)}
                        className="px-3 py-1 text-sm border border-green-500 text-green-700 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                        title={option.description}
                        aria-label={`Set next treatment date to ${option.description}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-[200px]">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Date</label>
                <div className="relative w-full">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ({currencySymbol})</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      value={service.total_amount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-end">
                    {(serviceItems.length > 1 || service.id.startsWith('vaccination-')) && (
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

          {/* Billing Information */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">Billing Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Total ({currencySymbol})</label>
                  <input
                    type="number"
                    value={netTotal}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountInputValue}
                    onChange={(e) => handleDiscountInputChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total ({currencySymbol})</label>
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
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('print')}
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V4h12v5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 14h12v6H6z" />
              </svg>
              {isLoading ? 'Working...' : 'Save & Print Bill'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('prescription')}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-6 4h6m-6 4h3" />
              </svg>
              {isLoading ? 'Working...' : 'Save & Print Prescription'}
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {isLoading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Bill' : 'Save Bill')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
