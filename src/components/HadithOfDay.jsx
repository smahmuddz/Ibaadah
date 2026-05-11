import React, { useState, useEffect } from 'react';
import './Common.css';

const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY;

const COLLECTIONS = [
  'Sahih Bukhari',
  'Sahih Muslim',
  'Abu Dawud',
  'Tirmidhi',
  'Ibn Majah',
  'Nasai',
  'Malik',
];

export default function HadithOfDay() {
  const [hadith, setHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  async function fetchHadith(t = '') {
    setLoading(true);
    setHadith(null);
    setError('');

    const collection =
      COLLECTIONS[
        Math.floor(Math.random() * COLLECTIONS.length)
      ];

    const prompt = t
      ? `
Share ONE short authentic hadith about "${t}" from ${collection}.

Rules:
- Keep the response concise
- Include:
1. Hadith text
2. Source reference
3. Short lesson (1-2 sentences)
- Use clean formatting
`
      : `
Share ONE inspiring authentic hadith from ${collection}.

Rules:
- Keep the response concise
- Include:
1. Hadith text
2. Source reference
3. Short lesson (1-2 sentences)
- Make it uplifting and relevant to daily Muslim life
`;

    try {
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_KEY}`,
          },

          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',

            messages: [
              {
                role: 'system',
                content:
                  'You are an Islamic scholar assistant. Only provide authentic hadith references and keep responses concise.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],

            temperature: 0.7,
            max_tokens: 350,
          }),
        }
      );

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();

      const content =
        data?.choices?.[0]?.message?.content;

      setHadith({
        text:
          content ||
          'Could not load hadith at the moment.',
        collection,
      });
    } catch (err) {
      console.error(err);

      setError(
        'Failed to fetch hadith. Please try again.'
      );

      setHadith({
        text:
          'Connection error. Please check your internet or API key.',
        collection,
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchHadith();
  }, []);

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1>📜 Hadith of the Day</h1>

        <p>
          Authentic sayings of Prophet Muhammad ﷺ
          to guide your day
        </p>
      </div>

      <div className="card feature-card">
        <div className="input-row">
          <input
            className="feature-input"
            placeholder="Topic (e.g. patience, kindness, prayer)"
            value={topic}
            onChange={(e) =>
              setTopic(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchHadith(topic);
              }
            }}
          />

          <button
            className="primary-btn"
            onClick={() => fetchHadith(topic)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'New Hadith'}
          </button>
        </div>

        {error && (
          <p
            style={{
              marginTop: '10px',
              color: '#ef4444',
              fontSize: '14px',
            }}
          >
            {error}
          </p>
        )}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />

          <p>Loading hadith...</p>
        </div>
      )}

      {hadith && !loading && (
        <div className="card hadith-card fade-up">
          <div className="hadith-decoration">
            📜
          </div>

          <div className="hadith-source-badge">
            {hadith.collection}
          </div>

          <div
            className="hadith-text"
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
            }}
          >
            {hadith.text}
          </div>

          <div className="hadith-footer">
            Prophet Muhammad ﷺ ·{' '}
            {hadith.collection}
          </div>
        </div>
      )}
    </div>
  );
}