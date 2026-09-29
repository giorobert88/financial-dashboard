"use client";

import React, { createContext, useContext, useState } from "react";
import { DisplayCurrency, DEFAULT_DISPLAY_CURRENCY } from "@/lib/currency-types";
import { formatCurrency } from "@/lib/format";

interface CurrencyContextType {
  currency: DisplayCurrency;
  code: string;
  symbol: string;
  fmt: (n: number, options?: Intl.NumberFormatOptions) => string;
  setCurrency: (curr: DisplayCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_DISPLAY_CURRENCY,
  code: DEFAULT_DISPLAY_CURRENCY.code,
  symbol: DEFAULT_DISPLAY_CURRENCY.symbol,
  fmt: (n: number, options?: Intl.NumberFormatOptions) => formatCurrency(n, DEFAULT_DISPLAY_CURRENCY.code, options),
  setCurrency: () => {},
});

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: DisplayCurrency;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(initialCurrency);

  const fmt = (n: number, options?: Intl.NumberFormatOptions) => {
    return formatCurrency(n, currency.code, options);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        code: currency.code,
        symbol: currency.symbol,
        fmt,
        setCurrency: setCurrencyState,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
