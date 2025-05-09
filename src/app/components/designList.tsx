import Image from 'next/image';
import Link from 'next/link';
import PaginationControl from './paginationControl'; // Adjust path if needed
import styles from './designList.module.css';
import type { Design } from '@/app/types/design';

interface DesignListProps {
  designs: Design[];
  page: number;
  totalPages: number;
  pageSize: number;
  caption?: string;
  baseUrl?: string;
  className?: string;
}

export function DesignList({
  designs,
  page,
  totalPages,
  pageSize,
  caption,
  baseUrl,
  className,
}: DesignListProps) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {caption && <h2 className={styles.caption}>{caption}</h2>}
      <div className={styles.pagination}>
        <PaginationControl
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          baseUrl={baseUrl}
        />
      </div>
      {designs.length === 0 ? (
        <p className="text-gray-500">No designs found.</p>
      ) : (
        <div className={styles.grid}>
          {designs.map((design) => (
            <div
              key={`${design.AlbumID}-${design.DesignID}`}
              className={styles.card}
            >
              <Link href={`/designs/${design.DesignID}`}>
                <div className="text-center">
                  {design.ImageUrl ? (
                    <div className="w-[100px] h-[100px] mx-auto flex items-center justify-center">
                      <Image
                        src={design.ImageUrl}
                        alt={design.Caption}
                        width={100}
                        height={100}
                        className="max-w-[100px] max-h-[100px] object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-[100px] h-[100px] mx-auto bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                  )}
                  <div className="w-full mt-2">
                    <h3 className="text-lg font-semibold truncate">{design.Caption}</h3>
                  </div>
                </div>
              </Link>
              <div className="w-full mt-2 text-center">
                {design.PdfUrl ? (
                  <a
                    href={design.PdfUrl}
                    className="inline-block text-blue-600 hover:underline w-full"
                    download
                  >
                    Download PDF 
                  </a>
                ) : (
                  <p className="text-gray-500">PDF not available {design.DesignID}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={styles.pagination}>
        <PaginationControl
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          baseUrl={baseUrl}
        />
      </div>
    </div>
  );
}