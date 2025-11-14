'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthControl } from '@/app/components/AuthControl';

export default function ClientNav() {
  const [isArticlesOpen, setIsArticlesOpen] = useState(false);

  return (
    <nav
      className="bg-white border-b border-gray-200 py-4 shadow-md"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 flex items-center space-x-2">
        <Link href="/" className="text-gray-700 hover:text-gray-900 text-xl">
          Home
        </Link>
        <span className="text-gray-500 text-xl">»</span>
        <Link href="/albums" className="text-gray-700 hover:text-gray-900 text-xl">
          To the thematic catalog
        </Link>
        <span className="text-gray-500 text-xl">»</span>
        <div className="relative">
          <button
            onClick={() => setIsArticlesOpen(!isArticlesOpen)}
            className="text-gray-700 hover:text-gray-900 text-xl focus:outline-none"
          >
            Articles
          </button>
          {isArticlesOpen && (
            <div
              style={{ width: '256px' }}
              className="absolute left-0 mt-2 w-128 bg-white border border-gray-200 rounded-md shadow-lg z-10"
            >
              <Link
                href="/EmbroideryHistory.aspx"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsArticlesOpen(false)}
              >
                The History of Embroidery
              </Link>
              <hr />
              <Link
                href="/WhyCrossStitch"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsArticlesOpen(false)}
              >
                Why Cross-Stitch?
              </Link>
              <hr />
              <Link
                href="/Article070409.aspx"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsArticlesOpen(false)}
              >
                Men and Cross-Stitch
              </Link>
              <hr />
              <Link
                href="/exercises"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsArticlesOpen(false)}
              >
                Exercises for cross-stitchers
              </Link>
            </div>
          )}
        </div>
        <div className="ml-auto">
          <AuthControl />
        </div>
      </div>
    </nav>
  );
}
