// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const g = globalThis as typeof globalThis & {
    __LAST_REQUEST_URL__?: string;
  };

  g.__LAST_REQUEST_URL__ = `${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`;

  const response = NextResponse.next();

  // Apply HSTS only for HTTPS requests to enforce secure transport.
  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.nextUrl.protocol === 'https:';
  if (isHttps) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
