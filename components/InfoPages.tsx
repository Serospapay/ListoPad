
import React from 'react';

interface InfoPageProps {
  isDarkMode: boolean;
}

export const Delivery: React.FC<InfoPageProps> = ({ isDarkMode }) => {
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textBody = isDarkMode ? 'text-stone-300' : 'text-stone-700';

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-fadeIn pb-24">
      <div className="text-center space-y-4">
        <h2 className={`text-5xl md:text-6xl font-serif-gothic font-black tracking-tighter italic ${textTitle}`}>Доставка</h2>
        <p className={`${textMuted} text-[10px] font-black uppercase tracking-[0.4em]`}>ячс</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className={`${cardBg} p-12 border shadow-2xl space-y-6`}>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>Нова Пошта</h3>
          <p className={`${textBody} font-serif italic text-lg leading-relaxed`}>
            ячс
          </p>
        </div>

        <div className={`${cardBg} p-12 border shadow-2xl space-y-6`}>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>ячс</h3>
          <p className={`${textBody} font-serif italic text-lg leading-relaxed`}>
            ячс
          </p>
        </div>
      </div>

      <div className={`p-12 border text-center ${isDarkMode ? 'bg-stone-900/50 border-stone-900' : 'bg-stone-50 border-stone-100'}`}>
        <p className={`${textMuted} text-xs italic`}>
          ячс
        </p>
      </div>
    </div>
  );
};

export const Payment: React.FC<InfoPageProps> = ({ isDarkMode }) => {
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textBody = isDarkMode ? 'text-stone-300' : 'text-stone-700';

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-fadeIn pb-24">
      <div className="text-center space-y-4">
        <h2 className={`text-5xl md:text-6xl font-serif-gothic font-black tracking-tighter italic ${textTitle}`}>Оплата</h2>
        <p className={`${textMuted} text-[10px] font-black uppercase tracking-[0.4em]`}>ячс</p>
      </div>

      <div className="space-y-8">
        {[
          { title: 'ячс', desc: 'ячс' },
          { title: 'ячс', desc: 'ячс' },
          { title: 'ячс', desc: 'ячс' }
        ].map((method, idx) => (
          <div key={idx} className={`${cardBg} p-12 border shadow-2xl flex flex-col md:flex-row md:items-center gap-8`}>
            <div className="md:w-1/3">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>{method.title}</h3>
            </div>
            <div className="md:w-2/3">
              <p className={`${textBody} font-serif italic text-lg`}>{method.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
