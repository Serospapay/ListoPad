
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  categories: string[];
  description: string;
  inventory: number;
  low_stock_threshold?: number;
  rating: number;
  reviewsCount?: number;
  coverImage: string;
  images?: string[]; 
  pages: number;
  year: number;
  publisher: string;
  cover: string;
  format: string;
  weight: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
  lastPurchaseDate: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  notifyOnNewBook?: boolean;
  joinDate: string;
  wishlist?: string[];
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export type OrderStatus =
  | 'ordered'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled'
  | 'shipping'
  | 'at_branch'
  | 'received';

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  bookTitle: string;
  author?: string;
  date: string;
  amount: number;
  subtotalAmount?: number;
  shippingAmount?: number;
  totalAmount?: number;
  discountAmount?: number;
  promoCode?: string;
  status: OrderStatus;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cash_on_delivery';
  deliveryMethod: 'nova_poshta' | 'standard';
  trackingNumber?: string;
  orderedAt?: string;
  paidAt?: string;
  packedAt?: string;
  shippedAt?: string;
  atBranchAt?: string;
  receivedAt?: string;
  deliveredAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  items?: OrderItem[];
  statusHistory?: OrderStatusHistoryItem[];
}

export interface OrderItem {
  id: string;
  bookId: string;
  bookTitle: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderStatusHistoryItem {
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  changedBy: string;
}

export interface ApiErrorShape {
  detail: string;
  code: number;
  fields?: Record<string, unknown>;
}

export interface DemoAuthAccount {
  role: 'user' | 'admin';
  email: string;
  password: string;
  name: string;
}

export interface PromoCode {
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  is_active: boolean;
  expires_at?: string | null;
  max_uses: number;
  used_count: number;
  min_order_amount?: number;
  per_user_limit?: number;
}

export interface BookReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

export interface BookReviewModeration {
  id: string;
  bookId: string;
  bookTitle: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  moderation_note: string;
  createdAt: string;
  updatedAt: string;
  moderatedAt: string | null;
  moderatedBy: string;
}

export type ViewType = 
  | 'storefront' 
  | 'crm' 
  | 'inventory' 
  | 'profile' 
  | 'auth' 
  | 'checkout' 
  | 'success' 
  | 'contacts' 
  | 'delivery' 
  | 'payment' 
  | 'book_details'
  | 'admin_orders';
