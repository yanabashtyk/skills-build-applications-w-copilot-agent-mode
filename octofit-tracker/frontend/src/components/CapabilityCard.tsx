import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  loadItems: () => Promise<T[]>;
  emptyMessage: string;
  renderItems: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, loadItems, emptyMessage, renderItems }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadItems()
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('Unexpected API response');
        if (active) setItems(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      });
    return () => { active = false; };
  }, [loadItems]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : renderItems(items)}
      </div>
    </section>
  );
}
