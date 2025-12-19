'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Bill {
  bill_id: number;
  bill_number: string;
  billing_date: string;
  grand_total: number | string;
  status: string;
  pet_name: string;
  vet_first_name: string;
  vet_last_name: string;
  next_treatment_date?: string;
}

interface BillService {
  service_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_amount: number;
}

interface BillPrescription {
  drug_name: string;
  dose: string;
  dosage: string;
  dosage_label?: string;
  duration: string;
  duration_label?: string;
}

interface BillVaccination {
  vaccine_name: string;
  next_vaccination_date: string;
  duration_slots: string;
}

interface BillDetail extends Bill {
  pet_code?: string;
  pet_gender?: string;
  pet_date_of_birth?: string;
  pet_weight?: number | string;
  pet_color?: string;
  category_name?: string;
  breed_name?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_address?: string;
  owner_email?: string;
  vet_specialization?: string;
  history_complaint?: string;
  clinical_observation?: string;
  treatment_remarks?: string;
  net_total: number | string;
  discount_amount: number | string;
  services: BillService[];
  prescriptions: BillPrescription[];
  vaccinations: BillVaccination[];
}

type BillAction = 'view' | 'edit' | 'print' | 'prescription' | 'delete';

interface ApiResponse {
  success: boolean;
  data?: Bill[];
  message?: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
  completed: 'bg-blue-100 text-blue-700 border border-blue-200'
};

