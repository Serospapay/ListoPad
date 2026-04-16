
import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Book, Customer, User, CartItem, Order } from './types';
import Layout from './components/Layout';
import Storefront from './components/Storefront';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Checkout from './components/Checkout';
import SuccessPage from './components/SuccessPage';
import Contacts from './components/Contacts';
import { Delivery, Payment } from './components/InfoPages';
import BookDetails from './components/BookDetails';
import { ErrorBoundary } from './components/ErrorBoundary';
import { apiService } from './services/api';
import { pathFromView } from './routes';

const CRM = lazy(() => import('./components/CRM'));
const Inventory = lazy(() => import('./components/Inventory'));
const AdminOrders = lazy(() => import('./components/AdminOrders'));

const CART_STORAGE_KEY = 'lystopad_cart_v2';

const BookDetailsRoute: React.FC<{
  books: Book[];
  wishlist: string[];
  isDarkMode: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (book: Book) => void;
  onViewGenre: (g: string) => void;
  onNavigateStore: () => void;
}> = ({ books, wishlist, isDarkMode, onToggleWishlist, onAddToCart, onViewGenre, onNavigateStore }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === bookId);
  if (!book) return <Navigate to="/" replace />;
  return (
    <BookDetails
      book={book}
      allBooks={books}
      onAddToCart={onAddToCart}
      onViewGenre={(g) => {
        onViewGenre(g);
        onNavigateStore();
      }}
      onViewBook={(b) => navigate(`/book/${b.id}`)}
      onBack={onNavigateStore}
      isDarkMode={isDarkMode}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
    />
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [customBg, setCustomBg] = useState<string>('');

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storefrontGenreFilter, setStorefrontGenreFilter] = useState('Всі');
  const [storefrontSearch, setStorefrontSearch] = useState('');
  const [storefrontPriceMin, setStorefrontPriceMin] = useState(0);
  const [storefrontPriceMax, setStorefrontPriceMax] = useState(2000);
  const [storefrontOnlyAvailable, setStorefrontOnlyAvailable] = useState(false);
  const [storefrontSort, setStorefrontSort] = useState<'default' | 'price-asc' | 'price-desc' | 'pages-asc' | 'pages-desc'>('default');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const setActiveView = useCallback(
    (view: Parameters<typeof pathFromView>[0]) => {
      navigate(pathFromView(view));
    },
    [navigate]
  );

  useEffect(() => {
    const root = document.documentElement;
    const bg = customBg || (isDarkMode ? '#0c0a09' : '#f5f5f4');
    const text = isDarkMode ? '#e7e5e4' : '#1c1917';
    root.style.setProperty('--app-bg', bg);
    root.style.setProperty('--app-text', text);
    document.body.style.backgroundColor = bg;
    document.body.style.color = text;
  }, [isDarkMode, customBg]);

  useEffect(() => {
    if (books.length === 0) return;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const rows = JSON.parse(raw) as Array<{ bookId: string; quantity: number }>;
      if (!Array.isArray(rows)) return;
      const next: CartItem[] = [];
      rows.forEach((row) => {
        const book = books.find((b) => b.id === row.bookId);
        if (book && row.quantity > 0) next.push({ book, quantity: row.quantity });
      });
      if (next.length) setCart(next);
    } catch {
      /* ignore */
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart.map((c) => ({ bookId: c.book.id, quantity: c.quantity })))
      );
    } catch {
      /* ignore */
    }
  }, [cart]);

  useEffect(() => {
    if (!appError) return;
    const timer = window.setTimeout(() => setAppError(null), 7000);
    return () => window.clearTimeout(timer);
  }, [appError]);

  const fetchData = useCallback(async () => {
    try {
      setAppError(null);
      const [b, c] = await Promise.all([
        apiService.getBooks({
          q: storefrontSearch,
          category: storefrontGenreFilter === 'Всі' ? undefined : storefrontGenreFilter,
          minPrice: storefrontPriceMin,
          maxPrice: storefrontPriceMax,
          inStock: storefrontOnlyAvailable || undefined,
          sort:
            storefrontSort === 'default'
              ? undefined
              : (storefrontSort.replace('-', '_') as 'price_asc' | 'price_desc' | 'pages_asc' | 'pages_desc'),
        }),
        apiService.getCategories(),
      ]);
      setBooks(b || []);
      setCategories(c || []);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Помилка завантаження даних.');
    }
  }, [storefrontSearch, storefrontGenreFilter, storefrontPriceMin, storefrontPriceMax, storefrontOnlyAvailable, storefrontSort]);

  useEffect(() => {
    const bootstrap = async () => {
      setIsBooksLoading(true);
      await fetchData();
      try {
        if (apiService.getTokenState().hasAccess || apiService.getTokenState().hasRefresh) {
          const me = await apiService.getMe();
          setCurrentUser(me);
          const wishlistIds = await apiService.getWishlist();
          setWishlist(wishlistIds);
          const scopedOrders = me.role === 'admin' ? await apiService.getOrders() : await apiService.getMyOrders();
          setAllOrders(scopedOrders);
          if (me.role === 'admin') {
            const users = await apiService.getUsers();
            setAllUsers(users);
          } else {
            setAllUsers([]);
          }
        } else {
          setAllOrders([]);
          setAllUsers([]);
        }
      } catch (error) {
        if (apiService.isApiError(error) && error.code === 401) {
          await apiService.logout();
          setCurrentUser(null);
        } else {
          setAppError(error instanceof Error ? error.message : 'Не вдалося ініціалізувати сесію.');
        }
      } finally {
        setIsBooksLoading(false);
        setIsBootstrapping(false);
      }
    };
    void bootstrap();
  }, [fetchData]);

  const handleLogin = useCallback(
    async (user: User) => {
      setCurrentUser(user);
      try {
        const scopedOrders = user.role === 'admin' ? await apiService.getOrders() : await apiService.getMyOrders();
        setAllOrders(scopedOrders);
        if (user.role === 'admin') {
          const freshUsers = await apiService.getUsers();
          setAllUsers(freshUsers);
        } else {
          setAllUsers([]);
        }
        const wishlistIds = await apiService.getWishlist();
        setWishlist(wishlistIds);
      } catch (error) {
        setAppError(error instanceof Error ? error.message : 'Не вдалося оновити дані профілю.');
      }
      navigate('/');
    },
    [navigate]
  );

  const handleLogout = useCallback(async () => {
    await apiService.logout();
    setCurrentUser(null);
    setAllOrders([]);
    setAllUsers([]);
    setWishlist([]);
    navigate('/');
  }, [navigate]);

  const handleAddBook = useCallback(async (b: Book) => {
    try {
      const saved = await apiService.addBook(b);
      setBooks((prev) => [saved, ...prev]);
      return saved;
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося додати книгу.');
      throw error;
    }
  }, []);

  const updateBook = useCallback(async (b: Book) => {
    try {
      const updated = await apiService.updateBook(b);
      setBooks((prev) => prev.map((book) => (book.id === b.id ? updated : book)));
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося оновити книгу.');
      throw error;
    }
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    try {
      await apiService.deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося видалити книгу.');
      throw error;
    }
  }, []);

  const addToCart = useCallback(
    (book: Book) => {
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.book.id === book.id);
        return existing
          ? prev.map((i) => (i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...prev, { book, quantity: 1 }];
      });
    },
    [currentUser, navigate]
  );

  const toggleWishlist = useCallback(
    async (id: string) => {
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      const exists = wishlist.includes(id);
      setWishlist((prev) => (exists ? prev.filter((i) => i !== id) : [...prev, id]));
      try {
        if (exists) {
          await apiService.removeWishlistItem(id);
        } else {
          await apiService.addWishlistItem(id);
        }
      } catch (error) {
        setWishlist((prev) => (exists ? [...prev, id] : prev.filter((i) => i !== id)));
        setAppError(error instanceof Error ? error.message : 'Не вдалося оновити список бажаного.');
      }
    },
    [currentUser, navigate, wishlist]
  );

  const customers: Customer[] = (allUsers || []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    ordersCount: (allOrders || []).filter((o) => o.customerId === user.id).length,
    totalSpent: (allOrders || []).filter((o) => o.customerId === user.id).reduce((s, o) => s + o.amount, 0),
    lastPurchaseDate: user.joinDate,
  }));

  const handleUpdateCategories = useCallback(async (newCats: string[]) => {
    try {
      await apiService.saveCategories(newCats);
      setCategories(newCats);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося зберегти жанри.');
    }
  }, []);

  const handleRenameCategory = useCallback(
    async (oldName: string, newName: string) => {
      const newCats = categories.map((c) => (c === oldName ? newName : c));
      try {
        await apiService.saveCategories(newCats);
        const booksToUpdate = books
          .filter((book) => book.categories?.includes(oldName))
          .map((book) => ({
            ...book,
            categories: book.categories.map((c) => (c === oldName ? newName : c)),
          }));
        await Promise.all(booksToUpdate.map((book) => apiService.updateBook(book)));
        setCategories(newCats);
        setBooks((prev) =>
          prev.map((book) => {
            if (!book.categories?.includes(oldName)) return book;
            return {
              ...book,
              categories: book.categories.map((c) => (c === oldName ? newName : c)),
            };
          })
        );
      } catch (error) {
        setAppError(error instanceof Error ? error.message : 'Не вдалося перейменувати жанр.');
      }
    },
    [categories, books]
  );

  const handleCheckoutComplete = useCallback(
    async (payload: {
      paymentMethod: Order['paymentMethod'];
      deliveryMethod: Order['deliveryMethod'];
      promoCode?: string;
    }) => {
      if (!currentUser) throw new Error('Спочатку виконайте вхід.');
      await apiService.validateCart({
        items: cart.map((item) => ({ bookId: item.book.id, quantity: item.quantity })),
      });
      const response = await apiService.createOrder({
        customerName: currentUser.name,
        paymentMethod: payload.paymentMethod,
        deliveryMethod: payload.deliveryMethod,
        promoCode: payload.promoCode,
        items: cart.map((item) => ({ bookId: item.book.id, quantity: item.quantity })),
      });
      setAllOrders((prev) => [response.order, ...prev]);
      const refreshedBooks = await apiService.getBooks();
      setBooks(refreshedBooks);
      setCart([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      navigate('/success');
    },
    [cart, currentUser, navigate]
  );

  const handleStorefrontFiltersChange = useCallback(
    async (filters: {
      q: string;
      category: string;
      minPrice: number;
      maxPrice: number;
      inStock: boolean;
      sort: 'default' | 'price-asc' | 'price-desc' | 'pages-asc' | 'pages-desc';
    }) => {
      setStorefrontSearch(filters.q);
      setStorefrontGenreFilter(filters.category);
      setStorefrontPriceMin(filters.minPrice);
      setStorefrontPriceMax(filters.maxPrice);
      setStorefrontOnlyAvailable(filters.inStock);
      setStorefrontSort(filters.sort);
      setIsBooksLoading(true);
      try {
        const fetchedBooks = await apiService.getBooks({
          q: filters.q,
          category: filters.category === 'Всі' ? undefined : filters.category,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          inStock: filters.inStock || undefined,
          sort:
            filters.sort === 'default'
              ? undefined
              : (filters.sort.replace('-', '_') as 'price_asc' | 'price_desc' | 'pages_asc' | 'pages_desc'),
        });
        setBooks(fetchedBooks);
      } catch (error) {
        setAppError(error instanceof Error ? error.message : 'Не вдалося застосувати фільтри.');
      } finally {
        setIsBooksLoading(false);
      }
    },
    []
  );

  const suspenseFallback = (
    <div className="min-h-[40vh] flex items-center justify-center text-[10px] font-black uppercase tracking-[0.35em] opacity-50">
      Завантаження модуля…
    </div>
  );

  return (
    <ErrorBoundary isDarkMode={isDarkMode}>
      <Layout
        setActiveView={setActiveView}
        user={currentUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={() => {
          setIsDarkMode(!isDarkMode);
          setCustomBg('');
        }}
        cartCount={cart.reduce((a, i) => a + i.quantity, 0)}
        onCartClick={() => navigate('/checkout')}
        setCustomBg={setCustomBg}
        customBg={customBg}
      >
        {isBootstrapping && (
          <div className="mb-4 space-y-2 animate-pulse">
            <div className="h-3 w-48 bg-stone-700/40"></div>
            <div className="h-24 w-full bg-stone-700/20"></div>
          </div>
        )}
        {appError && (
          <div
            role="alert"
            className="p-4 mb-4 text-[10px] font-black uppercase tracking-widest border border-rose-900/40 text-rose-500 bg-rose-950/20 flex items-center justify-between gap-3"
          >
            <span>{appError}</span>
            <button
              type="button"
              onClick={() => setAppError(null)}
              aria-label="Закрити повідомлення про помилку"
              title="Закрити"
              className="px-2 py-1 border border-rose-800/50 hover:bg-rose-900/30 transition"
            >
              Закрити
            </button>
          </div>
        )}
        <Suspense fallback={suspenseFallback}>
          <Routes>
            <Route
              path="/"
              element={
                <Storefront
                  books={books}
                  categories={categories}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  externalCategoryFilter={storefrontGenreFilter}
                  onCategoryChange={setStorefrontGenreFilter}
                  onClearExternalFilter={() => setStorefrontGenreFilter('Всі')}
                  onAddToCart={addToCart}
                  onViewBook={(b) => navigate(`/book/${b.id}`)}
                  onFiltersChange={handleStorefrontFiltersChange}
                  isLoading={isBooksLoading}
                  isDarkMode={isDarkMode}
                />
              }
            />
            <Route path="/auth" element={<Auth onLogin={handleLogin} isDarkMode={isDarkMode} />} />
            <Route
              path="/profile"
              element={
                currentUser ? (
                  <Profile
                    user={currentUser}
                    books={books}
                    orders={allOrders}
                    isDarkMode={isDarkMode}
                    wishlistBooks={books.filter((b) => wishlist.includes(b.id))}
                    onToggleWishlist={toggleWishlist}
                    onViewBook={(b) => navigate(`/book/${b.id}`)}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/checkout"
              element={
                <Checkout
                  cart={cart}
                  user={currentUser}
                  onComplete={handleCheckoutComplete}
                  onUpdateQuantity={(id, d) =>
                    setCart((p) => p.map((i) => (i.book.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i)))
                  }
                  onRemoveItem={(id) => setCart((p) => p.filter((i) => i.book.id !== id))}
                  onBack={() => navigate('/')}
                  isDarkMode={isDarkMode}
                />
              }
            />
            <Route path="/success" element={<SuccessPage onContinue={() => navigate('/')} isDarkMode={isDarkMode} />} />
            <Route
              path="/book/:bookId"
              element={
                <BookDetailsRoute
                  books={books}
                  wishlist={wishlist}
                  isDarkMode={isDarkMode}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={addToCart}
                  onViewGenre={(g) => setStorefrontGenreFilter(g)}
                  onNavigateStore={() => navigate('/')}
                />
              }
            />
            <Route path="/contacts" element={<Contacts isDarkMode={isDarkMode} />} />
            <Route path="/delivery" element={<Delivery isDarkMode={isDarkMode} />} />
            <Route path="/payment" element={<Payment isDarkMode={isDarkMode} />} />
            <Route
              path="/inventory"
              element={
                currentUser?.role === 'admin' ? (
                  <Inventory
                    books={books}
                    categories={categories}
                    onUpdateCategories={handleUpdateCategories}
                    onRenameCategory={handleRenameCategory}
                    onAddBook={handleAddBook}
                    onUpdateBook={updateBook}
                    onDeleteBook={deleteBook}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/admin/orders"
              element={
                currentUser?.role === 'admin' ? (
                  <AdminOrders
                    orders={allOrders}
                    customers={customers}
                    onUpdateStatus={async (id, s) => {
                      const previousOrders = allOrders;
                      setAllOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: s } : o)));
                      try {
                        const updatedOrder = await apiService.updateOrderStatus(id, s);
                        setAllOrders((prev) => prev.map((order) => (order.id === id ? updatedOrder : order)));
                      } catch (error) {
                        setAllOrders(previousOrders);
                        setAppError(error instanceof Error ? error.message : 'Не вдалося оновити статус.');
                      }
                    }}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/crm"
              element={
                currentUser?.role === 'admin' ? (
                  <CRM customers={customers} orders={allOrders} isDarkMode={isDarkMode} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
