import { ReactNode } from 'react';
import Link from 'next/link';
import AuthControl from '@/app/components/AuthControl';
import './globals.css';

export const metadata = {
  title: 'Cross Stitch Designs',
  description: 'Explore thousands of cross-stitch designs with downloadable PDFs',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 flex flex-col">
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
              <AuthControl/>
            </div>
          </div>
        </nav>
        <main className="flex-grow">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 px-4 shadow-md text-center text-gray-700 text-sm" aria-label="Site footer">
          <div className="container mx-auto">
            <p>Copyright © 2008 - {currentYear}</p>
            <p>www.cross-stitch-pattern.net</p>
            <p className="mt-2">
              <a
                href="mailto:ann@cross-stitch-pattern.net"
                className="text-blue-600 hover:underline"
                aria-label="Email Ann Logan"
              >
                ann@cross-stitch-pattern.net
              </a>
            </p>
            <p>Ann Logan</p>
            <p>Krivoklatska 271, Praha, 19900, CZECH REPUBLIC</p>
          </div>
        </footer>
      </body>
    </html>
  );
}