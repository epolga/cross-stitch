import { ReactNode } from 'react';
import '@/lib/global-error-handler';
import Script from 'next/script';
import { getSiteBaseUrl } from '@/lib/url-helper';
import ClientNav from './components/ClientNav';
import PrivacyPolicyFooterLink from './components/PrivacyPolicyFooterLink';
import './globals.css';

export const metadata = {
  title: 'Cross Stitch Designs',
  description: 'Explore thousands of cross-stitch designs with downloadable PDFs',
};

function extractHostname(baseUrl: string): string {
  try {
    // If it includes a scheme, URL() is safe
    const u = new URL(baseUrl);
    return u.hostname;
  } catch {
    // If user ever sets just "cross-stitch.com" (no scheme), fallback:
    return baseUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }
}

function stripWww(hostname: string): string {
  return hostname.replace(/^www\./i, '');
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear();

  const siteBaseUrl = getSiteBaseUrl();
  const siteHost = extractHostname(siteBaseUrl);
  const emailDomain = stripWww(siteHost);
  const supportEmail = `ann@${emailDomain}`;

  return (
    <html lang="en">
      <head>
        <meta name="p:domain_verify" content="2580531f25c20bbb5e2ac0d45872e2b0" />

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
            gtag('config', 'G-J63NFLQTD1');
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

        <footer
          className="bg-white border-t border-gray-200 py-6 px-4 shadow-md text-center text-gray-700 text-sm"
          aria-label="Site footer"
        >
          <div className="container mx-auto">
            <p>Copyright © 2008 - {currentYear}</p>

            <p>
              <a
                href={siteBaseUrl}
                className="text-blue-600 hover:underline"
                aria-label="Open site homepage"
              >
                {siteHost}
              </a>
            </p>

            <p className="mt-2">
              <a
                href={`mailto:${supportEmail}`}
                className="text-blue-600 hover:underline"
                aria-label="Email Ann Logan"
              >
                {supportEmail}
              </a>
            </p>

            <p>Ann Logan</p>
            <p>Krivoklatska 271, Praha, 19900, CZECH REPUBLIC</p>
            <PrivacyPolicyFooterLink />
          </div>
        </footer>
      </body>
    </html>
  );
}
