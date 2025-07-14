'use client';

import { useState, useEffect } from 'react';
import { DesignList } from './DesignList';
import type { Design } from '@/app/types/design';

interface DesignListWrapperProps {
  designs: Design[];
  page: number;
  totalPages: number;
  pageSize: number;
  baseUrl?: string;
  caption?: string;
  className?: string;
}

export function DesignListWrapper({
  designs,
  page,
  totalPages,
  pageSize,
  baseUrl,
  caption,
  className,
}: DesignListWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated || false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <DesignList
      designs={designs}
      page={page}
      totalPages={totalPages}
      pageSize={pageSize}
      baseUrl={baseUrl}
      caption={caption}
      className={className}
      isLoggedIn={isLoggedIn}
    />
  );
}