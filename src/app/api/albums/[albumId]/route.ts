import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, QueryCommand, Select } from "@aws-sdk/client-dynamodb";
import { DesignsResponse, Design } from "@/app/types/design";
import { getAlbumCaption } from "@/app/utils/utils";

// Force SSR to avoid static generation issues
export const dynamic = 'force-dynamic';
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params; // Await the params Promise
  const { searchParams } = new URL(req.url);
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const nPage = parseInt(searchParams.get("nPage") || "1");

  const requiredEnvVars = ["DYNAMODB_TABLE_NAME", "AWS_REGION"];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error(`Missing environment variables: ${missingVars.join(", ")}`);
    return NextResponse.json(
      { error: `Missing environment variables: ${missingVars.join(", ")}` },
      { status: 500 }
    );
  }

  try {
    const albumCaption = await (getAlbumCaption(parseInt(albumId)));
    // Pad albumId to 4 digits with leading zeros
    const paddedAlbumId = albumId.padStart(4, "0");
    const partitionKey = `ALB#${paddedAlbumId}`;

    // Query to get total items for pagination
    const countParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id",
      FilterExpression: "EntityType = :entityType",
      ExpressionAttributeValues: {
        ":id": { S: partitionKey },
        ":entityType": { S: "DESIGN" },
      },
      Select: Select.COUNT, // Use enum value
    };

    console.debug(`Querying DynamoDB for count with partitionKey: ${partitionKey}`);
    const { Count } = await dynamoDBClient.send(new QueryCommand(countParams));
    const totalItems = Count || 0;

    if (totalItems === 0) {
      console.warn(`No designs found for AlbumID ${albumId}`);
      return NextResponse.json({
        designs: [],
        entryCount: 0,
        page: nPage,
        pageSize,
        totalPages: 1,
        albumCaption: undefined
      });
    }
    
    // Query designs for the current page
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id",
      FilterExpression: "EntityType = :entityType",
      ExpressionAttributeValues: {
        ":id": { S: partitionKey },
        ":entityType": { S: "DESIGN" },
      },
      Limit: pageSize,
      ScanIndexForward: false, // Descending order by NPage undefined,
    };

    const { Items } = await dynamoDBClient.send(new QueryCommand(queryParams));

    if (!Items || Items.length === 0) {
      console.warn(`No items found for AlbumID ${albumId} on page ${nPage}`);
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
        NPage: item.NPage?.S ? parseInt(item.NPage.S || "0") : 0,
      };

      const imageUrl = design.AlbumID && design.DesignID
        ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${design.AlbumID}/${design.DesignID}/4.jpg`
        : null;

      return { ...design, ImageUrl: imageUrl, PdfUrl: null };
    });

    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    console.log(`Received albumCaption ${albumCaption}`)
    const responseData: DesignsResponse = {
      designs: enrichedDesigns,
      entryCount: totalItems,
      page: nPage,
      pageSize,
      totalPages,
      albumCaption: albumCaption
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error fetching designs for AlbumID ${albumId}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch designs: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}