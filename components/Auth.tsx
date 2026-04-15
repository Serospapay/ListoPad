
import React, { useState } from 'react';
import { User } from '../types';
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

  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-600' : 'text-stone-400';
  const inputBorder = isDarkMode ? 'border-stone-800 focus:border-stone-100' : 'border-stone-200 focus:border-stone-900';
  const inputColor = isDarkMode ? 'text-stone-200' : 'text-stone-800';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await apiService.login(email, password);
        onLogin(user);
      } else {
        if (!email || !password || !name) {
          setError('Будь ласка, заповніть усі поля.');
          setIsLoading(false);
          return;
        }

        const user = await apiService.register(name, email, password);
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
              className={`underline underline-offset-8 transition ${isDarkMode ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-stone-950'}`}
            >
              {isLogin ? 'Зареєструйтесь!' : 'Увійти'}
            </button>
          </p>
        </div>

        <form className="space-y-10" onSubmit={handleSubmit}>
          <div className="space-y-8">
            {!isLogin && (
              <div className="animate-slideDown">
                <label className={`block text-[8px] font-black uppercase tracking-[0.4em] mb-4 ${textMuted}`}>Ваше Ім'я</label>
                <input
                  type="text"
                  required
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-0 py-4 bg-transparent border-b text-sm transition font-serif-gothic italic focus:outline-none ${inputBorder} ${inputColor}`}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className={`block text-[8px] font-black uppercase tracking-[0.4em] mb-4 ${textMuted}`}>Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-0 py-4 bg-transparent border-b text-sm transition focus:outline-none ${inputBorder} ${inputColor}`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 font-black text-[10px] transition shadow-2xl uppercase tracking-[0.5em] border ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-stone-100 text-stone-950 border-stone-200 hover:bg-white' : 'bg-stone-900 text-stone-100 border-stone-950 hover:bg-black'}`}
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
