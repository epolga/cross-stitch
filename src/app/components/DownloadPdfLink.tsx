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
  const recordDownload = useCallback(() => {
    void fetch(`/api/designs/${design.DesignID}`, { method: 'POST' }).catch((error) =>
      console.error('Failed to increment download count', error),
    );
  }, [design.DesignID]);

  const handleDownload = useCallback(() => {
    if (!design.PdfUrl) {
      return;
    }

    recordDownload();
    if (typeof window !== 'undefined') {
      window.open(design.PdfUrl, '_blank', 'noopener,noreferrer');
    }
  }, [design.PdfUrl, recordDownload]);

  // Keep auth state updated across same-tab and cross-tab
  useEffect(() => {
    const onAuthChange = () => {
      const newLoggedIn = isUserLoggedIn();
      setLoggedIn(newLoggedIn);

      // If newly logged in and there's a pending download matching this design's URL, trigger it
      if (newLoggedIn && !loggedIn) {
        const pendingDownload = localStorage.getItem('pendingDownload');
        if (pendingDownload && pendingDownload === design.PdfUrl) {
          window.open(pendingDownload, '_blank');
          localStorage.removeItem('pendingDownload');
        }
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') onAuthChange();
    };

    setLoggedIn(isUserLoggedIn());
    window.addEventListener('authStateChange', onAuthChange as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('authStateChange', onAuthChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [loggedIn, design.PdfUrl]);

  // Dispatch event to open registration modal, and store pending download URL
  const openRegister = useCallback(() => {
    if (design.PdfUrl) {
      localStorage.setItem('pendingDownload', design.PdfUrl);
    }
    const designPath = `/designs/${design.DesignID}`;
    const absoluteDesignUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${designPath}`
        : designPath;

    const evt = new CustomEvent('openRegisterModal', {
      detail: {
        source: 'design-download',
        label: `Download attempt for ${design.Caption}`,
        designId: design.DesignID,
        designCaption: design.Caption,
        designUrl: absoluteDesignUrl,
      },
    });
    window.dispatchEvent(evt);
  }, [design.DesignID, design.Caption, design.PdfUrl]);

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
      <button
        type="button"
        onClick={handleDownload}
        className={className ?? 'inline-block text-blue-600 hover:underline'}
        aria-label="Download PDF"
      >
        Download PDF
      </button>
    );
  }

  // 2) Registration required: show register modal if not logged in
  if (mode === 'register') {
    return loggedIn ? (
      <button
        type="button"
        onClick={handleDownload}
        className={className ?? 'inline-block text-blue-600 hover:underline'}
        aria-label="Download PDF"
      >
        Download PDF
      </button>
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
