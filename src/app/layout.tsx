import { ReactNode } from 'react';
import Link from 'next/link';
import LoginControl from '@/app/components/LoginControl';
import './globals.css';

export const metadata = {
  title: 'Cross Stitch Designs',
  description: 'Explore thousands of cross-stitch designs with downloadable PDFs',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <nav className="bg-white border-b border-gray-200 py-4 shadow-md" aria-label="Main navigation">
          <div className="container mx-auto px-4 flex items-center space-x-2">
            <Link href="/" className="text-gray-700 hover:text-gray-900 text-xl">
              Home
            </Link>
            <span className="text-gray-500 text-xl">»</span>
            <Link href="/albums" className="text-gray-700 hover:text-gray-900 text-xl">
              To the thematic catalog
            </Link>
            <span className="text-gray-500 text-xl">»</span>
            <div className="ml-auto">
              <LoginControl />
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}