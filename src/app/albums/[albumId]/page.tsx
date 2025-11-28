import type { Metadata } from 'next';
import { DesignList } from '@/app/components/DesignList'; // Adjust path
import type { DesignsResponse } from '@/app/types/design';
import { CreateAlbumUrl } from '@/lib/url-helper';
import Link from 'next/link';

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
      title: `Free Designs in Album ${albumId}`,
      description: `Explore free cross-stitch designs in album ${albumId}`,
    };
  }

  const { albumCaption, designs } = designsResponse;
  const ogImage = designs[0]?.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg';
  const canonicalPath = albumCaption ? await CreateAlbumUrl(albumCaption) : `/albums/${albumId}`;
  const canonicalUrl = `https://cross-stitch-pattern.net${canonicalPath}`;
  const baseName = albumCaption || `Album ${albumId}`;
  const highlightNames = (designs || []).slice(0, 2).map((d) => d.Caption).filter(Boolean);
  const title = `${baseName} Cross-Stitch Patterns (Album ${albumId}${page > 1 ? `, Page ${page}` : ''})`;
  const highlights = highlightNames.length ? ` Highlights: ${highlightNames.join(' | ')}.` : '';
  const description = `Explore free cross-stitch designs in ${baseName} (Album ${albumId})${page > 1 ? ` on page ${page}` : ''}. Downloadable PDF patterns available.${highlights}`;
  const slugCaption = baseName.replace(/\s+/g, '-');
  const keywords = albumCaption
    ? `free cross stitch ${albumCaption} patterns, ${albumCaption} charts, free embroidery PDFs, ${slugCaption} designs, download ${albumCaption} charts, album ${albumId}`
    : `cross stitch, free designs, free patterns, PDFs, album ${albumId}, download album ${albumId} charts`;
  const hasPart = (designs || []).slice(0, 3).map((design) => ({
    "@type": "CreativeWork",
    "name": design.Caption,
    "description": design.Description || undefined,
  }));

  return {
    title,
    description,
    keywords,
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
        "keywords": keywords,
        "hasPart": hasPart,
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
      <p className="text-gray-700 mb-4">
        This curated collection of free PDF charts includes instant downloads and stitch details tailored to the {albumCaption || `album ${albumId}`} theme.
        Looking for more ideas? <Link href="/XStitch-Charts.aspx" className="text-blue-600 hover:underline">View all free cross-stitch albums</Link>.
      </p>
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
