
import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAppContext } from '../App';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { handleLogin } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const success = handleLogin(email, password);
    if (!success) {
      setError(t('loginError'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl animate-fade-in-up">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
            EWAA HOTELS
          </h2>
           <p className="mt-2 text-sm text-gray-500 sm:text-base">
            {t('appTitle')}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('email')}
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-700">
              {t('password')}
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
              >
                  {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-2.201-4.209A3.004 3.004 0 0012 15a3 3 0 100-6 3 3 0 00-1.354.362" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                  )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400">
                <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t('login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
