import { getSnapshot } from '@/lib/public-apis-data';
import { ApiCard } from '@/components/registry/ApiCard';

// Categories are a fixed, small set derived from the bundled snapshot at build
// time, so pre-render them instead of hitting the server on every request.
export function generateStaticParams() {
  const categories = new Set(getSnapshot().map(a => a.category));
  return Array.from(categories).map(category => ({ category: encodeURIComponent(category) }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const apis = getSnapshot().filter(a => a.category === category);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">{category} APIs</h1>
        <p className="page-description">
          Found {apis.length} public APIs in this category.
        </p>
      </header>

      {apis.length === 0 ? (
        <div className="empty-state">
          <h3>No APIs found</h3>
          <p>We couldn't find any APIs matching this category.</p>
        </div>
      ) : (
        <ApiCard entries={apis} totalCount={apis.length} category={category} />
      )}
    </div>
  );
}
