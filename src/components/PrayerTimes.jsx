import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import './Common.css';

const PRAYERS = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

const ICONS = {
  Fajr: '🌄',
  Sunrise: '☀️',
  Dhuhr: '🌞',
  Asr: '🌤',
  Maghrib: '🌅',
  Isha: '🌙',
};

async function fetchCitySuggestions(
  query
) {
  if (!query || query.length < 2)
    return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=6&language=en&format=json`
    );

    const data = await res.json();

    if (!data.results) return [];

    return data.results.map((r) => ({
      city: r.name,
      country: r.country,
      country_code: r.country_code,
      latitude: r.latitude,
      longitude: r.longitude,
      display: `${r.name}, ${r.country}`,
    }));
  } catch {
    return [];
  }
}

export default function PrayerTimes() {
  const [query, setQuery] =
    useState('');

  const [selected, setSelected] =
    useState(null);

  const [suggestions, setSuggestions] =
    useState([]);

  const [showDropdown, setShowDropdown] =
    useState(false);

  const [times, setTimes] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [locationName, setLocationName] =
    useState('');

  const [date] = useState(new Date());

  const debounceRef = useRef(null);

  const wrapperRef = useRef(null);

  // AUTO DETECT USER LOCATION
  useEffect(() => {
    getCurrentLocationPrayerTimes();
  }, []);

  async function getCurrentLocationPrayerTimes() {
    if (!navigator.geolocation) {
      setError(
        'Geolocation not supported.'
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        try {
          // Fetch prayer times using coordinates
          const res = await fetch(
            `https://api.aladhan.com/v1/timings/${Math.floor(
              Date.now() / 1000
            )}?latitude=${latitude}&longitude=${longitude}&method=2`
          );

          const data =
            await res.json();

          setTimes(data.data);

          // Reverse geocode location name
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );

          const geoData =
            await geo.json();

          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.address?.state ||
            'Your Location';

          const country =
            geoData.address?.country ||
            '';

          const fullLocation = `${city}, ${country}`;

          setLocationName(
            fullLocation
          );

          setQuery(fullLocation);
        } catch (err) {
          console.error(err);

          setError(
            'Failed to fetch prayer times.'
          );
        }

        setLoading(false);
      },

      () => {
        setError(
          'Location access denied.'
        );

        setLoading(false);
      },

      {
        enableHighAccuracy: true,
      }
    );
  }

  // SEARCH SUGGESTIONS
  useEffect(() => {
    if (debounceRef.current)
      clearTimeout(
        debounceRef.current
      );

    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current =
      setTimeout(async () => {
        const results =
          await fetchCitySuggestions(
            query
          );

        setSuggestions(results);

        setShowDropdown(
          results.length > 0
        );
      }, 300);
  }, [query]);

  // OUTSIDE CLICK
  useEffect(() => {
    function handleClick(e) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          e.target
        )
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClick
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClick
      );
  }, []);

  // FETCH PRAYER TIMES BY CITY
  async function fetchTimes(
    cityName,
    countryName
  ) {
    if (!cityName) return;

    setLoading(true);

    setError('');

    try {
      const d = date;

      const dateStr = `${String(
        d.getDate()
      ).padStart(2, '0')}-${String(
        d.getMonth() + 1
      ).padStart(
        2,
        '0'
      )}-${d.getFullYear()}`;

      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(
          cityName
        )}&country=${encodeURIComponent(
          countryName || ''
        )}&method=2`
      );

      const data =
        await res.json();

      if (data.code !== 200) {
        throw new Error(
          'City not found'
        );
      }

      setTimes(data.data);

      setLocationName(
        `${cityName}, ${countryName}`
      );
    } catch {
      setError(
        'Could not fetch prayer times.'
      );
    }

    setLoading(false);
  }

  function handleSelect(
    suggestion
  ) {
    setQuery(suggestion.display);

    setSelected(suggestion);

    setShowDropdown(false);

    fetchTimes(
      suggestion.city,
      suggestion.country
    );
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      setShowDropdown(false);

      if (selected) {
        fetchTimes(
          selected.city,
          selected.country
        );
      } else {
        fetchTimes(query, '');
      }
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  const now = new Date();

  function isNextPrayer(name) {
    if (!times) return false;

    const timeStr =
      times.timings[name];

    if (!timeStr) return false;

    const [h, m] = timeStr
      .split(':')
      .map(Number);

    const prayerMinutes =
      h * 60 + m;

    const nowMinutes =
      now.getHours() * 60 +
      now.getMinutes();

    return (
      prayerMinutes > nowMinutes
    );
  }

  const nextPrayerName =
    PRAYERS.find((p) =>
      isNextPrayer(p)
    );

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1>🕌 Prayer Times</h1>

        <p>
          Auto-detects your local
          prayer times using GPS
        </p>
      </div>

      <div className="card feature-card">
        <div
          className="input-row"
          ref={wrapperRef}
          style={{
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: 1,
            }}
          >
            <input
              className="feature-input"
              placeholder="Search another city..."
              value={query}
              onChange={(e) => {
                setQuery(
                  e.target.value
                );

                setSelected(null);
              }}
              onKeyDown={
                handleKeyDown
              }
              onFocus={() =>
                suggestions.length >
                  0 &&
                setShowDropdown(true)
              }
              autoComplete="off"
              style={{
                width: '100%',
              }}
            />

            {showDropdown && (
              <ul
                style={{
                  position:
                    'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background:
                    '#111827',
                  border:
                    '1px solid #374151',
                  borderRadius:
                    '12px',
                  marginTop: '6px',
                  padding: '6px 0',
                  listStyle:
                    'none',
                  zIndex: 100,
                  boxShadow:
                    '0 8px 24px rgba(0,0,0,0.35)',
                  maxHeight:
                    '220px',
                  overflowY:
                    'auto',
                  color:
                    '#f9fafb',
                }}
              >
                {suggestions.map(
                  (s, i) => (
                    <li
                      key={i}
                      onMouseDown={() =>
                        handleSelect(
                          s
                        )
                      }
                      style={{
                        padding:
                          '12px 16px',
                        cursor:
                          'pointer',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '10px',
                        fontSize:
                          '14px',
                        transition:
                          'all 0.15s ease',
                        color:
                          '#f3f4f6',
                      }}
                      onMouseEnter={(
                        e
                      ) =>
                        (e.currentTarget.style.background =
                          '#1f2937')
                      }
                      onMouseLeave={(
                        e
                      ) =>
                        (e.currentTarget.style.background =
                          'transparent')
                      }
                    >
                      <span>
                        📍
                      </span>

                      <span>
                        <strong>
                          {s.city}
                        </strong>

                        <span
                          style={{
                            color:
                              '#9ca3af',
                            marginLeft:
                              '6px',
                          }}
                        >
                          {
                            s.country
                          }
                        </span>
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          <button
            className="primary-btn"
            onClick={
              getCurrentLocationPrayerTimes
            }
            disabled={loading}
          >
            {loading
              ? '...'
              : '📍 My Location'}
          </button>
        </div>

        {locationName && (
          <p
            style={{
              marginTop: '12px',
              color:
                'var(--muted)',
              fontSize: '14px',
            }}
          >
            Current Location:{' '}
            <strong>
              {locationName}
            </strong>
          </p>
        )}

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}
      </div>

      {times && (
        <div className="prayer-grid fade-up">
          {PRAYERS.map((name) => {
            const t =
              times.timings[name];

            const isNext =
              name ===
              nextPrayerName;

            return (
              <div
                key={name}
                className={`prayer-card ${
                  isNext
                    ? 'next-prayer'
                    : ''
                }`}
              >
                <div className="prayer-icon">
                  {ICONS[name]}
                </div>

                <div className="prayer-name">
                  {name}
                </div>

                <div className="prayer-time">
                  {t}
                </div>

                {isNext && (
                  <div className="next-badge">
                    Next ›
                  </div>
                )}
              </div>
            );
          })}

          <div className="prayer-card info-card">
            <div className="prayer-icon">
              📍
            </div>

            <div className="prayer-name">
              {times.meta.timezone}
            </div>

            <div
              className="prayer-time"
              style={{
                fontSize:
                  '12px',
                color:
                  'var(--muted)',
              }}
            >
              {
                times.date
                  .readable
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}