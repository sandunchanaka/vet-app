'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface VaccineRow {
  vaccine_name: string;
  vaccination_entries: number;
  vaccination_quantity: number;
  service_entries: number;
}

interface VaccinationReport {
  summary: {
    totalVaccinations: number;
    vaccineTypes: number;
  };
  vaccines: VaccineRow[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const getDefaults = () => {
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

export default function VaccinationSales() {
  const defaults = useMemo(() => getDefaults(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [report, setReport] = useState<VaccinationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(
    async (overrides?: { startDate?: string; endDate?: string }) => {
      const appliedStart = overrides?.startDate ?? startDate;
      const appliedEnd = overrides?.endDate ?? endDate;

      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          startDate: appliedStart,
          endDate: appliedEnd
        });
        const res = await fetch(`/api/reports/vaccinations?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Unable to load vaccination sales');
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Vaccination report unavailable');
        }
        setReport(json.data as VaccinationReport);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load vaccination sales';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [endDate, startDate]
  );

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleClear = () => {
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    loadReport({ startDate: defaults.start, endDate: defaults.end });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Vaccination Sales</h2>
          <p className="text-sm text-gray-600 mt-1">
            From {startDate} to {endDate}
          </p>
        </div>
        <button
          type="button"
          onClick={() => history.back()}
          className="inline-flex items-center px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Filter by Date</p>
          <p className="text-sm text-gray-500">Select the window to count vaccinations sold.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Total Vaccinations Sold</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report?.summary.totalVaccinations || 0)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8zm0 0V5m0 10v4" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-widest">Vaccine Types</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report?.summary.vaccineTypes || 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-rose-200 text-rose-900 px-4 py-3 flex items-center justify-between text-sm font-semibold">
          <div>
            <p>Vaccinations Sold</p>
            <p className="text-xs text-rose-800 font-normal">Grouped by vaccine name</p>
          </div>
          <span className="text-xs bg-white/60 text-rose-800 px-2 py-1 rounded-full border border-rose-300">
            From {report?.dateRange.startDate || startDate} to {report?.dateRange.endDate || endDate}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Vaccine</th>
                <th className="px-4 py-3 text-left">Vaccination Entries</th>
                <th className="px-4 py-3 text-left">Service Entries</th>
                <th className="px-4 py-3 text-left">Total Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(report?.vaccines || []).map((vaccine) => (
                <tr key={vaccine.vaccine_name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{vaccine.vaccine_name}</td>
                  <td className="px-4 py-3">{formatNumber(vaccine.vaccination_entries || 0)}</td>
                  <td className="px-4 py-3">{formatNumber(vaccine.service_entries || 0)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatNumber((vaccine.vaccination_quantity || 0) + (vaccine.service_entries || 0))}
                  </td>
                </tr>
              ))}
              {(!report?.vaccines || report.vaccines.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    {isLoading ? 'Loading report...' : 'No vaccination sales for the selected range.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
