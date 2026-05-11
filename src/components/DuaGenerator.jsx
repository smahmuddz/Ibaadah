import React, { useState } from 'react';
import './Common.css';
import './DuaGenerator.css';

const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY;

const SITUATIONS = [
  'Anxiety & Stress',
  'Before Eating',
  'Before Sleeping',
  'Seeking Forgiveness',
  'Traveling',
  'Illness & Recovery',
  'Gratitude',
  'Before Exams',
  'For Parents',
  'Seeking Rizq (Provision)',
];

export default function DuaGenerator() {

  const [situation, setSituation] = useState('');
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Generate Dua ───────────────────────────────
  async function generateDua(customSituation) {

    const currentSituation =
      customSituation || situation;

    if (!currentSituation) return;

    setLoading(true);
    setError('');
    setDuas([]);

    try {

      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`,
          },

          body: JSON.stringify({

            model: 'llama-3.3-70b-versatile',

            temperature: 0.5,

            max_tokens: 1200,

            response_format: {
              type: 'json_object'
            },

            messages: [

              {
                role: 'system',
                content:
`
You are an Islamic dua assistant.

Return ONLY valid JSON.

Format:
{
  "duas": [
    {
      "title": "",
      "arabic": "",
      "transliteration": "",
      "translation": "",
      "source": ""
    }
  ]
}

Rules:
- Return 2-3 authentic duas
- Arabic must be correct
- Include Quran or Hadith source
- No markdown
- No explanations outside JSON
`
              },

              {
                role: 'user',
                content:
`Provide authentic duas for:
"${currentSituation}"`
              }
            ]
          }),
        }
      );

      const data = await res.json();

      const raw =
        data?.choices?.[0]?.message?.content;

      const parsed = JSON.parse(raw);

      setDuas(parsed.duas || []);

    } catch (err) {

      console.error(err);

      setError(
        'Could not generate duas. Please try again.'
      );
    }

    setLoading(false);
  }

  return (

    <div className="feature-page">

      {/* ── Header ───────────────────────── */}
      <div className="page-header">

        <h1>
          🤲 Dua Generator
        </h1>

        <p>
          Find authentic duas for any situation in your life
        </p>

      </div>

      {/* ── Input Card ───────────────────── */}
      <div className="card feature-card">

        <p
          style={{
            color: 'var(--muted)',
            marginBottom: '14px',
            fontSize: '13px'
          }}
        >
          Choose a situation or type your own:
        </p>

        {/* Chips */}
        <div className="situation-chips">

          {SITUATIONS.map(s => (

            <button
              key={s}
              className={`situation-chip ${
                situation === s ? 'active' : ''
              }`}
              onClick={() => setSituation(s)}
            >
              {s}
            </button>

          ))}

        </div>

        {/* Input */}
        <div
          className="input-row"
          style={{
            marginTop: '16px'
          }}
        >

          <input
            className="feature-input"
            placeholder="Or describe your situation..."
            value={situation}
            onChange={e =>
              setSituation(e.target.value)
            }
          />

          <button
            className="primary-btn"
            onClick={() => generateDua()}
            disabled={loading || !situation}
          >

            {loading
              ? '🤲 Generating...'
              : 'Find Duas'
            }

          </button>

        </div>

      </div>

      {/* ── Error ────────────────────────── */}
      {error && (

        <div
          className="card"
          style={{
            marginTop: '20px',
            color: '#ff6b6b'
          }}
        >
          {error}
        </div>
      )}

      {/* ── Results ──────────────────────── */}
      {duas.length > 0 && (

        <div className="dua-results">

          {duas.map((dua, index) => (

            <div
              key={index}
              className="card result-card fade-up dua-card"
            >

              {/* Title */}
              <div className="dua-title">

                🤍 {dua.title || `Dua ${index + 1}`}

              </div>

              {/* Arabic */}
              <div className="dua-section">

                <div className="dua-label">
                  Arabic
                </div>

                <div className="dua-arabic arabic">
                  {dua.arabic}
                </div>

              </div>

              {/* Transliteration */}
              <div className="dua-section">

                <div className="dua-label">
                  Transliteration
                </div>

                <div className="dua-transliteration">
                  {dua.transliteration}
                </div>

              </div>

              {/* Translation */}
              <div className="dua-section">

                <div className="dua-label">
                  English Translation
                </div>

                <div className="dua-translation">
                  {dua.translation}
                </div>

              </div>

              {/* Source */}
              <div className="dua-source">

                📚 {dua.source}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}