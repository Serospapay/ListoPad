
import React, { useState, useMemo, useEffect } from 'react';
import { Book, CartItem, User } from '../types';

interface StorefrontProps {
  books: Book[];
  categories: string[];
  cart: CartItem[];
  user: User | null;
  wishlist: string[];
  onToggleWishlist: (bookId: string) => void;
  onUpdateBook?: (book: Book) => void;
  externalCategoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  onClearExternalFilter?: () => void;
  onAddToCart: (book: Book) => void;
  onGoToCheckout: () => void;
  onViewBook: (book: Book) => void;
  isDarkMode: boolean;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'pages-asc' | 'pages-desc';

const Storefront: React.FC<StorefrontProps> = ({ 
  books, categories, cart, user, wishlist, onToggleWishlist, onUpdateBook, externalCategoryFilter, onCategoryChange, onClearExternalFilter, 
  onAddToCart, onGoToCheckout, onViewBook, isDarkMode 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCategory = externalCategoryFilter || 'Всі';
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  
  // Пагінація
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 40;

  const allCategories = useMemo(() => ['Всі', ...categories], [categories]);

  const filteredBooks = useMemo(() => {
    let result = books.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Всі' || (book.categories && book.categories.includes(selectedCategory));
      const matchesPrice = book.price >= priceMin && book.price <= priceMax;
      const matchesAvailability = !onlyAvailable || book.inventory > 0;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesAvailability;
    });

    // Сортування
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'pages-asc':
        result.sort((a, b) => a.pages - b.pages);
        break;
      case 'pages-desc':
        result.sort((a, b) => b.pages - a.pages);
        break;
      default:
        break;
    }

    return result;
  }, [books, searchQuery, selectedCategory, priceMin, priceMax, onlyAvailable, sortBy]);

  // Розрахунок сторінок
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  // Скидання сторінки при зміні фільтрів
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceMin, priceMax, onlyAvailable, sortBy]);

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

  const cardBg = isDarkMode ? 'bg-stone-900/40 border-stone-800' : 'bg-white/60 border-stone-300 shadow-sm';
  const inputBg = isDarkMode ? 'bg-stone-950/60 border-stone-800 text-stone-200' : 'bg-white/80 border-stone-200 text-stone-900';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-950';

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* Фільтри */}
      <section className={`${cardBg} backdrop-blur-md p-8 border shadow-xl transition-all duration-700`}>
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Шукати */}
            <div className="w-full lg:flex-1 relative">
              <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-40 ${isDarkMode ? '' : 'text-stone-900'}`}></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук.."
                className={`w-full pl-12 pr-4 py-4 focus:outline-none text-sm transition font-medium ${inputBg}`}
              />
            </div>

            {/* Сортування */}
            <div className="w-full lg:w-64">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`w-full px-6 py-4 focus:outline-none text-sm cursor-pointer font-bold ${inputBg}`}
              >
                <option value="default">За замовчуванням</option>
                <option value="price-asc">Ціна: від дешевших</option>
                <option value="price-desc">Ціна: від дородчих</option>
                <option value="pages-asc">Обсяг: від менших</option>
                <option value="pages-desc">Обсяг: від більших</option>
              </select>
            </div>

            {/* Жанри */}
            <div className="w-full lg:w-56">
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  if (onCategoryChange) onCategoryChange(e.target.value);
                }}
                className={`w-full px-6 py-4 focus:outline-none text-sm cursor-pointer font-bold ${inputBg}`}
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Всі' ? 'Всі жанри' : cat}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={resetFilters}
              className={`w-full lg:w-auto text-[11px] font-black uppercase tracking-widest transition py-4 px-6 opacity-60 hover:opacity-100 ${isDarkMode ? 'text-stone-400' : 'text-stone-900'}`}
            >
              Скинути
            </button>
          </div>

          <div className={`pt-6 border-t ${isDarkMode ? 'border-stone-800' : 'border-stone-200'} flex flex-col md:flex-row gap-10 items-center`}>
            {/* Ціна */}
            <div className="flex-1 w-full space-y-3">
               <div className="flex justify-between items-center mb-1">
                 <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${isDarkMode ? '' : 'text-stone-900'}`}>Ціна (₴)</span>
                 <span className={`text-[11px] font-black tracking-widest ${textTitle}`}>
                   {priceMin} — {priceMax}
                 </span>
               </div>
               
               <div className="relative w-full h-4 flex items-center">
                  <div className={`absolute w-full h-0.5 ${isDarkMode ? 'bg-stone-800' : 'bg-stone-300'}`}></div>
                  <div 
                    className="absolute h-0.5 bg-stone-500 z-10"
                    style={{
                      left: `${(priceMin / 2000) * 100}%`,
                      right: `${100 - (priceMax / 2000) * 100}%`
                    }}
                  ></div>

                  <input 
                    type="range" min="0" max="2000" step="50"
                    value={priceMin} 
                    onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 50))}
                    className={`absolute w-full h-0.5 bg-transparent appearance-none cursor-pointer ${priceMin > 1000 ? 'z-30' : 'z-40'}`}
                  />
                  
                  <input 
                    type="range" min="0" max="2000" step="50"
                    value={priceMax} 
                    onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 50))}
                    className={`absolute w-full h-0.5 bg-transparent appearance-none cursor-pointer ${priceMin > 1000 ? 'z-40' : 'z-30'}`}
                  />
               </div>
            </div>

            {/* Наявність */}
            <div className="flex items-center gap-4 shrink-0">
               <button 
                 onClick={() => setOnlyAvailable(!onlyAvailable)}
                 className={`w-12 h-6 border transition-all flex items-center p-0.5 ${onlyAvailable ? 'bg-stone-900 border-stone-900' : 'bg-transparent border-stone-400'}`}
               >
                  <div className={`w-4 h-4 transition-all ${onlyAvailable ? 'translate-x-6 bg-stone-100' : 'translate-x-0 bg-stone-500'}`}></div>
               </button>
               <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${isDarkMode ? '' : 'text-stone-900'}`}>В наявності</span>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог */}
      <section>
        <div className={`mb-12 border-b-2 pb-6 flex justify-between items-end ${isDarkMode ? 'border-stone-700' : 'border-stone-400'}`}>
          <h3 className={`text-2xl md:text-5xl font-serif-gothic font-black italic tracking-tighter ${textTitle}`}>Бібліотека Видавництва</h3>
          {totalPages > 1 && (
            <div className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDarkMode ? 'text-stone-400' : 'text-stone-900'}`}>
              Сторінка {currentPage} з {totalPages}
            </div>
          )}
        </div>

        {paginatedBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 md:gap-x-10 gap-y-10 md:gap-y-20">
              {paginatedBooks.map(book => (
                <div key={book.id} className="group cursor-pointer relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(book.id); }}
                    className={`absolute top-2 left-2 md:top-4 md:left-4 z-20 w-6 h-6 md:w-10 md:h-10 border flex items-center justify-center transition-all ${wishlist.includes(book.id) ? 'bg-stone-100 text-stone-950 border-stone-100' : 'bg-stone-950/40 text-white border-white/20 hover:bg-stone-100 hover:text-stone-950'}`}
                  >
                    <i className={`${wishlist.includes(book.id) ? 'fas' : 'far'} fa-star text-[8px] md:text-base`}></i>
                  </button>

                  <div onClick={() => onViewBook(book)} className="relative aspect-[3/4.5] mb-4 md:mb-8 overflow-hidden bg-stone-950 shadow-2xl transition-transform duration-700 hover:-translate-y-2">
                    <img 
                      src={book.coverImage} 
                      className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition duration-1000" 
                      alt={book.title} 
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition duration-700"></div>
                    
                    <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-stone-950/90 backdrop-blur-md text-white px-2 py-1 md:px-4 md:py-2 border border-white/10 flex items-center gap-1 shadow-2xl">
                      <span className="text-[8px] md:text-[11px] font-black tracking-widest">{book.price} ₴</span>
                    </div>

                    {book.inventory === 0 && (
                      <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-rose-950/90 text-white px-1.5 py-0.5 md:px-3 md:py-1 text-[6px] md:text-[8px] font-black uppercase tracking-widest shadow-xl">
                        Скоро
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                       <button 
                         onClick={(e) => { e.stopPropagation(); onAddToCart(book); }}
                         className="bg-white text-stone-950 px-4 py-2 md:px-8 md:py-4 font-black text-[8px] md:text-[10px] uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                       >
                          У КОШИК
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
                  onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 border flex items-center justify-center transition disabled:opacity-20 ${isDarkMode ? 'border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-500' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center opacity-30 text-2xl font-serif-gothic italic">Поки що тут пусто...</div>
        )}
      </section>
    </div>
  );
};

export default Storefront;
