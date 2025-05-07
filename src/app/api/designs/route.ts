import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DesignsResponse, Design } from "@/app/types/design";

// Force SSR to avoid static generation issues
export const dynamic = 'force-dynamic';
const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const nPage = parseInt(searchParams.get("nPage") || "1");

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

    try {
        // Get the maximum NGlobalPage to determine totalItems
        const maxNPageParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            IndexName: "Designs-index",
            KeyConditionExpression: "EntityType = :entityType",
            ExpressionAttributeValues: {
                ":entityType": { S: "DESIGN" },
            },
            ProjectionExpression: "NGlobalPage",
            Limit: 1,
            ScanIndexForward: false, // Highest NGlobalPage
        };

        const { Items: maxItems } = await dynamoDBClient.send(new QueryCommand(maxNPageParams));
        const totalItems = maxItems && maxItems[0]?.NGlobalPage?.N ? parseInt(maxItems[0].NGlobalPage.N) : 0;

        if (totalItems === 0) {
            console.warn("No designs found in DynamoDB query");
            return NextResponse.json({
                designs: [],
                entryCount: 0,
                page: nPage,
                pageSize,
                totalPages: 1,
            });
        }

        // Calculate NGlobalPage range for the requested page (inclusive bounds)
        const startPage = totalItems - (nPage - 1) * pageSize; // Inclusive upper bound
        const endPage = totalItems - nPage * pageSize + 1; // Inclusive lower bound

        // Query designs for the current page
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            IndexName: "Designs-index",
            KeyConditionExpression: "EntityType = :entityType AND NGlobalPage BETWEEN :endPage AND :startPage",
            ExpressionAttributeValues: {
                ":entityType": { S: "DESIGN" },
                ":endPage": { N: endPage.toString() },
                ":startPage": { N: startPage.toString() },
            },
            Limit: pageSize,
            ScanIndexForward: false, // Descending order by NGlobalPage
        };

        const { Items } = await dynamoDBClient.send(new QueryCommand(params));

        if (!Items || Items.length === 0) {
            console.warn("No items found in DynamoDB query for page", nPage);
            return NextResponse.json({
                designs: [],
                entryCount: totalItems,
                page: nPage,
                pageSize,
                totalPages: Math.ceil(totalItems / pageSize) || 1,
            });
        }

        const enrichedDesigns = Items.map((item) => {
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
                NPage: item.NPage?.S ? parseInt(item.NPage.S) : 0, // Convert string to number
            };

            const imageUrl = design.AlbumID && design.DesignID
                ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${design.AlbumID}/${design.DesignID}/4.jpg`
                : null;

            return { ...design, ImageUrl: imageUrl, PdfUrl: null };
        });

        const totalPages = Math.ceil(totalItems / pageSize) || 1;

        const responseData: DesignsResponse = {
            designs: enrichedDesigns,
            entryCount: totalItems,
            page: nPage,
            pageSize,
            totalPages,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error fetching designs:", error);
        return NextResponse.json(
            { error: `Failed to fetch designs: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}