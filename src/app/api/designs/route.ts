import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const nPage = searchParams.get("nPage");
    const paddedAlbumId = albumId?.padStart(4, "0");
    const id = `ALB#${paddedAlbumId}`;
    if (!albumId) {
        return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }

    try {
        const params: {
            TableName: string;
            KeyConditionExpression: string;
            ExpressionAttributeValues: Record<string, string>;
            Limit: number;
        } = {
            TableName: process.env.DYNAMODB_TABLE_NAME!,
            KeyConditionExpression: "ID = :id",
            ExpressionAttributeValues: {
                ":id": id,
            },
            Limit: limit,
        };

        if (nPage) {
            params.KeyConditionExpression += " AND NPage >= :nPage";
            params.ExpressionAttributeValues[":nPage"] = nPage.padStart(5, "0");
        }

        const command = new QueryCommand(params);
        const data = await docClient.send(command);

        const designs = (data.Items || []).map(item => ({
            designId: item.ID.replace("DSN#", ""),
            nPage: parseInt(item.NPage), // Convert padded string to number
            caption: item.Caption || "",
        }));

        return NextResponse.json(designs);
    } catch (error) {
        console.error("DynamoDB error:", error);
        return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
    }
}