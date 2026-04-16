
import React, { useState } from 'react';
import { CartItem, User } from '../types';

interface CheckoutProps {
  cart: CartItem[];
  user: User | null;
  onComplete: (args: {
    paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cash_on_delivery';
    deliveryMethod: 'nova_poshta' | 'standard';
    promoCode?: string;
  }) => Promise<void>;
  onUpdateQuantity: (bookId: string, delta: number) => void;
  onRemoveItem: (bookId: string) => void;
  onBack: () => void;
  isDarkMode: boolean;
}

const Checkout: React.FC<CheckoutProps> = ({ cart, onComplete, onUpdateQuantity, onRemoveItem, onBack, isDarkMode }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | 'cash_on_delivery'>('card');
  const [deliveryMethod, setDeliveryMethod] = useState<'nova_poshta' | 'standard'>('nova_poshta');
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + (item.book.price * item.quantity), 0);
  const shipping = deliveryMethod === 'nova_poshta' ? 80 : 0;
  const total = subtotal + shipping;

  const cardBg = isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textTitle = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const textMuted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const innerBg = isDarkMode ? 'bg-stone-950' : 'bg-stone-50';

  const handlePayment = async () => {
    if (cart.length === 0) return;

    const outOfStock = cart.find(item => item.quantity > item.book.inventory);
    if (outOfStock) {
      setSubmitError(`Вибачте, книга "${outOfStock.book.title}" закінчилася або доступна в меншій кількості.`);
      return;
    }
    if (paymentMethod === 'card') {
      const normalizedCard = cardNumber.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(normalizedCard)) {
        setSubmitError('Вкажіть коректний номер картки (16 цифр).');
        return;
      }
      if (!/^\d{2}\s?\/\s?\d{2}$/.test(cardExpiry)) {
        setSubmitError('Вкажіть термін дії у форматі ММ/РР.');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvc)) {
        setSubmitError('Вкажіть коректний CVC код.');
        return;
      }
    }

    setIsProcessing(true);
    setSubmitError(null);
    try {
      await onComplete({ paymentMethod, deliveryMethod, promoCode: promoCode.trim().toUpperCase() });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не вдалося оформити замовлення.');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-fadeIn">
        <div className={`w-16 h-16 border-2 rounded-full animate-spin ${isDarkMode ? 'border-stone-800 border-t-stone-200' : 'border-stone-200 border-t-stone-900'}`}></div>
        <div className="text-center">
          <h2 className={`text-3xl font-serif-gothic italic font-black ${textTitle}`}>Підтвердження транзакції</h2>
          <p className={`${textMuted} text-sm font-black uppercase tracking-[0.2em] mt-2`}>Зачекайте...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fadeIn pb-24">
      <div className="lg:col-span-8 space-y-12">
        <button onClick={onBack} className={`${textMuted} font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${isDarkMode ? 'hover:text-stone-100' : 'hover:text-stone-900'}`}>
          <i className="fas fa-arrow-left text-sm"></i> Повернутися
        </button>

        {/* Delivery */}
        <div className={`${cardBg} p-10 border shadow-2xl`}>
          <h3 className={`text-xl font-serif-gothic font-black mb-10 italic border-b pb-6 flex items-center gap-4 ${textTitle} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
             Спосіб доставки
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <button 
              onClick={() => setDeliveryMethod('nova_poshta')}
              disabled={isProcessing}
              className={`p-6 border transition text-left ${deliveryMethod === 'nova_poshta' ? (isDarkMode ? 'border-stone-300 bg-stone-800' : 'border-stone-900 bg-stone-50') : (isDarkMode ? 'border-stone-800 hover:border-stone-600' : 'border-stone-200 hover:border-stone-400')}`}
            >
              <span className={`font-bold block mb-2 uppercase text-sm tracking-widest ${isDarkMode ? 'text-stone-100' : 'text-stone-900'}`}>Нова Пошта</span>
              <p className={`text-[10px] font-bold tracking-widest leading-relaxed uppercase ${textMuted}`}>Доставка у відділення або поштомат за тарифами перевізника</p>
            </button>
            <button 
              onClick={() => setDeliveryMethod('standard')}
              disabled={isProcessing}
              className={`p-6 border transition text-left ${deliveryMethod === 'standard' ? (isDarkMode ? 'border-stone-300 bg-stone-800' : 'border-stone-900 bg-stone-50') : (isDarkMode ? 'border-stone-800 hover:border-stone-600' : 'border-stone-200 hover:border-stone-400')}`}
            >
              <span className={`font-bold block mb-2 uppercase text-sm tracking-widest ${isDarkMode ? 'text-stone-100' : 'text-stone-900'}`}>Самовивіз</span>
              <p className={`text-[10px] font-bold tracking-widest leading-relaxed uppercase ${textMuted}`}>Безкоштовно з нашого офісу після підтвердження</p>
            </button>
          </div>
        </div>

        {/* Payment */}
        <div className={`${cardBg} p-10 border shadow-2xl`}>
          <h3 className={`text-xl font-serif-gothic font-black mb-10 italic border-b pb-6 flex items-center gap-4 ${textTitle} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
             Спосіб оплати
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button 
                onClick={() => setPaymentMethod('card')}
                disabled={isProcessing}
                className={`p-6 border transition flex items-center gap-5 ${paymentMethod === 'card' ? (isDarkMode ? 'border-stone-300 bg-stone-800' : 'border-stone-900 bg-stone-50') : (isDarkMode ? 'border-stone-800' : 'border-stone-200')}`}
             >
                <i className={`fas fa-credit-card text-lg ${textMuted}`}></i>
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>Банківська карта</span>
             </button>
             <button 
                onClick={() => setPaymentMethod('cash_on_delivery')}
                disabled={isProcessing}
                className={`p-6 border transition flex items-center gap-5 ${paymentMethod === 'cash_on_delivery' ? (isDarkMode ? 'border-stone-300 bg-stone-800' : 'border-stone-900 bg-stone-50') : (isDarkMode ? 'border-stone-800' : 'border-stone-200')}`}
             >
                <i className={`fas fa-coins text-lg ${textMuted}`}></i>
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>При отриманні</span>
             </button>
          </div>

          {paymentMethod === 'card' && (
            <div className={`mt-10 p-8 border space-y-8 animate-fadeIn ${innerBg} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
               <div>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.3em] mb-3 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>Номер карти</label>
                  <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className={`w-full py-3 text-sm focus:outline-none tracking-[0.2em] bg-transparent border-b ${isDarkMode ? 'border-stone-800 text-stone-200 focus:border-stone-100' : 'border-stone-200 text-stone-800 focus:border-stone-900'}`} />
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className={`block text-[9px] font-black uppercase tracking-[0.3em] mb-3 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>Термін</label>
                    <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="ММ / РР" className={`w-full py-3 text-sm focus:outline-none bg-transparent border-b ${isDarkMode ? 'border-stone-800 text-stone-200 focus:border-stone-100' : 'border-stone-200 text-stone-800 focus:border-stone-900'}`} />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-black uppercase tracking-[0.3em] mb-3 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>CVC</label>
                    <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="•••" type="password" className={`w-full py-3 text-sm focus:outline-none bg-transparent border-b ${isDarkMode ? 'border-stone-800 text-stone-200 focus:border-stone-100' : 'border-stone-200 text-stone-800 focus:border-stone-900'}`} />
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-4">
        <div className={`${cardBg} p-10 border shadow-2xl sticky top-32`}>
          <h3 className={`font-serif-gothic italic font-black mb-8 text-2xl border-b pb-4 ${textTitle} ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>Кошик</h3>
          <div className="space-y-8 mb-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length > 0 ? cart.map(item => (
              <div key={item.book.id} className="flex gap-4 items-start border-b pb-4 border-stone-800/20 last:border-0">
                <div className={`w-14 h-20 border flex-shrink-0 ${isDarkMode ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                  <img src={item.book.coverImage} className="w-full h-full object-cover grayscale opacity-50" alt={item.book.title} />
                </div>
                <div className="flex-1 space-y-2">
                  <p className={`text-[11px] font-black line-clamp-1 uppercase tracking-widest ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{item.book.title}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{item.book.price} ₴ за примірник</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-stone-800/30">
                      <button 
                        title="Зменшити кількість"
                        aria-label="Зменшити кількість"
                        onClick={() => onUpdateQuantity(item.book.id, -1)}
                        disabled={isProcessing}
                        className={`px-2 py-1 text-sm hover:bg-stone-500/10 transition ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <span className={`px-3 py-1 text-[11px] font-black ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{item.quantity}</span>
                      <button 
                        title="Збільшити кількість"
                        aria-label="Збільшити кількість"
                        onClick={() => onUpdateQuantity(item.book.id, 1)}
                        disabled={isProcessing}
                        className={`px-2 py-1 text-sm hover:bg-stone-500/10 transition ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => onRemoveItem(item.book.id)}
                      disabled={isProcessing}
                      className={`text-[10px] font-black uppercase tracking-widest transition ${isDarkMode ? 'text-rose-900 hover:text-rose-500' : 'text-rose-400 hover:text-rose-600'}`}
                    >
                      Видалити
                    </button>
                  </div>
                  {item.quantity >= item.book.inventory && (
                    <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Це останні книги</p>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Кошик порожній</p>
              </div>
            )}
          </div>
          
          <div className={`space-y-4 border-t pt-8 ${isDarkMode ? 'border-stone-800' : 'border-stone-100'}`}>
            <div className={`flex justify-between text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>
              <span>Вартість</span>
              <span className={isDarkMode ? 'text-stone-300' : 'text-stone-700'}>{subtotal} ₴</span>
            </div>
            <div className={`flex justify-between text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>
              <span>Доставка</span>
              <span className={isDarkMode ? 'text-stone-300' : 'text-stone-700'}>{shipping} ₴</span>
            </div>
            <div className={`flex justify-between text-3xl font-serif-gothic italic font-black pt-4 ${textTitle}`}>
              <span>Разом</span>
              <span>{total} ₴</span>
            </div>
          </div>

          <div className={`mt-6 p-4 border ${isDarkMode ? 'border-stone-800 bg-stone-950/30' : 'border-stone-200 bg-stone-50/80'}`}>
            <label className={`block text-[9px] font-black uppercase tracking-[0.3em] mb-3 ${textMuted}`}>Промокод</label>
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={isProcessing}
              placeholder="Введіть код"
              className={`w-full py-3 text-sm focus:outline-none tracking-[0.2em] bg-transparent border-b ${isDarkMode ? 'border-stone-800 text-stone-200 focus:border-stone-100' : 'border-stone-200 text-stone-800 focus:border-stone-900'}`}
            />
          </div>

          {submitError && (
            <div className={`mt-6 p-4 border text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'border-rose-900/60 text-rose-500 bg-rose-950/20' : 'border-rose-200 text-rose-700 bg-rose-50'}`}>
              {submitError}
            </div>
          )}

          <button 
            onClick={handlePayment}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full font-black py-5 mt-10 transition uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 border ${
              isDarkMode
                ? 'border-amber-200/25 bg-gradient-to-b from-amber-200/12 to-zinc-950/25 text-stone-100/90 hover:border-amber-200/40 hover:bg-amber-200/15'
                : 'border-stone-200/80 bg-stone-50/80 text-stone-950 hover:border-stone-300'
            }`}
          >
            {isProcessing ? 'Обробка...' : 'Оплатити'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
