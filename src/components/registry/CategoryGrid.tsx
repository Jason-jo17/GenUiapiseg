'use client';

import { CATEGORY_ICONS } from '@/lib/public-apis-data';

interface CategoryItem {
  name: string;
  count: number;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  highlight?: string | null;
  total: number;
}

export function CategoryGrid({ categories, highlight, total }: CategoryGridProps) {
  return (
    <div className="category-grid-card">
      <div className="category-grid-card__header">
        <h3>Browse by Category</h3>
        <span className="category-grid-card__total">{total} APIs total</span>
      </div>
      <div className="category-grid">
        {categories.map(cat => (
          <button
            key={cat.name}
            className={`category-tile ${highlight === cat.name ? 'category-tile--active' : ''}`}
            onClick={() => window.dispatchEvent(new CustomEvent('genui:browse-category', { detail: { category: cat.name } }))}
          >
            <span className="category-tile__icon">{CATEGORY_ICONS[cat.name] ?? '🔗'}</span>
            <span className="category-tile__name">{cat.name}</span>
            <span className="category-tile__count">{cat.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
