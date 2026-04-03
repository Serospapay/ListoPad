
import { Book, User, Order } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const mapBookFromApi = (apiBook: any): Book => ({
  ...apiBook,
  id: apiBook.id.toString(),
});

const mapBookToApi = (book: Partial<Book>) => {
  const { id, ...data } = book;
  return data;
};

const mapOrderFromApi = (apiOrder: any): Order => ({
  ...apiOrder,
  id: apiOrder.id.toString(),
  date: new Date(apiOrder.date).toLocaleDateString('uk-UA')
});

const STORAGE_KEYS = {
  BOOKS: 'lystopad_books',
  USERS: 'lystopad_users',
  ORDERS: 'lystopad_orders',
  CATEGORIES: 'lystopad_categories'
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

const saveToStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const apiService = {
  async getBooks(): Promise<Book[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/books/`);
      if (res.ok) {
        const data = await res.json();
        const books = data.map(mapBookFromApi);
        saveToStorage(STORAGE_KEYS.BOOKS, books);
        return books;
      }
    } catch (e) {}
    return getFromStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/`);
      if (res.ok) {
        const data = await res.json();
        saveToStorage(STORAGE_KEYS.USERS, data);
        return data;
      }
    } catch (e) {}
    return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  },

  async login(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const user = await res.json();
        return { user };
      }
    } catch (e) {}
    
    const users = await this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) return { user };
    return { user: null, error: 'Помилка входу. Перевірте дані.' };
  },

  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/`);
      if (res.ok) {
        const data = await res.json();
        const orders = data.map(mapOrderFromApi);
        saveToStorage(STORAGE_KEYS.ORDERS, orders);
        return orders;
      }
    } catch (e) {}
    return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  async getCategories(): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/`);
      if (res.ok) {
        const data = await res.json();
        const cats = data.map((c: any) => c.name);
        saveToStorage(STORAGE_KEYS.CATEGORIES, cats);
        return cats;
      }
    } catch (e) {}
    return getFromStorage<string[]>(STORAGE_KEYS.CATEGORIES, ['Класика', 'Детектив', 'Філософія', 'Готика']);
  },

  async addBook(book: Book): Promise<Book> {
    try {
      const res = await fetch(`${API_BASE_URL}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapBookToApi(book))
      });
      if (res.ok) {
        const saved = await res.json();
        const mapped = mapBookFromApi(saved);
        const books = await this.getBooks();
        saveToStorage(STORAGE_KEYS.BOOKS, [mapped, ...books]);
        return mapped;
      }
    } catch (e) {}
    
    const books = await this.getBooks();
    const newBooks = [book, ...books];
    saveToStorage(STORAGE_KEYS.BOOKS, newBooks);
    return book;
  },

  async updateBook(book: Book): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/books/${book.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapBookToApi(book))
      });
    } catch (e) {}
    
    const books = await this.getBooks();
    const newBooks = books.map(b => b.id === book.id ? book : b);
    saveToStorage(STORAGE_KEYS.BOOKS, newBooks);
  },

  async deleteBook(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/books/${id}/`, { method: 'DELETE' });
    } catch (e) {}
    
    const books = await this.getBooks();
    const newBooks = books.filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.BOOKS, newBooks);
  },

  async addCategory(name: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const cats = await this.getCategories();
        saveToStorage(STORAGE_KEYS.CATEGORIES, [...cats, name]);
        return true;
      }
    } catch (e) {}
    
    const cats = await this.getCategories();
    if (!cats.includes(name)) {
      saveToStorage(STORAGE_KEYS.CATEGORIES, [...cats, name]);
    }
    return true;
  },

  async saveCategories(categories: string[]): Promise<void> {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  },

  async saveBooks(books: Book[]): Promise<void> {
    saveToStorage(STORAGE_KEYS.BOOKS, books);
  }
};
