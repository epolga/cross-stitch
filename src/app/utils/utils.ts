import { DynamoDBClient, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

// Force SSR to avoid static generation issues
export const dynamic = 'force-dynamic';
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export async function getAlbumCaption(albumId: number): Promise<string | undefined> {
  try {
    const paddedAlbumId = albumId.toString().padStart(4, "0");
    const partitionKey = `ALB#${paddedAlbumId}`;

    // Query to fetch album metadata
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id AND NPage = :nPage",
      ExpressionAttributeValues: {
        ":id": { S: partitionKey },
        ":nPage": { S: "00000" }, // Assuming album metadata has NPage = "00000"
      },
      Limit: 1,
      ScanIndexForward: false, // Descending order
    };

    const { Items } = await dynamoDBClient.send(new QueryCommand(queryParams));

    if (!Items || Items.length === 0) {
      console.warn(`No album found for AlbumID ${albumId}`);
      return undefined;
    }

    // Extract Caption from the first item
    const caption = Items[0].Caption?.S;
    if (!caption) {
      console.warn(`No Caption found for AlbumID ${albumId}`);
      return undefined;
    }

    return caption;
  } catch (error) {
    console.error(`Error fetching album caption for AlbumID ${albumId}:`, error);
    return undefined;
  }
}

export async function getAllAlbumCaptions(): Promise<{ albumId: number; Caption: string }[] | undefined> {
  try {
    // Scan to fetch all albums (items with ID starting with ALB# and NPage = "00000")
    const scanParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: "begins_with(ID, :idPrefix) AND NPage = :nPage",
      ExpressionAttributeValues: {
        ":idPrefix": { S: "ALB#" },
        ":nPage": { S: "00000" },
      },
    };

    const { Items } = await dynamoDBClient.send(new ScanCommand(scanParams));

    if (!Items || Items.length === 0) {
      console.warn(`No albums found`);
      return [];
    }

    const albums = Items.map((item) => {
      const id = item.ID?.S || "";
      const albumId = parseInt(id.replace("ALB#", "")) || 0; // Extract numeric albumId
      const caption = item.Caption?.S || "";
      return { albumId, Caption: caption };
    }).filter((album) => album.albumId > 0 && album.Caption); // Filter out invalid entries

    return albums;
  } catch (error) {
    console.error(`Error fetching all album captions:`, error);
    return undefined;
  }
}