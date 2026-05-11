import React, { useState, useEffect } from 'react';
import './Common.css';
import './ZakatCalculator.css';

const NISAB_GOLD_GRAMS = 85;

// Fallback gold price in USD per gram
const FALLBACK_GOLD_USD_PER_GRAM = 98;

const FALLBACK_FX_RATES = {
  USD:1, EUR:0.92, GBP:0.79, BDT:110, SAR:3.75, AED:3.67,
  PKR:278, INR:83.5, MYR:4.7, IDR:15700, TRY:32, EGP:48,
  NGN:1600, CAD:1.37, AUD:1.55, SGD:1.35, KWD:0.308,
  QAR:3.64, OMR:0.385, JOD:0.71, MAD:10, ZAR:19, JPY:155,
  CNY:7.25, CHF:0.9,
};

const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka' },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah' },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'KWD', symbol: 'KD',  name: 'Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'QR',  name: 'Qatari Riyal' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'JOD', symbol: 'JD',  name: 'Jordanian Dinar' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc' },
];

function formatAmount(value, symbol) {
  if (!value && value !== 0) return `${symbol}—`;

  if (value >= 1_000_000_000) {
    return `${symbol}${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${symbol}${value.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })}`;
  }

  return `${symbol}${value.toFixed(2)}`;
}

