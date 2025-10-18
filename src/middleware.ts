import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log("Middleware processing request for pathname:", pathname);

  // Match any slugs ending in .jpg (validation handled in Route Handler)
  if (pathname.endsWith('.jpg')) {
    // Rewrite to the Route Handler (preserves original URL)
    let rewriteUrl = new URL(`/api/image${pathname}`, request.url);

    rewriteUrl = new URL('https://d2o1uvvg91z7o4.cloudfront.net/photos/104/5351/4.jpg', request.url); // Temporary hardcoded for testing
    console.log("Rewriting request to:", rewriteUrl.toString());
    return NextResponse.rewrite(rewriteUrl);
  }

  // Fall through for non-matching requests
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'], // Array format for consistent matching across all paths
};