'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { isUserLoggedIn, resolveDownloadMode, DownloadMode } from './AuthControl';
import { Design } from '../types/design';
//import { CreateDesignUrl } from '@/lib/url-helper';

type Props = {
  design: Design;
  className?: string;
};

export default function DownloadPdfLink({ design, className }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);

  const mode: DownloadMode = useMemo(() => resolveDownloadMode(), []);

  // Keep auth state updated across same-tab and cross-tab
  useEffect(() => {
    const onAuthChange = () => setLoggedIn(isUserLoggedIn());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') setLoggedIn(isUserLoggedIn());
    };

    setLoggedIn(isUserLoggedIn());
    window.addEventListener('authStateChange', onAuthChange as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('authStateChange', onAuthChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Dispatch event to open registration modal
  const openRegister = useCallback(() => {
    const evt = new Event('openRegisterModal');
    window.dispatchEvent(evt);
  }, []);

  // Dispatch event to open PayPal modal (handled elsewhere)
  const openPayPal = useCallback(() => {
    const evt = new CustomEvent('openPayPalModal', { detail: { design } });
    window.dispatchEvent(evt);
  }, [design]);

  if (!design || !design.PdfUrl) {
    return <p className="text-gray-500">PDF is not available for this design.</p>;
  }

  console.log(`DownloadPdfLink: mode = ${mode}, loggedIn = ${loggedIn}`);

  // ===== MODES =====

  // 1) Free download for everyone
  if (mode === 'free') {
    return (
      <a
        href={design.PdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className ?? 'inline-block text-blue-600 hover:underline'}
        aria-label="Download PDF"
      >
        Download PDF
      </a>
    );
  }

  // 2) Registration required: show register modal if not logged in
  if (mode === 'register') {
    return loggedIn ? (
      <a
        href={design.PdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className ?? 'inline-block text-blue-600 hover:underline'}
        aria-label="Download PDF"
      >
        Download PDF
      </a>
    ) : (
      <button
        onClick={openRegister}
        className={className ?? 'inline-block text-blue-600 hover:underline'}
        aria-label="Open register form"
        type="button"
      >
        Download PDF
      </button>
    );
  }

  // 3) Paid mode: open PayPal modal
  return (
    <button
      onClick={openPayPal}
      className={className ?? 'inline-block text-blue-600 hover:underline'}
      aria-label="Open PayPal checkout"
      type="button"
    >
      Download PDF
    </button>
  );
}
