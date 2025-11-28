import { ReactNode } from 'react';
import Script from 'next/script';
import ClientNav from './components/ClientNav';
import './globals.css';

export const metadata = {
  title: 'Cross Stitch Designs',
  description: 'Explore thousands of cross-stitch designs with downloadable PDFs',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <head>
        {/* Google Analytics Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-232D0Z4TWB`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-232D0Z4TWB');
          `}
        </Script>
        {/* Google AdSense Script */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8273546332414099"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-black">
        <ClientNav />
        <main className="flex-grow">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 px-4 shadow-md text-center text-gray-700 text-sm" aria-label="Site footer">
          <div className="container mx-auto">
            <p>Copyright © 2008 - {currentYear}</p>
            <p>cross-stitch-pattern.net</p>
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