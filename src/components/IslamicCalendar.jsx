import React, { useState, useEffect } from 'react';
import './Common.css';

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(
    2,
    '0'
  );
  const d = String(date.getDate()).padStart(
    2,
    '0'
  );

  return `${y}-${m}-${d}`;
}

export default function IslamicCalendar() {
  const [selectedDate, setSelectedDate] = useState(
    toDateInputValue(new Date())
  );

  const [hijriData, setHijriData] =
    useState(null);

  const [todayHijri, setTodayHijri] =
    useState(null);

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(false);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  // Load today's Hijri date
  useEffect(() => {
    convertDate(
      toDateInputValue(new Date()),
      true
    );

    fetchUpcomingIslamicDates();
  }, []);

  async function convertDate(
    dateStr,
    isToday = false
  ) {
    if (!dateStr) return;

    setLoading(true);

    const [y, m, d] = dateStr.split('-');

    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/gToH/${d}-${m}-${y}`
      );

      const data = await res.json();

      const hijri = data.data?.hijri;

      if (isToday) {
        setTodayHijri(hijri);
      }

      setHijriData(hijri);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  // Fetch upcoming Islamic events dynamically
  async function fetchUpcomingIslamicDates() {
    setEventsLoading(true);

    try {
      const today = new Date();

      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      // Fetch current & next month
      const requests = [
        fetch(
          `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`
        ),

        fetch(
          `https://api.aladhan.com/v1/gToHCalendar/${
            month === 12 ? 1 : month + 1
          }/${month === 12 ? year + 1 : year}`
        ),
      ];

      const responses = await Promise.all(
        requests
      );

      const jsons = await Promise.all(
        responses.map((r) => r.json())
      );

      const allDays = jsons.flatMap(
        (j) => j.data || []
      );

      // Keep only days with Islamic holidays
      const importantDays = allDays
        .filter(
          (d) =>
            d.hijri?.holidays &&
            d.hijri.holidays.length > 0
        )
        .map((d) => ({
          name: d.hijri.holidays[0],
          hijri: `${d.hijri.day} ${d.hijri.month.en} ${d.hijri.year} AH`,
          gregorian: `${d.gregorian.day} ${d.gregorian.month.en} ${d.gregorian.year}`,
          emoji: getEmoji(
            d.hijri.holidays[0]
          ),
        }));

      setEvents(importantDays);
    } catch (err) {
      console.error(err);
    }

    setEventsLoading(false);
  }

  function getEmoji(name) {
    const lower = name.toLowerCase();

    if (lower.includes('ramadan'))
      return '🌙';

    if (lower.includes('eid'))
      return '🎉';

    if (lower.includes('hajj'))
      return '🕋';

    if (lower.includes('arafah'))
      return '🤲';

    if (lower.includes('ashura'))
      return '✨';

    return '⭐';
  }

  function handleDateChange(e) {
    setSelectedDate(e.target.value);

    convertDate(e.target.value);
  }

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1>📅 Hijri Calendar</h1>

        <p>
          Islamic date converter & important
          events
        </p>
      </div>

      {/* Today Card */}
      {todayHijri && (
        <div className="card today-hijri-card fade-up">
          <div className="today-badge">
            Today
          </div>

          <div className="today-hijri-ar arabic">
            {todayHijri.day}{' '}
            {todayHijri.month.ar}{' '}
            {todayHijri.year}
          </div>

          <div className="today-hijri-en">
            {todayHijri.day}{' '}
            {todayHijri.month.en}{' '}
            {todayHijri.year} AH
          </div>

          {todayHijri.holidays?.length >
            0 && (
            <div className="today-event-badge">
              🌙{' '}
              {todayHijri.holidays[0]}
            </div>
          )}
        </div>
      )}

      {/* Converter */}
      <div className="card feature-card">
        <h3 className="section-title">
          Convert Any Date
        </h3>

        <div className="converter-row">
          <div className="converter-field">
            <label className="field-label">
              Gregorian Date
            </label>

            <input
              type="date"
              className="feature-input"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>

          {loading && (
            <div className="conv-loading">
              ⏳
            </div>
          )}

          {hijriData && !loading && (
            <div className="converter-result">
              <div className="conv-arrow">
                →
              </div>

              <div className="conv-hijri">
                <div className="conv-hijri-ar arabic">
                  {hijriData.day}{' '}
                  {hijriData.month.ar}{' '}
                  {hijriData.year}
                </div>

                <div className="conv-hijri-en">
                  {hijriData.day}{' '}
                  {hijriData.month.en}{' '}
                  {hijriData.year} AH
                </div>

                {hijriData.holidays
                  ?.length > 0 && (
                  <div className="conv-holiday">
                    🌙{' '}
                    {
                      hijriData.holidays[0]
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Islamic Events */}
      <div className="card feature-card">
        <h3 className="section-title">
          Upcoming Events
        </h3>

        {eventsLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading events...</p>
          </div>
        ) : (
          <div className="events-list">
            {events.length > 0 ? (
              events.map((e, i) => (
                <div
                  key={i}
                  className="event-item"
                >
                  <span className="event-emoji">
                    {e.emoji}
                  </span>

                  <div className="event-info">
                    <div className="event-name">
                      {e.name}
                    </div>

                    <div className="event-hijri">
                      {e.hijri}
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        opacity: 0.7,
                        marginTop: '2px',
                      }}
                    >
                      {e.gregorian}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>
                No upcoming events found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}