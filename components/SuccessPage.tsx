
import React from 'react';

interface SuccessPageProps {
  onContinue: () => void;
  isDarkMode: boolean;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ onContinue, isDarkMode }) => {
  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const innerBg = isDarkMode ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-100';

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fadeIn pb-24">
      <div className={`p-16 border shadow-2xl text-center max-w-xl space-y-12 ${cardBg}`}>
        <div className={`relative mx-auto w-32 h-32 flex items-center justify-center border-2 ${isDarkMode ? 'border-stone-800 bg-stone-950' : 'border-stone-100 bg-stone-50'}`}>
          <i className={`fas fa-check text-4xl ${isDarkMode ? 'text-stone-100' : 'text-stone-900'}`}></i>
          <div className={`absolute inset-0 border animate-pulse ${isDarkMode ? 'border-stone-700' : 'border-stone-200'}`}></div>
        </div>
        
        <div className="space-y-6">
          <h2 className={`text-5xl font-serif-gothic font-black tracking-tighter italic ${textTitle}`}>Успішно</h2>
          <p className={`${textMuted} font-medium text-sm italic`}>
            Книги готуються до відправлення
          </p>
          <div className={`p-8 border text-left ${innerBg}`}>
             <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-center ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>Цифровий примірник чека</p>
             <p className={`text-[9px] text-center uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-stone-700' : 'text-stone-300'}`}>
               Цифровий чек надіслано на ваш електронну адресу. Очікуйте прибуття????
             </p>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className={`w-full border font-black py-5 transition uppercase tracking-[0.4em] text-[10px] ${isDarkMode ? 'border-stone-100 text-stone-100 hover:bg-stone-100 hover:text-stone-950' : 'border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-100'}`}
        >
          Повернутися до бібліотеки
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
