"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [widthFrom, setWidthFrom] = useState(params.get('widthFrom') || '');
  const [widthTo, setWidthTo] = useState(params.get('widthTo') || '');
  const [heightFrom, setHeightFrom] = useState(params.get('heightFrom') || '');
  const [heightTo, setHeightTo] = useState(params.get('heightTo') || '');
  const [ncolorsFrom, setNColorsFrom] = useState(params.get('ncolorsFrom') || '');
  const [ncolorsTo, setNColorsTo] = useState(params.get('ncolorsTo') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (widthFrom) searchParams.set('widthFrom', widthFrom);
    if (widthTo) searchParams.set('widthTo', widthTo);
    if (heightFrom) searchParams.set('heightFrom', heightFrom);
    if (heightTo) searchParams.set('heightTo', heightTo);
    if (ncolorsFrom) searchParams.set('ncolorsFrom', ncolorsFrom);
    if (ncolorsTo) searchParams.set('ncolorsTo', ncolorsTo);
    router.push(`/designs?${searchParams.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-100 rounded shadow">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Width From</label>
          <input type="number" value={widthFrom} onChange={(e) => setWidthFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Width To</label>
          <input type="number" value={widthTo} onChange={(e) => setWidthTo(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Height From</label>
          <input type="number" value={heightFrom} onChange={(e) => setHeightFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Height To</label>
          <input type="number" value={heightTo} onChange={(e) => setHeightTo(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Colors From</label>
          <input type="number" value={ncolorsFrom} onChange={(e) => setNColorsFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Colors To</label>
          <input type="number" value={ncolorsTo} onChange={(e) => setNColorsTo(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Search
      </button>
    </form>
  );
}
