"use client";

import { useRouter } from "next/navigation";

interface PaginationControlProps {
  page: number;
  totalPages: number;
  pageSize: number;
  baseUrl?: string; // New prop for dynamic URL base
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
    <div className="flex items-center space-x-4">
      <label htmlFor="pageSize" className="text-lg">Items per page:</label>
      <select
        id="pageSize"
        value={pageSize}
        onChange={(e) => updateUrl(e.target.value, 1)} // Reset to page 1 on pageSize change
        className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <p>Page {page} of {totalPages}</p>
      {page > 1 && (
        <button
          onClick={() => updateUrl(undefined, page - 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Previous
        </button>
      )}
      {page < totalPages && (
        <button
          onClick={() => updateUrl(undefined, page + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next
        </button>
      )}
    </div>
  );
}