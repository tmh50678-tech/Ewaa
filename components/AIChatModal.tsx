

import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { useTranslation } from '../i18n';
import { useAppContext } from '../App';
import { getAIsearchFilters } from '../services/geminiService';
import type { AISearchFilters } from '../types';
import Spinner from './Spinner';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AISearchFilters) => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, onApplyFilters }) => {
  const { t } = useTranslation();
  const { currentUser, branches } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: t('aiGreeting') }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      if (!currentUser) throw new Error("User not found");
      const result = await getAIsearchFilters(userInput, currentUser, branches);
      
      setMessages([...newMessages, { sender: 'ai', text: result.responseText }]);
      onApplyFilters(result.filters);

    } catch (error) {
      console.error("AI search failed:", error);
      const errorMessage = { sender: 'ai' as const, text: t('error.suggestionFailed') }; // Reusing translation key
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <div className="flex flex-col h-[70vh]">
        <h2 className="text-2xl font-bold text-white flex-grow-0 text-center mb-4">{t('aiAssistant')}</h2>
        
        <div className="flex-grow overflow-y-auto pr-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-pink-900/70 text-pink-100' : 'bg-cyan-900/70 text-cyan-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-md p-3 rounded-lg bg-cyan-900/70 text-cyan-100 flex items-center">
                    <Spinner />
                    <span className={`ml-2 rtl:mr-2 rtl:ml-0`}>Thinking...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('aiSearchPlaceholder')}
              disabled={isLoading}
              className="w-full block pl-4 pr-12 py-3 bg-slate-900/50 border-b-2 border-slate-500 rounded-t-md placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-pink-400 sm:text-sm transition"
            />
            <button type="submit" disabled={isLoading || !userInput.trim()} className="absolute inset-y-0 right-0 pr-3 flex items-center text-pink-400 disabled:text-slate-600 hover:text-pink-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 12h14" /></svg>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AIChatModal;