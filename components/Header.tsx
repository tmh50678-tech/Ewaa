import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { ROLES } from '../constants';
import { useAppContext } from '../App';

interface HeaderProps {
  onNewRequest: () => void;
  onToggleSettings: () => void;
  onToggleReports: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewRequest, onToggleSettings, onToggleReports }) => {
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
    <header className="bg-primary-800 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10 rtl:flex-row-reverse">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold tracking-tight">EWAA HOTELS</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {canCreateRequest && (
          <>
            <button
                onClick={onNewRequest}
                className="bg-accent-500 hover:bg-accent-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hidden sm:block"
            >
                {t('createNewRequest')}
            </button>
            <button
                onClick={onNewRequest}
                className="sm:hidden bg-accent-500 hover:bg-accent-600 text-white font-bold p-2 rounded-full transition-colors"
                aria-label={t('createNewRequest')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
          </>
        )}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 p-2 rounded-md hover:bg-primary-700">
            <span className="hidden md:inline">{user.name}</span>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <svg className="w-5 h-5 transition-transform" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 text-gray-800">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-gray-500">{t(user.role)}</p>
              </div>
              <div className="border-t border-gray-100"></div>
              {canViewReports && (
                <button onClick={() => { onToggleReports(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">{t('reports')}</button>
              )}
              <button onClick={() => { onToggleSettings(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">{t('settings')}</button>
              <div className="border-t border-gray-100"></div>
              <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">{t('logout')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;