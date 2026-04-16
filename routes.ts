import { ViewType } from './types';

export const pathFromView = (view: ViewType): string => {
  switch (view) {
    case 'storefront':
      return '/';
    case 'auth':
      return '/auth';
    case 'checkout':
      return '/checkout';
    case 'profile':
      return '/profile';
    case 'inventory':
      return '/inventory';
    case 'crm':
      return '/crm';
    case 'admin_orders':
      return '/admin/orders';
    case 'success':
      return '/success';
    case 'contacts':
      return '/contacts';
    case 'delivery':
      return '/delivery';
    case 'payment':
      return '/payment';
    case 'book_details':
      return '/';
    default:
      return '/';
  }
};

export const viewFromPath = (pathname: string): ViewType => {
  if (pathname === '/' || pathname === '') return 'storefront';
  if (pathname.startsWith('/auth')) return 'auth';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/admin/orders')) return 'admin_orders';
  if (pathname.startsWith('/success')) return 'success';
  if (pathname.startsWith('/contacts')) return 'contacts';
  if (pathname.startsWith('/delivery')) return 'delivery';
  if (pathname.startsWith('/payment')) return 'payment';
  if (pathname.startsWith('/book/')) return 'book_details';
  return 'storefront';
};
