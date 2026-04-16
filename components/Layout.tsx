
import React from 'react';
import { ViewType, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartClick: () => void;
  setCustomBg: (color: string) => void;
  customBg: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeView, setActiveView, user, onLogout, isDarkMode, 
  toggleTheme, cartCount, onCartClick, setCustomBg, customBg 
}) => {
  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isWidePage = activeView === 'book_details';
  const mainMaxWidth = isWidePage ? 'max-w-[1600px]' : 'max-w-[1300px]';

  const headerClass = isDarkMode ? 'bg-zinc-950/55 border-zinc-800/60' : 'bg-stone-50/70 border-stone-200/80';
  const navClass = isDarkMode ? 'bg-zinc-950/75 border-zinc-800/60' : 'bg-stone-50/80 border-stone-200/80';
  const footerClass = isDarkMode ? 'border-stone-900' : 'border-stone-200';

  const accentOptions = isDarkMode 
    ? [
        { name: 'Gothic Green', color: '#0a2e0a' },
        { name: 'Velvet Brown', color: '#2b1a0e' },
        { name: 'Velvet Crimson', color: '#520505' },
        { name: 'Velvet Orange', color: '#662d08' }
      ]
    : [
        { name: 'Sage Velvet', color: '#a3c2a3' },
        { name: 'Sepia Brown', color: '#bca68e' },
        { name: 'Old Rose Red', color: '#cc9999' },
        { name: 'Warm Orange', color: '#d9a37a' }
      ];

  return (
    <div className={`min-h-screen flex flex-col selection:bg-amber-200/20 selection:text-stone-100/90 transition-all duration-700`}>
      
      {cartCount > 0 && activeView !== 'checkout' && (
        <button 
          onClick={onCartClick}
          className={`fixed bottom-8 right-6 md:bottom-10 md:right-10 px-6 md:px-8 py-4 shadow-gothic z-[60] flex items-center gap-4 transition transform hover:-translate-y-1 font-black uppercase text-[11px] tracking-[0.22em] rounded-full border ${
            isDarkMode ? 'bg-zinc-900/60 text-stone-100/90 border-zinc-700/50 backdrop-blur-md hover:bg-zinc-900/75' : 'bg-stone-50/80 text-stone-950 border-stone-200/80'
          }`}
        >
          <i className={`fas fa-shopping-bag ${isDarkMode ? 'text-amber-200/80' : 'text-stone-700'}`}></i>
          <span>Замовлення ({cartCount})</span>
        </button>
      )}

      <header className={`${headerClass} backdrop-blur-md border-b px-4 md:px-6 py-5 md:py-6 relative z-50 transition-colors duration-700`}>
        <div className="max-w-[1300px] mx-auto flex items-center justify-between relative min-h-[64px]">
          
          <div className="flex items-center gap-3 h-10 px-2 group/theme">
            <button 
              onClick={toggleTheme}
              title="Змінити тему"
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-500 shadow-lg shrink-0 ${
                isDarkMode 
                ? 'bg-zinc-900/50 border-zinc-700/50 text-stone-200/70 hover:text-stone-100 hover:border-amber-200/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/20' 
                : 'bg-stone-50/80 border-stone-200/80 text-stone-600 hover:text-stone-950 hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/25'
              }`}
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-base`}></i>
            </button>

            {/* Кольорові теми - з'являються при наведенні на область зміни теми, приховані на мобільних */}
            <div className="hidden md:flex gap-1.5 items-center opacity-0 pointer-events-none group-hover/theme:opacity-100 group-hover/theme:pointer-events-auto transition-all duration-500 transform translate-x-[-10px] group-hover/theme:translate-x-0">
              {accentOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setCustomBg(opt.color)}
                  title={opt.name}
                  style={{ backgroundColor: opt.color }}
                  className={`w-6 h-6 border shadow-md hover:scale-110 transition-all duration-300 ${
                    customBg === opt.color
                      ? (isDarkMode ? 'border-stone-100/80 ring-2 ring-amber-200/15' : 'border-stone-950/60 ring-2 ring-stone-400/25')
                      : (isDarkMode ? 'border-zinc-700/40' : 'border-stone-300/70')
                  }`}
                />
              ))}
              <button 
                onClick={() => setCustomBg('')}
                title="Скинути до стандарту"
                className={`w-6 h-6 flex items-center justify-center border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-stone-800 text-stone-500 hover:text-stone-200 border-stone-700' 
                    : 'bg-stone-100 text-stone-400 hover:text-stone-900 border-stone-300'
                } ${!customBg ? 'grayscale cursor-default opacity-30' : 'ring-1 ring-stone-500'}`}
              >
                <i className="fas fa-undo text-[9px]"></i>
              </button>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <div onClick={() => handleViewChange('storefront')} className="cursor-pointer text-center group select-none">
              <h1 className={`font-serif text-base md:text-lg tracking-[0.35em] uppercase ${isDarkMode ? 'text-stone-100/90 group-hover:text-amber-200/80' : 'text-stone-950 group-hover:text-stone-700'}`}>
                ЛИСТОПАД
              </h1>
              <div className={`mt-1 hidden md:block text-[10px] tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/45' : 'text-stone-600/70'}`}>
                книжкове видавництво
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {user ? (
              <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => handleViewChange('profile')}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center font-bold transition shadow-xl overflow-hidden ${isDarkMode ? 'bg-stone-950 border-stone-800 text-stone-200 group-hover:border-stone-100' : 'bg-white border-stone-300 text-stone-900 group-hover:border-stone-950'}`}>
                  <span className="text-base md:text-lg font-serif-gothic italic">{user.name.charAt(0)}</span>
                </div>
                <span className={`hidden md:block text-[8px] font-black uppercase tracking-[0.2em] transition ${isDarkMode ? 'text-stone-500 group-hover:text-stone-300' : 'text-stone-400 group-hover:text-stone-900'}`}>
                  {user.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <button 
                onClick={() => handleViewChange('auth')} 
                className={`px-4 h-10 rounded-full font-medium text-[11px] uppercase tracking-[0.22em] transition flex items-center gap-2 border ${
                  isDarkMode
                    ? 'bg-gradient-to-b from-amber-200/10 to-zinc-950/20 border-amber-200/25 text-stone-100/90 hover:border-amber-200/40 hover:bg-amber-200/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/20'
                    : 'bg-stone-50/80 border-stone-200/80 text-stone-950 hover:border-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/25'
                }`}
              >
                <i className="fas fa-user md:hidden"></i>
                <span className="hidden md:inline">Увійти</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className={`${navClass} backdrop-blur-md sticky top-0 z-40 border-b transition-colors duration-700`}>
        <div className="max-w-[1300px] mx-auto px-6 flex items-center justify-center gap-2">
          <button onClick={() => handleViewChange('storefront')} className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.4em] transition border-b-2 ${activeView === 'storefront' || activeView === 'book_details' ? (isDarkMode ? 'border-stone-100 text-stone-100' : 'border-stone-900 text-stone-900') : 'border-transparent opacity-50 hover:opacity-100'}`}>Магазин</button>
          {user && <button onClick={() => handleViewChange('profile')} className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.4em] transition border-b-2 ${activeView === 'profile' ? (isDarkMode ? 'border-stone-100 text-stone-100' : 'border-stone-900 text-stone-900') : 'border-transparent opacity-50 hover:opacity-100'}`}>Кабінет</button>}
          {user?.role === 'admin' && (
            <>
              <div className="w-px h-4 mx-2 bg-stone-500/20"></div>
              <button onClick={() => handleViewChange('admin_orders')} className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.4em] transition border-b-2 ${activeView === 'admin_orders' ? (isDarkMode ? 'border-stone-100 text-stone-100' : 'border-stone-900 text-stone-900') : 'border-transparent opacity-50 hover:opacity-100'}`}>Замовлення</button>
              <button onClick={() => handleViewChange('crm')} className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.4em] transition border-b-2 ${activeView === 'crm' ? (isDarkMode ? 'border-stone-100 text-stone-100' : 'border-stone-900 text-stone-900') : 'border-transparent opacity-50 hover:opacity-100'}`}>CRM</button>
              <button onClick={() => handleViewChange('inventory')} className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.4em] transition border-b-2 ${activeView === 'inventory' ? (isDarkMode ? 'border-stone-100 text-stone-100' : 'border-stone-900 text-stone-900') : 'border-transparent opacity-50 hover:opacity-100'}`}>Склад</button>
            </>
          )}
        </div>
      </nav>

      <main className={`flex-1 ${mainMaxWidth} mx-auto w-full p-6 md:p-12 relative z-10 transition-all duration-700`}>
        {children}
      </main>

      <footer className={`${footerClass} border-t py-16 px-6 mt-20 transition-colors duration-700`}>
        <div className="max-w-[1300px] mx-auto flex flex-col items-center gap-10">
          <span className="text-3xl font-serif-gothic font-black tracking-tighter opacity-20 italic">ЛистоПад</span>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 font-bold uppercase text-[10px] tracking-[0.5em] opacity-50">
            <button onClick={() => handleViewChange('delivery')} className="hover:opacity-100 transition">Доставка</button>
            <button onClick={() => handleViewChange('payment')} className="hover:opacity-100 transition">Оплата</button>
            <button onClick={() => handleViewChange('contacts')} className="hover:opacity-100 transition">Контакти</button>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-center opacity-30">© 2026 Видавництво "ЛистоПад".</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
