import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Chatbot from './components/Chatbot';
import PrayerTimes from './components/PrayerTimes';
import QiblaFinder from './components/QiblaFinder';
import QuranExplorer from './components/QuranExplorer';
import DuaGenerator from './components/DuaGenerator';
import ZakatCalculator from './components/ZakatCalculator';
import HadithOfDay from './components/HadithOfDay';
import IslamicCalendar from './components/IslamicCalendar';
import './App.css';

const PAGES = {
  chat: Chatbot,
  prayer: PrayerTimes,
  qibla: QiblaFinder,
  quran: QuranExplorer,
  dua: DuaGenerator,
  zakat: ZakatCalculator,
  hadith: HadithOfDay,
  calendar: IslamicCalendar,
};

export default function App() {
  const [activePage, setActivePage] = useState('chat');
  const [theme, setTheme] = useState('light');
  const PageComponent = PAGES[activePage];

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="main-content">
        <PageComponent />
      </main>
      <BottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}