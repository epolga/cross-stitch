import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import PaginationControl from "./components/paginationControl";
import type { DesignsResponse } from "@/app/types/design";

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: Props) {
    // Await searchParams to resolve the Promise
    const resolvedSearchParams = await searchParams;
    const pageSize = parseInt(resolvedSearchParams.pageSize as string || "10");
    const nPage = parseInt(resolvedSearchParams.nPage as string || "1");

    let designsResponse: DesignsResponse;
    try {
        const response = await fetch(
            `http://localhost:3000/api/designs?pageSize=${pageSize}&nPage=${nPage}`,
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

    const { designs, entryCount, page, totalPages } = designsResponse;

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
            <div className="mb-6">
                <PaginationControl page={page} totalPages={totalPages} pageSize={pageSize} />
            </div>
            <div className="flex flex-wrap gap-6 items-stretch">
                {designs.map((design) => (
                    <div key={`${design.AlbumID}-${design.DesignID}`} className="float-left m-[3px] p-[5px] border border-gray-500 rounded-lg shadow hover:shadow-lg w-[15%] min-w-[120px] h-[240px]">
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
                <PaginationControl page={page} totalPages={totalPages} pageSize={pageSize} />
            </div>
        </div>
    );
}