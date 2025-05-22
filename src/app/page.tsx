import { DesignList } from '@/app/components/DesignList';
import SearchForm from '@/app/components/SearchForm';
import { fetchFilteredDesigns } from '@/lib/DataAccess';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const nPage = parseInt(resolvedSearchParams?.nPage?.toString() || '1', 10);
  const pageSize = parseInt(resolvedSearchParams?.pageSize?.toString() || '20', 10);
  const searchText = resolvedSearchParams?.searchText?.toString() || '';

  const filters = {
    widthFrom: parseInt(resolvedSearchParams?.widthFrom?.toString() || '0', 10),
    widthTo: parseInt(resolvedSearchParams?.widthTo?.toString() || '10000', 10),
    heightFrom: parseInt(resolvedSearchParams?.heightFrom?.toString() || '0', 10),
    heightTo: parseInt(resolvedSearchParams?.heightTo?.toString() || '10000', 10),
    ncolorsFrom: parseInt(resolvedSearchParams?.ncolorsFrom?.toString() || '0', 10),
    ncolorsTo: parseInt(resolvedSearchParams?.ncolorsTo?.toString() || '10000', 10),
    nPage,
    pageSize,
    searchText,
  };

  let designs, totalPages;
  try {
    ({ designs, totalPages } = await fetchFilteredDesigns(filters));
  } catch (error) {
    console.error('Error fetching designs:', error);
    return (
      <div className="p-4">
        <p className="text-red-500">
          Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-48">
          <SearchForm />
        </div>
        <div className="w-full md:flex-1">
          <Suspense fallback={<div>Loading...</div>}>
            <DesignList
              designs={designs}
              page={nPage}
              totalPages={totalPages}
              pageSize={pageSize}
              baseUrl="/"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}