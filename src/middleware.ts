// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const g = globalThis as typeof globalThis & {
    __LAST_REQUEST_URL__?: string;
  };

  g.__LAST_REQUEST_URL__ =
    `${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`;

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
