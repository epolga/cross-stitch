import { DesignList } from '@/app/components/DesignList';
import SearchForm from '@/app/components/SearchForm';
import { fetchFilteredDesigns } from '@/app/utils/DataAccess';
import { Suspense } from 'react';

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams; // Await the Promise
  const nPage = parseInt(resolvedSearchParams?.nPage?.toString() || '1', 10);
  const pageSize = parseInt(resolvedSearchParams?.pageSize?.toString() || '20', 10);

  const filters = {
    widthFrom: parseInt(resolvedSearchParams?.widthFrom?.toString() || '0', 10),
    widthTo: parseInt(resolvedSearchParams?.widthTo?.toString() || '10000', 10),
    heightFrom: parseInt(resolvedSearchParams?.heightFrom?.toString() || '0', 10),
    heightTo: parseInt(resolvedSearchParams?.heightTo?.toString() || '10000', 10),
    ncolorsFrom: parseInt(resolvedSearchParams?.ncolorsFrom?.toString() || '0', 10),
    ncolorsTo: parseInt(resolvedSearchParams?.ncolorsTo?.toString() || '10000', 10),
    nPage,
    pageSize,
  };
  
  const { designs, totalPages } = await fetchFilteredDesigns(filters);

  return (
    <div className="p-4">
      <SearchForm />
      <Suspense fallback={<div>Loading...</div>}>
        <DesignList
          designs={designs}
          page={nPage}
          totalPages={totalPages}
          pageSize={pageSize}
          baseUrl="/designs"
        />
      </Suspense>
    </div>
  );
}