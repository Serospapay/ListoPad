import React, { useState } from 'react';

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
  minYear: number;
  setMinYear: (value: number) => void;
  maxYear: number;
  setMaxYear: (value: number) => void;
  minRating: number;
  setMinRating: (value: number) => void;
  publisherQuery: string;
  setPublisherQuery: (value: string) => void;
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
  minYear,
  setMinYear,
  maxYear,
  setMaxYear,
  minRating,
  setMinRating,
  publisherQuery,
  setPublisherQuery,
  onlyAvailable,
  setOnlyAvailable,
  resetFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const text = isDarkMode ? 'text-zinc-200' : 'text-zinc-800';
  const line = isDarkMode ? 'border-zinc-800/90' : 'border-zinc-200';
  const panel = isDarkMode ? 'bg-zinc-950/55 border-zinc-800/80' : 'bg-white/80 border-stone-200';
  const fieldBg = isDarkMode ? 'bg-zinc-900/45 hover:bg-zinc-900/70' : 'bg-stone-50/80 hover:bg-stone-100/90';
  const inputClass = `w-full bg-transparent outline-none text-sm placeholder:opacity-50 ${text}`;
  const selectClass = `catalog-select w-full appearance-none bg-transparent pr-7 text-sm outline-none cursor-pointer ${text}`;

  return (
    <section className={`catalog-filters ${isDarkMode ? 'theme-dark' : 'theme-light'} py-2 md:py-3`}>
      <div className={`border rounded-2xl p-3 md:p-4 ${panel}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-[10px] uppercase tracking-[0.22em] font-black ${muted}`}>Фільтри каталогу</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`h-8 px-3 rounded-lg text-[10px] uppercase tracking-[0.16em] font-black border transition ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500' : 'border-stone-300 text-stone-700 hover:text-stone-900 hover:border-stone-500'}`}
            >
              {showAdvanced ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className={`h-8 px-3 rounded-lg text-[10px] uppercase tracking-[0.16em] font-black border transition ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500' : 'border-stone-300 text-stone-700 hover:text-stone-900 hover:border-stone-500'}`}
            >
              Скинути
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <label className={`group lg:col-span-5 block border ${line} ${fieldBg} rounded-xl p-3 transition-colors`}>
            <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 ${muted}`}>Пошук</span>
            <span className="flex items-center gap-2.5">
              <i className={`fas fa-search text-xs ${muted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Назва, автор, ISBN…"
                autoComplete="off"
                className={inputClass}
              />
            </span>
          </label>

          <label className={`group lg:col-span-3 block border ${line} ${fieldBg} rounded-xl p-3 transition-colors`}>
            <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 ${muted}`}>Сортування</span>
            <span className="relative block">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                aria-label="Сортування книг"
                title="Сортування книг"
                className={selectClass}
              >
                <option value="default">За замовчуванням</option>
                <option value="price-asc">Ціна: від дешевших</option>
                <option value="price-desc">Ціна: від дорожчих</option>
                <option value="pages-asc">Обсяг: від менших</option>
                <option value="pages-desc">Обсяг: від більших</option>
              </select>
              <i className={`fas fa-chevron-down text-[10px] pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${muted}`} />
            </span>
          </label>

          <label className={`group lg:col-span-4 block border ${line} ${fieldBg} rounded-xl p-3 transition-colors`}>
            <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 ${muted}`}>Жанр</span>
            <span className="relative block">
              <select
                value={selectedCategory}
                onChange={(event) => {
                  if (onCategoryChange) onCategoryChange(event.target.value);
                }}
                aria-label="Фільтр за жанром"
                title="Фільтр за жанром"
                className={selectClass}
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'Всі' ? 'Всі жанри' : category}
                  </option>
                ))}
              </select>
              <i className={`fas fa-chevron-down text-[10px] pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${muted}`} />
            </span>
          </label>
        </div>

        {showAdvanced && (
          <div className={`mt-3 pt-3 border-t ${line}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className={`lg:col-span-8 border ${line} ${fieldBg} rounded-xl p-3`}>
                <div className="flex items-end justify-between mb-2">
                  <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${muted}`}>Ціна</p>
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

              <div className={`lg:col-span-4 border ${line} ${fieldBg} rounded-xl p-3 flex items-center justify-center`}>
                <button
                  type="button"
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  aria-label="Показувати лише книги в наявності"
                  title="Показувати лише книги в наявності"
                  className={`h-10 px-2 text-[10px] uppercase tracking-[0.18em] font-black transition ${
                    onlyAvailable ? (isDarkMode ? 'text-zinc-100' : 'text-zinc-900') : muted
                  }`}
                >
                  {onlyAvailable ? 'Лише в наявності: Увімкнено' : 'Лише в наявності'}
                </button>
              </div>

              <label className={`group lg:col-span-5 block border ${line} ${fieldBg} rounded-xl p-3 transition-colors`}>
                <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 ${muted}`}>Видавництво</span>
                <input
                  type="text"
                  value={publisherQuery}
                  onChange={(event) => setPublisherQuery(event.target.value)}
                  placeholder="Пошук за видавництвом..."
                  className={inputClass}
                />
              </label>

              <label className={`group lg:col-span-4 block border ${line} ${fieldBg} rounded-xl p-3 transition-colors`}>
                <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 ${muted}`}>Рік видання</span>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="number"
                    value={minYear}
                    onChange={(event) => setMinYear(Number(event.target.value || 0))}
                    placeholder="Від"
                    className={inputClass}
                  />
                  <span className={muted}>—</span>
                  <input
                    type="number"
                    value={maxYear}
                    onChange={(event) => setMaxYear(Number(event.target.value || 0))}
                    placeholder="До"
                    className={inputClass}
                  />
                </div>
              </label>

              <label className={`group lg:col-span-3 block border ${line} ${fieldBg} rounded-xl p-3 transition-colors`}>
                <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 ${muted}`}>Рейтинг від</span>
                <select
                  value={minRating}
                  onChange={(event) => setMinRating(Number(event.target.value))}
                  className={selectClass}
                >
                  <option value={0}>Будь-який</option>
                  <option value={3.5}>3.5</option>
                  <option value={4}>4.0</option>
                  <option value={4.5}>4.5</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StorefrontFilters;
