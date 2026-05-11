import React, { useState, useEffect, useRef } from 'react';
import './Common.css';

export default function QuranExplorer() {
  const [surahs, setSurahs] = useState([]);
  const [selected, setSelected] = useState('');
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(true);
  const [listCollapsed, setListCollapsed] = useState(false);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const searchRef = useRef(null);
  const audioRef = useRef(null);

  // Load Surahs
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => setSurahs(d.data || []))
      .catch(() => setSurahs([]));
  }, []);

  // Stop audio ONLY when changing Surah
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [selected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  async function toggleAudio() {
    if (!selected) return;

    // If audio already exists
    if (audioRef.current) {
      try {
        if (audioPlaying) {
          // Pause ONLY (do not reset)
          audioRef.current.pause();
          setAudioPlaying(false);
        } else {
          // Resume from paused position
          await audioRef.current.play();
          setAudioPlaying(true);
        }
      } catch (err) {
        console.error(err);
      }

      return;
    }

    const surahNum = String(selected).padStart(3, '0');

    const primaryUrl =
      `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahNum}.mp3`;

    const fallbackUrl =
      `https://server8.mp3quran.net/afs/${surahNum}.mp3`;

    setAudioLoading(true);
    setAudioError(false);

    // Stop global audio
    if (window.currentQuranAudio) {
      window.currentQuranAudio.pause();
      window.currentQuranAudio.src = '';
    }

    const audio = new Audio();

    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    audioRef.current = audio;
    window.currentQuranAudio = audio;

    audio.onplaying = () => {
      setAudioLoading(false);
      setAudioPlaying(true);
    };

    audio.onpause = () => {
      setAudioPlaying(false);
    };

    audio.onended = () => {
      setAudioPlaying(false);
      setAudioLoading(false);

      audio.currentTime = 0;
    };

    audio.onerror = async () => {
      // Try fallback once
      if (audio.src !== fallbackUrl) {
        try {
          audio.src = fallbackUrl;
          audio.load();

          await audio.play();
        } catch (err) {
          console.error(err);

          setAudioError(true);
          setAudioLoading(false);
          setAudioPlaying(false);
        }
      } else {
        setAudioError(true);
        setAudioLoading(false);
        setAudioPlaying(false);
      }
    };

    try {
      audio.src = primaryUrl;
      audio.load();

      await audio.play();
    } catch (err) {
      console.error(err);

      setAudioError(true);
      setAudioLoading(false);
      setAudioPlaying(false);
    }
  }

  const filtered = surahs.filter(
    s =>
      s.englishName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      String(s.number).includes(search)
  );

  const currentSurah = surahs.find(
    s => s.number === Number(selected)
  );

  const displayList = searchOpen
    ? filtered
    : surahs;

  async function loadSurah(num) {
    // Stop previous audio when changing surah
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setAudioPlaying(false);
    setAudioLoading(false);
    setAudioError(false);

    setSelected(num);
    setLoading(true);

    setSearchOpen(false);
    setSearch('');
    setListCollapsed(true);

    try {
      const [arRes, enRes] = await Promise.all([
        fetch(
          `https://api.alquran.cloud/v1/surah/${num}`
        ),
        fetch(
          `https://api.alquran.cloud/v1/surah/${num}/en.asad`
        )
      ]);

      const [arData, enData] =
        await Promise.all([
          arRes.json(),
          enRes.json()
        ]);

      const combined =
        arData.data.ayahs.map((a, i) => ({
          number: a.numberInSurah,
          arabic: a.text,
          english:
            enData.data.ayahs[i]?.text || ''
        }));

      setVerses(combined);
    } catch (err) {
      console.error(err);
      setVerses([]);
    }

    setLoading(false);
  }

  return (
    <div className="feature-page quran-layout">
      <div className="page-header">
        <h1>📖 Quran Explorer</h1>

        <p>
          Read every Surah with Arabic text
          and English translation
        </p>
      </div>

      <div className="quran-container">
        {/* LEFT PANEL */}
        <div
          className={`surah-list-panel ${
            listCollapsed ? 'collapsed' : ''
          }`}
        >
          <div className="search-bar-row">
            {searchOpen ? (
              <input
                ref={searchRef}
                className="feature-input"
                placeholder="🔍 Search surahs..."
                value={search}
                onChange={e =>
                  setSearch(e.target.value)
                }
                autoFocus
              />
            ) : (
              <button
                className="search-toggle-btn"
                onClick={() => {
                  setSearchOpen(true);
                  setListCollapsed(false);

                  setTimeout(() => {
                    searchRef.current?.focus();
                  }, 50);
                }}
              >
                🔍{' '}
                {listCollapsed
                  ? 'Search / Browse'
                  : 'Search'}
              </button>
            )}

            {searchOpen && (
              <button
                className="search-close-btn"
                onClick={() => {
                  setSearchOpen(false);
                  setSearch('');
                }}
                title="Close search"
              >
                ✕
              </button>
            )}

            {selected && !searchOpen && (
              <button
                className="search-close-btn"
                onClick={() =>
                  setListCollapsed(c => !c)
                }
                title={
                  listCollapsed
                    ? 'Expand list'
                    : 'Collapse list'
                }
              >
                {listCollapsed ? '▶' : '◀'}
              </button>
            )}
          </div>

          {(!listCollapsed || searchOpen) && (
            <div className="surah-list">
              {displayList.map(s => (
                <button
                  key={s.number}
                  className={`surah-item ${
                    selected === s.number
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    loadSurah(s.number)
                  }
                >
                  <div className="surah-num">
                    {s.number}
                  </div>

                  <div className="surah-info">
                    <div className="surah-en">
                      {s.englishName}
                    </div>

                    <div className="surah-ar arabic">
                      {s.name}
                    </div>
                  </div>

                  <div className="surah-meta">
                    {s.numberOfAyahs} ayahs
                  </div>
                </button>
              ))}
            </div>
          )}

          {listCollapsed && !searchOpen && (
            <div
              className="collapsed-hint"
              onClick={() =>
                setListCollapsed(false)
              }
            >
              <span>📋</span>
              <span>All Surahs</span>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="verses-panel">
          {!selected && (
            <div className="empty-state">
              <div
                style={{ fontSize: '60px' }}
              >
                📖
              </div>

              <p>
                Select a Surah to begin
                reading
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading Surah...</p>
            </div>
          )}

          {selected &&
            !loading &&
            currentSurah && (
              <>
                <div className="surah-header-display">
                  <div className="surah-title-ar arabic">
                    {currentSurah.name}
                  </div>

                  <div className="surah-title-en">
                    {
                      currentSurah.englishName
                    }{' '}
                    ·{' '}
                    {
                      currentSurah.englishNameTranslation
                    }
                  </div>

                  <div className="bismillah arabic">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ
                    الرَّحِيمِ
                  </div>

                  <button
                    className={`audio-btn ${
                      audioPlaying
                        ? 'playing'
                        : ''
                    }`}
                    onClick={toggleAudio}
                    disabled={audioLoading}
                  >
                    {audioLoading ? (
                      <>
                        <span className="audio-spinner" />{' '}
                        Loading audio…
                      </>
                    ) : audioPlaying ? (
                      <>⏸ Pause Recitation</>
                    ) : (
                      <>▶ Play Recitation</>
                    )}
                  </button>

                  {audioPlaying && (
                    <div className="audio-reciter">
                      🎙 Mishary Alafasy
                    </div>
                  )}

                  {audioError && (
                    <div
                      style={{
                        marginTop: '10px',
                        color: '#ff6b6b'
                      }}
                    >
                     
                    </div>
                  )}
                </div>

                <div className="verses-list">
                  {verses.map(v => (
                    <div
                      key={v.number}
                      className="verse-card"
                    >
                      <div className="verse-num">
                        {v.number}
                      </div>

                      <div className="verse-content">
                        <p className="verse-arabic arabic">
                          {v.arabic}
                        </p>

                        <p className="verse-english">
                          {v.english}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
