import Head from "next/head";
import Link from "next/link";
import { getAllAlbumCaptions } from "@/lib/DataAccess";

export const dynamic = 'force-dynamic';

export default async function AlbumsPage() {
  const albums = await getAllAlbumCaptions();

  if (!albums) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Cross-Stitch Patterns Catalog</h1>
        <p className="text-red-500">Error loading albums: Unable to fetch album data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Cross-Stitch Patterns Catalog</title>
        <meta name="description" content="Explore all cross-stitch albums" />
        <meta name="keywords" content="cross stitch, albums, patterns" />
        <meta property="og:title" content="Cross-Stitch Patterns Catalog" />
        <meta property="og:description" content="Explore all cross-stitch albums" />
        <meta property="og:image" content="https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg" />
      </Head>
      <h1 className="text-3xl font-bold mb-6 text-center">Cross-Stitch Patterns Catalog</h1>
      <h2 className="text-2xl mb-8 text-center">to embroider in your leisure time</h2>
      <div className="overflow-hidden">
        {albums.map((album) => (
          <Link key={album.albumId} href={`/albums/${album.albumId}`}>
            <div className="m-[1px] p-1 float-left border border-gray-300 rounded-lg shadow hover:shadow-lg min-w-[100px] w-[15%] h-[40px]">
              <div className="text-center">
                <h3 className="text-sm font-semibold truncate">{album.Caption}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}