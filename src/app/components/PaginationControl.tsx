"use client";

import { useRouter } from "next/navigation";
import Image from 'next/image';
import styles from './paginationControl.module.css';

interface PaginationControlProps {
  page: number;
  totalPages: number;
  pageSize: number;
  baseUrl?: string;
}

export default function PaginationControl({ page, totalPages, pageSize, baseUrl = "/" }: PaginationControlProps) {
  const router = useRouter();
  const pageSizeOptions = [10, 20, 50];

  const updateUrl = (newPageSize?: string, newPage?: number) => {
    const params = new URLSearchParams({
      pageSize: newPageSize || pageSize.toString(),
      nPage: (newPage !== undefined ? newPage : page).toString(),
    });
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <div className={styles.pagination}>
      <label htmlFor="pageSize" className={styles.label}>Items per page:</label>
      <select
        id="pageSize"
        value={pageSize}
        onChange={(e) => updateUrl(e.target.value, 1)}
        className={styles.select}
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <p>Page {page} of {totalPages}</p>

      <button
        onClick={() => updateUrl(undefined, 1)}
        className={`${styles.button} ${page === 1 ? styles.disabled : ''}`}
        aria-label="First page"
        title="First page"
        disabled={page === 1}
      >
        <Image
          src="/arrow-start-left-icon.svg"
          alt=""
          width={16}
          height={16}
          className={styles.icon}
          aria-hidden="true"
        />
      </button>

      <button
        onClick={() => updateUrl(undefined, page - 1)}
        className={`${styles.button} ${page === 1 ? styles.disabled : ''}`}
        aria-label="Previous page"
        title="Previous page"
        disabled={page === 1}
      >
        <Image
          src="/angle-circle-left-icon.svg"
          alt=""
          width={32}
          height={32}
          className={styles.icon}
          aria-hidden="true"
        />
      </button>

      <button
        onClick={() => updateUrl(undefined, page + 1)}
        className={`${styles.button} ${page === totalPages ? styles.disabled : ''}`}
        aria-label="Next page"
        title="Next page"
        disabled={page === totalPages}
      >
        <Image
          src="/angle-circle-right-icon.svg"
          alt=""
          width={32}
          height={32}
          className={styles.icon}
          aria-hidden="true"
        />
      </button>

      <button
        onClick={() => updateUrl(undefined, totalPages)}
        className={`${styles.button} ${page === totalPages ? styles.disabled : ''}`}
        aria-label="Last page"
        title="Last page"
        disabled={page === totalPages}
      >
        <Image
          src="/arrow-end-right-icon.svg"
          alt=""
          width={16}
          height={16}
          className={styles.icon}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
