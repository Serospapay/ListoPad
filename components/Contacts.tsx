
import React from 'react';
import { contactsContent } from '../content/staticPages';

interface ContactsProps {
  isDarkMode: boolean;
}

const Contacts: React.FC<ContactsProps> = ({ isDarkMode }) => {
  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textPrimary = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textSecondary = isDarkMode ? 'text-stone-400' : 'text-stone-600';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-fadeIn pb-24">
      <div className="text-center space-y-4">
        <h2 className={`text-5xl md:text-6xl font-serif-gothic font-black tracking-tighter italic ${textPrimary}`}>Контакти</h2>
        <p className={`${textMuted} text-[10px] font-black uppercase tracking-[0.4em]`}>{contactsContent.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Physical Presence */}
        <div className={`${cardBg} p-12 border shadow-2xl space-y-8 transition-colors duration-700`}>
          <div className="space-y-2">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>{contactsContent.officeTitle}</h3>
            <p className={`text-xl font-serif-gothic italic ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{contactsContent.officeName}</p>
            <p className={`${textSecondary} text-sm`}>{contactsContent.officeAddress}</p>
          </div>

          <div className={`space-y-2 pt-8 border-t ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>{contactsContent.hoursTitle}</h3>
            <div className={`space-y-1 text-sm ${textSecondary}`}>
              <p className="flex justify-between"><span>{contactsContent.workdaysLabel}</span> <span className={isDarkMode ? 'text-stone-200' : 'text-stone-900'}>{contactsContent.workdaysValue}</span></p>
              <p className="flex justify-between"><span>{contactsContent.weekendLabel}</span> <span className={isDarkMode ? 'text-stone-200' : 'text-stone-900'}>{contactsContent.weekendValue}</span></p>
              <p className={`flex justify-between italic ${isDarkMode ? 'text-stone-700' : 'text-stone-300'}`}><span>{contactsContent.closedLabel}</span> <span>{contactsContent.closedValue}</span></p>
            </div>
          </div>
        </div>

        {/* Digital & Direct */}
        <div className={`${cardBg} p-12 border shadow-2xl space-y-8 transition-colors duration-700`}>
          <div className="space-y-2">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>Електронна пошта</h3>
            <p className={`text-xl font-serif-gothic italic underline underline-offset-8 decoration-stone-800 ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{contactsContent.email}</p>
            <p className={`${textMuted} text-[9px] uppercase tracking-widest mt-2`}>{contactsContent.emailNote}</p>
          </div>

          <div className={`space-y-2 pt-8 border-t ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>Телефон</h3>
            <p className={`text-xl font-serif-gothic italic ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{contactsContent.phone}</p>
            <p className={`${textMuted} text-[9px] uppercase tracking-widest mt-2`}>{contactsContent.phoneNote}</p>
          </div>

          <div className={`pt-8 flex gap-6 text-xl justify-center md:justify-start ${isDarkMode ? 'text-stone-600' : 'text-stone-300'}`}>
            <a href="#" className={`transition ${isDarkMode ? 'hover:text-stone-200' : 'hover:text-stone-900'}`}><i className="fab fa-instagram"></i></a>
            <a href="#" className={`transition ${isDarkMode ? 'hover:text-stone-200' : 'hover:text-stone-900'}`}><i className="fab fa-telegram-plane"></i></a>
          </div>
        </div>
      </div>

      {/* Decorative Statement */}
      <div className={`text-center py-16 border-y opacity-30 ${isDarkMode ? 'border-stone-900' : 'border-stone-200'}`}>
        <p className={`font-serif-gothic italic text-lg leading-relaxed max-w-2xl mx-auto ${textMuted}`}>
          {contactsContent.footerStatement}
        </p>
      </div>
    </div>
  );
};

export default Contacts;
