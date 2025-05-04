import { NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

// Force SSR to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
    const requiredEnvVars = [
        "DYNAMODB_TABLE_NAME",
        "AWS_REGION",
    ];
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

    const dynamoDBClient = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
            }
            : undefined,
    });

    try {
        const { Items } = await dynamoDBClient.send(
            new ScanCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME,
            })
        );

        const designs = Items?.map((item) => ({
            DesignID: item.DesignID.N,
        })) || [];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://cross-stitch.us-east-1.elasticbeanstalk.com/</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>
        ${designs
            .map(
                (design) => `
          <url>
            <loc>https://cross-stitch.us-east-1.elasticbeanstalk.com/design/${design.DesignID}</loc>
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