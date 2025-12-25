'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BillService {
  service_name: string;
  quantity: number;
  unit_price: number | string;
  discount_percentage: number | string;
  total_amount: number | string;
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
  vaccine_id?: number | string;
  vaccine_name: string;
  next_vaccination_date: string;
  duration_slots: string;
}

interface BillDetail {
  bill_id: number;
  bill_number: string;
  billing_date: string;
  next_treatment_date?: string;
  status: string;
  pet_name: string;
  pet_code?: string;
  pet_gender?: string;
  pet_date_of_birth?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_address?: string;
  owner_email?: string;
  vet_first_name?: string;
  vet_last_name?: string;
  history_complaint?: string;
  clinical_observation?: string;
  treatment_remarks?: string;
  net_total: number | string;
  discount_amount: number | string;
  grand_total: number | string;
  services: BillService[];
  prescriptions: BillPrescription[];
  vaccinations: BillVaccination[];
}

interface PrintPageProps {
  params: { id: string };
}

export default function PrintBillPage({ params }: PrintPageProps) {
  const router = useRouter();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/bills/${params.id}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load bill details.');
        }
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Bill details not found.');
        }
        setBill(result.data as BillDetail);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch bill.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBill();
  }, [params.id]);

  useEffect(() => {
    if (bill && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [bill]);

  const formatCurrency = (value?: number | string) => {
    const amount = Number(value) || 0;
    return `Rs. ${amount.toFixed(2)}`;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const servicesTotal = useMemo(() => {
    if (!bill?.services?.length) return 0;
    return bill.services.reduce((sum, service) => sum + (Number(service.total_amount) || 0), 0);
  }, [bill]);

  const closeWindow = () => {
    if (typeof window !== 'undefined') {
      window.close();
    } else {
      router.push('/dashboard?tab=list-bills');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-900 flex items-center justify-center py-6 print:bg-white">
      <div className="w-full max-w-lg px-4">
        <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-6 print:shadow-none print:border-0 print:max-w-none">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <svg className="h-10 w-10 animate-spin text-green-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C5.373 1 1 5.373 1 12h3zm2 5.291A7.962 7.962 0 014 12H1c0 3.042 1.135 5.824 3 7.938l2-2.647z" />
              </svg>
              <p className="text-sm text-gray-600">Preparing printable bill...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center space-y-4">
              <p className="text-red-600 font-semibold">{error}</p>
              <button
                type="button"
                onClick={closeWindow}
                className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && bill && (
            <>
              <div className="text-center border-b border-gray-200 pb-4 mb-4">
                <p className="text-xs uppercase tracking-widest text-gray-500">Billing Details</p>
                <h1 className="text-2xl font-black text-gray-900">Challenger Vet Animal Hospital</h1>
                <p className="text-sm text-gray-600">Kottawa, Sri Lanka · Phone: 011-2197400</p>
                <p className="text-sm text-gray-600 mt-1">{formatDateTime(bill.billing_date)}</p>
              </div>

              <div className="text-sm text-gray-700 space-y-1 mb-4">
                <p>
                  <span className="font-semibold">Bill No:</span>{' '}
                  {bill.bill_number || `BILL-${bill.bill_id}`}
                </p>
                <p>
                  <span className="font-semibold">Pet ID:</span> {bill.pet_code || 'N/A'}
                </p>
                <p>
                  <span className="font-semibold">Pet Name:</span> {bill.pet_name || 'N/A'}
                </p>
                <p>
                  <span className="font-semibold">Owner Name:</span> {bill.owner_name || 'N/A'}
                </p>
                <p>
                  <span className="font-semibold">Doctor:</span> Dr. {bill.vet_first_name || ''} {bill.vet_last_name || ''}
                </p>
              </div>

              <div className="border-t border-b border-gray-200 py-3 mb-4">
                <h2 className="text-base font-semibold uppercase tracking-widest text-gray-700 mb-3">Billing Items</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest text-xs">
                      <th className="text-left py-1">#</th>
                      <th className="text-left py-1">Item</th>
                      <th className="text-right py-1">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.services?.length ? (
                      bill.services.map((service, idx) => (
                        <tr key={`${service.service_name}-${idx}`} className="border-t border-gray-100">
                          <td className="py-1 text-gray-600">{idx + 1}</td>
                          <td className="py-1 text-gray-800 capitalize">{service.service_name}</td>
                          <td className="py-1 text-gray-800 text-right">{formatCurrency(service.total_amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-2 text-center text-gray-500">
                          No services recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-gray-800 space-y-1 mb-6">
                <div className="flex justify-between">
                  <span className="font-semibold">Net Amount:</span>
                  <span>{formatCurrency(bill.net_total || servicesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Discount:</span>
                  <span>{formatCurrency(bill.discount_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total Cost:</span>
                  <span>{formatCurrency(bill.grand_total || bill.net_total || servicesTotal)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 space-y-3 mb-6">
                <p>Thank you for trusting Challenger Vet Animal Hospital with your pet&apos;s care!</p>
                <p className="font-semibold">Prepared by: ChallengerVet</p>
              </div>

              <div className="print:hidden flex justify-between items-center text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800"
                >
                  Print
                </button>
                <button type="button" onClick={closeWindow} className="text-gray-600 hover:text-gray-900">
                  Close Tab
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
