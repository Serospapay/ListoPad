import React from 'react';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'pages-asc' | 'pages-desc';

interface StorefrontFiltersProps {
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  selectedCategory: string;
  allCategories: string[];
  onCategoryChange?: (category: string) => void;
  priceMin: number;
  setPriceMin: (value: number) => void;
  priceMax: number;
  setPriceMax: (value: number) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (value: boolean) => void;
  resetFilters: () => void;
}

const StorefrontFilters: React.FC<StorefrontFiltersProps> = ({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedCategory,
  allCategories,
  onCategoryChange,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  onlyAvailable,
  setOnlyAvailable,
  resetFilters,
}) => {
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const text = isDarkMode ? 'text-zinc-200' : 'text-zinc-800';
  const line = isDarkMode ? 'border-zinc-800/90' : 'border-zinc-300/90';
  const hoverBg = isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-zinc-900/[0.03]';

  return (
    <section className="py-12 md:py-14">
      <div className="flex items-center justify-between mb-8">
        <p className={`text-[10px] uppercase tracking-[0.24em] font-black ${muted}`}>Фільтри каталогу</p>
        <button
          type="button"
          onClick={resetFilters}
          className={`text-[10px] uppercase tracking-[0.24em] font-black transition ${muted} ${isDarkMode ? 'hover:text-zinc-100' : 'hover:text-zinc-900'}`}
        >
          Скинути
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <label className={`group lg:col-span-5 block border-b ${line} pb-3 transition-all ${hoverBg} px-1`}>
          <span className={`block text-[10px] uppercase tracking-[0.22em] mb-2 ${muted}`}>Пошук</span>
          <span className="flex items-center gap-3">
            <i className={`fas fa-search text-xs ${muted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Назва, автор, ISBN…"
              autoComplete="off"
              className={`w-full bg-transparent outline-none text-sm placeholder:opacity-50 ${text}`}
            />
          </span>
        </label>

        <label className={`group lg:col-span-3 block border-b ${line} pb-3 transition-all ${hoverBg} px-1`}>
          <span className={`block text-[10px] uppercase tracking-[0.22em] mb-2 ${muted}`}>Сортування</span>
          <span className="relative block">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              aria-label="Сортування книг"
              title="Сортування книг"
              className={`w-full appearance-none bg-transparent pr-6 text-sm outline-none cursor-pointer ${text}`}
            >
              <option value="default">За замовчуванням</option>
              <option value="price-asc">Ціна: від дешевших</option>
              <option value="price-desc">Ціна: від дорожчих</option>
              <option value="pages-asc">Обсяг: від менших</option>
              <option value="pages-desc">Обсяг: від більших</option>
            </select>
            <i className={`fas fa-chevron-down text-[10px] pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${muted}`} />
          </span>
        </label>

        <label className={`group lg:col-span-4 block border-b ${line} pb-3 transition-all ${hoverBg} px-1`}>
          <span className={`block text-[10px] uppercase tracking-[0.22em] mb-2 ${muted}`}>Жанр</span>
          <span className="relative block">
            <select
              value={selectedCategory}
              onChange={(event) => {
                if (onCategoryChange) onCategoryChange(event.target.value);
              }}
              aria-label="Фільтр за жанром"
              title="Фільтр за жанром"
              className={`w-full appearance-none bg-transparent pr-6 text-sm outline-none cursor-pointer ${text}`}
            >
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category === 'Всі' ? 'Всі жанри' : category}
                </option>
              ))}
            </select>
            <i className={`fas fa-chevron-down text-[10px] pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${muted}`} />
          </span>
        </label>

        <div className="lg:col-span-9">
          <div className="flex items-end justify-between mb-3">
            <p className={`text-[10px] uppercase tracking-[0.22em] font-black ${muted}`}>Ціна</p>
            <p className={`text-sm tabular-nums font-semibold ${text}`}>{priceMin} — {priceMax} ₴</p>
          </div>
          <div className="relative h-7">
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={priceMin}
              onChange={(event) => setPriceMin(Math.min(Number(event.target.value), priceMax - 50))}
              aria-label="Мінімальна ціна"
              title="Мінімальна ціна"
              className={`range-thin absolute inset-x-0 top-1/2 -translate-y-1/2 ${priceMin > 1000 ? 'z-10' : 'z-20'}`}
            />
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={priceMax}
              onChange={(event) => setPriceMax(Math.max(Number(event.target.value), priceMin + 50))}
              aria-label="Максимальна ціна"
              title="Максимальна ціна"
              className={`range-thin absolute inset-x-0 top-1/2 -translate-y-1/2 ${priceMin > 1000 ? 'z-20' : 'z-10'}`}
            />
          </div>
        </div>

        <div className="lg:col-span-3 flex items-end justify-start lg:justify-end">
          <button
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            aria-label="Показувати лише книги в наявності"
            title="Показувати лише книги в наявності"
            className={`h-11 px-1 text-[10px] uppercase tracking-[0.22em] font-black transition border-b ${line} ${
              onlyAvailable ? (isDarkMode ? 'text-zinc-100' : 'text-zinc-900') : muted
            }`}
          >
            {onlyAvailable ? 'Лише в наявності: Увімкнено' : 'Лише в наявності'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default StorefrontFilters;
