
import React, { useState, useMemo } from 'react';
import { Book } from '../types';

interface BookDetailsProps {
  book: Book;
  allBooks: Book[];
  onAddToCart: (book: Book) => void;
  onViewGenre: (genre: string) => void;
  onViewBook: (book: Book) => void;
  onBack: () => void;
  isDarkMode: boolean;
  wishlist: string[];
  onToggleWishlist: (bookId: string) => void;
}

const BookDetails: React.FC<BookDetailsProps> = ({ 
  book, allBooks, onAddToCart, onViewGenre, onViewBook, onBack, isDarkMode, wishlist, onToggleWishlist 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const images = book.images && book.images.length > 0 ? book.images : [book.coverImage];

  const cardBg = isDarkMode ? 'bg-stone-900/20 border-stone-800 backdrop-blur-md' : 'bg-white/20 border-stone-200 backdrop-blur-md';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const textBody = isDarkMode ? 'text-stone-300' : 'text-stone-700';
  const borderCol = isDarkMode ? 'border-stone-800' : 'border-stone-100';
  const accentBg = isDarkMode ? 'bg-stone-950/40' : 'bg-stone-50/40';

  const specs = [
    { label: 'Кількість сторінок', value: book.pages },
    { label: 'Рік видання', value: book.year },
    { label: 'Видавництво', value: book.publisher },
    { label: 'Обкладинка', value: book.cover },
    { label: 'Формат', value: book.format },
    { label: 'Вага', value: book.weight },
  ];

  const similarBooks = useMemo(() => {
    return allBooks
      .filter(b => b.id !== book.id && b.categories.some(cat => book.categories.includes(cat)))
      .slice(0, 5);
  }, [allBooks, book]);

  const handlePrev = () => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  const handleNext = () => setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));

  const isLiked = wishlist.includes(book.id);

  return (
    <div className="w-full animate-fadeIn pb-24 space-y-20">
      <div>
        <button 
          onClick={onBack} 
          className={`${textMuted} font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 transition-all mb-12 ${isDarkMode ? 'hover:text-stone-100' : 'hover:text-stone-900'}`}
        >
          <i className="fas fa-arrow-left"></i> Назад до бібліотеки
        </button>

        <div className={`${cardBg} border shadow-2xl flex flex-col lg:flex-row overflow-hidden transition-all duration-700`}>
          {/* Gallery Section */}
          <div className={`lg:w-1/5 relative flex flex-col ${accentBg} border-b lg:border-b-0 lg:border-r ${borderCol}`}>
            <div className="relative flex-1 flex flex-col items-center justify-start p-8 min-h-[400px] lg:min-h-min">
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="relative w-full aspect-[3/4.5] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden bg-stone-950 cursor-zoom-in group mb-8"
              >
                 <img 
                   src={images[currentImageIndex]} 
                   className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
                   alt={book.title} 
                 />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                    <i className="fas fa-search-plus text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
                 </div>
              </div>

              {images.length > 1 && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="flex items-center gap-8">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      className={`w-12 h-12 flex items-center justify-center border transition shadow-lg ${isDarkMode ? 'border-stone-700 text-stone-400 hover:text-stone-100 hover:border-stone-500 bg-stone-900/40' : 'border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900 bg-white/40'}`}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      className={`w-12 h-12 flex items-center justify-center border transition shadow-lg ${isDarkMode ? 'border-stone-700 text-stone-400 hover:text-stone-100 hover:border-stone-500 bg-stone-900/40' : 'border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900 bg-white/40'}`}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:w-4/5 p-10 md:p-20 lg:p-24 flex flex-col justify-between space-y-16">
            <div className="space-y-12">
              <div className="space-y-10">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-6">
                    {book.categories && book.categories.map((cat, idx) => (
                      <button 
                        key={idx}
                        onClick={() => onViewGenre(cat)}
                        className={`text-[12px] font-black uppercase tracking-[0.5em] transition border-b border-transparent hover:border-stone-500 ${textMuted}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => onToggleWishlist(book.id)}
                    className={`flex items-center gap-4 px-8 py-4 border text-[11px] font-black uppercase tracking-widest transition-all ${isLiked ? (isDarkMode ? 'bg-stone-100 text-stone-950 border-stone-100' : 'bg-stone-900 text-white border-stone-900') : (isDarkMode ? 'border-stone-700 text-stone-500 hover:text-stone-100' : 'border-stone-300 text-stone-400 hover:text-stone-900')}`}
                  >
                    <i className={`${isLiked ? 'fas' : 'far'} fa-star text-base`}></i>
                    {isLiked ? 'У бажаному' : 'До бажаного'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h2 className={`text-6xl md:text-8xl lg:text-9xl font-serif-gothic font-black tracking-tighter italic leading-none ${textTitle}`}>
                    {book.title}
                  </h2>
                  <p className={`text-3xl md:text-4xl font-medium tracking-wide italic ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    — {book.author} —
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                <div className="xl:col-span-8 space-y-8">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] ${textMuted}`}>Анотація</h3>
                  <div className={`${textBody} font-serif italic text-2xl md:text-3xl leading-relaxed whitespace-pre-line`}>
                    {book.description || 'Опис готується до друку...'}
                  </div>
                </div>

                <div className="xl:col-span-4 space-y-10">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-4 ${textMuted}`}>Технічні характеристики</h3>
                  <div className="grid grid-cols-1 gap-y-6">
                    {specs.map((spec, i) => (
                      <div key={i} className={`flex justify-between border-b pb-4 ${borderCol}`}>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${textMuted}`}>{spec.label}</span>
                        <span className={`text-[14px] font-bold ${textTitle}`}>{spec.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`mt-12 p-10 border text-center ${isDarkMode ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                    <p className={`text-[12px] font-black uppercase tracking-[0.6em] mb-4 ${textMuted}`}>Ціна</p>
                    <p className={`text-7xl font-serif-gothic italic font-black ${textTitle}`}>{book.price} ₴</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 flex flex-col md:flex-row items-center gap-12">
              <button 
                 onClick={() => onAddToCart(book)}
                 disabled={book.inventory === 0}
                 className={`flex-1 w-full px-16 py-10 font-black text-[18px] uppercase tracking-[0.8em] transition shadow-2xl disabled:opacity-30 transform hover:-translate-y-1 active:translate-y-0 ${
                   isDarkMode ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-black'
                 }`}
               >
                  {book.inventory > 0 ? 'Додати до кошика' : 'Скоро у наявності'}
               </button>
               <div className="flex flex-col items-center md:items-start gap-2 shrink-0">
                 {book.inventory > 0 ? (
                    <span className={`text-[12px] font-black uppercase tracking-widest ${book.inventory < 10 ? 'text-rose-500 animate-pulse' : textMuted}`}>
                     {book.inventory < 10 ? `Лишилося ${book.inventory} примірників!` : `Доступно: ${book.inventory} шт.`}
                   </span>
                 ) : (
                   <span className="text-[12px] font-black uppercase tracking-widest text-rose-800">Скоро у наявності</span>
                 )}
                 <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>Швидка відправка по Україні</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Books Section */}
      {similarBooks.length > 0 && (
        <section className="space-y-10">
          <h3 className={`text-4xl font-serif-gothic font-black italic tracking-tight ${textTitle}`}>
            Схожі за духом твори
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            {similarBooks.map(b => (
              <div 
                key={b.id} 
                onClick={() => { onViewBook(b); window.scrollTo(0,0); }}
                className="group cursor-pointer space-y-4"
              >
                <div className="aspect-[3/4.5] overflow-hidden bg-stone-950 shadow-xl border border-stone-800 transition-transform duration-500 group-hover:-translate-y-2">
                  <img src={b.coverImage} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition duration-700" alt={b.title} />
                </div>
                <div className="text-center">
                  <h4 className={`text-sm font-serif-gothic font-bold line-clamp-1 italic ${textTitle}`}>{b.title}</h4>
                  <p className={`text-[10px] uppercase tracking-widest opacity-40 ${textMuted}`}>{b.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950/98 animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button className="absolute top-10 right-10 text-white text-3xl opacity-50 hover:opacity-100 transition">
            <i className="fas fa-times"></i>
          </button>
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <img 
              src={images[currentImageIndex]} 
              className="max-w-full max-h-[92vh] object-contain shadow-2xl animate-slideUp"
              alt="Full view"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;
