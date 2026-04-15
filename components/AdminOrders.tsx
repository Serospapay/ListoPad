
import React, { useState, useMemo } from 'react';
import { Order, Customer } from '../types';

interface AdminOrdersProps {
  orders: Order[];
  customers: Customer[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  isDarkMode: boolean;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, customers, onUpdateStatus, isDarkMode }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const cardBg = isDarkMode ? 'bg-stone-900/20 border-stone-800 backdrop-blur-md' : 'bg-white/20 border-stone-200 backdrop-blur-md';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const headerBg = isDarkMode ? 'bg-stone-950/40' : 'bg-stone-50/40';

  const ordersByCustomer = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    orders.forEach(order => {
      if (!groups[order.customerId]) groups[order.customerId] = [];
      groups[order.customerId].push(order);
    });
    return groups;
  }, [orders]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ordered': return 'Оформлено';
      case 'shipping': return 'Відправлено';
      case 'at_branch': return 'У відділенні';
      case 'received': return 'Отримано';
      default: return status;
    }
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

      <div className="space-y-16">
        {/* Fix: Explicitly cast Object.entries to ensure customerOrders is recognized as Order[] type */}
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
                      <th className="px-8 py-4">Сума</th>
                      <th className="px-8 py-4">Статус</th>
                      <th className="px-8 py-4 text-right">Змінити стан</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                    {customerOrders.map((order) => (
                      <tr key={order.id} className={`transition ${isDarkMode ? 'hover:bg-stone-800/20' : 'hover:bg-stone-50/50'}`}>
                        <td className="px-8 py-6">
                          <p className={`font-mono text-[10px] ${textTitle}`}>#{order.id}</p>
                          <p className={`text-[8px] uppercase tracking-widest mt-1 ${textMuted}`}>{order.date}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`font-serif-gothic italic text-sm ${textTitle}`}>{order.bookTitle}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`font-black text-xs ${textTitle}`}>{order.amount} ₴</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 border ${
                            order.status === 'ordered' ? 'border-rose-900/40 text-rose-500' :
                            order.status === 'shipping' ? 'border-orange-900/40 text-orange-500' :
                            order.status === 'at_branch' ? 'border-sky-900/40 text-sky-500' :
                            'border-emerald-900/40 text-emerald-500'
                          }`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <select 
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                            className={`text-[9px] font-black uppercase tracking-widest bg-transparent border p-2 focus:outline-none ${isDarkMode ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-600'}`}
                          >
                            <option value="ordered">Оформлено</option>
                            <option value="shipping">Відправлено</option>
                            <option value="at_branch">У відділенні</option>
                            <option value="received">Отримано</option>
                          </select>
                        </td>
                      </tr>
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
