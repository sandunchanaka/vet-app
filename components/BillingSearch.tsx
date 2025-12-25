'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BillRow {
  bill_id: number;
  bill_number: string;
  billing_date: string;
  grand_total: number | string;
  status?: string;
  pet_id?: number;
  pet_name?: string;
  veterinarian_id?: number;
  vet_first_name?: string;
  vet_last_name?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  pet_category_id?: number;
  category_name?: string;
}

interface RevenueTrendPoint {
  billing_day: string;
  total_amount: number | string;
  bill_count: number | string;
}

interface RevenueByDoctorPoint {
  doctor_id: number | null;
  doctor_name: string;
  total_amount: number | string;
}

interface BillingSummary {
  totalBills: number;
  totalAmount: number;
  averagePerBill: number;
}

interface Veterinarian {
  vet_id: number;
  first_name: string;
  last_name: string;
}

interface PetOption {
  pet_id: number;
  name: string;
}

interface PetCategory {
  id: number;
  category_name: string;
}

const formatCurrency = (value?: number | string) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const getLastMonthDefaults = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const fmt = (date: Date) => date.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(now) };
};

type BillingSearchMode = 'search' | 'report';

interface BillingSearchProps {
  mode?: BillingSearchMode;
}

export default function BillingSearch({ mode = 'search' }: BillingSearchProps) {
  const router = useRouter();
  const isReport = mode === 'report';
  const defaults = useMemo(() => getLastMonthDefaults(), []);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('any');
  const [selectedPet, setSelectedPet] = useState('any');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([]);
  const [revenueByDoctor, setRevenueByDoctor] = useState<RevenueByDoctorPoint[]>([]);
  const [bills, setBills] = useState<BillRow[]>([]);
  const [doctors, setDoctors] = useState<Veterinarian[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [petCategories, setPetCategories] = useState<PetCategory[]>([]);
  const [selectedPetCategory, setSelectedPetCategory] = useState('any');
  const [billingIdFilter, setBillingIdFilter] = useState('');
  const [petIdFilter, setPetIdFilter] = useState('');
  const [petNameFilter, setPetNameFilter] = useState('');
  const [ownerNameFilter, setOwnerNameFilter] = useState('');
  const [ownerEmailFilter, setOwnerEmailFilter] = useState('');
  const [ownerPhoneFilter, setOwnerPhoneFilter] = useState('');
  const [deletingBillId, setDeletingBillId] = useState<number | null>(null);

  const loadOptions = useCallback(async () => {
    try {
      const doctorsPromise = fetch('/api/veterinarians');
      const petsPromise = isReport ? null : fetch('/api/pets');
      const categoriesPromise = fetch('/api/pet-categories');

      const [doctorsRes, petsRes, categoriesRes] = await Promise.all([
        doctorsPromise,
        petsPromise,
        categoriesPromise
      ]);

      if (doctorsRes.ok) {
        const doctorsJson = await doctorsRes.json();
        if (doctorsJson.success && Array.isArray(doctorsJson.data)) {
          setDoctors(doctorsJson.data);
        }
      }

      if (!isReport && petsRes?.ok) {
        const petsJson = await petsRes.json();
        if (petsJson.success && Array.isArray(petsJson.data)) {
          setPets(petsJson.data);
        }
      }

      if (categoriesRes?.ok) {
        const categoriesJson = await categoriesRes.json();
        if (categoriesJson.success && Array.isArray(categoriesJson.data)) {
          setPetCategories(categoriesJson.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dropdown data', err);
    }
  }, [isReport]);

  const loadReport = useCallback(
    async (
      overrides?: {
        startDate?: string;
        endDate?: string;
        doctorId?: string;
        petId?: string;
        billingId?: string;
        petIdFilter?: string;
        petName?: string;
        ownerName?: string;
        ownerEmail?: string;
        ownerPhone?: string;
        petCategoryId?: string;
      }
    ) => {
      const appliedStart = overrides?.startDate ?? startDate;
      const appliedEnd = overrides?.endDate ?? endDate;
      const appliedDoctor = overrides?.doctorId ?? selectedDoctor;
      const appliedPet = overrides?.petId ?? selectedPet;
      const appliedPetCategory = overrides?.petCategoryId ?? selectedPetCategory;
      const appliedBillingId = overrides?.billingId ?? billingIdFilter;
      const appliedPetIdFilter = overrides?.petIdFilter ?? petIdFilter;
      const appliedPetName = overrides?.petName ?? petNameFilter;
      const appliedOwnerName = overrides?.ownerName ?? ownerNameFilter;
      const appliedOwnerEmail = overrides?.ownerEmail ?? ownerEmailFilter;
      const appliedOwnerPhone = overrides?.ownerPhone ?? ownerPhoneFilter;

      setCurrentPage(1);
      setIsLoading(true);
      setError(null);
      try {
        const finalStart = appliedStart || defaults.start;
        const finalEnd = appliedEnd || defaults.end;

        const params = new URLSearchParams({
          startDate: finalStart,
          endDate: finalEnd
        });

        if (appliedDoctor !== 'any') {
          params.set('doctorId', appliedDoctor);
        }

        if (!isReport) {
          const effectivePetId = (appliedPetIdFilter || '').trim() || appliedPet;
          if (effectivePetId !== 'any' && effectivePetId) {
            params.set('petId', effectivePetId);
          }
        }

        if (isReport) {
          const effectiveCategory = (appliedPetCategory || '').trim();
          if (effectiveCategory && effectiveCategory !== 'any') {
            params.set('petCategoryId', effectiveCategory);
          }
        }

        if (!isReport && appliedBillingId.trim()) {
          params.set('billId', appliedBillingId.trim());
          params.set('billNumber', appliedBillingId.trim());
        }

        if (!isReport && appliedPetName.trim()) {
          params.set('petName', appliedPetName.trim());
        }

        if (!isReport && appliedOwnerName.trim()) {
          params.set('ownerName', appliedOwnerName.trim());
        }

        if (!isReport && appliedOwnerEmail.trim()) {
          params.set('ownerEmail', appliedOwnerEmail.trim());
        }

        if (!isReport && appliedOwnerPhone.trim()) {
          params.set('ownerPhone', appliedOwnerPhone.trim());
        }

        const response = await fetch(`/api/billing/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Unable to load billing report.');
        }
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Billing report data unavailable.');
        }

        setSummary(result.data.summary);
        setTrend(result.data.revenueTrend || []);
        setRevenueByDoctor(result.data.revenueByDoctor || []);
        setBills(result.data.bills || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch billing data.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, selectedDoctor, selectedPet, selectedPetCategory, billingIdFilter, petIdFilter, petNameFilter, ownerNameFilter, ownerEmailFilter, ownerPhoneFilter, defaults, isReport]
  );

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadReport();
    }
  }, [loadReport]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchTerm]);

  const filteredBills = useMemo(() => {
    if (!searchTerm.trim()) {
      return bills;
    }
    const term = searchTerm.toLowerCase();
    return bills.filter((bill) => {
      const doctorName = `${bill.vet_first_name || ''} ${bill.vet_last_name || ''}`.trim().toLowerCase();
      const ownerName = (bill as any).owner_name?.toLowerCase?.() || '';
      const ownerPhone = (bill as any).owner_phone?.toLowerCase?.() || '';
      const ownerEmail = (bill as any).owner_email?.toLowerCase?.() || '';
      const billIdStr = bill.bill_id?.toString() || '';
      const petIdStr = bill.pet_id?.toString() || '';
      const billingDate = bill.billing_date ? new Date(bill.billing_date).toLocaleDateString().toLowerCase() : '';
      return (
        bill.bill_number?.toLowerCase().includes(term) ||
        billIdStr.includes(term) ||
        petIdStr.includes(term) ||
        billingDate.includes(term) ||
        bill.pet_name?.toLowerCase().includes(term) ||
        doctorName.includes(term) ||
        ownerName.includes(term) ||
        ownerPhone.includes(term) ||
        ownerEmail.includes(term)
      );
    });
  }, [bills, searchTerm]);

  const currentBills = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBills.slice(startIndex, startIndex + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDoctor('any');
    setSelectedPet('any');
    setSelectedPetCategory('any');
    setBillingIdFilter('');
    setPetIdFilter('');
    setPetNameFilter('');
    setOwnerNameFilter('');
    setOwnerEmailFilter('');
    setOwnerPhoneFilter('');
    setSearchTerm('');
    setPageSize(10);
    setCurrentPage(1);
    loadReport({
      startDate: '',
      endDate: '',
      doctorId: 'any',
      petId: 'any',
      petCategoryId: 'any',
      billingId: '',
      petIdFilter: '',
      petName: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: ''
    });
  };

  const maxTrendValue = useMemo(() => {
    if (!trend.length) return 0;
    return Math.max(...trend.map((item) => Number(item.total_amount) || 0));
  }, [trend]);

  const totalDoctorRevenue = useMemo(() => {
    if (!revenueByDoctor.length) return 0;
    return revenueByDoctor.reduce((sum, entry) => sum + (Number(entry.total_amount) || 0), 0);
  }, [revenueByDoctor]);

  const chartColors = ['#5c6cf2', '#4cc9f0', '#4361ee', '#f72585', '#3a86ff', '#ffba08'];
  const showActions = !isReport;

  const handlePrintBill = (billId: number) => {
    const url = `/billing/print/${billId}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      router.push(url);
    }
  };

  const handlePrintPrescription = (billId: number) => {
    const url = `/billing/prescription/${billId}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      router.push(url);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to delete this bill? This cannot be undone.');
      if (!confirmed) return;
    }

    setDeletingBillId(billId);
    try {
      const response = await fetch(`/api/bills/${billId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete bill');
      }
      await loadReport();
      if (typeof window !== 'undefined') {
        window.alert('Bill deleted successfully.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete bill';
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } finally {
      setDeletingBillId(null);
    }
  };

  const handleBillAction = (action: 'view' | 'edit' | 'print' | 'prescription' | 'delete', billId: number) => {
    if (action === 'view') {
      handlePrintBill(billId);
      return;
    }
    if (action === 'edit') {
      router.push(`/dashboard?tab=edit-bill&billId=${billId}`);
      return;
    }
    if (action === 'print') {
      handlePrintBill(billId);
      return;
    }
    if (action === 'prescription') {
      handlePrintPrescription(billId);
      return;
    }
    if (action === 'delete') {
      handleDeleteBill(billId);
    }
  };

  const actionButtons = [
    {
      label: 'View',
      action: 'view' as const,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      label: 'Edit',
      action: 'edit' as const,
      color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2 2 0 112.828 2.828L11.828 13.828H9v-2.828z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V7" />
        </svg>
      )
    },
    {
      label: 'Print',
      action: 'print' as const,
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v8H6z" />
        </svg>
      )
    },
    {
      label: 'Prescription',
      action: 'prescription' as const,
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      )
    },
    {
      label: 'Delete',
      action: 'delete' as const,
      color: 'bg-red-100 text-red-700 hover:bg-red-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a3 3 0 013-3 3 3 0 013 3v2" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 7h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-100 to-indigo-50 border border-purple-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-purple-600 font-semibold uppercase tracking-wider">Billing Report</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Comprehensive Billing Search</h2>
          <p className="text-gray-600 mt-1">
            From {startDate || defaults.start} to {endDate || defaults.end}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard?tab=list-bills')}
          className="inline-flex items-center px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Filter by Date & Team</p>
            <p className="text-sm text-gray-500">Refine the report without leaving the page.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadReport}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h4.28a1 1 0 01.948.684l.405 1.216A1 1 0 0010.612 6H20a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
              </svg>
              Apply
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H10m9.418 6A8.001 8.001 0 014.582 15m0 0H10v5" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(event) => setSelectedDoctor(event.target.value)}
              className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="any">Any Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.vet_id} value={doctor.vet_id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                </option>
              ))}
            </select>
          </div>
          {isReport ? (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Pet Category</label>
              <select
                value={selectedPetCategory}
                onChange={(event) => setSelectedPetCategory(event.target.value)}
                className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="any">Any Category</option>
                {petCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Pet</label>
              <select
                value={selectedPet}
                onChange={(event) => setSelectedPet(event.target.value)}
                className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="any">Any Pet</option>
                {pets.map((pet) => (
                  <option key={pet.pet_id} value={pet.pet_id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!isReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Billing ID / Number</label>
              <input
                type="text"
                value={billingIdFilter}
                onChange={(event) => setBillingIdFilter(event.target.value)}
                placeholder="e.g. 102 or BILL-102"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Pet ID</label>
              <input
                type="text"
                value={petIdFilter}
                onChange={(event) => setPetIdFilter(event.target.value)}
                placeholder="Enter pet ID"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Pet Name</label>
              <input
                type="text"
                value={petNameFilter}
                onChange={(event) => setPetNameFilter(event.target.value)}
                placeholder="e.g. Milo"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerNameFilter}
                onChange={(event) => setOwnerNameFilter(event.target.value)}
                placeholder="Owner full name"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Owner Email</label>
              <input
                type="email"
                value={ownerEmailFilter}
                onChange={(event) => setOwnerEmailFilter(event.target.value)}
                placeholder="email@example.com"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Owner Phone</label>
              <input
                type="text"
                value={ownerPhoneFilter}
                onChange={(event) => setOwnerPhoneFilter(event.target.value)}
                placeholder="e.g. 0771234567"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Number of Bills</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalBills ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8zm0 0V5m0 10v4" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Total Billing Amount</p>
            <p className="text-2xl font-bold text-gray-900">Rs. {formatCurrency(summary?.totalAmount)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 9h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Average Per Bill</p>
            <p className="text-2xl font-bold text-gray-900">Rs. {formatCurrency(summary?.averagePerBill)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Revenue Trend</p>
              <p className="text-xs text-gray-500">Daily totals across the selected range</p>
            </div>
          </div>
          <div className="h-56">
            {trend.length ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <polyline
                  fill="rgba(92,108,242,0.15)"
                  stroke="none"
                  points={`0,100 ${trend
                    .map((point, idx) => {
                      const x = (idx / Math.max(1, trend.length - 1)) * 100;
                      const y =
                        maxTrendValue > 0
                          ? 100 - (Number(point.total_amount) / maxTrendValue) * 80 - 10
                          : 95;
                      return `${x},${y}`;
                    })
                    .join(' ')} 100,100`}
                />
                <polyline
                  fill="none"
                  stroke="#5c6cf2"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={trend
                    .map((point, idx) => {
                      const x = (idx / Math.max(1, trend.length - 1)) * 100;
                      const y =
                        maxTrendValue > 0
                          ? 100 - (Number(point.total_amount) / maxTrendValue) * 80 - 10
                          : 95;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Not enough data to display the trend.
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Revenue by Doctor</p>
              <p className="text-xs text-gray-500">Top performers by collected total</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            {revenueByDoctor.length && totalDoctorRevenue > 0 ? (
              <div className="w-40 h-40 relative">
                {revenueByDoctor.map((entry, index) => {
                  const value = Number(entry.total_amount) || 0;
                  const radius = 16;
                  const circumference = 2 * Math.PI * radius;
                  const percentage = totalDoctorRevenue > 0 ? value / totalDoctorRevenue : 0;
                  const strokeDasharray = `${percentage * circumference} ${circumference}`;
                  const offset =
                    revenueByDoctor
                      .slice(0, index)
                      .reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0) / totalDoctorRevenue;
                  const strokeDashoffset = circumference * (1 - offset);
                  return (
                    <svg
                      key={entry.doctor_id ?? `dr-${index}`}
                      viewBox="0 0 40 40"
                      className="absolute inset-0"
                      style={{ transform: 'rotate(-90deg)' }}
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r={radius}
                        fill="transparent"
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth="6"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-gray-900">Rs. {formatCurrency(totalDoctorRevenue)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                Not enough doctor data.
              </div>
            )}
            <div className="w-full space-y-3">
              {revenueByDoctor.slice(0, 4).map((entry, index) => (
                <div key={entry.doctor_id ?? `legend-${index}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="text-gray-700 truncate">{entry.doctor_name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">Rs. {formatCurrency(entry.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Billing ID</th>
                <th className="px-4 py-3 text-left">Pet Name</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Doctor Name</th>
                <th className="px-4 py-3 text-left">Billing Date</th>
                <th className="px-4 py-3 text-left">Bill Amount</th>
                {showActions && <th className="px-4 py-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBills.length ? (
                currentBills.map((bill, index) => (
                  <tr key={bill.bill_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{bill.bill_number || `BILL-${bill.bill_id}`}</td>
                    <td className="px-4 py-3 capitalize">
                      <div className="font-medium text-gray-900">{bill.pet_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">ID: {bill.pet_id ?? 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{bill.owner_name || 'Unknown owner'}</div>
                      <div className="text-xs text-gray-500">{bill.owner_phone || 'No phone'}{bill.owner_email ? ` · ${bill.owner_email}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      Dr. {bill.vet_first_name || ''} {bill.vet_last_name || ''}
                    </td>
                    <td className="px-4 py-3">{formatDate(bill.billing_date)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">Rs. {formatCurrency(bill.grand_total)}</td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {actionButtons.map((button) => {
                            const isDelete = button.action === 'delete';
                            const disabled = isDelete && deletingBillId === bill.bill_id;
                            return (
                              <button
                                key={`${bill.bill_id}-${button.label}`}
                                type="button"
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${button.color} ${
                                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onClick={() => handleBillAction(button.action, bill.bill_id)}
                                aria-label={`${button.label} bill ${bill.bill_number || bill.bill_id}`}
                                disabled={disabled}
                              >
                                {button.icon}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showActions ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                    {isLoading ? 'Loading report...' : 'No billing records found for the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-4 text-sm text-gray-600 gap-3">
          <p>
            Showing{' '}
            <span className="font-semibold text-gray-900">
              {filteredBills.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(currentPage * pageSize, filteredBills.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-900">{filteredBills.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md border text-sm ${
                currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            <span className="font-semibold text-gray-900">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md border text-sm ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
