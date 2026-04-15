
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Customer, Book, Order } from '../types';

interface CRMProps {
  customers: Customer[];
  books: Book[];
  orders: Order[];
  isDarkMode: boolean;
}

const CRM: React.FC<CRMProps> = ({ customers, books, orders, isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const cardBg = isDarkMode ? 'bg-stone-900/20 border-stone-800 backdrop-blur-md' : 'bg-white/20 border-stone-200 backdrop-blur-md';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const tableHeaderBg = isDarkMode ? 'bg-stone-950/40' : 'bg-stone-50/40';
  const headerBg = isDarkMode ? 'bg-stone-950/40' : 'bg-stone-50/40';

  
  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + o.amount, 0), [orders]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const selectedCustomerInfo = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return orders.filter(o => o.customerId === selectedCustomerId);
  }, [selectedCustomerId, orders]);

  const stats = [
    { label: 'Загальний дохід', value: `${totalRevenue.toLocaleString()} ₴`, trend: 'Актуальні дані', icon: 'fa-coins' },
    { 
      label: 'Користувачі', 
      value: `${customers.length}`, 
      trend: `Всього в базі`, 
      icon: 'fa-users' 
    },
    { 
      label: 'Активні замовлення', 
      value: `${orders.filter(o => o.status !== 'received').length}`, 
      trend: `В обробці`, 
      icon: 'fa-chart-line' 
    }
  ];

  const chartData = useMemo(() => {
    if (orders.length === 0) return [
      { name: 'Січ', sales: 0 }, { name: 'Лют', sales: 0 }, { name: 'Бер', sales: 0 }, { name: 'Квіт', sales: 0 }, { name: 'Трав', sales: 0 }
    ];
    return [
      { name: 'Січ', sales: 0 },
      { name: 'Лют', sales: 0 },
      { name: 'Бер', sales: 0 },
      { name: 'Квіт', sales: 0 },
      { name: 'Трав', sales: totalRevenue },
    ];
  }, [orders, totalRevenue]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ordered': return 'Оформлено';
      case 'shipping': return 'Відправлено';
      case 'at_branch': return 'У відділенні';
      case 'received': return 'Отримано';
      default: return status;
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-20 relative">
      <div className={`flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8 ${isDarkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <div>
          <h2 className={`text-4xl font-serif-gothic font-black italic ${textTitle}`}>Аналітика Видавництва</h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={`${cardBg} p-8 border shadow-2xl transition-all duration-700`}>
            <div className="flex items-center justify-between mb-6">
              <div className={`${isDarkMode ? 'text-stone-600' : 'text-stone-300'} text-xl`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className={`text-[8px] font-black tracking-widest ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 ${textMuted}`}>{stat.label}</p>
            <h4 className={`text-2xl font-serif-gothic font-black ${textTitle}`}>{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="h-80 w-full mb-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDarkMode ? "#44403c" : "#d6d3d1"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isDarkMode ? "#44403c" : "#d6d3d1"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1c1917" : "#e7e5e4"} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#57534e' : '#a8a29e', fontSize: 10}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#57534e' : '#a8a29e', fontSize: 10}} />
            <Tooltip 
              contentStyle={{backgroundColor: isDarkMode ? '#0c0a09' : '#ffffff', borderRadius: '0', border: isDarkMode ? '1px solid #292524' : '1px solid #e7e5e4', color: isDarkMode ? '#d6d3d1' : '#44403c'}}
            />
            <Area type="monotone" dataKey="sales" stroke={isDarkMode ? "#a8a29e" : "#78716c"} strokeWidth={1} fillOpacity={1} fill="url(#colorSales)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* User Table */}
      <div className={`${cardBg} border shadow-2xl overflow-hidden transition-all duration-700`}>
        <div className={`p-10 border-b flex justify-between items-center ${isDarkMode ? 'border-stone-800 bg-stone-950/30' : 'border-stone-200 bg-stone-50/30'}`}>
          <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${textMuted}`}>Користувачі</h3>
          <div className="relative">
            <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-xs ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}></i>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Знайти..." 
              className={`pl-12 pr-6 py-3 border text-[10px] focus:outline-none w-72 ${isDarkMode ? 'bg-stone-900/40 border-stone-800 text-stone-400 focus:border-stone-600' : 'bg-white/40 border-stone-200 text-stone-800 focus:border-stone-300'}`} 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredCustomers.length > 0 ? (
            <table className="w-full text-left">
              <thead className={`${tableHeaderBg} text-[9px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                <tr>
                  <th className="px-8 py-6">Користувач</th>
                  <th className="px-8 py-6">Замовлення</th>
                  <th className="px-8 py-6">Витрачено</th>
                  <th className="px-8 py-6">Дата реєстрації</th>
                  <th className="px-8 py-6 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className={`${isDarkMode ? 'hover:bg-stone-800/30' : 'hover:bg-stone-50'} transition`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 border flex items-center justify-center font-serif-gothic italic ${isDarkMode ? 'border-stone-800 bg-stone-950/40 text-stone-500' : 'border-stone-200 bg-white/40 text-stone-400'}`}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{customer.name}</p>
                          <p className={`text-[10px] font-mono ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-8 py-6 font-bold ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>{customer.ordersCount}</td>
                    <td className={`px-8 py-6 font-black ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{customer.totalSpent} ₴</td>
                    <td className={`px-8 py-6 text-[10px] uppercase tracking-widest ${textMuted}`}>{customer.lastPurchaseDate}</td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 border transition ${isDarkMode ? 'border-stone-700 text-stone-400 hover:text-stone-100 hover:bg-stone-800' : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'}`}
                      >
                        Переглянути
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${textMuted}`}>База порожня. Нових записів не виявлено.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Account Modal */}
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

              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-6 border-b pb-2 ${isDarkMode ? 'text-stone-500 border-stone-800' : 'text-stone-400 border-stone-100'}`}>
                  Повна історія замовлень
                </h4>
                <div className="max-h-64 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                  {customerOrders.length > 0 ? customerOrders.map(o => (
                    <div key={o.id} className={`flex justify-between items-center p-4 border transition ${isDarkMode ? 'border-stone-800 hover:bg-stone-800/30' : 'border-stone-100 hover:bg-stone-50'}`}>
                       <div>
                         <p className={`text-xs font-bold ${textTitle}`}>{o.bookTitle}</p>
                         <p className={`text-[8px] font-mono mt-1 ${textMuted}`}>{o.date} • #{o.id}</p>
                       </div>
                       <div className="text-right">
                         <p className={`text-xs font-black ${textTitle}`}>{o.amount} ₴</p>
                         <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${o.status === 'received' ? 'text-emerald-500' : 'text-orange-500'}`}>{getStatusLabel(o.status)}</p>
                       </div>
                    </div>
                  )) : (
                    <p className={`text-[10px] text-center font-bold uppercase tracking-widest py-10 ${textMuted}`}>Замовлень не знайдено</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-8 border-t flex justify-end ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
               <button 
                 onClick={() => setSelectedCustomerId(null)}
                 className={`px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition ${isDarkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-900 text-stone-100'}`}
               >
                 Закрити
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
