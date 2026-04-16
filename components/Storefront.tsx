
import React, { useState, useMemo, useEffect } from 'react';
import { Book } from '../types';

interface StorefrontProps {
  books: Book[];
  categories: string[];
  wishlist: string[];
  onToggleWishlist: (bookId: string) => void;
  externalCategoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  onClearExternalFilter?: () => void;
  onAddToCart: (book: Book) => void;
  onViewBook: (book: Book) => void;
  onFiltersChange: (filters: {
    q: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    inStock: boolean;
    sort: SortOption;
  }) => Promise<void>;
  isLoading?: boolean;
  isDarkMode: boolean;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'pages-asc' | 'pages-desc';

const Storefront: React.FC<StorefrontProps> = ({ 
  books, categories, wishlist, onToggleWishlist, externalCategoryFilter, onCategoryChange, onClearExternalFilter, 
  onAddToCart, onViewBook, onFiltersChange, isLoading = false, isDarkMode 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCategory = externalCategoryFilter || 'Всі';
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 40;

  const allCategories = useMemo(() => ['Всі', ...categories], [categories]);

  const filteredBooks = useMemo(() => books, [books]);

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceMin, priceMax, onlyAvailable, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void onFiltersChange({
        q: searchQuery,
        category: selectedCategory,
        minPrice: priceMin,
        maxPrice: priceMax,
        inStock: onlyAvailable,
        sort: sortBy,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, priceMin, priceMax, onlyAvailable, sortBy, onFiltersChange]);

  const resetFilters = () => {
    setSearchQuery('');
    if (onCategoryChange) onCategoryChange('Всі');
    setPriceMin(0);
    setPriceMax(2000);
    setOnlyAvailable(false);
    setSortBy('default');
    setCurrentPage(1);
    if (onClearExternalFilter) onClearExternalFilter();
  };

  const cardBg = isDarkMode ? 'bg-zinc-900/35 border-zinc-700/40 shadow-gothic' : 'bg-stone-50/80 border-stone-200/80 shadow-sm';
  const inputBg = isDarkMode ? 'bg-zinc-950/25 border-zinc-700/40 text-stone-100/85' : 'bg-white/80 border-stone-200 text-stone-900';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-950';
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'Всі' ||
    priceMin !== 0 ||
    priceMax !== 2000 ||
    onlyAvailable ||
    sortBy !== 'default';

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* Фільтри */}
      <section className={`relative overflow-hidden rounded-2xl border ${cardBg} backdrop-blur-md transition-all duration-700`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_18%_10%,rgba(199,167,106,0.10),transparent_55%),radial-gradient(900px_circle_at_82%_25%,rgba(90,31,43,0.14),transparent_55%)]" />
        <div className="relative p-5 md:p-6">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className={`text-[11px] font-medium tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
                Фільтри
              </div>
              <div className={`mt-1 font-serif text-lg tracking-wide ${isDarkMode ? 'text-stone-100/90' : 'text-stone-950'}`}>
                Налаштуйте підбір книг
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-[11px] font-medium tracking-[0.22em] uppercase transition focus:outline-none focus-visible:ring-2 ${
                isDarkMode
                  ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-100/75 hover:bg-zinc-950/45 hover:text-stone-100 focus-visible:ring-amber-200/20'
                  : 'border-stone-200/80 bg-stone-50/80 text-stone-700 hover:bg-stone-50 focus-visible:ring-stone-400/25'
              }`}
            >
              Скинути
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Пошук */}
            <div className="md:col-span-5">
              <label className={`block text-[11px] font-medium tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
                Пошук
              </label>

              <div className={`mt-2 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition focus-within:ring-2 ${inputBg} ${
                isDarkMode
                  ? 'focus-within:border-amber-200/35 focus-within:ring-amber-200/20'
                  : 'focus-within:border-stone-400 focus-within:ring-stone-400/25'
              }`}>
                <i className={`fas fa-search text-sm ${isDarkMode ? 'text-stone-300/50' : 'text-stone-600/60'}`}></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Назва, автор, ISBN…"
                  className="h-6 w-full appearance-none bg-transparent text-sm outline-none placeholder:text-stone-300/45"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Сортування */}
            <div className="md:col-span-3">
              <label className={`block text-[11px] font-medium tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
                Сортування
              </label>
              <div className="relative mt-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Сортування книг"
                  title="Сортування книг"
                  className={`h-11 w-full appearance-none rounded-xl border px-3 pr-10 text-sm outline-none transition hover:border-zinc-700/60 focus:ring-2 ${inputBg} ${
                    isDarkMode
                      ? 'focus:border-amber-200/35 focus:ring-amber-200/20'
                      : 'focus:border-stone-400 focus:ring-stone-400/25'
                  }`}
                >
                  <option value="default">За замовчуванням</option>
                  <option value="price-asc">Ціна: від дешевших</option>
                  <option value="price-desc">Ціна: від дорожчих</option>
                  <option value="pages-asc">Обсяг: від менших</option>
                  <option value="pages-desc">Обсяг: від більших</option>
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDarkMode ? 'text-stone-300/55' : 'text-stone-600/60'}`}>
                  <i className="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>

            {/* Жанри */}
            <div className="md:col-span-4">
              <label className={`block text-[11px] font-medium tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
                Жанр
              </label>
              <div className="relative mt-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    if (onCategoryChange) onCategoryChange(e.target.value);
                  }}
                  aria-label="Фільтр за жанром"
                  title="Фільтр за жанром"
                  className={`h-11 w-full appearance-none rounded-xl border px-3 pr-10 text-sm outline-none transition hover:border-zinc-700/60 focus:ring-2 ${inputBg} ${
                    isDarkMode
                      ? 'focus:border-amber-200/35 focus:ring-amber-200/20'
                      : 'focus:border-stone-400 focus:ring-stone-400/25'
                  }`}
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'Всі' ? 'Всі жанри' : cat}
                    </option>
                  ))}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDarkMode ? 'text-stone-300/55' : 'text-stone-600/60'}`}>
                  <i className="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>

            {/* Ціна + Наявність */}
            <div className="md:col-span-12">
              <div className={`mt-1 flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
                isDarkMode ? 'border-zinc-700/35 bg-zinc-950/20' : 'border-stone-200/80 bg-stone-50/60'
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className={`text-[11px] font-medium tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
                      Ціна (₴)
                    </div>
                    <div className={`font-serif text-base tracking-wide tabular-nums ${isDarkMode ? 'text-stone-100/90' : 'text-stone-950'}`}>
                      {priceMin} — {priceMax}
                    </div>
                  </div>

                  <div className="relative mt-3 h-8">
                    <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full ${isDarkMode ? 'bg-zinc-800/70' : 'bg-stone-300/70'}`} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-amber-200/25"
                      style={{
                        left: `${(priceMin / 2000) * 100}%`,
                        right: `${100 - (priceMax / 2000) * 100}%`,
                      }}
                    />

                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="50"
                      value={priceMin}
                      onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 50))}
                      aria-label="Мінімальна ціна"
                      title="Мінімальна ціна"
                      className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full ${priceMin > 1000 ? 'z-30' : 'z-40'}`}
                    />

                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="50"
                      value={priceMax}
                      onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 50))}
                      aria-label="Максимальна ціна"
                      title="Максимальна ціна"
                      className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full ${priceMin > 1000 ? 'z-40' : 'z-30'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <div className={`text-[11px] font-medium tracking-[0.22em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
                    В наявності
                  </div>
                  <button
                    type="button"
                    aria-label="Показувати лише книги в наявності"
                    title="Показувати лише книги в наявності"
                    onClick={() => setOnlyAvailable(!onlyAvailable)}
                    className={[
                      'relative inline-flex h-10 w-16 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2',
                      isDarkMode ? 'focus-visible:ring-amber-200/20' : 'focus-visible:ring-stone-400/25',
                      onlyAvailable
                        ? (isDarkMode ? 'border-emerald-300/25 bg-emerald-400/10' : 'border-emerald-600/30 bg-emerald-600/10')
                        : (isDarkMode ? 'border-zinc-700/50 bg-zinc-950/25' : 'border-stone-300 bg-white/70'),
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-8 w-8 transform rounded-full border transition-all',
                        onlyAvailable
                          ? 'translate-x-7 border-emerald-300/30 bg-gradient-to-b from-emerald-200/15 to-zinc-950/40'
                          : (isDarkMode ? 'translate-x-1 border-zinc-700/50 bg-gradient-to-b from-stone-100/10 to-zinc-950/30' : 'translate-x-1 border-stone-300 bg-gradient-to-b from-stone-50 to-stone-200/60'),
                      ].join(' ')}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог */}
      <section>
        <div className={`mb-12 border-b-2 pb-6 flex justify-between items-end ${isDarkMode ? 'border-stone-700' : 'border-stone-400'}`}>
          <div>
            <h3 className={`text-2xl md:text-5xl font-serif-gothic font-black italic tracking-tighter ${textTitle}`}>Бібліотека Видавництва</h3>
            <div
              aria-live="polite"
              className={`mt-2 text-[11px] font-medium tracking-[0.14em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}
            >
              Знайдено: {filteredBooks.length} книг
            </div>
          </div>
          {totalPages > 1 && (
            <div className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDarkMode ? 'text-stone-400' : 'text-stone-900'}`}>
              Сторінка {currentPage} з {totalPages}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}>
              Активні фільтри:
            </span>
            {searchQuery.trim().length > 0 && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Пошук: {searchQuery}
              </span>
            )}
            {selectedCategory !== 'Всі' && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Жанр: {selectedCategory}
              </span>
            )}
            {(priceMin !== 0 || priceMax !== 2000) && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Ціна: {priceMin}–{priceMax} ₴
              </span>
            )}
            {onlyAvailable && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Лише в наявності
              </span>
            )}
            {sortBy !== 'default' && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Сортування застосовано
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div aria-live="polite" className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 md:gap-x-10 gap-y-10 md:gap-y-20 animate-pulse">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="aspect-[3/4.5] bg-stone-700/20"></div>
                <div className="h-3 bg-stone-700/20"></div>
                <div className="h-3 w-2/3 mx-auto bg-stone-700/20"></div>
              </div>
            ))}
          </div>
        ) : paginatedBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 md:gap-x-10 gap-y-10 md:gap-y-20">
              {paginatedBooks.map(book => (
                <div key={book.id} className="group cursor-pointer relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(book.id); }}
                    aria-label={wishlist.includes(book.id) ? `Прибрати ${book.title} зі списку бажаного` : `Додати ${book.title} до списку бажаного`}
                    className={`absolute top-2 left-2 md:top-4 md:left-4 z-20 w-6 h-6 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-all ${
                      wishlist.includes(book.id)
                        ? 'bg-stone-100/90 text-stone-950 border-stone-100/80'
                        : 'bg-zinc-950/35 text-stone-100/85 border-zinc-700/40 hover:bg-stone-100/90 hover:text-stone-950 hover:border-stone-100/80'
                    }`}
                  >
                    <i className={`${wishlist.includes(book.id) ? 'fas' : 'far'} fa-star text-[8px] md:text-base`}></i>
                  </button>

                  <div onClick={() => onViewBook(book)} className="relative aspect-[3/4.5] mb-4 md:mb-8 overflow-hidden bg-stone-950 shadow-2xl transition-transform duration-700 hover:-translate-y-2">
                    <img 
                      src={book.coverImage} 
                      className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition duration-1000" 
                      alt={book.title} 
                    />
                    <div className="absolute inset-0 bg-zinc-950/35 group-hover:bg-transparent transition duration-700"></div>
                    
                    <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-zinc-950/75 backdrop-blur-md text-stone-100/90 px-2 py-1 md:px-4 md:py-2 border border-zinc-700/40 flex items-center gap-1 shadow-2xl rounded-full">
                      <span className="text-[8px] md:text-[11px] font-black tracking-widest">{book.price} ₴</span>
                    </div>

                    {book.inventory === 0 && (
                      <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-rose-950/70 text-stone-100/90 px-2 py-1 md:px-3 md:py-1 text-[6px] md:text-[8px] font-black uppercase tracking-widest shadow-xl rounded-full border border-rose-900/30">
                        Скоро
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); onAddToCart(book); }}
                         aria-label={`Додати ${book.title} у кошик`}
                         disabled={book.inventory === 0}
                         className="rounded-full border border-amber-200/25 bg-gradient-to-b from-amber-200/12 to-zinc-950/30 px-4 py-2 md:px-8 md:py-4 font-black text-[8px] md:text-[10px] uppercase tracking-widest text-stone-100/90 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:border-amber-200/40 hover:bg-amber-200/15 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {book.inventory > 0 ? 'У КОШИК' : 'НЕДОСТУПНО'}
                       </button>
                    </div>
                  </div>

                  <div className="text-center space-y-1 md:space-y-2" onClick={() => onViewBook(book)}>
                    <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-50 line-clamp-1 ${isDarkMode ? '' : 'text-stone-900'}`}>
                      {book.categories && book.categories.length > 0 ? book.categories.join(' • ') : 'Жанр не вказано'}
                    </span>
                    <h4 className={`font-serif-gothic font-bold text-xs md:text-2xl italic leading-tight transition ${textTitle} group-hover:opacity-60 line-clamp-2`}>{book.title}</h4>
                    <p className={`text-[8px] md:text-[12px] italic opacity-40 ${isDarkMode ? '' : 'text-stone-900'}`}>— {book.author.split(' ').pop()} —</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Навігація по сторінках */}
            {totalPages > 1 && (
              <div className="mt-20 flex justify-center items-center gap-4">
                <button 
                  disabled={currentPage === 1}
                  title="Попередня сторінка"
                  aria-label="Попередня сторінка"
                  onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 border flex items-center justify-center transition disabled:opacity-20 ${isDarkMode ? 'border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-500' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-12 h-12 border text-[11px] font-black transition ${
                        currentPage === page 
                          ? (isDarkMode ? 'bg-stone-100 text-stone-950 border-stone-100' : 'bg-stone-900 text-stone-100 border-stone-900') 
                          : (isDarkMode ? 'border-stone-800 text-stone-500 hover:border-stone-600' : 'border-stone-200 text-stone-400 hover:border-stone-400')
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  title="Наступна сторінка"
                  aria-label="Наступна сторінка"
                  onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 border flex items-center justify-center transition disabled:opacity-20 ${isDarkMode ? 'border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-500' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center space-y-6">
            <p className="opacity-30 text-2xl font-serif-gothic italic">Нічого не знайдено за поточними фільтрами.</p>
            <button
              type="button"
              onClick={resetFilters}
              className={`px-6 py-3 border text-[10px] font-black uppercase tracking-widest transition ${
                isDarkMode
                  ? 'border-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-900/40'
                  : 'border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Скинути фільтри
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Storefront;