export default function ZakatCalculator() {

  const [currencyCode, setCurrencyCode] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [search, setSearch] = useState('');

  const [assets, setAssets] = useState({
    cash: '',
    gold: '',
    silver: '',
    business: '',
    investments: '',
    receivables: '',
  });

  const [liabilities, setLiabilities] = useState({
    debts: '',
    expenses: '',
  });

  const [result, setResult] = useState(null);

  // Rates state
  const [goldUSD, setGoldUSD] = useState(FALLBACK_GOLD_USD_PER_GRAM);
  const [fxRates, setFxRates] = useState(FALLBACK_FX_RATES);

  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // ── Fetch live rates ─────────────────────────────────────────
  useEffect(() => {

    let mounted = true;

    // Load cached values instantly
    const cachedFx = localStorage.getItem('zakat_fx_rates');
    const cachedGold = localStorage.getItem('zakat_gold_price');
    const cachedTime = localStorage.getItem('zakat_last_updated');

    if (cachedFx) {
      try {
        setFxRates(JSON.parse(cachedFx));
      } catch {}
    }

    if (cachedGold) {
      setGoldUSD(Number(cachedGold));
    }

    if (cachedTime) {
      setLastUpdated(cachedTime);
    }

    // If cache exists, stop loading immediately
    if (cachedFx || cachedGold) {
      setRatesLoading(false);
    }

    async function fetchWithTimeout(url, timeout = 4000) {

      const controller = new AbortController();

      const timer = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        return await response.json();

      } finally {
        clearTimeout(timer);
      }
    }

    async function loadRates() {

      setRatesError('');

      const [fxResult, goldResult] = await Promise.allSettled([

        fetchWithTimeout(
          'https://open.er-api.com/v6/latest/USD',
          4000
        ),

        fetchWithTimeout(
          'https://data-asg.goldprice.org/dbXRates/USD',
          4000
        ),
      ]);

      // ── FX Rates ─────────────────────────────
      if (
        fxResult.status === 'fulfilled' &&
        fxResult.value?.result === 'success'
      ) {

        const fx = fxResult.value.rates;

        if (mounted) {

          setFxRates(fx);

          const updated = new Date(
            fxResult.value.time_last_update_utc
          ).toLocaleString();

          setLastUpdated(updated);

          localStorage.setItem(
            'zakat_fx_rates',
            JSON.stringify(fx)
          );

          localStorage.setItem(
            'zakat_last_updated',
            updated
          );
        }

      } else {

        if (mounted) {
          setRatesError(
            'Using estimated exchange rates.'
          );
        }
      }

      // ── Gold Price ───────────────────────────
      if (
        goldResult.status === 'fulfilled' &&
        goldResult.value?.items?.[0]?.xauPrice
      ) {

        const perOz = goldResult.value.items[0].xauPrice;
        const perGram = perOz / 31.1035;

        if (mounted) {

          setGoldUSD(perGram);

          localStorage.setItem(
            'zakat_gold_price',
            perGram.toString()
          );
        }

      } else {

        if (mounted) {

          setRatesError(prev =>
            prev || 'Using estimated gold price.'
          );
        }
      }

      if (mounted) {
        setRatesLoading(false);
      }
    }

    loadRates();

    return () => {
      mounted = false;
    };

  }, []);

  // ── Derived values ───────────────────────────────────────────
  const currency =
    CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const fxRate = fxRates[currencyCode] ?? 1;

  const goldPerGram =
    (goldUSD || FALLBACK_GOLD_USD_PER_GRAM) * fxRate;

  const nisab = NISAB_GOLD_GRAMS * goldPerGram;

  useEffect(() => {
    setResult(null);
  }, [currencyCode]);

  // ── Calculate ────────────────────────────────────────────────
  function calc() {

    const totalAssets = Object.values(assets).reduce(
      (sum, value) => sum + (parseFloat(value) || 0),
      0
    );

    const totalLiabilities = Object.values(liabilities).reduce(
      (sum, value) => sum + (parseFloat(value) || 0),
      0
    );

    const zakatable = totalAssets - totalLiabilities;

    const zakat =
      zakatable >= nisab
        ? zakatable * 0.025
        : 0;

    setResult({
      totalAssets,
      totalLiabilities,
      zakatable,
      zakat,
      eligible: zakatable >= nisab,
    });
  }

  function field(label, key, obj, setter) {

    return (
      <div className="zakat-field" key={key}>

        <label className="field-label">
          {label}
        </label>

        <div className="amount-input-wrap">

          <span className="currency-prefix">
            {currency.symbol}
          </span>

          <input
            className="feature-input amount-input"
            type="number"
            placeholder="0"
            min="0"
            value={obj[key]}
            onChange={(e) => {

              setter(prev => ({
                ...prev,
                [key]: e.target.value
              }));

              setResult(null);
            }}
          />

        </div>

      </div>
    );
  }

  const filteredCurrencies = CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="feature-page">

      <div className="page-header">
        <h1>💰 Zakat Calculator</h1>
        <p>
          Calculate your annual Zakat obligation with live rates
        </p>
      </div>

      {/* ── Currency Card ───────────────────── */}
      <div className="card feature-card">

        <div className="rate-status-bar">

          {ratesLoading ? (

            <div className="rate-loading">
              <div className="rate-spinner" />
              <span>Fetching live rates...</span>
            </div>

          ) : (

            <div className="rate-live-info">

              <div className="rate-live-dot" />

              <div className="rate-live-text">

                <span className="rate-live-label">
                  Live rates
                </span>

                {lastUpdated && (
                  <span className="rate-live-time">
                    Updated {lastUpdated}
                  </span>
                )}

              </div>

              <div className="rate-gold-pill">
                🥇 {formatAmount(goldPerGram, currency.symbol)}
                <span className="rate-unit">/g</span>
              </div>

            </div>
          )}

          {ratesError && (
            <div className="rate-warning">
              ⚠️ {ratesError}
            </div>
          )}

        </div>

        {/* Currency selector */}
        <div className="currency-selector-row">

          <div className="currency-meta">

            <span className="currency-label">
              Selected Currency
            </span>

            <span className="currency-nisab">
              Nisab threshold ≈ {
                ratesLoading
                  ? '...'
                  : formatAmount(nisab, currency.symbol)
              }
            </span>

          </div>

          <button
            className="currency-toggle-btn"
            onClick={() =>
              setShowCurrencyPicker(v => !v)
            }
          >

            <span className="currency-symbol-badge">
              {currency.symbol}
            </span>

            <span className="currency-code">
              {currency.code}
            </span>

            <span className="currency-name-small">
              {currency.name}
            </span>

            <span className="currency-chevron">
              {showCurrencyPicker ? '▲' : '▼'}
            </span>

          </button>

        </div>

        {/* Currency picker */}
        {showCurrencyPicker && (

          <div className="currency-picker fade-up">

            <input
              className="feature-input"
              placeholder="🔍 Search currency..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              autoFocus
            />

            <div className="currency-list">

              {filteredCurrencies.map(c => {

                const rate = fxRates[c.code] ?? 1;

                const gPrice =
                  (goldUSD || FALLBACK_GOLD_USD_PER_GRAM) * rate;

                return (

                  <button
                    key={c.code}
                    className={`currency-option ${
                      c.code === currencyCode
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {

                      setCurrencyCode(c.code);
                      setShowCurrencyPicker(false);
                      setSearch('');
                    }}
                  >

                    <span className="co-symbol">
                      {c.symbol}
                    </span>

                    <div className="co-info">

                      <span className="co-code">
                        {c.code}
                      </span>

                      <span className="co-name">
                        {c.name}
                      </span>

                    </div>

                    <span className="co-rate">

                      {ratesLoading
                        ? '…'
                        : `${c.symbol}${
                            gPrice >= 1000
                              ? Math.round(gPrice).toLocaleString()
                              : gPrice.toFixed(2)
                          }/g`
                      }

                    </span>

                    {c.code === currencyCode && (
                      <span className="co-check">✓</span>
                    )}

                  </button>
                );
              })}

            </div>

          </div>
        )}

      </div>

      {/* ── Assets ───────────────────────────── */}
      <div className="card feature-card">

        <h3 className="section-title">
          💎 Assets
        </h3>

        <div className="zakat-grid">

          {field('💵 Cash & Bank Savings', 'cash', assets, setAssets)}
          {field('🥇 Gold Value', 'gold', assets, setAssets)}
          {field('🥈 Silver Value', 'silver', assets, setAssets)}
          {field('🏪 Business Inventory', 'business', assets, setAssets)}
          {field('📈 Investments', 'investments', assets, setAssets)}
          {field('💳 Money Owed to You', 'receivables', assets, setAssets)}

        </div>

      </div>

      {/* ── Liabilities ─────────────────────── */}
      <div className="card feature-card">

        <h3 className="section-title">
          📉 Liabilities
        </h3>

        <div className="zakat-grid">

          {field('🏦 Debts & Loans', 'debts', liabilities, setLiabilities)}

          {field(
            '🧾 Immediate Expenses',
            'expenses',
            liabilities,
            setLiabilities
          )}

        </div>

        <button
          className="primary-btn"
          style={{
            marginTop: '20px',
            width: '100%'
          }}
          onClick={calc}
          disabled={ratesLoading}
        >

          {ratesLoading
            ? '⏳ Loading rates...'
            : 'Calculate Zakat'
          }

        </button>

      </div>

      {/* ── Result ──────────────────────────── */}
      {result && (

        <div className="card result-card fade-up">

          <h3
            style={{
              color: 'var(--gold)',
              marginBottom: '16px',
              fontSize: '15px'
            }}
          >
            📊 Zakat Summary
          </h3>

          <div className="zakat-summary">

            <div className="summary-row">
              <span>Total Assets</span>
              <span>
                {formatAmount(
                  result.totalAssets,
                  currency.symbol
                )}
              </span>
            </div>

            <div className="summary-row">
              <span>Total Liabilities</span>
              <span>
                −{formatAmount(
                  result.totalLiabilities,
                  currency.symbol
                )}
              </span>
            </div>

            <div className="summary-row total">
              <span>Zakatable Wealth</span>
              <span>
                {formatAmount(
                  result.zakatable,
                  currency.symbol
                )}
              </span>
            </div>

            <div className="summary-row">
              <span>Nisab Threshold</span>
              <span>
                {formatAmount(
                  nisab,
                  currency.symbol
                )}
              </span>
            </div>

          </div>

          <div
            className={`zakat-result ${
              result.eligible
                ? 'eligible'
                : 'not-eligible'
            }`}
          >

            {result.eligible ? (
              <>
                🌙 Zakat Due:{' '}
                <strong>
                  {formatAmount(
                    result.zakat,
                    currency.symbol
                  )}
                </strong>

                <div
                  style={{
                    fontSize: '12px',
                    marginTop: '4px',
                    opacity: 0.8
                  }}
                >
                  2.5% of zakatable wealth
                </div>
              </>
            ) : (
              <>
                ✅ No Zakat due — your wealth is below the Nisab threshold
              </>
            )}

          </div>

          <div className="result-footnote">

            Gold rate used:{' '}

            {formatAmount(
              goldPerGram,
              currency.symbol
            )}

            /gram · 1 USD = {

              (fxRates[currencyCode] ?? 1)
                .toLocaleString()

            } {currencyCode}

          </div>

        </div>
      )}

    </div>
  );
}