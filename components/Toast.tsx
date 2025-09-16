import React, { useEffect } from 'react';
import { useTranslation } from '../i18n';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const { language } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div 
      className={`fixed bottom-5 ${language === 'ar' ? 'left-5' : 'right-5'} z-50 bg-green-600 text-white py-3 px-5 rounded-lg shadow-lg flex items-center animate-fade-in-up`}
      role="alert"
      aria-live="assertive"
    >
      
      <svg className={`w-6 h-6 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
