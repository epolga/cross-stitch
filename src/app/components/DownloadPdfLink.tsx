'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  isUserLoggedIn,
  resolveDownloadMode,
  fetchRuntimeDownloadMode,
  DownloadMode,
} from './AuthControl';
import { Design } from '../types/design';
//import { CreateDesignUrl } from '@/lib/url-helper';

type Props = {
  design: Design;
  className?: string;
  formatLabel?: string;
  formatNumber?: string;
  isMissing?: boolean;
};

type SubscriptionStatusResponse = {
  active?: boolean;
};

const PDF_BASE = 'https://d2o1uvvg91z7o4.cloudfront.net/pdfs';

export default function DownloadPdfLink({ design, className, formatLabel, formatNumber, isMissing }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [referrerBypass, setReferrerBypass] = useState(false);
  const [isCheckingPaidAccess, setIsCheckingPaidAccess] = useState(false);

  const [mode, setMode] = useState<DownloadMode>(() => resolveDownloadMode());

  useEffect(() => {
    let isMounted = true;

    const loadRuntimeMode = async (): Promise<void> => {
      const runtimeMode = await fetchRuntimeDownloadMode();
      if (isMounted) {
        setMode(runtimeMode);
      }
    };

    void loadRuntimeMode();

    return () => {
      isMounted = false;
    };
  }, []);

  const recordDownload = useCallback(() => {
    void fetch(`/api/designs/${design.DesignID}`, { method: 'POST' }).catch((error) =>
      console.error('Failed to increment download count', error),
    );
  }, [design.DesignID]);

  const fallbackPdfUrl = useMemo(() => {
    if (!design?.AlbumID || !design?.DesignID) return null;
    const chosenNumber = formatNumber || '1';
    return `${PDF_BASE}/${design.AlbumID}/${design.DesignID}/Stitch${design.DesignID}_${chosenNumber}_Kit.pdf`;
  }, [design.AlbumID, design.DesignID, formatNumber]);

  const resolvedPdfUrl = useMemo(() => {
    if (isMissing === true) {
      // Listed in MissingDesignPdfs.txt -> keep legacy link if present
      return design.PdfUrl ?? fallbackPdfUrl ?? null;
    }
    if (isMissing === false) {
      // Not listed -> use new per-format path
      return fallbackPdfUrl ?? design.PdfUrl ?? null;
    }
    // Unknown yet: default to existing link to avoid surprises
    return design.PdfUrl ?? fallbackPdfUrl ?? null;
  }, [design.PdfUrl, fallbackPdfUrl, isMissing]);

  useEffect(() => {
    console.log('[DownloadPdfLink] init', {
      designId: design.DesignID,
      albumId: design.AlbumID,
      pdfUrl: design.PdfUrl,
      fallbackPdfUrl,
      resolvedPdfUrl,
      formatLabel,
      formatNumber,
      isMissing,
    });
  }, [design.DesignID, design.AlbumID, design.PdfUrl, fallbackPdfUrl, resolvedPdfUrl, formatLabel, formatNumber, isMissing]);

  const handleDownload = useCallback(() => {
    if (!resolvedPdfUrl) {
      console.warn('[DownloadPdfLink] no resolvedPdfUrl', {
        designId: design.DesignID,
        albumId: design.AlbumID,
        formatNumber,
      });
      return;
    }

    console.log('[DownloadPdfLink] handleDownload', {
      designId: design.DesignID,
      albumId: design.AlbumID,
      resolvedPdfUrl,
      formatLabel,
      formatNumber,
    });

    recordDownload();
    if (typeof window !== 'undefined') {
      window.open(resolvedPdfUrl, '_blank', 'noopener,noreferrer');
    }
  }, [
    design.AlbumID,
    design.DesignID,
    formatLabel,
    formatNumber,
    recordDownload,
    resolvedPdfUrl,
  ]);

  // Keep auth state updated across same-tab and cross-tab
  useEffect(() => {
    const onAuthChange = () => {
      const newLoggedIn = isUserLoggedIn();
      setLoggedIn(newLoggedIn);

      // If newly logged in and there's a pending download matching this design's URL, trigger it
      if (newLoggedIn && !loggedIn) {
        const pendingDownload = localStorage.getItem('pendingDownload');
        if (pendingDownload && pendingDownload === resolvedPdfUrl) {
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
  }, [loggedIn, resolvedPdfUrl]);

  // Dispatch event to open registration modal, and store pending download URL
  const openRegister = useCallback(() => {
    if (resolvedPdfUrl) {
      localStorage.setItem('pendingDownload', resolvedPdfUrl);
    }
    const designPath = `/designs/${design.DesignID}`;
    const absoluteDesignUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${designPath}`
        : designPath;

    const evt = new CustomEvent('openRegisterModal', {
      detail: {
        source: 'design-download',
        label: `Download attempt for ${design.Caption}${formatLabel ? ` (${formatLabel})` : ''}`,
        designId: design.DesignID,
        designCaption: design.Caption,
        designUrl: absoluteDesignUrl,
      },
    });
    window.dispatchEvent(evt);
  }, [design.DesignID, design.Caption, resolvedPdfUrl, formatLabel]);

  // Dispatch event to open PayPal modal (handled elsewhere)
  const openPayPal = useCallback(() => {
    const evt = new CustomEvent('openPayPalModal', { detail: { design } });
    window.dispatchEvent(evt);
  }, [design]);

  const hasActiveSubscriptionForCurrentUser = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const email = (localStorage.getItem('userEmail') || '').trim().toLowerCase();
    if (!email) return false;

    try {
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as SubscriptionStatusResponse | null;

      return response.ok && data?.active === true;
    } catch (error) {
      console.error('[DownloadPdfLink] failed to check subscription status', error);
      return false;
    }
  }, []);

  const handlePaidClick = useCallback(async () => {
    if (!loggedIn) {
      openPayPal();
      return;
    }

    setIsCheckingPaidAccess(true);
    try {
      const hasActiveSubscription = await hasActiveSubscriptionForCurrentUser();
      if (hasActiveSubscription) {
        handleDownload();
        return;
      }
      openPayPal();
    } finally {
      setIsCheckingPaidAccess(false);
    }
  }, [loggedIn, openPayPal, hasActiveSubscriptionForCurrentUser, handleDownload]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const ref = document.referrer.toLowerCase();
    const allow =
      ref.includes('allcraftsblogs.com') || ref.includes('allcrafts.allcraftsblogs.com');
    setReferrerBypass(allow);
  }, []);

  if (!design || !resolvedPdfUrl) {
    return <p className="text-gray-500">PDF is not available for this design.</p>;
  }

  const downloadLabel = 'Download PDF';
  const labelContent = <span>Download PDF</span>;

  console.log(
    `DownloadPdfLink: mode = ${mode}, loggedIn = ${loggedIn}, format = ${formatLabel ?? 'default'}, formatNumber = ${formatNumber ?? 'default'}, url = ${resolvedPdfUrl}`,
  );

  // ===== MODES =====

  // 1) Free download for everyone
  if (mode === 'free') {
    return (
      <button
        type="button"
        onClick={handleDownload}
        className={className ?? 'inline-block text-gray-600 text-sm leading-tight underline cursor-pointer'}
        aria-label={downloadLabel}
      >
        {labelContent}
      </button>
    );
  }

  // 2) Registration required: show register modal if not logged in
  if (mode === 'register') {
    const allowDirectDownload = loggedIn || referrerBypass;

    return allowDirectDownload ? (
      <button
        type="button"
        onClick={handleDownload}
        className={className ?? 'inline-block text-gray-600 text-sm leading-tight underline cursor-pointer'}
        aria-label={downloadLabel}
      >
        {labelContent}
      </button>
    ) : (
      <button
        onClick={openRegister}
        className={className ?? 'inline-block text-gray-600 text-sm leading-tight underline cursor-pointer'}
        aria-label="Open register form"
        type="button"
      >
        {labelContent}
      </button>
    );
  }

  // 3) Paid mode: open PayPal modal
  return (
    <button
      onClick={() => {
        void handlePaidClick();
      }}
      className={className ?? 'inline-block text-gray-600 text-sm leading-tight underline cursor-pointer'}
      aria-label="Open PayPal checkout"
      type="button"
      disabled={isCheckingPaidAccess}
    >
      {labelContent}
    </button>
  );
}
