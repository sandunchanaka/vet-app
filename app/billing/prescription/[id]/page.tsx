'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BillPrescription {
  drug_name: string;
  dose: string;
  dosage: string;
  dosage_label?: string;
  duration: string;
  duration_label?: string;
}

interface BillDetail {
  bill_id: number;
  bill_number: string;
  billing_date: string;
  pet_name?: string;
  owner_name?: string;
  vet_first_name?: string;
  vet_last_name?: string;
  prescriptions: BillPrescription[];
}

interface PrescriptionPageProps {
  params: { id: string };
}

export default function PrescriptionPrintPage({ params }: PrescriptionPageProps) {
  const router = useRouter();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/bills/${params.id}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load prescription.');
        }
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Prescription not available.');
        }
        setBill(result.data as BillDetail);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch prescription.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescription();
  }, [params.id]);

  useEffect(() => {
    if (bill && typeof window !== 'undefined') {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [bill]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleDateString();
  };

  const closeWindow = () => {
    if (typeof window !== 'undefined') {
      window.close();
    } else {
      router.push('/dashboard?tab=list-bills');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-6 print:bg-white">
      <div className="w-full max-w-2xl px-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 font-mono text-gray-900 space-y-6 print:shadow-none print:border-0">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
              <svg className="h-10 w-10 animate-spin text-green-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C5.373 1 1 5.373 1 12h3zm2 5.291A7.962 7.962 0 014 12H1c0 3.042 1.135 5.824 3 7.938l2-2.647z" />
              </svg>
              <p>Preparing prescription...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center space-y-4">
              <p className="text-red-600 font-semibold">{error}</p>
              <button
                type="button"
                onClick={closeWindow}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && bill && (
            <>
              <div className="text-center space-y-1 border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-black tracking-wide">Challenger Vet Animal Hospital</h1>
                <p className="text-sm">Kottawa, Sri Lanka</p>
                <p className="text-sm">Phone: 011-2197400</p>
              </div>

              <div className="space-y-1">
                <p className="text-lg font-black uppercase tracking-wide">Prescription Details</p>
                <p>
                  <span className="font-bold">Prescription Date:</span> {formatDate(bill.billing_date)}
                </p>
                <p>
                  <span className="font-bold">Pet Name:</span> {bill.pet_name || 'N/A'}
                </p>
                <p>
                  <span className="font-bold">Owner Name:</span> {bill.owner_name || 'N/A'}
                </p>
                <p>
                  <span className="font-bold">Doctor:</span> {`Dr. ${bill.vet_first_name || ''} ${bill.vet_last_name || ''}`.trim()}
                </p>
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-wide bg-sky-100 inline-block px-2">Prescription Items</p>
                <table className="w-full text-left text-sm mt-3 border-t border-b border-gray-200">
                  <thead>
                    <tr className="uppercase text-xs tracking-widest text-gray-500">
                      <th className="py-2">#</th>
                      <th className="py-2">Drug Name</th>
                      <th className="py-2">Dose</th>
                      <th className="py-2">Dosage</th>
                      <th className="py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.prescriptions?.length ? (
                      bill.prescriptions.map((prescription, idx) => (
                        <tr key={`${prescription.drug_name}-${idx}`} className="border-t border-gray-100">
                          <td className="py-2 align-top">{idx + 1}</td>
                          <td className="py-2 align-top">{prescription.drug_name || '-'}</td>
                          <td className="py-2 align-top">{prescription.dose || '-'}</td>
                          <td className="py-2 align-top">
                            {prescription.dosage_label || prescription.dosage || '-'}
                          </td>
                          <td className="py-2 align-top">
                            {prescription.duration_label || prescription.duration || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">
                          No prescription items recorded for this bill.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 text-center text-sm text-gray-700">
                <p>Thank you for trusting Challenger Vet Animal Hospital with your pet&apos;s care!</p>
                <p className="font-bold">Prepared by: ChallengerVet</p>
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