export default function BillsList() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [deletingBillId, setDeletingBillId] = useState<number | null>(null);

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bills');
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }

      const result: ApiResponse = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || 'No bill data available');
      }

      setBills(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const filteredBills = useMemo(() => {
    if (!searchTerm.trim()) {
      return bills;
    }
    const term = searchTerm.toLowerCase();
    return bills.filter((bill) => {
      const doctorName = `${bill.vet_first_name || ''} ${bill.vet_last_name || ''}`.toLowerCase();
      return (
        bill.bill_number?.toLowerCase().includes(term) ||
        bill.pet_name?.toLowerCase().includes(term) ||
        doctorName.includes(term) ||
        bill.status?.toLowerCase().includes(term)
      );
    });
  }, [bills, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));

  const currentBills = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBills.slice(startIndex, startIndex + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchTerm]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  };

  const formatAmount = (value: number | string) => {
    const amount = Number(value) || 0;
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderStatusPill = (status?: string) => {
    if (!status) return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">Unknown</span>;
    const key = status.toLowerCase();
    const style = statusStyles[key] || 'bg-gray-100 text-gray-700 border border-gray-200';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
        {status}
      </span>
    );
  };

  const fetchBillDetails = async (billId: number) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedBill(null);

    try {
      const response = await fetch(`/api/bills/${billId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bill details');
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Bill details not available');
      }

      setSelectedBill(result.data as BillDetail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load bill details';
      setDetailError(message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBill(null);
    setDetailError(null);
  };

  const handleAddBill = () => {
    router.push('/dashboard?tab=new-bill');
  };

  const handlePrintBill = (billId: number) => {
    if (typeof window !== 'undefined') {
      const url = `/billing/print/${billId}`;
      window.open(url, '_blank');
    } else {
      router.push(`/billing/print/${billId}`);
    }
  };

  const handlePrintPrescription = (billId: number) => {
    if (typeof window !== 'undefined') {
      window.open(`/billing/prescription/${billId}`, '_blank');
    } else {
      router.push(`/billing/prescription/${billId}`);
    }
  };

  const handleBillAction = (action: BillAction, bill: Bill) => {
    if (action === 'view') {
      fetchBillDetails(bill.bill_id);
      return;
    }

    if (action === 'edit') {
      router.push(`/dashboard?tab=edit-bill&billId=${bill.bill_id}`);
      return;
    }

    if (action === 'print') {
      handlePrintBill(bill.bill_id);
      return;
    }

    if (action === 'prescription') {
      handlePrintPrescription(bill.bill_id);
      return;
    }

    if (action === 'delete') {
      handleDeleteBill(bill.bill_id);
      return;
    }

    console.log(`${action} bill ${bill.bill_id}`);
  };

  const handleDeleteBill = async (billId: number) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to delete this bill? This cannot be undone.');
      if (!confirmed) {
        return;
      }
    }

    setDeletingBillId(billId);
    try {
      const response = await fetch(`/api/bills/${billId}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete bill');
      }

      if (selectedBill?.bill_id === billId) {
        closeDetailModal();
      }

      await loadBills();

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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C5.373 1 1 5.373 1 12h3zm2 5.291A7.962 7.962 0 014 12H1c0 3.042 1.135 5.824 3 7.938l2-2.647z" />
          </svg>
          <p className="text-gray-700 font-medium">Loading active bills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-red-100">
        <p className="text-red-600 font-semibold">Unable to load bills</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  };

  const actionButtons = [
    {
      label: 'View',
      action: 'view' as BillAction,
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
      action: 'edit' as BillAction,
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
      action: 'print' as BillAction,
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
      action: 'prescription' as BillAction,
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
      action: 'delete' as BillAction,
      color: 'bg-red-100 text-red-700 hover:bg-red-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 7V4h6v3" />
        </svg>
      )
    }
  ];

  if (bills.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Bills</h2>
        <p className="text-gray-600">No bills found at the moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bill Listing</h2>
          <p className="text-gray-600 mt-1">Review and manage all billing records.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <button
            type="button"
            onClick={handleAddBill}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New Bill
          </button>
          <div>
            Showing <span className="font-semibold text-gray-900">{currentBills.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{filteredBills.length}</span> entries
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">#</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Billing ID</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Pet Name</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Doctor Name</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Billing Date</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Bill Amount</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-xs text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBills.map((bill, index) => {
              const rowNumber = (currentPage - 1) * pageSize + index + 1;
              return (
                <tr key={bill.bill_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{rowNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{bill.bill_number || `BILL-${bill.bill_id}`}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 capitalize">{bill.pet_name || 'Unknown Pet'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  Dr. {bill.vet_first_name || ''} {bill.vet_last_name || ''}
                </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(bill.billing_date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">Rs. {formatAmount(bill.grand_total)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{renderStatusPill(bill.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {actionButtons.map((button) => {
                        const isDeleteAction = button.action === 'delete';
                        const isPrintAction = button.action === 'print';
                        const isDisabled = isDeleteAction && deletingBillId === bill.bill_id;
                        return (
                          <button
                            key={`${bill.bill_id}-${button.label}`}
                            type="button"
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${button.color} ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => handleBillAction(button.action, bill)}
                            aria-label={`${button.label} bill ${bill.bill_number || bill.bill_id}`}
                            disabled={isDisabled}
                          >
                            {button.icon}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-gray-600">
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
              currentPage === 1
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-md border text-sm ${
                currentPage === page
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}

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

      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <p className="text-sm text-gray-500">Bill Number</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedBill?.bill_number || (selectedBill ? `BILL-${selectedBill.bill_id}` : 'Bill Details')}
                </p>
                {selectedBill?.status && <div className="mt-2">{renderStatusPill(selectedBill.status)}</div>}
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close bill details"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-6">
              {isDetailLoading && (
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C5.373 1 1 5.373 1 12h3zm2 5.291A7.962 7.962 0 014 12H1c0 3.042 1.135 5.824 3 7.938l2-2.647z" />
                  </svg>
                  <span>Loading bill details...</span>
                </div>
              )}

              {detailError && !isDetailLoading && (
                <div className="border border-red-100 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                  {detailError}
                </div>
              )}

              {selectedBill && !isDetailLoading && !detailError && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500">Billing Date</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(selectedBill.billing_date)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500">Next Treatment Date</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(selectedBill.next_treatment_date)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500">Bill Amount</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">Rs. {formatAmount(selectedBill.grand_total)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Pet Details</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-500">Pet Name</dt>
                          <dd className="font-semibold text-gray-900">{selectedBill.pet_name || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Pet Code</dt>
                          <dd className="font-semibold text-gray-900">{selectedBill.pet_code || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Category</dt>
                          <dd className="font-semibold text-gray-900">{selectedBill.category_name || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Breed</dt>
                          <dd className="font-semibold text-gray-900">{selectedBill.breed_name || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Gender</dt>
                          <dd className="font-semibold text-gray-900 capitalize">{selectedBill.pet_gender || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Date of Birth</dt>
                          <dd className="font-semibold text-gray-900">{formatDate(selectedBill.pet_date_of_birth)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Weight</dt>
                          <dd className="font-semibold text-gray-900">{selectedBill.pet_weight ? `${selectedBill.pet_weight} kg` : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Color</dt>
                          <dd className="font-semibold text-gray-900">{selectedBill.pet_color || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Owner Details</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-gray-500">Owner Name</dt>
                            <dd className="font-semibold text-gray-900">{selectedBill.owner_name || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Phone</dt>
                            <dd className="font-semibold text-gray-900">{selectedBill.owner_phone || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Email</dt>
                            <dd className="font-semibold text-gray-900 break-all">{selectedBill.owner_email || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Address</dt>
                            <dd className="font-semibold text-gray-900">{selectedBill.owner_address || 'N/A'}</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Doctor</h3>
                        <p className="font-semibold text-gray-900">
                          Dr. {selectedBill.vet_first_name || ''} {selectedBill.vet_last_name || ''}
                        </p>
                        <p className="text-sm text-gray-600">{selectedBill.vet_specialization || 'General Practitioner'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">History / Complaint</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {selectedBill.history_complaint || 'Not provided'}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Clinical Observation</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {selectedBill.clinical_observation || 'Not provided'}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Treatment Remarks</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {selectedBill.treatment_remarks || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Services</h3>
                      <span className="text-sm text-gray-500">
                        Total Net: Rs. {formatAmount(selectedBill.net_total)} | Discount: Rs. {formatAmount(selectedBill.discount_amount)} | Grand Total: Rs. {formatAmount(selectedBill.grand_total)}
                      </span>
                    </div>
                    {selectedBill.services?.length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-800">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Service</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Qty</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Unit Price</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Discount %</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedBill.services.map((service, idx) => (
                              <tr key={`${service.service_name}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-semibold text-gray-900">{service.service_name}</td>
                                <td className="px-4 py-2 text-gray-700">{service.quantity}</td>
                                <td className="px-4 py-2 text-gray-700">Rs. {formatAmount(service.unit_price)}</td>
                                <td className="px-4 py-2 text-gray-700">{service.discount_percentage}%</td>
                                <td className="px-4 py-2 font-semibold text-emerald-700">Rs. {formatAmount(service.total_amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-600">No services recorded for this bill.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg">
                      <div className="px-4 py-3 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Prescriptions</h3>
                      </div>
                      {selectedBill.prescriptions?.length ? (
                        <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-800">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Drug</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Dose</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Dosage</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedBill.prescriptions.map((prescription, idx) => (
                              <tr key={`${prescription.drug_name}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-semibold text-gray-900">{prescription.drug_name}</td>
                                <td className="px-4 py-2 text-gray-700">{prescription.dose || '-'}</td>
                                <td className="px-4 py-2 text-gray-700">{prescription.dosage_label || prescription.dosage || '-'}</td>
                                <td className="px-4 py-2 text-gray-700">{prescription.duration_label || prescription.duration || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-sm text-gray-600">No prescriptions recorded.</p>
                      )}
                    </div>

                    <div className="border rounded-lg">
                      <div className="px-4 py-3 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Vaccinations</h3>
                      </div>
                      {selectedBill.vaccinations?.length ? (
                        <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-800">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Vaccine</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Next Date</th>
                              <th className="px-4 py-2 text-left text-gray-600 font-semibold uppercase text-xs tracking-wide">Duration Slots</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedBill.vaccinations.map((vaccination, idx) => (
                              <tr key={`${vaccination.vaccine_name}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-semibold text-gray-900">{vaccination.vaccine_name}</td>
                                <td className="px-4 py-2 text-gray-700">{formatDate(vaccination.next_vaccination_date)}</td>
                                <td className="px-4 py-2 text-gray-700">{vaccination.duration_slots || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-sm text-gray-600">No vaccinations recorded.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
