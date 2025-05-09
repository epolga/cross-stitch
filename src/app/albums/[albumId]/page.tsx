import Head from 'next/head';
import { DesignList } from '@/app/components/designList'; // Adjust path
import type { DesignsResponse } from '@/app/types/design';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ albumId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AlbumDesignsPage({ params, searchParams }: Props) {
  const { albumId } = await params;
  const searchParamsRes = await searchParams;
  const pageSize = parseInt(searchParamsRes.pageSize as string || '10');
  const page = parseInt(searchParamsRes.nPage as string || '1');

  let designsResponse: DesignsResponse;
  try {
    const response = await fetch(
      `http://localhost:3000/api/albums/${albumId}?pageSize=${pageSize}&nPage=${page}`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch designs: ${response.statusText}`);
    }
    designsResponse = await response.json();
  } catch (error) {
    console.error('Error fetching designs for album:', error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Designs in Album {albumId}</h1>
        <p className="text-red-500">
          Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const { designs, entryCount, page: currentPage, totalPages, albumCaption } = designsResponse;

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Designs in Album {albumCaption}</title>
        <meta name="description" content={`Explore cross-stitch designs in album ${albumId}`} />
        <meta name="keywords" content="cross stitch, designs, patterns, PDFs, album" />
        <meta property="og:title" content={`Designs in Album ${albumId}`} />
        <meta property="og:description" content={`Explore cross-stitch designs in album ${albumId}`} />
        <meta property="og:image" content={designs[0]?.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg'} />
      </Head>
      <h1 className="text-3xl font-bold mb-6">Designs in {albumCaption || `Album ${albumId}`} ({entryCount} designs)</h1>
      <DesignList
        designs={designs}
        page={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        caption={albumCaption || `Album ${albumId}`}
        baseUrl={`/albums/${albumId}`}
      />
    </div>
  );
}