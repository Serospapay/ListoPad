
import React, { useMemo, useState } from 'react';
import { Customer, Order, OrderStatus } from '../types';

interface AdminOrdersProps {
  orders: Order[];
  customers: Customer[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  isDarkMode: boolean;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, customers, onUpdateStatus, isDarkMode }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [promoFilter, setPromoFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const cardBg = isDarkMode ? 'bg-stone-900/20 border-stone-800 backdrop-blur-md' : 'bg-white/20 border-stone-200 backdrop-blur-md';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const headerBg = isDarkMode ? 'bg-stone-950/40' : 'bg-stone-50/40';

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (promoFilter.trim() && !(order.promoCode || '').toLowerCase().includes(promoFilter.trim().toLowerCase())) return false;
      if (!searchQuery.trim()) return true;
      const needle = searchQuery.trim().toLowerCase();
      return (
        order.customerName?.toLowerCase().includes(needle)
        || order.customerId.toLowerCase().includes(needle)
        || order.bookTitle.toLowerCase().includes(needle)
        || order.id.toLowerCase().includes(needle)
      );
    });
  }, [orders, promoFilter, searchQuery, statusFilter]);

  const ordersByCustomer = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    filteredOrders.forEach((order) => {
      if (!groups[order.customerId]) groups[order.customerId] = [];
      groups[order.customerId].push(order);
    });
    return groups;
  }, [filteredOrders]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ordered': return 'Створено';
      case 'paid': return 'Оплачено';
      case 'packed': return 'Упаковано';
      case 'shipped': return 'Відправлено';
      case 'delivered': return 'Доставлено';
      case 'closed': return 'Закрито';
      case 'cancelled': return 'Скасовано';
      case 'shipping': return 'Відправлено';
      case 'at_branch': return 'У відділенні';
      case 'received': return 'Отримано';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    if (status === 'ordered') return 'border-rose-900/40 text-rose-500';
    if (status === 'paid' || status === 'packed') return 'border-amber-900/40 text-amber-500';
    if (status === 'shipped' || status === 'shipping') return 'border-orange-900/40 text-orange-500';
    if (status === 'delivered' || status === 'at_branch') return 'border-sky-900/40 text-sky-500';
    if (status === 'closed' || status === 'received') return 'border-emerald-900/40 text-emerald-500';
    if (status === 'cancelled') return 'border-zinc-700/60 text-zinc-400';
    return 'border-zinc-700/60 text-zinc-400';
  };

  const getNextStatuses = (status: OrderStatus): OrderStatus[] => {
    const map: Record<OrderStatus, OrderStatus[]> = {
      ordered: ['paid', 'cancelled'],
      paid: ['packed', 'cancelled'],
      packed: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['closed'],
      closed: [],
      cancelled: [],
      shipping: ['delivered'],
      at_branch: ['closed'],
      received: [],
    };
    return map[status] || [];
  };

  const selectedCustomerInfo = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId) || {
      id: selectedCustomerId,
      name: ordersByCustomer[selectedCustomerId]?.[0]?.customerName || 'Гість',
      email: '—',
      totalSpent: ordersByCustomer[selectedCustomerId]?.reduce((sum, o) => sum + o.amount, 0) || 0,
      ordersCount: ordersByCustomer[selectedCustomerId]?.length || 0,
      lastPurchaseDate: '—'
    };
  }, [selectedCustomerId, customers, ordersByCustomer]);

  return (
    <div className="space-y-12 animate-fadeIn pb-24 relative">
      <div className={`border-b pb-8 ${isDarkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <h2 className={`text-4xl font-serif-gothic font-black italic ${textTitle}`}>Реєстр Замовлень</h2>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border ${cardBg}`}>
        <label className="space-y-2">
          <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${textMuted}`}>Пошук</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Клієнт, книга, ID..."
            className={`w-full p-3 border bg-transparent text-sm ${isDarkMode ? 'border-stone-800 text-stone-200' : 'border-stone-200 text-stone-900'}`}
          />
        </label>
        <label className="space-y-2">
          <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${textMuted}`}>Статус</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | OrderStatus)}
            className={`w-full p-3 border bg-transparent text-sm ${isDarkMode ? 'border-stone-800 text-stone-200' : 'border-stone-200 text-stone-900'}`}
          >
            <option value="all">Всі статуси</option>
            <option value="ordered">Створено</option>
            <option value="paid">Оплачено</option>
            <option value="packed">Упаковано</option>
            <option value="shipped">Відправлено</option>
            <option value="delivered">Доставлено</option>
            <option value="closed">Закрито</option>
            <option value="cancelled">Скасовано</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${textMuted}`}>Промокод</span>
          <input
            value={promoFilter}
            onChange={(event) => setPromoFilter(event.target.value)}
            placeholder="Напр. SAVE10"
            className={`w-full p-3 border bg-transparent text-sm ${isDarkMode ? 'border-stone-800 text-stone-200' : 'border-stone-200 text-stone-900'}`}
          />
        </label>
      </div>

      <div className="space-y-16">
        {(Object.entries(ordersByCustomer) as [string, Order[]][]).map(([customerId, customerOrders]) => {
          const customerName = customerOrders[0].customerName || 'Гість';
          return (
            <div key={customerId} className={`${cardBg} border shadow-2xl overflow-hidden transition-all duration-700`}>
              <div className={`p-8 border-b flex justify-between items-center ${headerBg} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 flex items-center justify-center font-serif-gothic italic text-xl border ${isDarkMode ? 'bg-stone-900/60 border-stone-800 text-stone-500' : 'bg-white/60 border-stone-200 text-stone-400'}`}>
                    {customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`text-lg font-black uppercase tracking-widest ${textTitle}`}>{customerName}</h3>
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${textMuted}`}>
                      Замовлень в архіві: {customerOrders.length}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomerId(customerId)}
                  className={`px-6 py-3 border text-[9px] font-black uppercase tracking-widest transition ${isDarkMode ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                >
                  Переглянути акаунт
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className={`text-[8px] font-black uppercase tracking-[0.4em] ${textMuted} border-b ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
                    <tr>
                      <th className="px-8 py-4">ID / Дата</th>
                      <th className="px-8 py-4">Назва книги</th>
                      <th className="px-8 py-4">Платіж / Доставка</th>
                      <th className="px-8 py-4">Промо</th>
                      <th className="px-8 py-4">Сума</th>
                      <th className="px-8 py-4">Статус</th>
                      <th className="px-8 py-4 text-right">Змінити стан</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                    {customerOrders.map((order) => (
                      <React.Fragment key={order.id}>
                      <tr className={`transition ${isDarkMode ? 'hover:bg-stone-800/20' : 'hover:bg-stone-50/50'}`}>
                        <td className="px-8 py-6">
                          <p className={`font-mono text-[10px] ${textTitle}`}>#{order.id}</p>
                          <p className={`text-[8px] uppercase tracking-widest mt-1 ${textMuted}`}>{order.date}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`font-serif-gothic italic text-sm ${textTitle}`}>{order.bookTitle}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`text-[10px] uppercase tracking-widest ${textMuted}`}>
                            {order.paymentMethod} / {order.deliveryMethod}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${textTitle}`}>{order.promoCode || '—'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`font-black text-xs ${textTitle}`}>{order.totalAmount ?? order.amount} ₴</p>
                          {(order.discountAmount || 0) > 0 && (
                            <p className="text-[9px] text-emerald-500 uppercase tracking-widest mt-1">Знижка: {order.discountAmount} ₴</p>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 border ${getStatusClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          {order.statusHistory && order.statusHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                              className={`mt-2 block text-[8px] font-black uppercase tracking-widest ${textMuted} hover:opacity-100 opacity-70`}
                            >
                              {expandedOrderId === order.id ? 'Сховати таймлайн' : 'Показати таймлайн'}
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {getNextStatuses(order.status).map((target) => (
                              <button
                                key={`${order.id}-${target}`}
                                type="button"
                                onClick={() => onUpdateStatus(order.id, target)}
                                className={`text-[9px] font-black uppercase tracking-widest border px-3 py-2 ${isDarkMode ? 'border-stone-700 text-stone-300 hover:text-stone-100 hover:border-stone-500' : 'border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-400'}`}
                              >
                                {getStatusLabel(target)}
                              </button>
                            ))}
                            {getNextStatuses(order.status).length === 0 && (
                              <span className={`text-[9px] font-black uppercase tracking-widest ${textMuted}`}>Фінальний стан</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedOrderId === order.id && (
                        <tr className={isDarkMode ? 'bg-stone-900/25' : 'bg-stone-100/50'}>
                          <td colSpan={7} className="px-8 py-5">
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${textMuted}`}>Таймлайн статусів</p>
                            <div className="space-y-2">
                              {(order.statusHistory || []).map((history, idx) => (
                                <div key={`${order.id}-h-${idx}`} className="flex items-center justify-between text-[11px]">
                                  <span className={textTitle}>
                                    {getStatusLabel(history.fromStatus || 'ordered')} {'->'} {getStatusLabel(history.toStatus)}
                                  </span>
                                  <span className={textMuted}>
                                    {new Date(history.changedAt).toLocaleString('uk-UA')} {history.changedBy ? `• ${history.changedBy}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCustomerId && selectedCustomerInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={() => setSelectedCustomerId(null)}></div>
          <div className={`relative max-w-2xl w-full border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden animate-slideUp ${cardBg}`}>
            <div className={`p-10 border-b flex justify-between items-start ${headerBg} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
              <div className="flex gap-8 items-center">
                <div className={`w-20 h-20 flex items-center justify-center font-serif-gothic italic text-4xl border ${isDarkMode ? 'bg-stone-900/60 border-stone-800 text-stone-600' : 'bg-white/60 border-stone-200 text-stone-300'}`}>
                  {selectedCustomerInfo.name.charAt(0)}
                </div>
                <div>
                  <h3 className={`text-3xl font-serif-gothic font-black italic ${textTitle}`}>{selectedCustomerInfo.name}</h3>
                  <p className={`text-[10px] font-black uppercase tracking-[0.4em] mt-2 ${textMuted}`}>{selectedCustomerInfo.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerId(null)} className={`text-xl transition ${isDarkMode ? 'text-stone-700 hover:text-stone-100' : 'text-stone-300 hover:text-stone-900'}`}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className={`p-6 border ${isDarkMode ? 'bg-stone-950/50 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 ${textMuted}`}>Витрачено всього</p>
                  <p className={`text-2xl font-serif-gothic font-black ${textTitle}`}>{selectedCustomerInfo.totalSpent.toLocaleString()} ₴</p>
                </div>
                <div className={`p-6 border ${isDarkMode ? 'bg-stone-950/50 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 ${textMuted}`}>Дата реєстрації</p>
                  <p className={`text-sm font-black uppercase tracking-widest ${textTitle}`}>{selectedCustomerInfo.lastPurchaseDate || '—'}</p>
                </div>
              </div>
            </div>
            <div className={`p-8 border-t flex justify-end ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
               <button 
                 onClick={() => setSelectedCustomerId(null)}
                 className={`px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition ${isDarkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-900 text-stone-100'}`}
               >
                 Закрити справу
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
