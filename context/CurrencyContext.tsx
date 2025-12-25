'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CurrencyCode = 'USD' | 'LKR';

interface CurrencyContextValue {
  currency: CurrencyCode;
  currencySymbol: string;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (value: number | string | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    const stored = localStorage.getItem('system_currency') as CurrencyCode | null;
    if (stored === 'USD' || stored === 'LKR') {
      setCurrency(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('system_currency', currency);
  }, [currency]);

  const currencySymbol = currency === 'LKR' ? 'Rs' : '$';

  const formatAmount = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(parsed)) return 'N/A';
    return `${currencySymbol}${parsed.toFixed(2)}`;
  };

  const contextValue = useMemo(
    () => ({
      currency,
      currencySymbol,
      setCurrency,
      formatAmount,
    }),
    [currency, currencySymbol]
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
