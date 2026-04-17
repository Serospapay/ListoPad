
import React, { useState, useMemo, useEffect } from 'react';
import { Book, BookReviewModeration } from '../types';
import { apiService } from '../services/api';
import { withCoverFallback } from '../services/covers';

interface InventoryProps {
  books: Book[];
  categories: string[];
  onUpdateCategories: (cats: string[]) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onAddBook: (book: Book) => Promise<Book>;
  onUpdateBook: (book: Book) => Promise<void>;
  onDeleteBook: (bookId: string) => Promise<void>;
  onRefreshBooks: () => Promise<void>;
  isDarkMode: boolean;
}

const Inventory: React.FC<InventoryProps> = ({ 
  books, categories, onUpdateCategories, onRenameCategory, 
  onAddBook, onUpdateBook, onDeleteBook, onRefreshBooks, isDarkMode 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [pendingReviews, setPendingReviews] = useState<BookReviewModeration[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);
  const [reviewModerationError, setReviewModerationError] = useState<string | null>(null);
  
  const [inventorySearch, setInventorySearch] = useState('');
  const [showDeficit, setShowDeficit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 40;

  const [formatW, setFormatW] = useState('');
  const [formatH, setFormatH] = useState('');
  const [weightVal, setWeightVal] = useState('');

  const [formData, setFormData] = useState<Partial<Book>>({
    title: '', author: '', price: 0, categories: [],
    description: '', inventory: 0, pages: 0, year: new Date().getFullYear(),
    publisher: 'ЛистоПад', cover: 'Тверда', images: []
  });

  const cardBg = isDarkMode ? 'bg-stone-900/20 border-stone-800 backdrop-blur-md' : 'bg-white/20 border-stone-200 backdrop-blur-md';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-600' : 'text-stone-400';
  const inputClass = `w-full px-4 py-3 bg-transparent border-b text-base transition focus:outline-none ${isDarkMode ? 'border-stone-800 text-stone-200 focus:border-stone-500' : 'border-stone-200 text-stone-800 focus:border-stone-900'}`;

  const [genreEditName, setGenreEditName] = useState<{old: string, new: string} | null>(null);
  const [newGenreInput, setNewGenreInput] = useState('');

  const filteredInventory = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(inventorySearch.toLowerCase()) || 
        book.author.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesDeficit = !showDeficit || book.inventory < 10;
      return matchesSearch && matchesDeficit;
    });
  }, [books, inventorySearch, showDeficit]);

  const totalPages = Math.ceil(filteredInventory.length / BOOKS_PER_PAGE);
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredInventory.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredInventory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [inventorySearch, showDeficit]);

  useEffect(() => {
    let isActive = true;
    const loadPendingReviews = async () => {
      setIsReviewsLoading(true);
      setReviewModerationError(null);
      try {
        const rows = await apiService.getReviewsForModeration({ status: 'pending' });
        if (isActive) {
          setPendingReviews(rows);
        }
      } catch (error) {
        if (isActive) {
          setReviewModerationError(error instanceof Error ? error.message : 'Не вдалося завантажити відгуки на модерацію.');
        }
      } finally {
        if (isActive) {
          setIsReviewsLoading(false);
        }
      }
    };
    void loadPendingReviews();
    return () => {
      isActive = false;
    };
  }, []);

  const moderateReview = async (reviewId: string, nextStatus: 'approved' | 'rejected') => {
    setReviewActionId(reviewId);
    setReviewModerationError(null);
    try {
      await apiService.moderateReview(reviewId, { status: nextStatus });
      setPendingReviews((prev) => prev.filter((row) => row.id !== reviewId));
      await onRefreshBooks();
    } catch (error) {
      setReviewModerationError(error instanceof Error ? error.message : 'Не вдалося виконати модерацію відгуку.');
    } finally {
      setReviewActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (bookToDelete) {
      try {
        setIsSubmitting(true);
        await onDeleteBook(bookToDelete.id);
        setBookToDelete(null);
      } catch (error) {
        setModalError(error instanceof Error ? error.message : 'Не вдалося видалити книгу.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsLoadingImages(true);
    const compressedImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(base64);
      compressedImages.push(compressed);
    }
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...compressedImages].slice(0, 10)
    }));
    setIsLoadingImages(false);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (!formData.images) return;
    const newImages = [...formData.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => {
      const current = prev.categories || [];
      if (current.includes(genre)) {
        return { ...prev, categories: current.filter(c => c !== genre) };
      }
      return { ...prev, categories: [...current, genre] };
    });
  };

  const openAddModal = () => {
    setModalError(null);
    setEditingBook(null);
    setFormData({
      title: '', author: '', price: 0, categories: [],
      description: '', inventory: 0, pages: 0, year: new Date().getFullYear(),
      publisher: 'ЛистоПад', cover: 'Тверда', images: []
    });
    setFormatW(''); setFormatH(''); setWeightVal('');
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setModalError(null);
    setEditingBook(book);
    setFormData(book);
    if (book.format) {
      const parts = book.format.replace(' мм', '').split('x');
      setFormatW(parts[0] || ''); setFormatH(parts[1] || '');
    }
    setWeightVal(book.weight ? book.weight.replace(' г', '') : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    const finalFormat = formatW && formatH ? `${formatW}x${formatH} мм` : '';
    const finalWeight = weightVal ? `${weightVal} г` : '';
    const finalBook: Book = {
      ...(formData as Book),
      id: editingBook?.id || '',
      rating: editingBook?.rating || 0,
      format: finalFormat,
      weight: finalWeight,
      coverImage: formData.images?.[0] || 'https://images.unsplash.com/photo-1543003919-a9957004bfa0?auto=format&fit=crop&q=80&w=800'
    };
    try {
      if (editingBook) {
        await onUpdateBook(finalBook);
      } else {
        await onAddBook(finalBook);
      }
      setIsModalOpen(false);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Не вдалося зберегти книгу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      <section className={`border rounded-2xl p-5 md:p-6 ${isDarkMode ? 'border-stone-800 bg-stone-950/30' : 'border-stone-200 bg-white/70'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={`text-2xl font-serif-gothic font-black italic ${textTitle}`}>Модерація відгуків</h3>
          <span className={`text-[11px] font-black uppercase tracking-[0.16em] ${textMuted}`}>Очікують: {pendingReviews.length}</span>
        </div>
        {reviewModerationError && (
          <p className="mt-3 text-[11px] font-semibold text-rose-500">{reviewModerationError}</p>
        )}
        <div className="mt-4 space-y-3">
          {isReviewsLoading ? (
            <p className={textMuted}>Завантаження черги модерації...</p>
          ) : pendingReviews.length === 0 ? (
            <p className={textMuted}>Немає відгуків, що очікують модерації.</p>
          ) : (
            pendingReviews.map((review) => (
              <article key={review.id} className={`border rounded-xl p-4 ${isDarkMode ? 'border-stone-800 bg-stone-950/40' : 'border-stone-200 bg-stone-50/60'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${textTitle}`}>{review.bookTitle}</p>
                    <p className={`text-[11px] ${textMuted}`}>{review.userName} ({review.userEmail})</p>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <i key={`${review.id}-moderation-star-${index}`} className={`${index < review.rating ? 'fas' : 'far'} fa-star`} />
                      ))}
                    </div>
                    <p className={`mt-2 whitespace-pre-line text-sm ${isDarkMode ? 'text-stone-300' : 'text-stone-700'}`}>{review.comment}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void moderateReview(review.id, 'approved')}
                      disabled={reviewActionId === review.id}
                      className="h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-60"
                    >
                      Підтвердити
                    </button>
                    <button
                      type="button"
                      onClick={() => void moderateReview(review.id, 'rejected')}
                      disabled={reviewActionId === review.id}
                      className="h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] bg-rose-600 text-white hover:bg-rose-500 transition disabled:opacity-60"
                    >
                      Відхилити
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className={`flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-10 ${isDarkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="flex items-center gap-6">
          <h2 className={`text-4xl font-serif-gothic font-black italic ${textTitle}`}>Склад</h2>
          <button 
            onClick={() => setShowDeficit(!showDeficit)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition shadow-lg ${
              showDeficit
                ? 'bg-rose-700 border-rose-700 text-stone-100/90'
                : (isDarkMode ? 'bg-zinc-900/50 border-zinc-700/50 text-stone-300/70' : 'bg-stone-50 border-stone-200 text-stone-600')
            }`}
            title="Показати дефіцитні (менше 10)"
          >
            <i className="fas fa-exclamation text-lg"></i>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
          <div className="relative w-full md:w-64">
            <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-xs opacity-40 ${isDarkMode ? '' : 'text-stone-900'}`}></i>
            <input 
              type="text" 
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Шукати на складі..."
              className={`w-full pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-widest bg-transparent border-b focus:outline-none transition ${isDarkMode ? 'border-stone-800 focus:border-stone-100 text-stone-200' : 'border-stone-200 focus:border-stone-900 text-stone-900'}`}
            />
          </div>

          <button onClick={() => setIsGenreModalOpen(true)} className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest transition border ${isDarkMode ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'}`}>
            <i className="fas fa-tags mr-3 text-sm"></i> Жанри
          </button>
          <button onClick={openAddModal} className={`${isDarkMode ? 'bg-stone-100 text-stone-950 border-stone-200' : 'bg-stone-900 text-stone-100 border-stone-950'} px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition shadow-2xl border`}>
            <i className="fas fa-plus mr-3 text-sm"></i> Додати книгу
          </button>
        </div>
      </div>

      {paginatedInventory.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {paginatedInventory.map(book => (
              <div key={book.id} className={`${cardBg} border p-5 flex flex-col shadow-xl group transition duration-500 hover:scale-[1.02] ${isDarkMode ? 'hover:border-stone-500' : 'hover:border-stone-400'}`}>
                <div className="aspect-[3/4.5] border overflow-hidden shadow-md flex-shrink-0 bg-stone-950/40 relative mb-4">
                  <img src={book.coverImage} className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-100 group-hover:grayscale-0 transition duration-700" alt={book.title} onError={withCoverFallback} />
                   <div className={`absolute top-0 right-0 ${book.inventory < 10 ? 'bg-rose-700/90' : 'bg-zinc-950/70'} text-[8px] font-black text-stone-100/90 px-2 py-1 uppercase tracking-widest`}>
                     {book.inventory > 0 ? `Склад: ${book.inventory}` : 'Скоро у наявності'}
                   </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center">
                    <h4 className={`font-serif-gothic font-bold line-clamp-1 italic text-base mb-1 ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{book.title}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 italic ${textMuted}`}>{book.author}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-stone-800/10">
                    <button onClick={() => openEditModal(book)} className={`w-full py-2 border text-[9px] font-black uppercase tracking-widest transition ${isDarkMode ? 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-100' : 'bg-stone-50/60 text-stone-500 border-stone-200 hover:text-stone-900'}`}>Змінити</button>
              <button onClick={() => setBookToDelete(book)} className={`w-full py-2 border text-[9px] font-black uppercase tracking-widest transition bg-rose-900/10 text-rose-300/90 border-rose-900/20 hover:bg-rose-600 hover:text-stone-100/90`}>Видалити</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-20 flex justify-center items-center gap-4">
              <button 
                disabled={currentPage === 1}
                title="Попередня сторінка"
                aria-label="Попередня сторінка"
                onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-10 h-10 border flex items-center justify-center transition disabled:opacity-20 ${isDarkMode ? 'border-stone-800 text-stone-400 hover:text-stone-100' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 border text-[9px] font-black transition ${
                      currentPage === page 
                        ? (isDarkMode ? 'bg-stone-100 text-stone-950 border-stone-100' : 'bg-stone-900 text-stone-100 border-stone-900') 
                        : (isDarkMode ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-400')
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
                className={`w-10 h-10 border flex items-center justify-center transition disabled:opacity-20 ${isDarkMode ? 'border-stone-800 text-stone-400 hover:text-stone-100' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center opacity-30 text-[11px] font-black uppercase tracking-widest">
          {inventorySearch || showDeficit ? 'Співпадінь на складі не знайдено' : 'Склад порожній'}
        </div>
      )}

      {bookToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md" onClick={() => setBookToDelete(null)}></div>
          <div className={`relative max-w-md w-full border shadow-2xl p-10 text-center animate-slideUp ${cardBg}`}>
            <i className="fas fa-exclamation-triangle text-4xl text-rose-600 mb-6"></i>
            <h3 className="text-2xl font-serif-gothic font-black italic mb-4">Видалення книги</h3>
            <p className={`text-sm italic mb-10 ${textMuted}`}>
              Ви впевнені, що хочете видалити твір <span className="font-bold text-stone-200">"{bookToDelete.title}"</span>? Цю дію неможливо скасувати.
            </p>
            {modalError && (
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-rose-500">{modalError}</p>
            )}
            <div className="flex gap-4">
              <button onClick={() => setBookToDelete(null)} className="flex-1 py-4 border text-[10px] font-black uppercase tracking-widest border-stone-700 text-stone-400 hover:bg-stone-800">Скасувати</button>
              <button disabled={isSubmitting} onClick={() => void confirmDelete()} className="flex-1 py-4 bg-rose-700 text-stone-100/90 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-60">{isSubmitting ? 'Видалення...' : 'Видалити'}</button>
            </div>
          </div>
        </div>
      )}

      {isGenreModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-md" onClick={() => setIsGenreModalOpen(false)}></div>
          <div className={`relative max-w-lg w-full border shadow-2xl p-10 animate-slideUp ${cardBg}`}>
            <h3 className="text-2xl font-serif-gothic font-black italic mb-8">Реєстр Жанрів</h3>
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between group">
                  {genreEditName?.old === cat ? (
                    <input 
                      aria-label="Редагування назви жанру"
                      placeholder="Назва жанру"
                      autoFocus className={inputClass} value={genreEditName.new}
                      onChange={e => setGenreEditName({...genreEditName, new: e.target.value})}
                      onBlur={() => { if (genreEditName.new.trim() && genreEditName.new !== cat) onRenameCategory(cat, genreEditName.new); setGenreEditName(null); }}
                      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                  ) : (
                    <>
                      <span className="text-base font-bold uppercase tracking-widest opacity-70">{cat}</span>
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition">
                        <button title="Редагувати жанр" aria-label="Редагувати жанр" onClick={() => setGenreEditName({old: cat, new: cat})} className="text-stone-500 hover:text-stone-100"><i className="fas fa-pen text-[11px]"></i></button>
                        <button title="Видалити жанр" aria-label="Видалити жанр" onClick={() => onUpdateCategories(categories.filter(c => c !== cat))} className="text-rose-900 hover:text-rose-500"><i className="fas fa-trash text-[11px]"></i></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-stone-800">
               <label className="block text-[9px] font-black uppercase tracking-widest mb-2 opacity-40">Новий жанр</label>
               <div className="flex gap-4">
                  <input value={newGenreInput} onChange={e => setNewGenreInput(e.target.value)} className={inputClass} placeholder="Напр: Класика" />
                  <button onClick={() => { if (newGenreInput.trim() && !categories.includes(newGenreInput)) { onUpdateCategories([...categories, newGenreInput]); setNewGenreInput(''); } }} className="px-6 bg-stone-100 text-stone-950 font-black text-[11px] uppercase">Додати</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn overflow-y-auto">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative max-w-4xl w-full border shadow-2xl overflow-hidden animate-slideUp my-auto ${cardBg}`}>
            <div className="p-8 border-b flex justify-between items-center bg-stone-950/50">
               <h3 className="text-2xl font-serif-gothic font-black italic">{editingBook ? 'Редагувати' : 'Нова книга'}</h3>
               <button title="Закрити модальне вікно" aria-label="Закрити модальне вікно" onClick={() => setIsModalOpen(false)} className="opacity-50 hover:opacity-100"><i className="fas fa-times text-lg"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {modalError && (
                <div className="p-4 border border-rose-900/60 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-950/20">
                  {modalError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 border-b pb-2">Основні дані</h4>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} placeholder="Назва книги" />
                  <input required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className={inputClass} placeholder="Автор" />
                  <div className="space-y-3">
                    <label className="block text-[9px] font-black uppercase tracking-widest opacity-40">Жанри</label>
                    <div className={`grid grid-cols-2 gap-3 p-4 border max-h-40 overflow-y-auto custom-scrollbar ${isDarkMode ? 'border-stone-800 bg-stone-950/40' : 'border-stone-100 bg-stone-50/40'}`}>
                      {categories.map(cat => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                          <input aria-label={`Обрати жанр ${cat}`} type="checkbox" checked={formData.categories?.includes(cat)} onChange={() => toggleGenre(cat)} className="hidden" />
                          <div className={`w-4 h-4 border flex items-center justify-center transition ${formData.categories?.includes(cat) ? (isDarkMode ? 'bg-stone-100 border-stone-100' : 'bg-stone-900 border-stone-900') : 'border-stone-500'}`}>
                            {formData.categories?.includes(cat) && <i className={`fas fa-check text-[8px] ${isDarkMode ? 'text-stone-950' : 'text-stone-100/90'}`}></i>}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest transition ${formData.categories?.includes(cat) ? textTitle : 'opacity-40 group-hover:opacity-100'}`}>{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Ціна (₴)</label>
                      <input aria-label="Ціна книги у гривнях" type="number" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Кількість на складі</label>
                      <input aria-label="Кількість книги на складі" type="number" required value={formData.inventory} onChange={e => setFormData({...formData, inventory: Number(e.target.value)})} className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 border-b pb-2">Характеристики</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Рік видання</label>
                       <input aria-label="Рік видання книги" type="number" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Сторінок</label>
                       <input aria-label="Кількість сторінок книги" type="number" value={formData.pages} onChange={e => setFormData({...formData, pages: Number(e.target.value)})} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Вага (г)</label>
                      <input type="number" value={weightVal} onChange={e => setWeightVal(e.target.value)} className={inputClass} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Формат (ШxВ)</label>
                      <div className="flex gap-2">
                        <input type="number" value={formatW} onChange={e => setFormatW(e.target.value)} className={inputClass} placeholder="Ш" />
                        <input type="number" value={formatH} onChange={e => setFormatH(e.target.value)} className={inputClass} placeholder="В" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {['Тверда', 'М\'яка'].map(c => (
                      <button key={c} type="button" onClick={() => setFormData({...formData, cover: c})} className={`flex-1 py-3 border text-[10px] font-black uppercase transition ${formData.cover === c ? 'bg-stone-100 text-stone-950 border-stone-100' : 'opacity-40 border-stone-800'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Опис</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className={`w-full p-4 bg-transparent border text-base transition font-serif italic focus:outline-none ${isDarkMode ? 'border-stone-800' : 'border-stone-200'}`} placeholder="..." />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2 border-stone-800/20">
                  <h4 className="text-[11px] font-black uppercase tracking-widest opacity-50">Галерея ({formData.images?.length || 0}/10)</h4>
                  <label className="cursor-pointer px-6 py-2 border text-[9px] font-black uppercase tracking-widest hover:bg-stone-100 hover:text-stone-950 transition">
                    <i className="fas fa-images mr-2 text-sm"></i> {isLoadingImages ? 'Завантаження...' : 'Додати фото'}
                    <input aria-label="Завантажити зображення книги" type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" disabled={isLoadingImages} />
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {formData.images?.map((img, idx) => (
                    <div key={idx} className="relative aspect-[3/4] border group overflow-hidden border-stone-800 bg-stone-950/40">
                      <img src={img} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-zinc-950/50">
                        <button title="Перемістити зображення вліво" aria-label="Перемістити зображення вліво" type="button" onClick={() => moveImage(idx, 'left')} className="w-10 h-10 rounded-full bg-stone-100/90 text-stone-950 flex items-center justify-center text-sm hover:bg-stone-100 transition shadow-xl"><i className="fas fa-chevron-left"></i></button>
                        <button title="Перемістити зображення вправо" aria-label="Перемістити зображення вправо" type="button" onClick={() => moveImage(idx, 'right')} className="w-10 h-10 rounded-full bg-stone-100/90 text-stone-950 flex items-center justify-center text-sm hover:bg-stone-100 transition shadow-xl"><i className="fas fa-chevron-right"></i></button>
                      </div>
                      <button title="Видалити зображення" aria-label="Видалити зображення" type="button" onClick={() => setFormData({...formData, images: formData.images?.filter((_, i) => i !== idx)})} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 text-stone-100/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"><i className="fas fa-times text-[11px]"></i></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-10">
                <button type="submit" disabled={isLoadingImages || isSubmitting} className={`w-full py-5 font-black text-[11px] uppercase tracking-widest transition shadow-2xl border disabled:opacity-60 ${
                  isDarkMode
                    ? 'border-amber-200/25 bg-gradient-to-b from-amber-200/12 to-zinc-950/25 text-stone-100/90 hover:border-amber-200/40 hover:bg-amber-200/15'
                    : 'border-stone-200/80 bg-stone-50/80 text-stone-950 hover:border-stone-300'
                }`}>{isSubmitting ? 'Збереження...' : 'Зберегти зміни'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
