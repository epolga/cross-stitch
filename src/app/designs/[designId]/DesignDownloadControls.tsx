'use client';

import { useEffect, useState } from 'react';
import DownloadPdfLink from '@/app/components/DownloadPdfLink';
import type { Design } from '@/app/types/design';
import styles from '@/app/components/designList.module.css';

type ChartFormat = 'color-symbol' | 'symbol-chart' | 'color-chart';

const chartFormatLabels: Record<ChartFormat, string> = {
  'color-symbol': 'Color & Symbol',
  'symbol-chart': 'Symbol Chart',
  'color-chart': 'Color Chart',
};

const chartFormatNumbers: Record<ChartFormat, string> = {
  'color-symbol': '1',
  'symbol-chart': '3',
  'color-chart': '5',
};

let missingDesignsPromise: Promise<Set<number>> | null = null;
let missingDesignsCache: Set<number> | null = null;

async function loadMissingDesigns(): Promise<Set<number>> {
  if (!missingDesignsPromise) {
    missingDesignsPromise = fetch('/api/missing-design-pdfs', { cache: 'no-store' })
      .then((res) => res.text())
      .then((text) => {
        const set = new Set<number>();
        text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            const [idStr] = line.split(',');
            const id = parseInt(idStr, 10);
            if (!Number.isNaN(id)) set.add(id);
          });
        missingDesignsCache = set;
        console.log('[DesignDownloadControls] MissingDesignPdfs loaded', { count: set.size });
        return set;
      })
      .catch((err) => {
        console.error('[DesignDownloadControls] Failed to load MissingDesignPdfs.txt', err);
        return new Set<number>();
      });
  }
  return missingDesignsPromise;
}

function useMissing(designId: number) {
  const [isMissing, setIsMissing] = useState<boolean>(
    missingDesignsCache ? missingDesignsCache.has(designId) : false,
  );
  const [loaded, setLoaded] = useState<boolean>(Boolean(missingDesignsCache));

  useEffect(() => {
    if (missingDesignsCache) {
      setIsMissing(missingDesignsCache.has(designId));
      setLoaded(true);
      return;
    }
    setLoaded(false);
    loadMissingDesigns().then((set) => {
      setIsMissing(set.has(designId));
      setLoaded(true);
    });
  }, [designId]);

  return { isMissing, loaded };
}

interface Props {
  design: Design;
  align?: 'left' | 'center';
}

export function DesignDownloadControls({ design, align = 'center' }: Props) {
  const [selectedFormat, setSelectedFormat] = useState<ChartFormat>('color-symbol');
  const { isMissing, loaded } = useMissing(design.DesignID);
  const showFormatSelector = loaded && !isMissing;

  useEffect(() => {
    console.log('[DesignDownloadControls] render', {
      designId: design.DesignID,
      isMissing,
      loaded,
      selectedFormat,
    });
  }, [design.DesignID, isMissing, loaded, selectedFormat]);

  const containerClass =
    align === 'center' ? 'text-center w-full' : 'text-left w-full flex flex-col items-start';

  return (
    <div className={containerClass}>
      <div className={`${styles.formatRow} mt-2 mb-2`}>
        {showFormatSelector ? (
          <>
            <label htmlFor={`format-${design.DesignID}`} className="sr-only">
              Select chart format
            </label>
            <select
              id={`format-${design.DesignID}`}
              className={styles.formatSelect}
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ChartFormat)}
            >
              {Object.keys(chartFormatLabels).map((key) => (
                <option key={key} value={key}>
                  {chartFormatLabels[key as ChartFormat]}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div className={styles.formatPlaceholder} aria-hidden="true" />
        )}
      </div>
      <DownloadPdfLink
        design={design}
        className={styles.downloadLink}
        formatLabel={showFormatSelector ? chartFormatLabels[selectedFormat] : undefined}
        formatNumber={showFormatSelector ? chartFormatNumbers[selectedFormat] : undefined}
        isMissing={isMissing}
      />
    </div>
  );
}
