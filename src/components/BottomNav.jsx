import React from 'react';
import './BottomNav.css';

// Show only 5 most important on mobile bottom bar
const PRIMARY = [
  { id: 'chat',     icon: '🕌', label: 'Scholar'  },
  { id: 'prayer',   icon: '⏰', label: 'Prayer'   },
  { id: 'quran',    icon: '📖', label: 'Quran'    },
  { id: 'dua',      icon: '🤲', label: 'Dua'      },
  { id: 'more',     icon: '⋯',  label: 'More'     },
];

const MORE = [
  { id: 'qibla',    icon: '🧭', label: 'Qibla'    },
  { id: 'zakat',    icon: '💰', label: 'Zakat'    },
  { id: 'hadith',   icon: '📜', label: 'Hadith'   },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
];

export default function BottomNav({ activePage, setActivePage, theme, toggleTheme }) {
  const [showMore, setShowMore] = React.useState(false);
  const isMoreActive = MORE.some(m => m.id === activePage);

  function pick(id) {
    setActivePage(id);
    setShowMore(false);
  }

  return (
    <>
      {showMore && (
        <div className="more-drawer">
          <div className="more-drawer-inner">
            {MORE.map(item => (
              <button key={item.id} className={`more-item ${activePage === item.id ? 'active' : ''}`} onClick={() => pick(item.id)}>
                <span className="more-icon">{item.icon}</span>
                <span className="more-label">{item.label}</span>
              </button>
            ))}
            <button
              className="more-item theme-toggle-item"
              onClick={() => { toggleTheme(); setShowMore(false); }}
            >
              <span className="more-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="more-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      )}
      {showMore && <div className="more-overlay" onClick={() => setShowMore(false)} />}

      <nav className="bottom-nav">
        {PRIMARY.map(item => {
          if (item.id === 'more') {
            return (
              <button key="more" className={`bottom-tab ${(showMore || isMoreActive) ? 'active' : ''}`} onClick={() => setShowMore(v => !v)}>
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
              </button>
            );
          }
          return (
            <button key={item.id} className={`bottom-tab ${activePage === item.id ? 'active' : ''}`} onClick={() => pick(item.id)}>
              <span className="tab-icon">{item.icon}</span>
              <span className="tab-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}