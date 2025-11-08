import type { Metadata } from 'next';
import { DesignList } from '@/app/components/DesignList'; // Adjust path
import type { DesignsResponse } from '@/app/types/design';
import { CreateAlbumUrl } from '@/lib/url-helper';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ albumId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
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
    console.error('Error fetching designs for metadata:', error);
    return {
      title: `Designs in Album ${albumId}`,
      description: `Explore cross-stitch designs in album ${albumId}`,
    };
  }

  const { albumCaption, designs } = designsResponse;
  const ogImage = designs[0]?.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg';
  const canonicalUrl = `https://cross-stitch-pattern.net${await CreateAlbumUrl(albumCaption ? albumCaption : '')}`;
  const title = `Designs in ${albumCaption || `Album ${albumId}`}`;
  const description = `Explore cross-stitch designs in album ${albumCaption || albumId}. Downloadable PDF patterns available.`;

  return {
    title,
    description,
    keywords: 'cross stitch, designs, patterns, PDFs, album',
    alternates: {
      canonical: canonicalUrl,
    },
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      images: ogImage,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage,
    },
    other: {
      'application/ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "image": ogImage,
        "url": canonicalUrl,
        "keywords": "cross stitch, patterns, designs",
      }),
    },
  };
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
      <h1 className="text-3xl font-bold mb-6">Designs in {albumCaption || `Album ${albumId}`} ({entryCount} designs)</h1>
      <DesignList
        designs={designs}
        page={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        caption={albumCaption || `Album ${albumId}`}
        baseUrl={`/albums/${albumId}`}
        isLoggedIn={false} // Assuming user is logged in for this example
      />
    </div>
  );
}