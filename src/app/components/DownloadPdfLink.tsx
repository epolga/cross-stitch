'use client';

import { useEffect, useState, useCallback } from 'react';
import { isUserLoggedIn } from './AuthControl';
import { Design } from '../types/design';
import { CreateDesignUrl } from '@/lib/url-helper';
type Props = {
  design: Design;
  className?: string;
};

export default function DownloadPdfLink({ design, className }: Props) {
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

  if (! design || !design.PdfUrl) {
    return <p className="text-gray-500 mb-4">PDF not available</p>;
  }

  return loggedIn || 2===2 ? (
    <a
      href={design.PdfUrl}
      className={className ?? 'inline-block text-blue-600 hover:underline'}
      download
      aria-label={`Download PDF for ${design.Caption}`}
      onClick={async () => {
        
      const baseUrl = 'https://www.cross-stitch-pattern.net';
     
      const notifyAdmin = async () => {
        try {
          console.log('Design PDF download initiated for', design.Caption); 
           

          const response = await fetch('/api/notify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: `Design Download: ${design.Caption}`, message: `User downloaded design ${baseUrl}/${CreateDesignUrl(design)}` })
          });
          if (response.ok) {
            console.log('Admin notified of design download.');
          } else {
            throw new Error(`API response not OK: ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to send email notification to admin:', error);
        }
      };
      
      notifyAdmin();
    }}
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
