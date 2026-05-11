import React from 'react';
import './Sidebar.css';

export const NAV = [
  { id: 'chat',     icon: '🕌', label: 'Islamic Scholar'   },
  { id: 'prayer',   icon: '⏰', label: 'Prayer Times'      },
  { id: 'qibla',    icon: '🧭', label: 'Qibla Direction'   },
  { id: 'quran',    icon: '📖', label: 'Quran Explorer'    },
  { id: 'dua',      icon: '🤲', label: 'Dua Finder'        },
  { id: 'zakat',    icon: '💰', label: 'Zakat Calculator'  },
  { id: 'hadith',   icon: '📜', label: 'Daily Hadith'      },
  { id: 'calendar', icon: '📅', label: 'Hijri Calendar'    },
];

export default function Sidebar({ activePage, setActivePage, theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div>
          <div className="logo-title">Ibaadah</div>
          <div className="logo-arabic">بسم الله الرحمن الرحيم</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activePage === item.id && <span className="nav-pip" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme}>
          <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="footer-quote">"Seek knowledge from the cradle to the grave"</div>
      </div>
    </aside>
  );
}