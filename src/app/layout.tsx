import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cross Stitch Designs",
  description: "Explore 6,000 cross-stitch designs with downloadable PDFs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <body className="bg-gray-100">{children}</body>
      </html>
  );
}