import React, { useEffect, useRef, useState } from 'react';
import './Common.css';

export default function QiblaFinder() {
  const [qibla, setQibla] = useState(null);
  const [heading, setHeading] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('');

  const orientationHandler = useRef(null);

  async function findQibla() {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          // Qibla API
          const res = await fetch(
            `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`
          );

          const data = await res.json();

          setQibla(data.data.direction);

          // Reverse Geocoding
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );

          const geoData = await geo.json();

          setLocation(
            geoData.address?.city ||
              geoData.address?.town ||
              geoData.address?.village ||
              'Your Location'
          );

          // Start live compass
          await startCompass();

        } catch (err) {
          console.log(err);

          setError(
            'Failed to calculate Qibla direction.'
          );
        }

        setLoading(false);
      },

      () => {
        setError(
          'Location access denied. Please enable GPS.'
        );

        setLoading(false);
      },

      {
        enableHighAccuracy: true,
      }
    );
  }

  async function startCompass() {
    // iPhone permission
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission ===
        'function'
    ) {
      try {
        const permission =
          await DeviceOrientationEvent.requestPermission();

        if (permission !== 'granted') {
          setError(
            'Compass permission denied.'
          );
          return;
        }
      } catch {
        setError(
          'Compass permission denied.'
        );
        return;
      }
    }

    const handleOrientation = (event) => {
      let compass = 0;

      // iOS
      if (event.webkitCompassHeading) {
        compass = event.webkitCompassHeading;
      }

      // Android
      else if (event.alpha !== null) {
        compass = 360 - event.alpha;
      }

      compass = (compass + 360) % 360;

      setHeading(compass);
    };

    orientationHandler.current =
      handleOrientation;

    window.addEventListener(
      'deviceorientationabsolute',
      handleOrientation,
      true
    );

    window.addEventListener(
      'deviceorientation',
      handleOrientation,
      true
    );
  }

  useEffect(() => {
    return () => {
      if (orientationHandler.current) {
        window.removeEventListener(
          'deviceorientationabsolute',
          orientationHandler.current
        );

        window.removeEventListener(
          'deviceorientation',
          orientationHandler.current
        );
      }
    };
  }, []);

  // LIVE QIBLA DIRECTION
  const liveQiblaRotation =
    qibla !== null
      ? (qibla - heading + 360) % 360
      : 0;

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1>🧭 Live Qibla Compass</h1>

        <p>
          Real-time compass using your
          device GPS & sensors
        </p>
      </div>

      <div className="card feature-card centered">
        {qibla === null ? (
          <>
            <div className="qibla-illustration">
              🕋
            </div>

            <p
              style={{
                color: 'var(--muted)',
                marginBottom: '20px',
              }}
            >
              Allow GPS and compass access
              to find the live Qibla direction
            </p>

            <button
              className="primary-btn"
              onClick={findQibla}
              disabled={loading}
            >
              {loading
                ? '📡 Starting Compass...'
                : '🧭 Start Live Compass'}
            </button>

            {error && (
              <p
                className="error-text"
                style={{ marginTop: '12px' }}
              >
                {error}
              </p>
            )}
          </>
        ) : (
          <div className="qibla-result fade-up">
            <p className="qibla-location">
              📍 {location}
            </p>

            {/* REAL COMPASS */}
            <div className="compass-container">
              <div className="compass-ring">

                {/* ROTATING COMPASS FACE */}
                <div
                  className="compass-face"
                  style={{
                    transform: `rotate(-${heading}deg)`,
                    transition:
                      'transform 0.12s linear',
                  }}
                >
                  {[
                    'N',
                    'NE',
                    'E',
                    'SE',
                    'S',
                    'SW',
                    'W',
                    'NW',
                  ].map((d, i) => (
                    <div
                      key={d}
                      className="compass-label"
                      style={{
                        transform: `
                          rotate(${i * 45}deg)
                          translateY(-110px)
                          rotate(-${i * 45}deg)
                        `,
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* FIXED QIBLA POINTER */}
                <div
                  className="compass-arrow"
                  style={{
                    transform: `rotate(${liveQiblaRotation}deg)`,
                    transition:
                      'transform 0.12s linear',
                  }}
                >
                  <div className="arrow-line"></div>

                  <div className="arrow-kaaba">
                    🕋
                  </div>
                </div>

                {/* CENTER */}
                <div className="compass-center">
                  ☪
                </div>
              </div>
            </div>

            <div className="qibla-degree">
              Qibla Direction:{' '}
              {Math.round(qibla)}°
            </div>

            <div className="qibla-degree">
              Device Heading:{' '}
              {Math.round(heading)}°
            </div>

            <p className="qibla-note">
              Rotate yourself until the
              Kaaba icon points straight up
            </p>

            <button
              className="secondary-btn"
              onClick={() => {
                setQibla(null);
                setHeading(0);
                setError('');
              }}
            >
              Recalculate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}