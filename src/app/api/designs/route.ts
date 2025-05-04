// src/app/api/designs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DesignsResponse, Design } from "@/types/design";

// Force SSR to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const nPage = parseInt(searchParams.get("nPage") || "1");
    console.log(JSON.stringify(process.env));
    const requiredEnvVars = [
        "DYNAMODB_TABLE_NAME",
        "AWS_REGION"
    ];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error(`Missing environment variables: ${missingVars.join(", ")}`);
        return NextResponse.json(
            { error: `Missing environment variables: ${missingVars.join(", ")}` },
            { status: 500 }
        );
    }

    const dynamoDBClient = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
        },
    });

    try {
        const { Items } = await dynamoDBClient.send(
            new ScanCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Limit: pageSize,
            })
        );

        if (!Items || Items.length === 0) {
            console.warn("No items found in DynamoDB scan");
            return NextResponse.json({
                designs: [],
                entryCount: 0,
                page: nPage,
                pageSize,
                totalPages: 1,
            });
        }

        const totalItems = Items.length;
        const designs = Items.slice((nPage - 1) * pageSize, nPage * pageSize);

        const enrichedDesigns = designs.map((item) => {
            const design: Design = {
                DesignID: item.DesignID?.N ? parseInt(item.DesignID.N) : 0,
                AlbumID: item.AlbumID?.N ? parseInt(item.AlbumID.N) : 0,
                Caption: item.Caption?.S || "",
                Description: item.Description?.S || "",
                NDownloaded: item.NDownloaded?.N ? parseInt(item.NDownloaded.N) : 0,
                Width: item.Width?.N ? parseInt(item.Width.N) : 0,
                Height: item.Height?.N ? parseInt(item.Height.N) : 0,
                Notes: item.Notes?.S || "",
                Text: item.Text?.S || "",
                NPage: item.NPage?.N ? parseInt(item.NPage.N) : 0,
            };

            const imageUrl = design.AlbumID && design.DesignID
                ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${design.AlbumID}/${design.DesignID}/4.jpg`
                : null;

            return { ...design, ImageUrl: imageUrl, PdfUrl: null };
        });

        const responseData: DesignsResponse = {
            designs: enrichedDesigns,
            entryCount: totalItems,
            page: nPage,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize) || 1,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error fetching designs!!!:", error);
        return NextResponse.json(
            { error: `Failed to fetch designs: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}