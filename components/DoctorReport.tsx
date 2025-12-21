'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface DoctorOption {
  vet_id: number;
  first_name: string;
  last_name: string;
}

interface DoctorStat {
  doctor_id: number | null;
  doctor_name: string;
  invoice_count: number;
  service_count: number;
}

interface ServiceBreakdown {
  doctor_id: number | null;
  doctor_name: string;
  service_name: string;
  quantity: number;
}

interface TopService {
  service_name: string;
  total_quantity: number;
}

interface DoctorReportData {
  summary: {
    totalInvoices: number;
    totalServices: number;
    totalDoctors: number;
  };
  doctors: DoctorStat[];
  serviceBreakdown: ServiceBreakdown[];
  topServices: TopService[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const getLast30Days = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const fmt = (date: Date) => date.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(now) };
};

const formatNumber = (value: number | string) => {
  const num = Number(value) || 0;
  return num.toLocaleString();
};

export default function DoctorReport() {
  const defaults = useMemo(() => getLast30Days(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [selectedDoctor, setSelectedDoctor] = useState('any');
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [report, setReport] = useState<DoctorReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    try {
      const res = await fetch('/api/veterinarians');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDoctors(json.data);
      }
    } catch (err) {
      console.error('Failed to load doctors list', err);
    }
  }, []);

  const loadReport = useCallback(
    async (overrides?: { startDate?: string; endDate?: string; doctorId?: string }) => {
      const appliedStart = overrides?.startDate ?? startDate;
      const appliedEnd = overrides?.endDate ?? endDate;
      const appliedDoctor = overrides?.doctorId ?? selectedDoctor;

      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          startDate: appliedStart,
          endDate: appliedEnd
        });
        if (appliedDoctor && appliedDoctor !== 'any') {
          params.set('doctorId', appliedDoctor);
        }

        const res = await fetch(`/api/reports/doctors?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Unable to load doctor report');
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Doctor report unavailable');
        }
        setReport(json.data as DoctorReportData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load doctor report';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [endDate, selectedDoctor, startDate]
  );

  useEffect(() => {
    loadDoctors();
    loadReport();
  }, [loadDoctors, loadReport]);

  const handleClear = () => {
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setSelectedDoctor('any');
    loadReport({ startDate: defaults.start, endDate: defaults.end, doctorId: 'any' });
  };

  const topInvoiceDoctor = useMemo(() => {
    if (!report?.doctors?.length) return null;
    return [...report.doctors].sort((a, b) => (b.invoice_count || 0) - (a.invoice_count || 0))[0];
  }, [report]);

  const topServiceDoctor = useMemo(() => {
    if (!report?.doctors?.length) return null;
    return [...report.doctors].sort((a, b) => (b.service_count || 0) - (a.service_count || 0))[0];
  }, [report]);

  const serviceByDoctorMap = useMemo(() => {
    const map: Record<string, ServiceBreakdown[]> = {};
    report?.serviceBreakdown?.forEach((entry) => {
      const key = `${entry.doctor_id || 'unknown'}`;
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    });
    return map;
  }, [report]);

  const doctorCards = useMemo(() => {
    return (report?.doctors || []).map((doc) => {
      const services = serviceByDoctorMap[`${doc.doctor_id || 'unknown'}`] || [];
      return { ...doc, topServices: services.slice(0, 4), extraCount: Math.max(services.length - 4, 0) };
    });
  }, [report, serviceByDoctorMap]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Filter by Date & Doctor</p>
            <p className="text-sm text-gray-600">Choose the window to count services and invoices.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadReport()}
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
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H10m9.418 6A8.001 8.001 0 014.582 15m0 0H10v5" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
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
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report?.summary.totalInvoices || 0)}</p>
            <p className="text-xs text-gray-500">All bills in this period</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 9h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Services Delivered</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report?.summary.totalServices || 0)}</p>
            <p className="text-xs text-gray-500">All service line items</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Doctors Counted</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report?.summary.totalDoctors || 0)}</p>
            <p className="text-xs text-gray-500">With activity in this range</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs uppercase text-gray-500 tracking-widest mb-1">Most Invoices</p>
          <h3 className="text-lg font-semibold text-gray-900">{topInvoiceDoctor?.doctor_name || '—'}</h3>
          <p className="text-xs text-indigo-600 font-semibold mt-2">{formatNumber(topInvoiceDoctor?.invoice_count || 0)} invoices</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs uppercase text-gray-500 tracking-widest mb-1">Most Services</p>
          <h3 className="text-lg font-semibold text-gray-900">{topServiceDoctor?.doctor_name || '—'}</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-2">{formatNumber(topServiceDoctor?.service_count || 0)} services</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs uppercase text-gray-500 tracking-widest mb-1">Top Services</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {report?.topServices?.slice(0, 8).map((svc) => (
              <span
                key={svc.service_name}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold"
              >
                {svc.service_name}
                <span className="text-[11px] text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                  {formatNumber(svc.total_quantity)}
                </span>
              </span>
            ))}
            {!report?.topServices?.length && <span className="text-xs text-gray-500">No services in range</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {doctorCards.map((doc) => (
          <div key={doc.doctor_id ?? doc.doctor_name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{doc.doctor_name || 'Unknown Doctor'}</p>
                <p className="text-xs text-gray-500">
                  Invoices: {formatNumber(doc.invoice_count || 0)} · Services: {formatNumber(doc.service_count || 0)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {doc.topServices.length ? (
                doc.topServices.map((svc, idx) => (
                  <div
                    key={`${svc.service_name}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800"
                  >
                    <span className="truncate">{svc.service_name}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(svc.quantity)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No services recorded.</p>
              )}
              {doc.extraCount > 0 && (
                <p className="text-xs text-indigo-600 font-semibold">+ {formatNumber(doc.extraCount)} other</p>
              )}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-700"
              onClick={() => {}}
              disabled
            >
              View performance
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
        {!doctorCards.length && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-sm text-gray-600">
            {isLoading ? 'Loading report...' : 'No doctor activity for the selected range.'}
          </div>
        )}
      </div>
    </div>
  );
}
