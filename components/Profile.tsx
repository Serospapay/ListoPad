
import React, { useMemo } from 'react';
import { User, Book, Order } from '../types';
import { withCoverFallback } from '../services/covers';

interface ProfileProps {
  user: User;
  books: Book[];
  orders: Order[];
  isDarkMode: boolean;
  wishlistBooks: Book[];
  onToggleWishlist: (bookId: string) => void;
  onViewBook: (book: Book) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, books, orders, isDarkMode, wishlistBooks, onToggleWishlist, onViewBook, onLogout }) => {
  const cardBg = isDarkMode ? 'bg-stone-900/20 border-stone-800 backdrop-blur-md' : 'bg-white/20 border-stone-200 backdrop-blur-md';
  const headerBg = isDarkMode ? 'bg-stone-950/40' : 'bg-stone-50/40';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const tableRowHover = isDarkMode ? 'hover:bg-stone-800/40' : 'hover:bg-stone-50';

  
  const userOrders = useMemo(() => {
    return orders.filter(o => o.customerId === user.id);
  }, [user.id, orders]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ordered':
        return { label: 'Створено', colorClass: isDarkMode ? 'text-rose-500 border-rose-900/40' : 'text-rose-600 border-rose-200' };
      case 'paid':
        return { label: 'Оплачено', colorClass: isDarkMode ? 'text-amber-400 border-amber-900/40' : 'text-amber-700 border-amber-200' };
      case 'packed':
        return { label: 'Упаковано', colorClass: isDarkMode ? 'text-amber-300 border-amber-900/40' : 'text-amber-600 border-amber-200' };
      case 'shipping':
      case 'shipped':
        return { label: 'Відправлено', colorClass: isDarkMode ? 'text-orange-500 border-orange-900/40' : 'text-orange-600 border-orange-200' };
      case 'at_branch':
      case 'delivered':
        return { label: 'Доставлено', colorClass: isDarkMode ? 'text-sky-500 border-sky-900/40' : 'text-sky-600 border-sky-200' };
      case 'received':
      case 'closed':
        return { label: 'Завершено', colorClass: isDarkMode ? 'text-emerald-500 border-emerald-900/40' : 'text-emerald-600 border-emerald-200' };
      case 'cancelled':
        return { label: 'Скасовано', colorClass: isDarkMode ? 'text-zinc-400 border-zinc-800' : 'text-zinc-600 border-zinc-200' };
      default:
        return { label: status, colorClass: isDarkMode ? 'text-rose-500 border-rose-900/40' : 'text-rose-600 border-rose-200' };
    }
  };

  return (
    <div className="space-y-16 animate-fadeIn max-w-6xl mx-auto pb-24">
      {/* User Card */}
      <div className={`text-center py-12 border shadow-2xl relative overflow-hidden transition-all duration-700 ${cardBg}`}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent ${isDarkMode ? 'opacity-100' : 'opacity-20'}`}></div>
        <div className="flex flex-col items-center">
          <div className={`w-28 h-28 rounded-full border-2 p-1 mb-8 shadow-inner ring-1 ${isDarkMode ? 'bg-stone-950/40 border-stone-800 ring-stone-800' : 'bg-stone-50/40 border-stone-200 ring-stone-100'}`}>
            <div className={`w-full h-full rounded-full flex items-center justify-center text-4xl font-serif-gothic italic border ${isDarkMode ? 'bg-stone-900/60 border-stone-800 text-stone-400' : 'bg-white/60 border-stone-200 text-stone-300'}`}>
              {user.name.charAt(0)}
            </div>
          </div>
          <h2 className={`text-4xl md:text-5xl font-serif-gothic font-black tracking-tight italic mb-4 ${textTitle}`}>
            {user.name}
          </h2>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${textMuted}`}>
            З нами з {user.joinDate}
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-6 border-t pt-4">
             <p className={`text-[11px] font-serif italic tracking-widest ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
               Придбано: {userOrders.length}
             </p>
             <p className={`text-[11px] font-serif italic tracking-widest ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
               У бажаному: {wishlistBooks.length}
             </p>
             <button 
               onClick={onLogout}
               className={`text-[11px] font-black uppercase tracking-[0.2em] transition flex items-center gap-2 ${isDarkMode ? 'text-rose-500 hover:text-rose-400' : 'text-rose-700 hover:text-rose-900'}`}
             >
               <i className="fas fa-power-off text-[10px]"></i>
               Вийти
             </button>
          </div>
        </div>
      </div>

      {/* Wishlist Section */}
      {wishlistBooks.length > 0 && (
        <div className="space-y-8">
          <h3 className={`text-2xl font-serif-gothic font-black italic tracking-tight ${textTitle}`}>
            Список бажаного
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {wishlistBooks.map(book => (
              <div 
                key={book.id} 
                className={`group cursor-pointer border p-4 transition-all duration-500 hover:scale-105 relative ${cardBg}`}
                onClick={() => onViewBook(book)}
              >
                {/* Wishlist Toggle Button (Star) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleWishlist(book.id); }}
                  className={`absolute top-6 left-6 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-stone-100/90 text-stone-950 border-stone-100/80 hover:bg-rose-600 hover:text-stone-100/90 hover:border-rose-600`}
                  title="Видалити зі списку"
                >
                  <i className="fas fa-star text-[10px]"></i>
                </button>

                <div className="aspect-[3/4.5] mb-4 overflow-hidden bg-stone-950 shadow-lg">
                  <img src={book.coverImage} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition" alt={book.title} onError={withCoverFallback} />
                </div>
                <h4 className={`text-[10px] font-black uppercase tracking-widest line-clamp-1 ${textTitle}`}>{book.title}</h4>
                <p className={`text-[9px] italic opacity-40 mt-1 ${textMuted}`}>{book.author}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Purchase History */}
      <div className={`border shadow-2xl overflow-hidden transition-all duration-700 ${cardBg}`}>
        <div className={`p-8 border-b ${headerBg} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] text-center italic ${textMuted}`}>
            Архів придбаних творів
          </h3>
        </div>
        <div className="md:hidden p-6 space-y-4">
          {userOrders.length > 0 ? userOrders.map((order) => {
            const statusInfo = getStatusConfig(order.status);
            return (
              <div key={order.id} className={`border p-4 space-y-2 ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
                <p className={`font-serif-gothic italic text-lg ${textTitle}`}>{order.bookTitle}</p>
                <p className={`text-[10px] uppercase tracking-widest ${textMuted}`}>{order.date}</p>
                <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>
                  {order.deliveryMethod === 'nova_poshta' ? 'Нова Пошта' : 'Самовивіз'} / {order.paymentMethod === 'cash_on_delivery' ? 'При отриманні' : 'Карта'}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`font-black ${textTitle}`}>{order.amount} ₴</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 border ${statusInfo.colorClass}`}>{statusInfo.label}</span>
                </div>
              </div>
            );
          }) : (
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${textMuted}`}>Історія порожня</p>
          )}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`${headerBg} text-[9px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-stone-700' : 'text-stone-400'}`}>
              <tr>
                <th className="px-8 py-6">Назва</th>
                <th className="px-8 py-6">Автор</th>
                <th className="px-8 py-6">Дата придбання</th>
                <th className="px-8 py-6">Доставка / Оплата</th>
                <th className="px-8 py-6 text-right">Ціна</th>
                <th className="px-8 py-6 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
              {userOrders.length > 0 ? userOrders.map((order, idx) => {
                const statusInfo = getStatusConfig(order.status);
                return (
                  <tr key={idx} className={`text-base transition group ${tableRowHover}`}>
                    <td className={`px-8 py-8 font-serif-gothic italic font-bold group-hover:text-stone-100 transition text-lg ${isDarkMode ? 'text-stone-300' : 'text-stone-800'}`}>
                      {order.bookTitle}
                    </td>
                    <td className={`px-8 py-8 font-medium italic ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                      {order.author || 'Автор невідомий'}
                    </td>
                    <td className={`px-8 py-8 text-[11px] tracking-widest uppercase ${isDarkMode ? 'text-stone-600' : 'text-stone-300'}`}>
                      {order.date}
                    </td>
                    <td className={`px-8 py-8 text-[10px] tracking-wide uppercase ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                      {order.deliveryMethod === 'nova_poshta' ? 'Нова Пошта' : 'Самовивіз'} / {order.paymentMethod === 'cash_on_delivery' ? 'При отриманні' : 'Карта'}
                      {order.trackingNumber ? ` • ТТН ${order.trackingNumber}` : ''}
                    </td>
                    <td className={`px-8 py-8 font-black text-right ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                      {order.amount} ₴
                    </td>
                    <td className="px-8 py-8 text-right">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 border inline-block min-w-[110px] text-center ${statusInfo.colorClass}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${textMuted}`}>Історія порожня</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profile;
