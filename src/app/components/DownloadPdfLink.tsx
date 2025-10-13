'use client';

import { useEffect, useState, useCallback } from 'react';
import { isUserLoggedIn } from './AuthControl';

type Props = {
  pdfUrl?: string | null;
  caption: string;
  className?: string;
};

export default function DownloadPdfLink({ pdfUrl, caption, className }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);

  // keep state in sync across same-tab + cross-tab changes
  useEffect(() => {
    setLoggedIn(isUserLoggedIn());

    const onAuthChange = () => setLoggedIn(isUserLoggedIn());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') setLoggedIn(e.newValue === 'true');
    };

    window.addEventListener('authStateChange', onAuthChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('authStateChange', onAuthChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const openRegister = useCallback(() => {
    const evt = new Event('openRegisterModal');
    window.dispatchEvent(evt);
  }, []);

  if (!pdfUrl) {
    return <p className="text-gray-500 mb-4">PDF not available</p>;
  }

  return loggedIn ? (
    <a
      href={pdfUrl}
      className={className ?? 'inline-block text-blue-600 hover:underline'}
      download
      aria-label={`Download PDF for ${caption}`}
    >
      Download PDF
    </a>
  ) : (
    <button
      onClick={openRegister}
      className={className ?? 'inline-block text-blue-600 hover:underline'}
      aria-label="Open register form"
    >
      Download PDF
    </button>
  );
}
