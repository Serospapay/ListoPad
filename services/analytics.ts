
import { Order, Book } from '../types';

export const getHardcodedInsight = (orders: Order[], books: Book[]) => {
  const totalSales = orders.length;
  const lowStock = books.filter(b => b.inventory < 5).length;
  
  const genreCounts: { [key: string]: number } = {};
  orders.forEach(o => {
    const book = books.find(b => b.title === o.bookTitle);
    if (book && book.categories) {
      book.categories.forEach(c => {
        genreCounts[c] = (genreCounts[c] || 0) + 1;
      });
    }
  });
  
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return `Зроблено ${totalSales} замовлень. Закінчується ${lowStock} книг. Найпопулярнішим жанром є "${topGenre}".`;
};
