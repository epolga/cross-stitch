"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const [widthFrom, setWidthFrom] = useState(params.get('widthFrom') || '');
  const [widthTo, setWidthTo] = useState(params.get('widthTo') || '');
  const [heightFrom, setHeightFrom] = useState(params.get('heightFrom') || '');
  const [heightTo, setHeightTo] = useState(params.get('heightTo') || '');
  const [ncolorsFrom, setNColorsFrom] = useState(params.get('ncolorsFrom') || '');
  const [ncolorsTo, setNColorsTo] = useState(params.get('ncolorsTo') || '');
  const [searchText, setSearchText] = useState(params.get('searchText') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (widthFrom) searchParams.set('widthFrom', widthFrom);
    if (widthTo) searchParams.set('widthTo', widthTo);
    if (heightFrom) searchParams.set('heightFrom', heightFrom);
    if (heightTo) searchParams.set('heightTo', heightTo);
    if (ncolorsFrom) searchParams.set('ncolorsFrom', ncolorsFrom);
    if (ncolorsTo) searchParams.set('ncolorsTo', ncolorsTo);
    if (searchText) searchParams.set('searchText', searchText);
    router.push(`/?${searchParams.toString()}`);
    setIsOpen(false); // Close form on submit
  };

  const handleReset = () => {
    setWidthFrom('');
    setWidthTo('');
    setHeightFrom('');
    setHeightTo('');
    setNColorsFrom('');
    setNColorsTo('');
    setSearchText('');
    router.push('/');
    setIsOpen(false); // Close form on reset
  };

  const toggleForm = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Hamburger Icon (visible on mobile, hidden on desktop) */}
      <button
        type="button"
        onClick={toggleForm}
        className="md:hidden p-2 bg-gray-600 text-white rounded focus:outline-none"
        aria-label="Toggle search form"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Form (hidden on mobile when isOpen is false, always visible on desktop) */}
      <form
        onSubmit={handleSubmit}
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block mb-4 p-4 bg-gray-100 rounded shadow min-w-0 fixed md:static top-0 left-0 w-full md:w-auto h-auto z-50 md:z-auto`}
      >
        {/* Close Button (visible on mobile when form is open) */}
        <button
          type="button"
          onClick={toggleForm}
          className="md:hidden absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          aria-label="Close search form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium">Text Search</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Width From</label>
            <input
              type="number"
              value={widthFrom}
              onChange={(e) => setWidthFrom(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Width To</label>
            <input
              type="number"
              value={widthTo}
              onChange={(e) => setWidthTo(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Height From</label>
            <input
              type="number"
              value={heightFrom}
              onChange={(e) => setHeightFrom(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Height To</label>
            <input
              type="number"
              value={heightTo}
              onChange={(e) => setHeightTo(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Colors From</label>
            <input
              type="number"
              value={ncolorsFrom}
              onChange={(e) => setNColorsFrom(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Colors To</label>
            <input
              type="number"
              value={ncolorsTo}
              onChange={(e) => setNColorsTo(e.target.value)}
              className="w-full border rounded px-0.5 py-0.5 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
            Search
          </button>
          <button type="button" onClick={handleReset} className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm">
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}