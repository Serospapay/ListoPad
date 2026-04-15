
import React, { useState, useEffect, useCallback } from 'react';
import { Book, Customer, ViewType, User, CartItem, Order } from './types';
import Layout from './components/Layout';
import Storefront from './components/Storefront';
import CRM from './components/CRM';
import Inventory from './components/Inventory';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Checkout from './components/Checkout';
import SuccessPage from './components/SuccessPage';
import Contacts from './components/Contacts';
import { Delivery, Payment } from './components/InfoPages';
import BookDetails from './components/BookDetails';
import AdminOrders from './components/AdminOrders';
import { apiService } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('storefront');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [customBg, setCustomBg] = useState<string>('');

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [storefrontGenreFilter, setStorefrontGenreFilter] = useState('Всі');
  const [storefrontSearch, setStorefrontSearch] = useState('');
  const [storefrontPriceMin, setStorefrontPriceMin] = useState(0);
  const [storefrontPriceMax, setStorefrontPriceMax] = useState(2000);
  const [storefrontOnlyAvailable, setStorefrontOnlyAvailable] = useState(false);
  const [storefrontSort, setStorefrontSort] = useState<'default' | 'price-asc' | 'price-desc' | 'pages-asc' | 'pages-desc'>('default');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const bg = customBg || (isDarkMode ? '#0c0a09' : '#f5f5f4');
    const text = isDarkMode ? '#e7e5e4' : '#1c1917';
    root.style.setProperty('--app-bg', bg);
    root.style.setProperty('--app-text', text);
    document.body.style.backgroundColor = bg;
    document.body.style.color = text;
  }, [isDarkMode, customBg]);

  const fetchData = useCallback(async () => {
    try {
      setAppError(null);
      const [b, u, c] = await Promise.all([
        apiService.getBooks({
          q: storefrontSearch,
          category: storefrontGenreFilter === 'Всі' ? undefined : storefrontGenreFilter,
          minPrice: storefrontPriceMin,
          maxPrice: storefrontPriceMax,
          inStock: storefrontOnlyAvailable || undefined,
          sort: storefrontSort === 'default' ? undefined : storefrontSort.replace('-', '_') as 'price_asc' | 'price_desc' | 'pages_asc' | 'pages_desc',
        }),
        apiService.getUsers(),
        apiService.getCategories()
      ]);
      setBooks(b || []);
      setAllUsers(u || []);
      setCategories(c || []);
    } catch (error) {
      console.error("API connection failed:", error);
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
        } else {
          setAllOrders([]);
        }
      } catch (error) {
        await apiService.logout();
        setCurrentUser(null);
      } finally {
        setIsBooksLoading(false);
        setIsBootstrapping(false);
      }
    };
    bootstrap();
  }, [fetchData]);

  const handleLogin = useCallback(async (user: User) => {
    setCurrentUser(user);
    try {
      const [scopedOrders, freshUsers] = await Promise.all([
        user.role === 'admin' ? apiService.getOrders() : apiService.getMyOrders(),
        apiService.getUsers()
      ]);
      setAllOrders(scopedOrders);
      setAllUsers(freshUsers);
      const wishlistIds = await apiService.getWishlist();
      setWishlist(wishlistIds);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося оновити дані профілю.');
    }
    setActiveView('storefront');
  }, []);

  const handleLogout = useCallback(async () => {
    await apiService.logout();
    setCurrentUser(null);
    setAllOrders([]);
    setWishlist([]);
    setActiveView('storefront');
  }, []);

  const handleAddBook = useCallback(async (b: Book) => {
    try {
      const saved = await apiService.addBook(b);
      setBooks(prev => [saved, ...prev]);
      return saved;
    } catch (error) {
      console.error("Failed to add book:", error);
      return b;
    }
  }, []);

  const updateBook = useCallback(async (b: Book) => {
    try {
      const updated = await apiService.updateBook(b);
      setBooks(prev => prev.map(book => book.id === b.id ? updated : book));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    try {
      await apiService.deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addToCart = useCallback((book: Book) => {
    if (!currentUser) return setActiveView('auth');
    setCart(prev => {
      const existing = prev.find(i => i.book.id === book.id);
      return existing 
        ? prev.map(i => i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { book, quantity: 1 }];
    });
  }, [currentUser, wishlist]);

  const toggleWishlist = useCallback(async (id: string) => {
    if (!currentUser) return setActiveView('auth');
    const exists = wishlist.includes(id);
    setWishlist(prev => exists ? prev.filter(i => i !== id) : [...prev, id]);
    try {
      if (exists) {
        await apiService.removeWishlistItem(id);
      } else {
        await apiService.addWishlistItem(id);
      }
    } catch (error) {
      setWishlist(prev => exists ? [...prev, id] : prev.filter(i => i !== id));
      setAppError(error instanceof Error ? error.message : 'Не вдалося оновити список бажаного.');
    }
  }, [currentUser]);

  const customers: Customer[] = (allUsers || []).map(user => ({
    id: user.id, name: user.name, email: user.email,
    ordersCount: (allOrders || []).filter(o => o.customerId === user.id).length,
    totalSpent: (allOrders || []).filter(o => o.customerId === user.id).reduce((s, o) => s + o.amount, 0),
    lastPurchaseDate: user.joinDate
  }));

  const handleUpdateCategories = useCallback(async (newCats: string[]) => {
    try {
      await apiService.saveCategories(newCats);
      setCategories(newCats);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося зберегти жанри.');
    }
  }, []);

  const handleRenameCategory = useCallback(async (oldName: string, newName: string) => {
    const newCats = categories.map(c => c === oldName ? newName : c);
    try {
      await apiService.saveCategories(newCats);
      setCategories(newCats);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося зберегти жанри.');
      return;
    }

    const updatedBooks = books.map(book => {
      if (book.categories?.includes(oldName)) {
        return {
          ...book,
          categories: book.categories.map(c => c === oldName ? newName : c)
        };
      }
      return book;
    });
    
    setBooks(updatedBooks);
  }, [categories, books]);

  const handleCheckoutComplete = useCallback(async (payload: {
    paymentMethod: Order['paymentMethod'];
    deliveryMethod: Order['deliveryMethod'];
    promoCode?: string;
  }) => {
    if (!currentUser) throw new Error('Спочатку виконайте вхід.');
    await apiService.validateCart({
      items: cart.map(item => ({ bookId: item.book.id, quantity: item.quantity })),
    });
    const response = await apiService.createOrder({
      customerName: currentUser.name,
      paymentMethod: payload.paymentMethod,
      deliveryMethod: payload.deliveryMethod,
      promoCode: payload.promoCode,
      items: cart.map(item => ({ bookId: item.book.id, quantity: item.quantity })),
    });
    setAllOrders(prev => [response.order, ...prev]);
    const refreshedBooks = await apiService.getBooks();
    setBooks(refreshedBooks);
    setCart([]);
    setActiveView('success');
  }, [cart, currentUser]);

  const handleStorefrontFiltersChange = useCallback(async (filters: {
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
        sort: filters.sort === 'default' ? undefined : filters.sort.replace('-', '_') as 'price_asc' | 'price_desc' | 'pages_asc' | 'pages_desc',
      });
      setBooks(fetchedBooks);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Не вдалося застосувати фільтри.');
    } finally {
      setIsBooksLoading(false);
    }
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'storefront': return (
        <Storefront 
          books={books} 
          categories={categories} 
          cart={cart} 
          user={currentUser} 
          wishlist={wishlist} 
          onToggleWishlist={toggleWishlist} 
          externalCategoryFilter={storefrontGenreFilter} 
          onCategoryChange={setStorefrontGenreFilter}
          onClearExternalFilter={() => setStorefrontGenreFilter('Всі')} 
          onAddToCart={addToCart} 
          onGoToCheckout={() => setActiveView('checkout')} 
          onViewBook={b => { setSelectedBook(b); setActiveView('book_details'); }} 
          onFiltersChange={handleStorefrontFiltersChange}
          isLoading={isBooksLoading}
          isDarkMode={isDarkMode} 
        />
      );
      case 'inventory': return <Inventory books={books} categories={categories} onUpdateCategories={handleUpdateCategories} onRenameCategory={handleRenameCategory} onAddBook={handleAddBook} onUpdateBook={updateBook} onDeleteBook={deleteBook} isDarkMode={isDarkMode} />;
      case 'admin_orders': return <AdminOrders orders={allOrders} customers={customers} onUpdateStatus={async (id, s) => {
        const previousOrders = allOrders;
        setAllOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o));
        try {
          const updatedOrder = await apiService.updateOrderStatus(id, s);
          setAllOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
        } catch (error) {
          setAllOrders(previousOrders);
          setAppError(error instanceof Error ? error.message : 'Не вдалося оновити статус.');
        }
      }} isDarkMode={isDarkMode} />;
      case 'crm': return <CRM customers={customers} books={books} orders={allOrders} isDarkMode={isDarkMode} />;
      case 'auth': return <Auth onLogin={handleLogin} isDarkMode={isDarkMode} />;
      case 'profile': return currentUser ? <Profile user={currentUser} books={books} orders={allOrders} isDarkMode={isDarkMode} wishlistBooks={books.filter(b => wishlist.includes(b.id))} onToggleWishlist={toggleWishlist} onViewBook={b => { setSelectedBook(b); setActiveView('book_details'); }} onLogout={handleLogout} /> : null;
      case 'checkout': return <Checkout cart={cart} user={currentUser} onComplete={handleCheckoutComplete} onUpdateQuantity={(id, d) => setCart(p => p.map(i => i.book.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))} onRemoveItem={id => setCart(p => p.filter(i => i.book.id !== id))} onBack={() => setActiveView('storefront')} isDarkMode={isDarkMode} />;
      case 'success': return <SuccessPage onContinue={() => setActiveView('storefront')} isDarkMode={isDarkMode} />;
      case 'book_details': return selectedBook ? <BookDetails book={selectedBook} allBooks={books} onAddToCart={addToCart} onViewGenre={g => {setStorefrontGenreFilter(g); setActiveView('storefront');}} onViewBook={setSelectedBook} onBack={() => setActiveView('storefront')} isDarkMode={isDarkMode} wishlist={wishlist} onToggleWishlist={toggleWishlist} /> : null;
      case 'contacts': return <Contacts isDarkMode={isDarkMode} />;
      case 'delivery': return <Delivery isDarkMode={isDarkMode} />;
      case 'payment': return <Payment isDarkMode={isDarkMode} />;
      default: return null;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} user={currentUser} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={() => { setIsDarkMode(!isDarkMode); setCustomBg(''); }} cartCount={cart.reduce((a, i) => a + i.quantity, 0)} onCartClick={() => setActiveView('checkout')} setCustomBg={setCustomBg} customBg={customBg}>
      {isBootstrapping && (
        <div className="mb-4 space-y-2 animate-pulse">
          <div className="h-3 w-48 bg-stone-700/40"></div>
          <div className="h-24 w-full bg-stone-700/20"></div>
        </div>
      )}
      {appError && (
        <div className="p-4 mb-4 text-[10px] font-black uppercase tracking-widest border border-rose-900/40 text-rose-500 bg-rose-950/20">
          {appError}
        </div>
      )}
      {renderView()}
    </Layout>
  );
};

export default App;
