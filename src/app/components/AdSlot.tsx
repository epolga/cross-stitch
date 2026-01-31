'use client';

import { useEffect, type CSSProperties } from 'react';

type Props = {
  slot: string;
  className?: string;
  minHeight?: number;
  minHeightDesktop?: number;
};

const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? 'ca-pub-8273546332414099';

export default function AdSlot({
  slot,
  className,
  minHeight = 250,
  minHeightDesktop,
}: Props) {
  useEffect(() => {
    if (!slot || !ADSENSE_CLIENT_ID) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('[AdSlot] adsbygoogle push failed', error);
    }
  }, [slot]);

  const style = {
    '--ad-min-height': `${minHeight}px`,
    ...(minHeightDesktop ? { '--ad-min-height-md': `${minHeightDesktop}px` } : {}),
  } as CSSProperties;

  return (
    <ins
      className={`adsbygoogle ad-slot ${className ?? ''}`.trim()}
      style={style}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
