
import React, { useState, useMemo, useEffect } from 'react';
import { Book } from '../types';
import StorefrontFilters from './StorefrontFilters';
import { withCoverFallback } from '../services/covers';

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
    minYear: number;
    maxYear: number;
    minRating: number;
    publisher: string;
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
  const [minYear, setMinYear] = useState<number>(0);
  const [maxYear, setMaxYear] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [publisherQuery, setPublisherQuery] = useState('');
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
  }, [searchQuery, selectedCategory, priceMin, priceMax, minYear, maxYear, minRating, publisherQuery, onlyAvailable, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void onFiltersChange({
        q: searchQuery,
        category: selectedCategory,
        minPrice: priceMin,
        maxPrice: priceMax,
        minYear,
        maxYear,
        minRating,
        publisher: publisherQuery,
        inStock: onlyAvailable,
        sort: sortBy,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, priceMin, priceMax, minYear, maxYear, minRating, publisherQuery, onlyAvailable, sortBy, onFiltersChange]);

  const resetFilters = () => {
    setSearchQuery('');
    if (onCategoryChange) onCategoryChange('Всі');
    setPriceMin(0);
    setPriceMax(2000);
    setMinYear(0);
    setMaxYear(0);
    setMinRating(0);
    setPublisherQuery('');
    setOnlyAvailable(false);
    setSortBy('default');
    setCurrentPage(1);
    if (onClearExternalFilter) onClearExternalFilter();
  };

  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-950';
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'Всі' ||
    priceMin !== 0 ||
    priceMax !== 2000 ||
    minYear !== 0 ||
    maxYear !== 0 ||
    minRating !== 0 ||
    publisherQuery.trim().length > 0 ||
    onlyAvailable ||
    sortBy !== 'default';

  return (
    <div className="space-y-16 animate-fadeIn pb-24">
      <section className="pt-8 md:pt-12">
        <h3 className={`text-3xl md:text-6xl font-serif-gothic font-black italic tracking-tight leading-[0.95] ${textTitle}`}>
          Бібліотека Видавництва
        </h3>
        <div
          aria-live="polite"
          className={`mt-4 text-[11px] font-medium tracking-[0.16em] uppercase ${isDarkMode ? 'text-stone-300/60' : 'text-stone-600/70'}`}
        >
          Знайдено: {filteredBooks.length} книг
        </div>
      </section>

      <StorefrontFilters
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedCategory={selectedCategory}
        allCategories={allCategories}
        onCategoryChange={onCategoryChange}
        priceMin={priceMin}
        setPriceMin={setPriceMin}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        minYear={minYear}
        setMinYear={setMinYear}
        maxYear={maxYear}
        setMaxYear={setMaxYear}
        minRating={minRating}
        setMinRating={setMinRating}
        publisherQuery={publisherQuery}
        setPublisherQuery={setPublisherQuery}
        onlyAvailable={onlyAvailable}
        setOnlyAvailable={setOnlyAvailable}
        resetFilters={resetFilters}
      />

      {/* Каталог */}
      <section>
        <div className={`mb-16 border-b pb-5 flex justify-between items-end ${isDarkMode ? 'border-zinc-800/70' : 'border-zinc-300/70'}`}>
          <div />
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
            {(minYear !== 0 || maxYear !== 0) && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Рік: {minYear || '—'}–{maxYear || '—'}
              </span>
            )}
            {minRating !== 0 && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Рейтинг: від {minRating}
              </span>
            )}
            {publisherQuery.trim().length > 0 && (
              <span className={`px-3 py-1 rounded-full text-[10px] border ${isDarkMode ? 'border-zinc-700/50 bg-zinc-950/30 text-stone-200/80' : 'border-stone-200 bg-white/70 text-stone-700'}`}>
                Видавництво: {publisherQuery}
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
                      onError={withCoverFallback}
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
                    <div className={`flex items-center justify-center gap-1 text-[9px] ${isDarkMode ? 'text-amber-200' : 'text-amber-600'}`}>
                      <i className="fas fa-star" />
                      <span className={`font-semibold ${isDarkMode ? 'text-stone-200' : 'text-stone-800'}`}>{Number(book.rating || 0).toFixed(1)}</span>
                      <span className={`${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>({Number(book.reviewsCount || 0)})</span>
                    </div>
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
