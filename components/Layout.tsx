
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ViewType, User } from '../types';
import { viewFromPath } from '../routes';

interface LayoutProps {
  children: React.ReactNode;
  setActiveView: (view: ViewType) => void;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartClick: () => void;
  setCustomBg: (color: string) => void;
  customBg: string;
  booksCount: number;
  categoriesCount: number;
  wishlistCount: number;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  setActiveView,
  user,
  onLogout,
  isDarkMode,
  toggleTheme,
  cartCount,
  onCartClick,
  setCustomBg,
  customBg,
  booksCount,
  categoriesCount,
  wishlistCount,
}) => {
  const location = useLocation();
  const activeView = viewFromPath(location.pathname);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isWidePage = location.pathname.startsWith('/book/');
  const mainMaxWidth = isWidePage ? 'max-w-[1600px]' : 'max-w-[1300px]';

  const headerClass = isDarkMode ? 'bg-zinc-950/88 border-amber-300/20' : 'bg-stone-50/96 border-stone-300/80';
  const navClass = isDarkMode ? 'bg-zinc-950/92 border-zinc-700/70' : 'bg-stone-50/96 border-stone-300/80';
  const footerClass = isDarkMode ? 'border-stone-900' : 'border-stone-200';

  const accentOptions = isDarkMode
    ? [
        { name: 'Gothic Green', color: '#0a2e0a' },
        { name: 'Velvet Brown', color: '#2b1a0e' },
        { name: 'Velvet Crimson', color: '#520505' },
        { name: 'Velvet Orange', color: '#662d08' },
      ]
    : [
        { name: 'Sage Velvet', color: '#a3c2a3' },
        { name: 'Sepia Brown', color: '#bca68e' },
        { name: 'Old Rose Red', color: '#cc9999' },
        { name: 'Warm Orange', color: '#d9a37a' },
      ];

  const subtitleByView: Record<ViewType, string> = {
    storefront: 'Кураторська добірка видань, новинок і перевиданих класик.',
    profile: 'Ваш кабінет читача: замовлення, бажане та персональні дані.',
    checkout: 'Безпечне оформлення замовлення та контроль позицій у кошику.',
    auth: 'Увійдіть, щоб оформлювати замовлення та керувати профілем.',
    success: 'Замовлення прийнято - далі стежте за статусом у кабінеті.',
    contacts: 'Контакти редакції, відділу продажу та підтримки клієнтів.',
    delivery: 'Умови доставки, строки та варіанти отримання замовлення.',
    payment: 'Способи оплати, перевірка і підтвердження платежів.',
    book_details: 'Опис видання, характеристики, схожі книги та наявність.',
    inventory: 'Керування складом: залишки, редагування та оновлення каталогу.',
    crm: 'Аналітика клієнтів, замовлень і повторних покупок.',
    admin_orders: 'Оперативне управління статусами та потоком замовлень.',
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-200/20 selection:text-stone-100/90 transition-all duration-700 relative">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-[320px] z-0 ${
          isDarkMode
            ? 'bg-[radial-gradient(ellipse_at_top,rgba(199,167,106,0.18),transparent_62%)]'
            : 'bg-[radial-gradient(ellipse_at_top,rgba(146,110,49,0.12),transparent_62%)]'
        }`}
      />
      <a href="#main-content" className="skip-link">
        Перейти до основного вмісту
      </a>

      {cartCount > 0 && activeView !== 'checkout' && (
        <button
          type="button"
          onClick={onCartClick}
          aria-label={`Перейти до оформлення замовлення. Позицій у кошику: ${cartCount}`}
          title="Перейти до кошика"
          className={`fixed bottom-8 right-6 md:bottom-10 md:right-10 px-6 md:px-8 py-4 shadow-gothic z-[60] flex items-center gap-4 transition transform hover:-translate-y-1 font-black uppercase text-[11px] tracking-[0.22em] rounded-full border ${
            isDarkMode ? 'bg-zinc-900/60 text-stone-100/90 border-zinc-700/50 backdrop-blur-md hover:bg-zinc-900/75' : 'bg-stone-50/80 text-stone-950 border-stone-200/80'
          }`}
        >
          <i className={`fas fa-shopping-bag ${isDarkMode ? 'text-amber-200/80' : 'text-stone-700'}`}></i>
          <span>Замовлення ({cartCount})</span>
        </button>
      )}

      <header className={`${headerClass} backdrop-blur-md border-b px-4 md:px-6 py-4 relative z-50 transition-colors duration-700`}>
        <div className="max-w-[1300px] mx-auto">
          <div className={`mb-4 flex items-center justify-between gap-3 pb-3 border-b ${isDarkMode ? 'border-amber-200/15' : 'border-stone-300/60'}`}>
            <p className={`text-[11px] md:text-[12px] tracking-[0.16em] uppercase font-black ${isDarkMode ? 'text-amber-100/85' : 'text-stone-700'}`}>
              Видавнича платформа
            </p>
            <div className={`hidden md:flex items-center gap-3 text-[11px] font-bold ${isDarkMode ? 'text-stone-300/90' : 'text-stone-700'}`}>
              <button onClick={() => handleViewChange('delivery')} className="hover:opacity-100 opacity-80 transition">Доставка</button>
              <span className="opacity-40">•</span>
              <button onClick={() => handleViewChange('payment')} className="hover:opacity-100 opacity-80 transition">Оплата</button>
              <span className="opacity-40">•</span>
              <button onClick={() => handleViewChange('contacts')} className="hover:opacity-100 opacity-80 transition">Підтримка</button>
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6 min-h-[64px]">
            <div className="flex items-center gap-3 h-10 px-1 group/theme">
              <button
                onClick={toggleTheme}
                title="Змінити тему"
                className={`w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-500 shadow-lg shrink-0 ${
                  isDarkMode
                    ? 'bg-zinc-900/50 border-zinc-700/50 text-stone-200/70 hover:text-stone-100 hover:border-amber-200/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/20'
                    : 'bg-stone-50/80 border-stone-200/80 text-stone-600 hover:text-stone-950 hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/25'
                }`}
              >
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-base`}></i>
              </button>

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
                    isDarkMode ? 'bg-stone-800 text-stone-500 hover:text-stone-200 border-stone-700' : 'bg-stone-100 text-stone-400 hover:text-stone-900 border-stone-300'
                  } ${!customBg ? 'grayscale cursor-default opacity-30' : 'ring-1 ring-stone-500'}`}
                >
                  <i className="fas fa-undo text-[9px]"></i>
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <div onClick={() => handleViewChange('storefront')} className="cursor-pointer text-center group select-none px-1 md:px-3">
                <h1 className={`font-serif text-sm md:text-xl tracking-[0.28em] md:tracking-[0.34em] uppercase ${isDarkMode ? 'text-stone-100 group-hover:text-amber-200' : 'text-stone-950 group-hover:text-stone-700'}`}>
                  ЛИСТОПАД
                </h1>
                <div className={`mt-1 text-[9px] md:text-[11px] tracking-[0.16em] md:tracking-[0.2em] uppercase ${isDarkMode ? 'text-amber-100/75' : 'text-stone-700/80'}`}>
                  книжкове видавництво та дистрибуція
                </div>
                <div className={`mt-1 hidden md:block text-[12px] truncate ${isDarkMode ? 'text-stone-200/90' : 'text-stone-700'}`}>
                  {subtitleByView[activeView]}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={onCartClick}
                title="Відкрити кошик"
                className={`inline-flex items-center gap-2 px-4 h-11 rounded-full font-black text-[11px] uppercase tracking-[0.12em] md:tracking-[0.16em] border transition ${
                  isDarkMode
                    ? 'bg-zinc-900/50 border-zinc-700/50 text-stone-100/90 hover:border-amber-200/35'
                    : 'bg-stone-50/80 border-stone-200/80 text-stone-900 hover:border-stone-400'
                }`}
              >
                <i className="fas fa-cart-shopping"></i>
                <span className="hidden md:inline">Кошик</span>
                <span>({cartCount})</span>
              </button>
              {user ? (
                <div className="flex items-center">
                  <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => handleViewChange('profile')}>
                    <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full border flex items-center justify-center font-bold transition shadow-xl overflow-hidden ${isDarkMode ? 'bg-stone-950 border-stone-800 text-stone-200 group-hover:border-stone-100' : 'bg-white border-stone-300 text-stone-900 group-hover:border-stone-950'}`}>
                      <span className="text-base md:text-lg font-serif-gothic italic">{user.name.charAt(0)}</span>
                    </div>
                    <span className={`hidden md:block text-[9px] font-black uppercase tracking-[0.2em] transition ${isDarkMode ? 'text-stone-500 group-hover:text-stone-300' : 'text-stone-400 group-hover:text-stone-900'}`}>
                      {user.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleViewChange('auth')}
                  className={`px-4 md:px-5 h-11 rounded-full font-medium text-[11px] md:text-[12px] uppercase tracking-[0.16em] md:tracking-[0.22em] transition flex items-center gap-2 border ${
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
        </div>
      </header>

      <nav className={`${navClass} backdrop-blur-md sticky top-0 z-40 border-b transition-colors duration-700`}>
        <div className="max-w-[1300px] mx-auto px-2 md:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-start md:justify-between gap-2 min-w-max">
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={() => handleViewChange('storefront')} className={`px-5 md:px-7 py-4 md:py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.18em] md:tracking-[0.26em] whitespace-nowrap transition rounded-t-lg ${activeView === 'storefront' || activeView === 'book_details' ? (isDarkMode ? 'bg-amber-200/15 text-amber-100 border-b-2 border-amber-200/70' : 'bg-stone-900 text-stone-100 border-b-2 border-stone-900') : (isDarkMode ? 'text-stone-300 hover:text-stone-100 hover:bg-zinc-800/50' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/80')}`}>Магазин</button>
              {user && <button onClick={() => handleViewChange('profile')} className={`px-5 md:px-7 py-4 md:py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.18em] md:tracking-[0.26em] whitespace-nowrap transition rounded-t-lg ${activeView === 'profile' ? (isDarkMode ? 'bg-amber-200/15 text-amber-100 border-b-2 border-amber-200/70' : 'bg-stone-900 text-stone-100 border-b-2 border-stone-900') : (isDarkMode ? 'text-stone-300 hover:text-stone-100 hover:bg-zinc-800/50' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/80')}`}>Кабінет</button>}
              <button onClick={() => handleViewChange('contacts')} className={`px-5 md:px-7 py-4 md:py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.18em] md:tracking-[0.26em] whitespace-nowrap transition rounded-t-lg ${activeView === 'contacts' ? (isDarkMode ? 'bg-amber-200/15 text-amber-100 border-b-2 border-amber-200/70' : 'bg-stone-900 text-stone-100 border-b-2 border-stone-900') : (isDarkMode ? 'text-stone-300 hover:text-stone-100 hover:bg-zinc-800/50' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/80')}`}>Контакти</button>
              {user?.role === 'admin' && (
                <>
                  <div className="w-px h-4 mx-2 bg-stone-500/20"></div>
                  <button onClick={() => handleViewChange('admin_orders')} className={`px-5 md:px-7 py-4 md:py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.18em] md:tracking-[0.26em] whitespace-nowrap transition rounded-t-lg ${activeView === 'admin_orders' ? (isDarkMode ? 'bg-amber-200/15 text-amber-100 border-b-2 border-amber-200/70' : 'bg-stone-900 text-stone-100 border-b-2 border-stone-900') : (isDarkMode ? 'text-stone-300 hover:text-stone-100 hover:bg-zinc-800/50' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/80')}`}>Замовлення</button>
                  <button onClick={() => handleViewChange('crm')} className={`px-5 md:px-7 py-4 md:py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.18em] md:tracking-[0.26em] whitespace-nowrap transition rounded-t-lg ${activeView === 'crm' ? (isDarkMode ? 'bg-amber-200/15 text-amber-100 border-b-2 border-amber-200/70' : 'bg-stone-900 text-stone-100 border-b-2 border-stone-900') : (isDarkMode ? 'text-stone-300 hover:text-stone-100 hover:bg-zinc-800/50' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/80')}`}>CRM</button>
                  <button onClick={() => handleViewChange('inventory')} className={`px-5 md:px-7 py-4 md:py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.18em] md:tracking-[0.26em] whitespace-nowrap transition rounded-t-lg ${activeView === 'inventory' ? (isDarkMode ? 'bg-amber-200/15 text-amber-100 border-b-2 border-amber-200/70' : 'bg-stone-900 text-stone-100 border-b-2 border-stone-900') : (isDarkMode ? 'text-stone-300 hover:text-stone-100 hover:bg-zinc-800/50' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/80')}`}>Склад</button>
                </>
              )}
            </div>
            <div className={`hidden xl:flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              <button onClick={() => handleViewChange('delivery')} className="hover:opacity-100 opacity-80 transition">Доставка</button>
              <button onClick={() => handleViewChange('payment')} className="hover:opacity-100 opacity-80 transition">Оплата</button>
              <span className="opacity-55">|</span>
              <span>{booksCount} книг</span>
              <span>{wishlistCount} в бажаному</span>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" className={`flex-1 ${mainMaxWidth} mx-auto w-full p-6 md:p-12 relative z-10 transition-all duration-700`}>
        {children}
      </main>

      <footer className={`${footerClass} border-t py-14 px-6 mt-20 transition-colors duration-700`}>
        <div className="max-w-[1300px] mx-auto">
          <div className={`rounded-3xl border px-6 py-8 md:px-10 md:py-10 ${isDarkMode ? 'border-zinc-800/70 bg-zinc-950/50' : 'border-stone-200 bg-stone-50/80'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
              <div className="space-y-4">
                <h3 className={`text-3xl font-serif-gothic font-black italic ${isDarkMode ? 'text-stone-100' : 'text-stone-900'}`}>ЛистоПад</h3>
                <p className={`${isDarkMode ? 'text-stone-400' : 'text-stone-600'} text-sm leading-relaxed`}>
                  Незалежне книжкове видавництво: нові автори, якісні перевидання, швидка доставка по Україні.
                </p>
                <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  Каталог: {booksCount} книг
                </div>
              </div>
              <div className="space-y-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>Швидкі переходи</p>
                <button onClick={() => handleViewChange('storefront')} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>Каталог книг</button>
                <button onClick={() => handleViewChange('delivery')} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>Умови доставки</button>
                <button onClick={() => handleViewChange('payment')} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>Способи оплати</button>
                <button onClick={() => handleViewChange('contacts')} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>Контакти та підтримка</button>
              </div>
              <div className="space-y-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>Корисні дії</p>
                <button onClick={onCartClick} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>
                  Перейти до кошика ({cartCount})
                </button>
                {user ? (
                  <>
                    <button onClick={() => handleViewChange('profile')} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>
                      Мій кабінет
                    </button>
                    <button onClick={onLogout} className={`block text-left text-sm transition ${isDarkMode ? 'text-rose-300 hover:text-rose-200' : 'text-rose-700 hover:text-rose-900'}`}>
                      Вийти з акаунта
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleViewChange('auth')} className={`block text-left text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>
                    Увійти в акаунт
                  </button>
                )}
                <p className={`text-xs ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>Жанрів у каталозі: {categoriesCount}</p>
                <p className={`text-xs ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>У бажаному: {wishlistCount}</p>
              </div>
              <div className="space-y-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>Зв'язок</p>
                <a href="mailto:support@lystopad.ua" className={`block text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>
                  support@lystopad.ua
                </a>
                <a href="tel:+380441234567" className={`block text-sm transition ${isDarkMode ? 'text-stone-200 hover:text-amber-200' : 'text-stone-800 hover:text-stone-950'}`}>
                  +38 (044) 123 45 67
                </a>
                <p className={`text-sm ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  Пн-Пт 09:00-19:00
                </p>
              </div>
            </div>
            <div className={`mt-8 pt-5 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isDarkMode ? 'border-zinc-800 text-stone-500' : 'border-stone-200 text-stone-500'}`}>
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">© 2026 Видавництво "ЛистоПад"</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Книги. Люди. Сенси.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
