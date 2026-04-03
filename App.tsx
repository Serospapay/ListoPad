
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
      const [b, u, o, c] = await Promise.all([
        apiService.getBooks(),
        apiService.getUsers(),
        apiService.getOrders(),
        apiService.getCategories()
      ]);
      setBooks(b || []);
      setAllUsers(u || []);
      setAllOrders(o || []);
      setCategories(c || []);
    } catch (error) {
      console.error("API connection failed:", error);
      setBooks([]);
      setAllUsers([]);
      setAllOrders([]);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const savedUser = localStorage.getItem('lystopad_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, [fetchData]);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem('lystopad_current_user', JSON.stringify(user));
    setActiveView('storefront');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('lystopad_current_user');
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
      await apiService.updateBook(b);
      setBooks(prev => prev.map(book => book.id === b.id ? b : book));
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
  }, [currentUser]);

  const toggleWishlist = useCallback((id: string) => {
    if (!currentUser) return setActiveView('auth');
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [currentUser]);

  const customers: Customer[] = (allUsers || []).map(user => ({
    id: user.id, name: user.name, email: user.email,
    ordersCount: (allOrders || []).filter(o => o.customerId === user.id).length,
    totalSpent: (allOrders || []).filter(o => o.customerId === user.id).reduce((s, o) => s + o.amount, 0),
    lastPurchaseDate: user.joinDate
  }));

  const handleUpdateCategories = useCallback(async (newCats: string[]) => {
    setCategories(newCats);
    await apiService.saveCategories(newCats);
  }, []);

  const handleRenameCategory = useCallback(async (oldName: string, newName: string) => {
    const newCats = categories.map(c => c === oldName ? newName : c);
    setCategories(newCats);
    await apiService.saveCategories(newCats);
    
    
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

    await apiService.saveBooks(updatedBooks);
  }, [categories, books]);

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
          isDarkMode={isDarkMode} 
        />
      );
      case 'inventory': return <Inventory books={books} categories={categories} onUpdateCategories={handleUpdateCategories} onRenameCategory={handleRenameCategory} onAddBook={handleAddBook} onUpdateBook={updateBook} onDeleteBook={deleteBook} isDarkMode={isDarkMode} />;
      case 'admin_orders': return <AdminOrders orders={allOrders} customers={customers} onUpdateStatus={async (id, s) => { setAllOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o)); }} isDarkMode={isDarkMode} />;
      case 'crm': return <CRM customers={customers} books={books} orders={allOrders} isDarkMode={isDarkMode} />;
      case 'auth': return <Auth onLogin={handleLogin} isDarkMode={isDarkMode} />;
      case 'profile': return currentUser ? <Profile user={currentUser} books={books} orders={allOrders} isDarkMode={isDarkMode} wishlistBooks={books.filter(b => wishlist.includes(b.id))} onToggleWishlist={toggleWishlist} onViewBook={b => { setSelectedBook(b); setActiveView('book_details'); }} onLogout={handleLogout} /> : null;
      case 'checkout': return <Checkout cart={cart} user={currentUser} onComplete={() => {setCart([]); setActiveView('success');}} onUpdateQuantity={(id, d) => setCart(p => p.map(i => i.book.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))} onRemoveItem={id => setCart(p => p.filter(i => i.book.id !== id))} onBack={() => setActiveView('storefront')} isDarkMode={isDarkMode} />;
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
      {renderView()}
    </Layout>
  );
};

export default App;
