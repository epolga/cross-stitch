import Head from 'next/head';
import { DesignList } from '@/app/components/designList'; // Adjust path
import type { DesignsResponse } from '@/app/types/design';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const pageSize = parseInt(resolvedSearchParams.pageSize as string || '10');
  const page = parseInt(resolvedSearchParams.nPage as string || '1');

  let designsResponse: DesignsResponse;
  try {
    const response = await fetch(
      `http://localhost:3000/api/designs?pageSize=${pageSize}&nPage=${page}`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch designs: ${response.statusText}`);
    }
    designsResponse = await response.json();
  } catch (error) {
    console.error('Error fetching designs:', error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Cross Stitch Designs</h1>
        <p className="text-red-500">
          Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const { designs, entryCount, page: currentPage, totalPages } = designsResponse;

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Cross Stitch Designs</title>
        <meta name="description" content="Explore 6,000 cross-stitch designs with downloadable PDFs" />
        <meta name="keywords" content="cross stitch, designs, patterns, PDFs" />
        <meta property="og:title" content="Cross Stitch Designs" />
        <meta property="og:description" content="Explore 6,000 cross-stitch designs with downloadable PDFs" />
        <meta property="og:image" content={designs[0]?.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg'} />
      </Head>
      <h1 className="text-3xl font-bold mb-6">Cross Stitch Designs ({entryCount} designs)</h1>
      <DesignList
        designs={designs}
        page={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        caption=""
      />
    </div> 
  );
}