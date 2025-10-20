import { NextRequest, NextResponse } from 'next/server';

let loadPromise: Promise<Map<number, string>> | undefined;

const getDesignAlbumMap = () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      // Assuming the CSV is publicly accessible; replace with your public S3 URL or CloudFront URL
      const response = await fetch('https://cross-stitch-designs.s3.us-east-1.amazonaws.com/mappings/design-album-mapping.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch S3 file content');
      }
      const body = await response.text();

      const lines = body.split('\n').slice(1); // Skip header
      const map = new Map<number, string>();

      for (const line of lines) {
        if (!line.trim()) continue;
        const [designStr, album] = line.split(',');
        const design = parseInt(designStr.trim());
        if (!isNaN(design)) {
          map.set(design, album.trim());
        }
      }

      return map;
    })();
  }
  return loadPromise;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log("Middleware processing request for pathname:", pathname);

  const map = await getDesignAlbumMap();
  if (pathname.endsWith('-Free-Design.jpg')) {
    // Match paths like /photos/<design>/<number>.jpg
    const pathParts = pathname.split('-').filter(Boolean);
    console.log("Parsed path parts:", pathParts);
    if (pathParts.length >= 5) {
      const designStr = pathParts[pathParts.length - 4];
      console.log("designStr:", designStr);
      const design = parseInt(designStr);
      const number = 4; // Assuming '4' is fixed as per original logic

      if (!isNaN(design) && map.has(design)) {
        const album = map.get(design);
        console.log("album:", album);
        // Rewrite to the CloudFront URL with album
        const rewriteUrl = new URL(`https://d2o1uvvg91z7o4.cloudfront.net/photos/${album}/${design}/${number}.jpg`, request.url);
        console.log("Rewriting request to:", rewriteUrl.toString());
        return NextResponse.rewrite(rewriteUrl);
      }
    }
  }
  
  // Fall through for non-matching requests
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'], // Array format for consistent matching across all paths
};