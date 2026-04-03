
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  categories: string[];
  description: string;
  inventory: number;
  rating: number;
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
  notifyOnNewBook: boolean;
  joinDate: string;
  wishlist?: string[];
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  bookTitle: string;
  author?: string;
  date: string;
  amount: number;
  status: 'ordered' | 'shipping' | 'at_branch' | 'received';
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cash_on_delivery';
  deliveryMethod: 'nova_poshta' | 'standard';
  trackingNumber?: string;
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

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
