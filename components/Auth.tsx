
import React, { useEffect, useState } from 'react';
import { DemoAuthAccount, User } from '../types';
import { apiService } from '../services/api';

interface AuthProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, isDarkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAuthAccount[]>([]);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-600' : 'text-stone-400';
  const inputBorder = isDarkMode ? 'border-stone-800 focus:border-stone-100' : 'border-stone-200 focus:border-stone-900';
  const inputColor = isDarkMode ? 'text-stone-200' : 'text-stone-800';

  useEffect(() => {
    const loadDemoAccounts = async () => {
      setIsDemoLoading(true);
      setDemoError(null);
      try {
        const accounts = await apiService.getDemoAccounts();
        setDemoAccounts(accounts);
      } catch (err) {
        setDemoError(err instanceof Error ? err.message : 'Не вдалося завантажити демо-акаунти.');
      } finally {
        setIsDemoLoading(false);
      }
    };
    void loadDemoAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await apiService.login(email.trim(), password);
        onLogin(user);
      } else {
        if (!email || !password || !name) {
          setError('Будь ласка, заповніть усі поля.');
          setIsLoading(false);
          return;
        }

        const user = await apiService.register(name.trim(), email.trim(), password);
        onLogin(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Виникла помилка при з’єднанні з сервером.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 px-4">
      <div className={`max-w-md w-full space-y-12 p-16 border shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] ${cardBg}`}>
        <div className="text-center">
          <h2 className={`text-4xl font-serif-gothic font-black tracking-tight italic ${textTitle}`}>
            {isLogin ? 'Вхід' : 'Реєстрація'}
          </h2>

          {error && (
            <div className={`mt-6 p-4 border animate-fadeIn ${isDarkMode ? 'bg-rose-950/30 border-rose-900/50' : 'bg-rose-50 border-rose-200'}`}>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">
                <i className="fas fa-exclamation-triangle mr-2"></i> {error}
              </p>
            </div>
          )}

          <p className="mt-8 text-[9px] font-bold uppercase tracking-[0.3em]">
            <span className={textMuted}>{isLogin ? 'Не маєте акаунт? ' : 'Вже зареєстровані? '}</span>
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className={`underline underline-offset-8 transition ${isDarkMode ? 'text-stone-300 hover:text-amber-200/80' : 'text-stone-700 hover:text-stone-950'}`}
            >
              {isLogin ? 'Зареєструйтесь!' : 'Увійти'}
            </button>
          </p>

          <div className={`mt-6 p-4 border ${isDarkMode ? 'border-stone-800 bg-stone-950/50' : 'border-stone-200 bg-stone-50'}`}>
            <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${textTitle}`}>Демо-користувачі</p>
            {isDemoLoading ? (
              <p className={`mt-2 text-[9px] uppercase tracking-[0.2em] ${textMuted}`}>Завантаження...</p>
            ) : demoError ? (
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">{demoError}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setIsLogin(true);
                      setError(null);
                    }}
                    className={`w-full text-left border px-3 py-2 transition ${
                      isDarkMode
                        ? 'border-stone-800 hover:border-amber-200/40 hover:bg-amber-200/5'
                        : 'border-stone-200 hover:border-stone-400 hover:bg-white'
                    }`}
                  >
                    <p className={`text-[9px] uppercase tracking-[0.2em] font-black ${textMuted}`}>{account.role}</p>
                    <p className={`mt-1 text-[10px] font-semibold ${textTitle}`}>{account.email}</p>
                    <p className={`text-[10px] ${isDarkMode ? 'text-stone-300' : 'text-stone-700'}`}>Пароль: {account.password}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form className="space-y-10" onSubmit={handleSubmit}>
          <div className="space-y-8">
            {!isLogin && (
              <div className="animate-slideDown">
                <label className={`block text-[8px] font-black uppercase tracking-[0.4em] mb-4 ${textMuted}`}>Ваше Ім'я</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-0 py-4 bg-transparent border-b text-sm transition font-serif-gothic italic focus:outline-none ${inputBorder} ${inputColor}`}
                  placeholder="Ім'я Прізвище"
                />
              </div>
            )}
            <div>
              <label className={`block text-[8px] font-black uppercase tracking-[0.4em] mb-4 ${textMuted}`}>Електронна пошта</label>
              <input
                type="email"
                required
                autoComplete="username"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-0 py-4 bg-transparent border-b text-sm transition font-serif-gothic italic focus:outline-none ${inputBorder} ${inputColor}`}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className={`block text-[8px] font-black uppercase tracking-[0.4em] mb-4 ${textMuted}`}>Пароль</label>
              {isLogin ? (
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-0 py-4 bg-transparent border-b text-sm transition focus:outline-none ${inputBorder} ${inputColor}`}
                  placeholder="••••••••"
                />
              ) : (
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  name="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-0 py-4 bg-transparent border-b text-sm transition focus:outline-none ${inputBorder} ${inputColor}`}
                  placeholder="••••••••"
                />
              )}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={`mt-3 text-[9px] font-black uppercase tracking-[0.25em] transition ${isDarkMode ? 'text-stone-400 hover:text-stone-100' : 'text-stone-600 hover:text-stone-900'}`}
              >
                {showPassword ? 'Сховати пароль' : 'Показати пароль'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 font-black text-[10px] transition shadow-2xl uppercase tracking-[0.5em] border ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDarkMode
                  ? 'border-amber-200/25 bg-gradient-to-b from-amber-200/12 to-zinc-950/25 text-stone-100/90 hover:border-amber-200/40 hover:bg-amber-200/15'
                  : 'border-stone-200/80 bg-stone-50/80 text-stone-950 hover:border-stone-300'
              }`}
            >
              {isLoading ? 'ОБРОБКА...' : (isLogin ? 'УВІЙТИ' : 'ЗАРЕЄСТРУВАТИСЯ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
