
import React, { useEffect, useMemo, useState } from 'react';
import { Book, BookReview, User } from '../types';
import { apiService } from '../services/api';
import { withCoverFallback } from '../services/covers';

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
  currentUser: User | null;
  onRequireAuth: () => void;
}

const BookDetailsLayout: React.FC<BookDetailsProps> = ({
  book,
  allBooks,
  onAddToCart,
  onViewGenre,
  onViewBook,
  onBack,
  isDarkMode,
  wishlist,
  onToggleWishlist,
  currentUser,
  onRequireAuth,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const images = book.images && book.images.length > 0 ? book.images : [book.coverImage];
  const isLiked = wishlist.includes(book.id);
  const titleTone = isDarkMode ? 'text-zinc-100' : 'text-zinc-900';
  const bodyTone = isDarkMode ? 'text-zinc-300' : 'text-zinc-700';
  const mutedTone = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const avgRating = Number(book.rating || 0);
  const reviewsCount = Number(book.reviewsCount || 0);

  const specs = [
    { label: 'Сторінок', value: book.pages || '—' },
    { label: 'Рік', value: book.year || '—' },
    { label: 'Видавництво', value: book.publisher || '—' },
    { label: 'Обкладинка', value: book.cover || '—' },
    { label: 'Формат', value: book.format || '—' },
    { label: 'Вага', value: book.weight || '—' },
  ];

  const similarBooks = useMemo(
    () =>
      allBooks
        .filter((candidate) => candidate.id !== book.id && candidate.categories.some((category) => book.categories.includes(category)))
        .slice(0, 4),
    [allBooks, book]
  );

  const handlePrev = () => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  const handleNext = () => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsLightboxOpen(false);
    setReviewError(null);
    setReviewSuccess(null);
    setReviewComment('');
    setReviewRating(5);
  }, [book.id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen]);

  useEffect(() => {
    let isActive = true;
    const loadReviews = async () => {
      setIsReviewsLoading(true);
      setReviewError(null);
      try {
        const rows = await apiService.getBookReviews(book.id);
        if (isActive) {
          setReviews(rows);
        }
      } catch (error) {
        if (isActive) {
          setReviewError(error instanceof Error ? error.message : 'Не вдалося завантажити відгуки.');
        }
      } finally {
        if (isActive) {
          setIsReviewsLoading(false);
        }
      }
    };
    void loadReviews();
    return () => {
      isActive = false;
    };
  }, [book.id]);

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Текст відгуку не може бути порожнім.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const payload = await apiService.submitBookReview(book.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSuccess(payload.detail || 'Відгук надіслано на модерацію.');
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Не вдалося надіслати відгук.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] animate-fadeIn px-2 md:px-4 pb-24">
      <button
        type="button"
        onClick={onBack}
        className={`mb-10 inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.28em] transition ${
          isDarkMode ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <i className="fas fa-arrow-left" />
        Назад до бібліотеки
      </button>

      <section className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-x-10 gap-y-10 border rounded-2xl p-4 md:p-8 ${
        isDarkMode ? 'border-zinc-800/80 bg-zinc-950/35' : 'border-stone-200 bg-white/80'
      }`}>
        <div className="space-y-10">
          {/* Seamless hero zone: image + editorial heading in one canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,520px)_minmax(0,1fr)] gap-8 items-start">
            <div className="space-y-4">
              <div
                className={`group relative h-[420px] md:h-[540px] overflow-hidden rounded-2xl cursor-zoom-in ${
                  isDarkMode ? 'bg-zinc-900/80 border border-zinc-800 shadow-[0_50px_90px_-60px_rgba(0,0,0,0.95)]' : 'bg-zinc-100/80 border border-stone-200'
                }`}
                onClick={() => setIsLightboxOpen(true)}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={book.title}
                  className="h-full w-full object-contain p-4 md:p-6 transition duration-500 group-hover:scale-[1.02]"
                  onError={withCoverFallback}
                />
                <button
                  type="button"
                  title="Відкрити зображення"
                  aria-label="Відкрити зображення у повному розмірі"
                  className="absolute right-3 top-3 h-10 w-10 rounded-full bg-zinc-950/65 text-zinc-100 transition hover:bg-zinc-950/90"
                >
                  <i className="fas fa-expand" />
                </button>
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-20 overflow-hidden rounded-lg transition ${
                        index === currentImageIndex
                          ? 'opacity-100 ring-1 ring-zinc-300/60'
                          : 'opacity-60 hover:opacity-90'
                      }`}
                    >
                      <img src={image} alt={`${book.title} ${index + 1}`} className="h-full w-full object-cover" onError={withCoverFallback} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-8 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {(book.categories || []).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onViewGenre(category)}
                    className={`text-[10px] font-black uppercase tracking-[0.18em] px-3 py-1.5 rounded-full transition ${
                      isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <h1 className={`font-serif-gothic text-4xl md:text-6xl xl:text-7xl font-black italic leading-[0.95] tracking-tight ${titleTone}`}>
                  {book.title}
                </h1>
                <p className={`text-lg md:text-2xl italic ${mutedTone}`}>{book.author}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex items-center gap-1 text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-600'}`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <i
                        key={`book-rating-star-${index}`}
                        className={`${index < Math.round(avgRating) ? 'fas' : 'far'} fa-star`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${mutedTone}`}>
                    {avgRating.toFixed(1)} ({reviewsCount} відгуків)
                  </p>
                </div>
              </div>

              <p
                className={`max-w-[62ch] whitespace-pre-line leading-8 md:leading-9 text-base md:text-[18px] font-serif ${bodyTone}
                first-letter:text-4xl first-letter:md:text-6xl first-letter:font-serif-gothic first-letter:mr-1.5 first-letter:float-left first-letter:leading-[0.8]`}
              >
                {book.description || 'Опис готується до друку.'}
              </p>
            </div>
          </div>

          {/* Minimal technical details without card boxes */}
          <div className={`max-w-[900px] pt-2 rounded-xl p-4 md:p-5 ${isDarkMode ? 'bg-zinc-900/40 border border-zinc-800/70' : 'bg-stone-50/80 border border-stone-200'}`}>
            <h2 className={`mb-5 text-[11px] font-black uppercase tracking-[0.28em] ${mutedTone}`}>
              Характеристики видання
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {specs.map((spec) => (
                <div key={spec.label} className={`flex items-end justify-between py-3 border-b ${isDarkMode ? 'border-zinc-800/70' : 'border-stone-200'}`}>
                  <dt className={`text-[11px] uppercase tracking-[0.14em] ${mutedTone}`}>{spec.label}</dt>
                  <dd className={`text-sm font-semibold ${titleTone}`}>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Sticky CTA that feels integrated via typography and spacing */}
        <aside className="xl:pt-0">
          <div className={`xl:sticky xl:top-24 rounded-2xl p-5 md:p-6 border ${isDarkMode ? 'border-zinc-800/70 bg-zinc-900/45' : 'border-stone-200 bg-stone-50/90'}`}>
            <div className="space-y-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${mutedTone}`}>Ціна</p>
                <p className={`mt-1 font-serif-gothic text-5xl font-black italic ${titleTone}`}>{book.price} ₴</p>
              </div>

              <div className={`text-sm ${book.inventory === 0 ? 'text-rose-400' : book.inventory < 10 ? 'text-amber-300' : mutedTone}`}>
                {book.inventory > 0 ? `В наявності: ${book.inventory} шт.` : 'Тимчасово немає в наявності'}
              </div>

              <button
                type="button"
                onClick={() => onAddToCart(book)}
                disabled={book.inventory === 0}
                className={`h-12 w-full rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDarkMode
                    ? 'bg-gradient-to-b from-amber-200/20 to-zinc-900 text-zinc-100 hover:from-amber-200/30'
                    : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                {book.inventory > 0 ? 'Додати в кошик' : 'Очікується поповнення'}
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(book.id)}
                aria-label={isLiked ? 'Прибрати з бажаного' : 'Додати в бажане'}
                title={isLiked ? 'Прибрати з бажаного' : 'Додати в бажане'}
                className={`h-10 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.16em] transition ${
                  isDarkMode
                    ? 'bg-zinc-900/70 text-zinc-300 hover:text-zinc-100'
                    : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                }`}
              >
                <i className={`${isLiked ? 'fas' : 'far'} fa-star mr-2`} />
                {isLiked ? 'У бажаному' : 'Додати в бажане'}
              </button>

              <div className={`pt-3 space-y-2 text-[12px] ${mutedTone}`}>
                <p><i className="fas fa-truck-fast mr-2" />Відправка по Україні 1–3 дні</p>
                <p><i className="fas fa-shield-alt mr-2" />Безпечна онлайн-оплата</p>
                <p><i className="fas fa-box-open mr-2" />Надійне пакування книги</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {similarBooks.length > 0 && (
        <section className="mt-16 space-y-5">
          <h2 className={`text-2xl md:text-3xl font-serif-gothic font-black italic ${titleTone}`}>Схожі книги</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {similarBooks.map((similarBook) => (
              <button
                key={similarBook.id}
                type="button"
                onClick={() => {
                  onViewBook(similarBook);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-left group"
              >
                <div className={`overflow-hidden rounded-xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800/70' : 'bg-zinc-100 border-stone-200'}`}>
                  <img
                    src={similarBook.coverImage}
                    alt={similarBook.title}
                    className="h-[230px] w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={withCoverFallback}
                  />
                </div>
                <p className={`mt-3 text-sm font-semibold line-clamp-2 ${titleTone}`}>{similarBook.title}</p>
                <p className={`mt-1 text-[10px] uppercase tracking-[0.12em] ${mutedTone}`}>{similarBook.author}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={`mt-16 border rounded-2xl p-4 md:p-6 ${isDarkMode ? 'border-zinc-800/70 bg-zinc-950/35' : 'border-stone-200 bg-white/85'}`}>
        <h2 className={`text-2xl md:text-3xl font-serif-gothic font-black italic ${titleTone}`}>Відгуки читачів</h2>
        <p className={`mt-2 text-[11px] uppercase tracking-[0.16em] ${mutedTone}`}>
          Публікуються лише після модерації адміністратором
        </p>

        <form onSubmit={handleSubmitReview} className={`mt-6 border rounded-xl p-4 md:p-5 ${isDarkMode ? 'border-zinc-800/70 bg-zinc-900/35' : 'border-stone-200 bg-stone-50/70'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${mutedTone}`}>Залишити відгук</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={`review-rating-${value}`}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className={`text-sm transition ${value <= reviewRating ? 'text-amber-400' : isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}
                    title={`Оцінка ${value}`}
                    aria-label={`Оцінка ${value}`}
                    disabled={!currentUser || isSubmittingReview}
                  >
                    <i className="fas fa-star" />
                  </button>
                );
              })}
            </div>
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            rows={4}
            placeholder={currentUser ? 'Поділіться враженням про книгу...' : 'Авторизуйтеся, щоб залишити відгук'}
            disabled={!currentUser || isSubmittingReview}
            className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none ${
              isDarkMode
                ? 'border-zinc-700 bg-zinc-950/60 text-zinc-200 focus:border-zinc-500'
                : 'border-stone-300 bg-white text-zinc-900 focus:border-zinc-700'
            } ${!currentUser ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
          {reviewError && <p className="mt-3 text-[11px] font-semibold text-rose-500">{reviewError}</p>}
          {reviewSuccess && <p className="mt-3 text-[11px] font-semibold text-emerald-500">{reviewSuccess}</p>}
          <div className="mt-4 flex justify-end">
            {currentUser ? (
              <button
                type="submit"
                disabled={isSubmittingReview}
                className={`h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] transition disabled:opacity-60 disabled:cursor-not-allowed ${
                  isDarkMode ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-300' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                {isSubmittingReview ? 'Надсилання...' : 'Надіслати на модерацію'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className={`h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] transition ${
                  isDarkMode ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-300' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                Увійти для відгуку
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {isReviewsLoading ? (
            <p className={mutedTone}>Завантаження відгуків...</p>
          ) : reviews.length === 0 ? (
            <p className={mutedTone}>Поки немає підтверджених відгуків для цієї книги.</p>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className={`border rounded-xl p-4 ${isDarkMode ? 'border-zinc-800/70 bg-zinc-900/25' : 'border-stone-200 bg-stone-50/55'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className={`text-[12px] font-semibold ${titleTone}`}>{review.userName}</p>
                  <p className={`text-[10px] uppercase tracking-[0.14em] ${mutedTone}`}>
                    {new Date(review.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <i key={`${review.id}-star-${index}`} className={`${index < review.rating ? 'fas' : 'far'} fa-star`} />
                  ))}
                </div>
                <p className={`mt-2 whitespace-pre-line text-sm leading-6 ${bodyTone}`}>{review.comment}</p>
              </article>
            ))
          )}
        </div>
      </section>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[220] bg-zinc-950/95 backdrop-blur-sm animate-fadeIn" onClick={() => setIsLightboxOpen(false)}>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Закрити перегляд зображення"
            title="Закрити"
            className="absolute right-4 top-4 h-11 w-11 rounded-full bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900"
          >
            <i className="fas fa-times" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handlePrev();
                }}
                aria-label="Попереднє зображення"
                title="Попереднє зображення"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900"
              >
                <i className="fas fa-chevron-left" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleNext();
                }}
                aria-label="Наступне зображення"
                title="Наступне зображення"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900"
              >
                <i className="fas fa-chevron-right" />
              </button>
            </>
          )}

          <div className="flex h-full w-full items-center justify-center p-6" onClick={(event) => event.stopPropagation()}>
            <img
              src={images[currentImageIndex]}
              alt={`Зображення книги ${currentImageIndex + 1}`}
              className="max-h-[92vh] max-w-[92vw] object-contain"
              onError={withCoverFallback}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetailsLayout;
