import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { ROLES } from '../constants';
import { useAppContext } from '../App';

interface HeaderProps {
  onNewRequest: () => void;
  onToggleSettings: () => void;
  onToggleReports: () => void;
  onToggleAIChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewRequest, onToggleSettings, onToggleReports, onToggleAIChat }) => {
  const { t } = useTranslation();
  const { currentUser: user, handleLogout: onLogout } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  if (!user) return null;

  const canCreateRequest = user.role === ROLES.REQUESTER || user.role === ROLES.ADMIN || user.role === ROLES.HOTEL_MANAGER;
  const canViewReports = user.role === ROLES.AUDITOR || user.role === ROLES.ADMIN || user.role === ROLES.ACCOUNTING_MANAGER;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900/50 backdrop-blur-md border-b border-cyan-500/20 p-4 flex justify-between items-center shadow-lg flex-shrink-0 z-10 rtl:flex-row-reverse">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold tracking-tight text-white" style={{ textShadow: '0 0 5px rgba(0, 245, 212, 0.5)' }}>EWAA HOTELS</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onToggleAIChat}
          className="bg-cyan-glow/80 hover:bg-cyan-500 text-white p-2 rounded-full transition-all shadow-md hover:shadow-glow-cyan"
          aria-label={t('aiAssistant')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </button>
        {canCreateRequest && (
          <>
            <button
                onClick={onNewRequest}
                className="bg-pink-glow hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-lg transition-all hidden sm:block shadow-md hover:shadow-glow-pink"
            >
                {t('createNewRequest')}
            </button>
            <button
                onClick={onNewRequest}
                className="sm:hidden bg-pink-glow hover:bg-pink-500 text-white font-bold p-2 rounded-full transition-all shadow-md hover:shadow-glow-pink"
                aria-label={t('createNewRequest')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
          </>
        )}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700/50">
            <span className="hidden md:inline text-slate-200">{user.name}</span>
            <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-cyan-300 border border-cyan-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <svg className="w-5 h-5 transition-transform text-slate-300" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-56 glass-panel rounded-md shadow-lg py-1 z-20 text-slate-100">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-slate-400">{t(user.role)}</p>
              </div>
              <div className="border-t border-cyan-500/20"></div>
              {canViewReports && (
                <button onClick={() => { onToggleReports(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700/50">{t('reports')}</button>
              )}
              <button onClick={() => { onToggleSettings(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700/50">{t('settings')}</button>
              <div className="border-t border-cyan-500/20"></div>
              <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700/50 text-pink-400">{t('logout')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;