import Head from "next/head";
import Link from "next/link";
import { getAllAlbumCaptions } from "@/lib/data-access";

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
        <title>Free Cross-Stitch Patterns Catalog</title>
        <meta name="description" content="Browse hundreds of free cross-stitch pattern albums with instant PDF downloads and curated themes." />
        <meta name="keywords" content="cross stitch, free albums, free patterns, free pdf charts" />
        <meta property="og:title" content="Free Cross-Stitch Patterns Catalog" />
        <meta property="og:description" content="Browse themed free cross-stitch albums packed with downloadable charts." />
        <meta property="og:image" content="https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg" />
      </Head>
      <h1 className="text-3xl font-bold mb-2 text-center">Free Cross-Stitch Patterns Catalog</h1>
      <h2 className="text-2xl mb-4 text-center">to embroider in your leisure time</h2>
      <p className="text-center text-gray-700 mb-8">
        Explore themed collections of free cross-stitch PDF charts - from floral bouquets to retro samplers.
        Each album links to instant downloads, detailed color keys, and stitch counts so you can plan your next project quickly.
      </p>
      <div className="overflow-hidden">
        {albums.map((album) => {
          const slug = album.Caption.replace(/\s+/g, '-');
          return (
            <Link key={album.Caption} href={`/Free-${slug}-Charts.aspx`} className="no-underline">
              <div className="m-[1px] p-1 float-left border border-gray-300 rounded-lg shadow hover:shadow-lg min-w-[100px] w-[15%] h-[40px]">
                <div className="text-center">
                  <h3 className="text-sm font-semibold truncate">{album.Caption}</h3>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
