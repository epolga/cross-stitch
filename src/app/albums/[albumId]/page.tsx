import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import PaginationControl from "../../components/paginationControl";
import type { DesignsResponse } from "@/app/types/design";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ albumId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AlbumDesignsPage({ params, searchParams }: Props) {
  const { albumId } = await params;
  const searchParamsRes = await searchParams;
  const pageSize = parseInt(searchParamsRes.pageSize as string || "10");
  const nPage = parseInt(searchParamsRes.nPage as string || "1");

  let designsResponse: DesignsResponse;
  try {
    const response = await fetch(
      `http://localhost:3000/api/albums/${albumId}?pageSize=${pageSize}&nPage=${nPage}`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch designs: ${response.statusText}`);
    }
    designsResponse = await response.json();
  } catch (error) {
    console.error("Error fetching designs for album:", error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Designs in Album {albumId}</h1>
        <p className="text-red-500">Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  const { designs, entryCount, page, totalPages, albumCaption } = designsResponse;
  console.log(`designsResponse = ${JSON.stringify(designsResponse)}`);
  return (
    <div className="container mx-auto p-4">
      <Head>
        <title> Designs in Album {albumCaption}</title>
        <meta name="description" content={`Explore cross-stitch designs in album ${albumId}`} />
        <meta name="keywords" content="cross stitch, designs, patterns, PDFs, album" />
        <meta property="og:title" content={`Designs in Album {albumId}`} />
        <meta property="og:description" content={`Explore cross-stitch designs in album ${albumId}`} />
        <meta property="og:image" content={designs[0]?.ImageUrl || "https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg"} />
      </Head>
      <h1 className="text-3xl font-bold mb-6">Designs in Album {albumCaption} ({entryCount} designs)</h1>
      <div className="mb-6">
        <PaginationControl
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          baseUrl={`/albums/${albumId}`}
        />
      </div>
      <div className="flex flex-wrap gap-6 items-stretch">
        {designs.map((design) => (
          <div key={`${design.AlbumID}-${design.DesignID}`} className="border-2 rounded-lg p-4 shadow hover:shadow-lg w-fit flex flex-col items-center min-h-[240px] justify-between">
            <Link href={`/designs/${design.DesignID}`}>
              <div className="block flex flex-col items-center">
                {design.ImageUrl ? (
                  <div className="w-[100px] h-[100px] flex items-center justify-center">
                    <Image
                      src={design.ImageUrl}
                      alt={design.Caption}
                      width={100}
                      height={100}
                      className="max-w-[100px] max-h-[100px] object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-[100px] h-[100px] bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                <div className="w-[150px] mt-2">
                  <h3 className="text-lg font-semibold text-center">{design.Caption}</h3>
                </div>
              </div>
            </Link>
            <div className="w-[150px] mt-2">
              {design.PdfUrl ? (
                <a
                  href={design.PdfUrl}
                  className="inline-block text-blue-600 hover:underline text-center w-full"
                  download
                >
                  Download PDF
                </a>
              ) : (
                <p className="text-gray-500 text-center">PDF not available</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <PaginationControl
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          baseUrl={`/albums/${albumId}`}
        />
      </div>
    </div>
  );
}