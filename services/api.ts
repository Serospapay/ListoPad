
import { ApiErrorShape, Book, BookReview, BookReviewModeration, DemoAuthAccount, Order, PromoCode, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const STORAGE_KEYS = {
  BOOKS: 'lystopad_books_cache',
  CATEGORIES: 'lystopad_categories_cache',
  ACCESS_TOKEN: 'lystopad_access_token',
  REFRESH_TOKEN: 'lystopad_refresh_token',
};
const MAX_RETRIES = 2;

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
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage quota/unavailable errors in runtime
  }
};

const parseJsonSafe = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export const unwrapList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === 'object' &&
    'results' in payload &&
    Array.isArray((payload as { results: unknown }).results)
  ) {
    return (payload as { results: T[] }).results;
  }
  return [];
};

const mapBookFromApi = (apiBook: any): Book => ({
  ...apiBook,
  id: String(apiBook.id),
  low_stock_threshold: typeof apiBook.low_stock_threshold === 'number' ? apiBook.low_stock_threshold : 3,
  reviewsCount: Number(apiBook.reviewsCount ?? apiBook.review_count ?? 0),
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
  subtotalAmount: Number(apiOrder.subtotalAmount ?? 0),
  shippingAmount: Number(apiOrder.shippingAmount ?? 0),
  totalAmount: Number(apiOrder.totalAmount || apiOrder.amount || 0),
  discountAmount: Number(apiOrder.discountAmount || 0),
  promoCode: apiOrder.promoCode || '',
  date: new Date(apiOrder.date).toLocaleDateString('uk-UA'),
  orderedAt: apiOrder.orderedAt,
  paidAt: apiOrder.paidAt,
  packedAt: apiOrder.packedAt,
  shippedAt: apiOrder.shippedAt,
  atBranchAt: apiOrder.atBranchAt,
  receivedAt: apiOrder.receivedAt,
  deliveredAt: apiOrder.deliveredAt,
  closedAt: apiOrder.closedAt,
  cancelledAt: apiOrder.cancelledAt,
  items: (apiOrder.items || []).map((item: any) => ({
    ...item,
    id: String(item.id),
    bookId: String(item.bookId),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  })),
  statusHistory: (apiOrder.statusHistory || []).map((row: any) => ({
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    changedAt: row.changedAt,
    changedBy: row.changedBy || '',
  })),
});

const mapUser = (raw: any): User => ({
  id: String(raw.id),
  email: raw.email,
  name: raw.name,
  role: raw.role,
  joinDate: raw.joinDate,
});

const mapBookReview = (row: any): BookReview => ({
  id: String(row.id),
  rating: Number(row.rating),
  comment: row.comment || '',
  userName: row.userName || 'Користувач',
  createdAt: row.createdAt,
});

