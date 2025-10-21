import { NextResponse } from "next/server";
import { getAllAlbumCaptions, fetchAllDesigns } from "@/lib/DataAccess";

// Force SSR to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
    const requiredEnvVars = [
        "DYNAMODB_TABLE_NAME",
        "AWS_REGION",
    ];
    console.log("Generating sitemap.xml");
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error(`Missing environment variables: ${missingVars.join(", ")}`);
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
       <error>Missing environment variables: ${missingVars.join(", ")}</error>`,
            {
                status: 500,
                headers: { "Content-Type": "text/xml" },
            }
        );
    }

    try {
        const designs = await fetchAllDesigns() || [];

        const albums = await getAllAlbumCaptions() || [];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://cross-stitch.us-east-1.elasticbeanstalk.com/</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://cross-stitch.us-east-1.elasticbeanstalk.com/XStitch-Charts.aspx</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
        ${albums
            .map(
                (album) => `
          <url>
            <loc>https://cross-stitch.us-east-1.elasticbeanstalk.com/Free-${album.Caption.replace(/\s+/g, '-')}-Charts.aspx</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>
        `
            )
            .join("")}
        ${designs
            .map(
                (design) => `
          <url>
            <loc>https://cross-stitch.us-east-1.elasticbeanstalk.com/designs/${design.DesignID}</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>
        `
            )
            .join("")}
      </urlset>`;

        return new NextResponse(sitemap, {
            status: 200,
            headers: { "Content-Type": "text/xml" },
        });
    } catch (error) {
        console.error("Error generating sitemap:", error);
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
       <error>Failed to generate sitemap</error>`,
            {
                status: 500,
                headers: { "Content-Type": "text/xml" },
            }
        );
    }
}