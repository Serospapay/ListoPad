
import React from 'react';
import { Book, Customer, Order } from '../types';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { SALES_DATA } from '../constants';

interface AdminDashboardProps {
  books: Book[];
  customers: Customer[];
  orders: Order[];
  setActiveView: (view: any) => void;
  isDarkMode: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ books, customers, orders, setActiveView, isDarkMode }) => {
  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';

  const totalRevenue = orders.reduce((acc, o) => acc + o.amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'ordered' || o.status === 'shipping').length;

  const stats = [
    { label: 'Загальний виторг', value: `${totalRevenue.toLocaleString()} ₴`, icon: 'fa-coins' },
    { label: 'Книг у базі', value: books.length, icon: 'fa-book-open' },
    { label: 'Активні замовлення', value: pendingOrders, icon: 'fa-box-open' },
    { label: 'Реєстр користувачів', value: customers.length, icon: 'fa-users' },
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      <div className={`border-b pb-8 ${isDarkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <h2 className={`text-4xl font-serif-gothic font-black italic ${textTitle}`}>Центр Управління</h2>
        <p className={`${textMuted} text-[10px] font-black uppercase tracking-[0.4em] mt-2`}>Головна панель адміністратора видавництва</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={`${cardBg} p-8 border shadow-2xl relative overflow-hidden group`}>
            <div className={`absolute -right-4 -bottom-4 text-6xl opacity-5 transition-transform group-hover:scale-110 ${textTitle}`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-3 ${textMuted}`}>{stat.label}</p>
            <h4 className={`text-3xl font-serif-gothic font-black ${textTitle}`}>{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sales Mini Chart */}
        <div className={`lg:col-span-2 ${cardBg} p-10 border shadow-2xl`}>
          <div className="flex justify-between items-center mb-10">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${textMuted}`}>Тренди продажів</h3>
            <button className={`text-[8px] font-bold uppercase tracking-widest underline underline-offset-4 ${textMuted}`}>Детальний звіт</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_DATA}>
                <XAxis dataKey="name" hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1c1917' : '#ffffff', border: 'none', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="sales" stroke={isDarkMode ? "#a8a29e" : "#78716c"} fill={isDarkMode ? "#44403c" : "#e7e5e4"} fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${cardBg} p-10 border shadow-2xl flex flex-col`}>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 ${textMuted}`}>Швидкі дії</h3>
          <div className="space-y-4 flex-1">
            <button 
              onClick={() => setActiveView('inventory')}
              className={`w-full py-5 border text-[9px] font-black uppercase tracking-[0.3em] transition ${isDarkMode ? 'border-stone-800 hover:bg-stone-800 text-stone-300' : 'border-stone-100 hover:bg-stone-50 text-stone-700'}`}
            >
              Додати нову книгу
            </button>
            <button 
              onClick={() => setActiveView('admin_orders')}
              className={`w-full py-5 border text-[9px] font-black uppercase tracking-[0.3em] transition ${isDarkMode ? 'border-stone-800 hover:bg-stone-800 text-stone-300' : 'border-stone-100 hover:bg-stone-50 text-stone-700'}`}
            >
              Переглянути замовлення
            </button>
            <button 
              onClick={() => setActiveView('crm')}
              className={`w-full py-5 border text-[9px] font-black uppercase tracking-[0.3em] transition ${isDarkMode ? 'border-stone-800 hover:bg-stone-800 text-stone-300' : 'border-stone-100 hover:bg-stone-50 text-stone-700'}`}
            >
              Аналіз бази користувачів
            </button>
          </div>
          <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
             <p className={`text-[9px] font-serif italic text-center ${textMuted}`}>Система працює у штатному режимі</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
