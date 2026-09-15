"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Language = "id" | "en";
type Currency = "idr" | "usd";
type Preferences = {
  language: Language;
  currency: Currency;
  setLanguage: (value: Language) => void;
  setCurrency: (value: Currency) => void;
};

const configuredRate = Number(process.env.NEXT_PUBLIC_USD_EXCHANGE_RATE);
export const USD_EXCHANGE_RATE =
  Number.isFinite(configuredRate) && configuredRate > 0
    ? configuredRate
    : 16000;

const CustomerPreferencesContext = createContext<Preferences | null>(null);

const preferenceChangeEvent = "egoto-preferences-change";

function subscribeToPreferences(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferenceChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferenceChangeEvent, onStoreChange);
  };
}

function savedLanguage(): Language {
  return localStorage.getItem("egoto-language") === "en" ? "en" : "id";
}

function savedCurrency(): Currency {
  return localStorage.getItem("egoto-currency") === "usd" ? "usd" : "idr";
}

export function CustomerPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server snapshot keeps hydration deterministic; persisted browser state
  // becomes visible immediately after hydration without a state-setting effect.
  const language = useSyncExternalStore<Language>(
    subscribeToPreferences,
    savedLanguage,
    () => "id",
  );
  const currency = useSyncExternalStore<Currency>(
    subscribeToPreferences,
    savedCurrency,
    () => "idr",
  );

  const updateLanguage = (value: Language) => {
    localStorage.setItem("egoto-language", value);
    window.dispatchEvent(new Event(preferenceChangeEvent));
  };
  const updateCurrency = (value: Currency) => {
    localStorage.setItem("egoto-currency", value);
    window.dispatchEvent(new Event(preferenceChangeEvent));
  };
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <CustomerPreferencesContext.Provider
      value={{
        language,
        currency,
        setLanguage: updateLanguage,
        setCurrency: updateCurrency,
      }}
    >
      {children}
    </CustomerPreferencesContext.Provider>
  );
}

export function useCustomerPreferences() {
  const value = useContext(CustomerPreferencesContext);
  if (!value) throw new Error("CustomerPreferencesProvider diperlukan.");
  return value;
}

export function formatCustomerPrice(
  amount: number,
  currency: Currency,
  exchangeRate = USD_EXCHANGE_RATE,
) {
  return currency === "usd"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount / exchangeRate)
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
}

export function CustomerPreferenceToggle() {
  const { language, currency, setLanguage, setCurrency } =
    useCustomerPreferences();
  return (
    <div
      className="hidden items-center gap-2 text-xs font-bold sm:flex"
      role="group"
      aria-label={
        language === "en"
          ? "Language and currency preferences"
          : "Pengaturan bahasa dan mata uang"
      }
    >
      <span className="rounded-full border border-ink/15 p-0.5">
        <button
          type="button"
          onClick={() => setLanguage("id")}
          className={`rounded-full px-2 py-1 ${language === "id" ? "bg-ink text-white" : "text-ink-muted"}`}
        >
          ID
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`rounded-full px-2 py-1 ${language === "en" ? "bg-ink text-white" : "text-ink-muted"}`}
        >
          EN
        </button>
      </span>
      <span className="rounded-full border border-ink/15 p-0.5">
        <button
          type="button"
          onClick={() => setCurrency("idr")}
          className={`rounded-full px-2 py-1 ${currency === "idr" ? "bg-ink text-white" : "text-ink-muted"}`}
        >
          Rp
        </button>
        <button
          type="button"
          onClick={() => setCurrency("usd")}
          className={`rounded-full px-2 py-1 ${currency === "usd" ? "bg-ink text-white" : "text-ink-muted"}`}
        >
          $
        </button>
      </span>
    </div>
  );
}
