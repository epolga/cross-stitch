// src/app/page.tsx
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { DesignsResponse } from "@/types/design";

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: Props) {
    // Await searchParams to resolve the Promise
    const resolvedSearchParams = await searchParams;
    const albumId = resolvedSearchParams.albumId as string || "15";
    const pageSize = parseInt(resolvedSearchParams.pageSize as string || "10");
    const nPage = parseInt(resolvedSearchParams.nPage as string || "1");

    let designsResponse: DesignsResponse;
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/designs?albumId=${albumId}&pageSize=${pageSize}&nPage=${nPage}`,
            { cache: 'no-store' }
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch designs: ${response.statusText}`);
        }
        designsResponse = await response.json();
    } catch (error) {
        console.error("Error fetching designs:", error);
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Cross Stitch Designs</h1>
                <p className="text-red-500">Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        );
    }

    const { designs, entryCount, page, pageSize: responsePageSize, totalPages } = designsResponse;

    return (
        <div className="container mx-auto p-4">
            <Head>
                <title>Cross Stitch Designs</title>
                <meta name="description" content="Explore 6,000 cross-stitch designs with downloadable PDFs" />
                <meta name="keywords" content="cross stitch, designs, patterns, PDFs" />
                <meta property="og:title" content="Cross Stitch Designs" />
                <meta property="og:description" content="Explore 6,000 cross-stitch designs with downloadable PDFs" />
                <meta property="og:image" content={designs[0]?.ImageUrl || "https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg"} />
            </Head>
            <h1 className="text-3xl font-bold mb-6">Cross Stitch Designs ({entryCount} designs)</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {designs.map((design) => (
                    <div key={`${design.AlbumID}-${design.DesignID}`} className="border rounded-lg p-4 shadow hover:shadow-lg">
                        <Link href={`/designs/${design.DesignID}`}>
                            <div className="block">
                                {design.ImageUrl ? (
                                    <Image
                                        src={design.ImageUrl}
                                        alt={design.Caption}
                                        width={200}
                                        height={200}
                                        className="w-full h-48 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 rounded" />
                                )}
                                <h3 className="text-lg font-semibold mt-2">{design.Caption}</h3>
                            </div>
                        </Link>
                        {design.PdfUrl ? (
                            <a
                                href={design.PdfUrl}
                                className="mt-2 inline-block text-blue-600 hover:underline"
                                download
                            >
                                Download PDF
                            </a>
                        ) : (
                            <p className="mt-2 text-gray-500">PDF not available</p>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-center items-center space-x-4">
                <p>Page {page} of {totalPages}</p>
                <p> {responsePageSize}</p>
                {page > 1 && (
                    <Link href={`/?albumId=${albumId}&pageSize=${pageSize}&nPage=${page - 1}`}>
                        <div className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Previous</div>
                    </Link>
                )}
                {page < totalPages && (
                    <Link href={`/?albumId=${albumId}&pageSize=${pageSize}&nPage=${page + 1}`}>
                        <div className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Next</div>
                    </Link>
                )}
            </div>
        </div>
    );
}