
import { ApiErrorShape, Book, Order, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const STORAGE_KEYS = {
  BOOKS: 'lystopad_books_cache',
  CATEGORIES: 'lystopad_categories_cache',
  ACCESS_TOKEN: 'lystopad_access_token',
  REFRESH_TOKEN: 'lystopad_refresh_token',
};

class ApiError extends Error {
  code: number;
  fields?: Record<string, unknown>;

  constructor(payload: ApiErrorShape) {
    super(payload.detail || 'API error');
    this.name = 'ApiError';
    this.code = payload.code;
    this.fields = payload.fields;
  }
}

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const parseJsonSafe = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const mapBookFromApi = (apiBook: any): Book => ({
  ...apiBook,
  id: String(apiBook.id),
});

const mapBookToApi = (book: Partial<Book>) => {
  const { id, ...data } = book;
  return data;
};

const mapOrderFromApi = (apiOrder: any): Order => ({
  ...apiOrder,
  id: String(apiOrder.id),
  customerId: String(apiOrder.customerId),
  amount: Number(apiOrder.amount || 0),
  totalAmount: Number(apiOrder.totalAmount || apiOrder.amount || 0),
  date: new Date(apiOrder.date).toLocaleDateString('uk-UA'),
  items: (apiOrder.items || []).map((item: any) => ({
    ...item,
    id: String(item.id),
    bookId: String(item.bookId),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  })),
});

const mapUser = (raw: any): User => ({
  id: String(raw.id),
  email: raw.email,
  name: raw.name,
  role: raw.role,
  joinDate: raw.joinDate,
});

const tokenStore = {
  get access() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  get refresh() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

const request = async <T>(path: string, init?: RequestInit, retry = true): Promise<T> => {
  const accessToken = tokenStore.access;
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload = await parseJsonSafe(res);

  if (res.status === 401 && retry && tokenStore.refresh) {
    try {
      await apiService.refreshToken();
      return request<T>(path, init, false);
    } catch {
      tokenStore.clear();
      throw new ApiError({ detail: 'Сесію завершено. Увійдіть повторно.', code: 401 });
    }
  }

  if (!res.ok) {
    throw new ApiError({
      detail: payload?.detail || 'Помилка запиту',
      code: payload?.code || res.status,
      fields: payload?.fields,
    });
  }

  return payload as T;
};

export const apiService = {
  isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  },

  getTokenState() {
    return { hasAccess: Boolean(tokenStore.access), hasRefresh: Boolean(tokenStore.refresh) };
  },

  async login(email: string, password: string): Promise<User> {
    const payload = await request<{ access: string; refresh: string }>(`/auth/login/`, {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    }, false);
    tokenStore.set(payload.access, payload.refresh);
    return this.getMe();
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const payload = await request<{ access: string; refresh: string; user: User }>(`/auth/register/`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }, false);
    tokenStore.set(payload.access, payload.refresh);
    return mapUser(payload.user);
  },

  async refreshToken(): Promise<void> {
    const refresh = tokenStore.refresh;
    if (!refresh) throw new ApiError({ detail: 'Refresh token відсутній', code: 401 });
    const payload = await request<{ access: string }>(`/auth/refresh/`, {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }, false);
    tokenStore.set(payload.access, refresh);
  },

  async logout(): Promise<void> {
    tokenStore.clear();
  },

  async getMe(): Promise<User> {
    const user = await request<User>(`/auth/me/`);
    return mapUser(user);
  },

  async getBooks(): Promise<Book[]> {
    try {
      const data = await request<any[]>(`/books/`);
      const books = data.map(mapBookFromApi);
      saveToStorage(STORAGE_KEYS.BOOKS, books);
      return books;
    } catch (error) {
      if (this.isApiError(error)) {
        const fallback = getFromStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
        if (fallback.length) return fallback;
      }
      throw error;
    }
  },

  async getUsers(): Promise<User[]> {
    const data = await request<any[]>(`/users/`);
    return data.map(mapUser);
  },

  async getOrders(): Promise<Order[]> {
    const data = await request<any[]>(`/orders/`);
    return data.map(mapOrderFromApi);
  },

  async getMyOrders(): Promise<Order[]> {
    const data = await request<any[]>(`/orders/my/`);
    return data.map(mapOrderFromApi);
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    const updated = await request<any>(`/orders/${orderId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return mapOrderFromApi(updated);
  },

  async getCategories(): Promise<string[]> {
    try {
      const data = await request<any[]>(`/categories/`);
      const cats = data.map((c: any) => c.name);
      saveToStorage(STORAGE_KEYS.CATEGORIES, cats);
      return cats;
    } catch (error) {
      if (this.isApiError(error)) {
        const fallback = getFromStorage<string[]>(STORAGE_KEYS.CATEGORIES, ['Класика', 'Детектив', 'Філософія', 'Готика']);
        if (fallback.length) return fallback;
      }
      throw error;
    }
  },

  async addBook(book: Book): Promise<Book> {
    const saved = await request<any>(`/books/`, {
      method: 'POST',
      body: JSON.stringify(mapBookToApi(book)),
    });
    return mapBookFromApi(saved);
  },

  async updateBook(book: Book): Promise<Book> {
    const updated = await request<any>(`/books/${book.id}/`, {
      method: 'PUT',
      body: JSON.stringify(mapBookToApi(book)),
    });
    return mapBookFromApi(updated);
  },

  async deleteBook(id: string): Promise<void> {
    await request<void>(`/books/${id}/`, { method: 'DELETE' });
  },

  async saveCategories(categories: string[]): Promise<void> {
    const existing = await request<any[]>(`/categories/`);
    const existingByName = new Map(existing.map((item) => [item.name, item]));

    await Promise.all(
      categories
        .filter((category) => !existingByName.has(category))
        .map((name) => request(`/categories/`, { method: 'POST', body: JSON.stringify({ name }) }))
    );

    await Promise.all(
      existing
        .filter((item) => !categories.includes(item.name))
        .map((item) => request(`/categories/${item.id}/`, { method: 'DELETE' }))
    );
  },

  async createOrder(payload: {
    customerName: string;
    paymentMethod: Order['paymentMethod'];
    deliveryMethod: Order['deliveryMethod'];
    items: Array<{ bookId: string; quantity: number }>;
  }): Promise<{ orderId: string; order: Order }> {
    const created = await request<any>(`/orders/checkout/`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: payload.customerName,
        paymentMethod: payload.paymentMethod,
        deliveryMethod: payload.deliveryMethod,
        items: payload.items.map((item) => ({
          bookId: Number(item.bookId),
          quantity: item.quantity,
        })),
      }),
    });
    return { orderId: String(created.orderId), order: mapOrderFromApi(created.order) };
  },

  async validateCart(payload: { items: Array<{ bookId: string; quantity: number }> }): Promise<void> {
    const books = await this.getBooks();
    const issue = payload.items.find((item) => {
      const book = books.find((candidate) => candidate.id === item.bookId);
      return !book || book.inventory < item.quantity;
    });
    if (issue) {
      throw new ApiError({ detail: 'Недостатньо книг на складі для оформлення.', code: 409 });
    }
  },
};
