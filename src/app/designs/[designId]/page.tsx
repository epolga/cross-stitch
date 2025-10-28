import Image from 'next/image';
import type { Design } from '@/app/types/design';
import DownloadPdfLink from '@/app/components/DownloadPdfLink';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ designId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { designId } = await params;
console.log("Generating metadata for designId:", designId);
  let design: Design;
  try {
    const response = await fetch(`http://localhost:3000/api/designs/${designId}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch design: ${response.statusText}`);
    design = await response.json();
  } catch (error) {
    console.error('Error fetching design for metadata:', error);
    return {
      title: 'Design Not Found',
      description: 'Error loading design',
    };
  }

  const canonicalUrl = `https://cross-stitch-pattern.net/designs/${designId}`;
  const ogImage = design.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg';

  return {
    title: design.Caption,
    description: design.Description || `View cross-stitch design ${design.Caption}`,
    keywords: 'cross stitch, design, pattern, PDF',
    alternates: {
      canonical: canonicalUrl,
    },
    robots: 'index, follow',
    openGraph: {
      title: design.Caption,
      description: design.Description || `View cross-stitch design ${design.Caption}`,
      images: ogImage,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: design.Caption,
      description: design.Description || `View cross-stitch design ${design.Caption}`,
      images: ogImage,
    },
    other: {
      'application/ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": design.Caption,
        "description": design.Description || `Cross-stitch design pattern for ${design.Caption}`,
        "image": ogImage,
        "url": canonicalUrl,
        "keywords": "cross stitch, pattern, design",
      }),
    },
  };
}

export default async function DesignPage({ params }: Props) {
  const { designId } = await params;

  let design: Design;
  try {
    const response = await fetch(`http://localhost:3000/api/designs/${designId}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch design: ${response.statusText}`);
    design = await response.json();
  } catch (error) {
    console.error('Error fetching design:', error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Design Not Found</h1>
        <p className="text-red-500">
          Error loading design: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{design.Caption}</h1>
      <div className="max-w-3xl mx-auto">
        <div className="border border-gray-500 rounded-lg shadow hover:shadow-lg p-5 text-center">
          <h2 className="text-lg font-semibold mb-2">{design.Caption}</h2>

          {/* TOP download control (gated) */}
          <DownloadPdfLink
            pdfUrl={design.PdfUrl}
            caption={design.Caption}
            className="inline-block text-blue-600 hover:underline mb-4"
          />

          {design.ImageUrl ? (
            <div className="mx-auto flex items-center justify-center mb-4">
              <Image
                src={design.ImageUrl}
                alt={design.Caption}
                width={0}
                height={0}
                className="max-w-[600px] max-h-[600px] w-full h-auto object-contain rounded"
                sizes="(max-width: 600px) 100vw, 600px"
              />
            </div>
          ) : (
            <div className="max-w-[200px] max-h-[200px] w-full h-auto mx-auto bg-gray-200 rounded flex items-center justify-center mb-4">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}

          <p className="text-gray-700 mb-4">{design.Description || 'No description available'}</p>

          {/* BOTTOM download control (gated) */}
          <DownloadPdfLink
            pdfUrl={design.PdfUrl}
            caption={design.Caption}
            className="inline-block text-blue-600 hover:underline"
          />
        </div>
      </div>
    </div>
  );
}