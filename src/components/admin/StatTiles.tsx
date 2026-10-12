import React from 'react';

/** A row of plain number tiles, the one stat style used across the admin panel. */
export default function StatTiles({ items }: { items: { label: string; value: React.ReactNode; hint?: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
      {items.map(item => (
        <div key={item.label} className="rounded-xl border bg-white px-4 py-3">
          <dt className="text-sm text-gray-500">{item.label}</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-gray-900">{item.value}</dd>
          {item.hint && <dd className="text-xs text-gray-500">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