const mapBookReviewModeration = (row: any): BookReviewModeration => ({
  id: String(row.id),
  bookId: String(row.bookId),
  bookTitle: row.bookTitle || '',
  userName: row.userName || '',
  userEmail: row.userEmail || '',
  rating: Number(row.rating || 0),
  comment: row.comment || '',
  status: row.status,
  moderation_note: row.moderation_note || '',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  moderatedAt: row.moderatedAt || null,
  moderatedBy: row.moderatedBy || '',
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
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
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
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (2 ** attempt)));
      continue;
    }
    throw new ApiError({
      detail: payload?.detail || 'Помилка запиту',
      code: payload?.code || res.status,
      fields: payload?.fields,
    });
  }

  return payload as T;
    } catch (error) {
      lastError = error;
      if (!(error instanceof TypeError) || attempt >= MAX_RETRIES) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (2 ** attempt)));
    }
  }
  if (lastError instanceof ApiError) {
    throw lastError;
  }
  throw new ApiError({
    detail: 'Не вдалося виконати запит. Перевірте зʼєднання та спробуйте ще раз.',
    code: 0,
  });
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

  async getDemoAccounts(): Promise<DemoAuthAccount[]> {
    const payload = await request<{ accounts?: DemoAuthAccount[] }>(`/auth/demo-accounts/`, undefined, false);
    return Array.isArray(payload?.accounts) ? payload.accounts : [];
  },

  async getBooks(filters?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    minRating?: number;
    publisher?: string;
    inStock?: boolean;
    sort?: 'price_asc' | 'price_desc' | 'pages_asc' | 'pages_desc';
  }): Promise<Book[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.q) params.set('q', filters.q);
      if (filters?.category) params.set('category', filters.category);
      if (typeof filters?.minPrice === 'number') params.set('min_price', String(filters.minPrice));
      if (typeof filters?.maxPrice === 'number') params.set('max_price', String(filters.maxPrice));
      if (typeof filters?.minYear === 'number') params.set('min_year', String(filters.minYear));
      if (typeof filters?.maxYear === 'number') params.set('max_year', String(filters.maxYear));
      if (typeof filters?.minRating === 'number') params.set('min_rating', String(filters.minRating));
      if (filters?.publisher) params.set('publisher', filters.publisher);
      if (typeof filters?.inStock === 'boolean') params.set('in_stock', String(filters.inStock));
      if (filters?.sort) params.set('sort', filters.sort);
      const query = params.toString();
      const raw = await request<unknown>(`/books/${query ? `?${query}` : ''}`);
      const data = unwrapList<any>(raw);
      const books = data.map(mapBookFromApi);
      saveToStorage(STORAGE_KEYS.BOOKS, books);
      return books;
    } catch (error) {
      if (!this.isApiError(error) || error.code !== 401) {
        const fallback = getFromStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
        if (fallback.length) return fallback;
      }
      throw error;
    }
  },

  async getUsers(): Promise<User[]> {
    const raw = await request<unknown>(`/users/`);
    return unwrapList<any>(raw).map(mapUser);
  },

  async getOrders(filters?: {
    status?: string;
    customerId?: string;
    promoCode?: string;
    paymentMethod?: string;
    deliveryMethod?: string;
    q?: string;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    params.set('page_size', '200');
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerId) params.set('customer_id', filters.customerId);
    if (filters?.promoCode) params.set('promo_code', filters.promoCode);
    if (filters?.paymentMethod) params.set('payment_method', filters.paymentMethod);
    if (filters?.deliveryMethod) params.set('delivery_method', filters.deliveryMethod);
    if (filters?.q) params.set('q', filters.q);
    const raw = await request<unknown>(`/orders/?${params.toString()}`);
    return unwrapList<any>(raw).map(mapOrderFromApi);
  },

  async getAnalyticsCrm(): Promise<{
    ordersCount: number;
    totalRevenue: string;
    usersCount: number;
    openOrders: number;
  }> {
    return request(`/analytics/crm/`);
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
      const raw = await request<unknown>(`/categories/`);
      const data = unwrapList<any>(raw);
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
    const existing = unwrapList<any>(await request<unknown>(`/categories/`));
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
    promoCode?: string;
    items: Array<{ bookId: string; quantity: number }>;
  }): Promise<{ orderId: string; order: Order }> {
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const created = await request<any>(`/orders/checkout/`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        customerName: payload.customerName,
        paymentMethod: payload.paymentMethod,
        deliveryMethod: payload.deliveryMethod,
        promoCode: payload.promoCode || '',
        idempotencyKey,
        items: payload.items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
      }),
    });
    return { orderId: String(created.orderId), order: mapOrderFromApi(created.order) };
  },

  async previewCheckout(payload: {
    deliveryMethod: Order['deliveryMethod'];
    promoCode?: string;
    items: Array<{ bookId: string; quantity: number }>;
  }): Promise<{
    subtotalAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    promoApplied: string;
  }> {
    const data = await request<any>(`/orders/checkout-preview/`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: '',
        paymentMethod: 'card',
        deliveryMethod: payload.deliveryMethod,
        promoCode: payload.promoCode || '',
        items: payload.items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
      }),
    });
    return {
      subtotalAmount: Number(data.subtotalAmount || 0),
      shippingAmount: Number(data.shippingAmount || 0),
      discountAmount: Number(data.discountAmount || 0),
      totalAmount: Number(data.totalAmount || 0),
      promoApplied: data.promoApplied || '',
    };
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

  async getWishlist(): Promise<string[]> {
    const data = await request<Array<{ id: string; bookId: string | number }>>(`/wishlist/`);
    return data.map((item) => String(item.bookId));
  },

  async addWishlistItem(bookId: string): Promise<void> {
    await request(`/wishlist/`, {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });
  },

  async removeWishlistItem(bookId: string): Promise<void> {
    await request(`/wishlist/${bookId}/`, { method: 'DELETE' });
  },

  async getPromoCodes(): Promise<PromoCode[]> {
    const raw = await request<unknown>(`/promo-codes/`);
    return unwrapList<any>(raw).map((item) => ({
      ...item,
      value: Number(item.value),
      min_order_amount: Number(item.min_order_amount || 0),
      per_user_limit: Number(item.per_user_limit || 0),
    }));
  },

  async getBookReviews(bookId: string): Promise<BookReview[]> {
    const raw = await request<any[]>(`/books/${bookId}/reviews/`, undefined, false);
    return (raw || []).map(mapBookReview);
  },

  async submitBookReview(
    bookId: string,
    payload: { rating: number; comment: string }
  ): Promise<{ detail: string }> {
    return request<{ detail: string }>(
      `/books/${bookId}/reviews/`,
      {
        method: 'POST',
        body: JSON.stringify({
          rating: payload.rating,
          comment: payload.comment,
        }),
      },
      true
    );
  },

  async getReviewsForModeration(filters?: { status?: 'pending' | 'approved' | 'rejected'; bookId?: string }): Promise<BookReviewModeration[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.bookId) params.set('book_id', filters.bookId);
    const query = params.toString();
    const raw = await request<unknown>(`/book-reviews/${query ? `?${query}` : ''}`);
    return unwrapList<any>(raw).map(mapBookReviewModeration);
  },

  async moderateReview(
    reviewId: string,
    payload: { status: 'pending' | 'approved' | 'rejected'; moderation_note?: string }
  ): Promise<BookReviewModeration> {
    const row = await request<any>(`/book-reviews/${reviewId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapBookReviewModeration(row);
  },
};
