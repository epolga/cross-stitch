import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { NextResponse } from 'next/server';
import type { Design } from '@/app/types/design';

// Initialize DynamoDB client
export const dynamic = 'force-dynamic';
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: Request, { params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;

  try {
    // Parse designId as an integer
    const id = parseInt(designId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
    }

    // Query the DesignsByID-index
    const command = new QueryCommand({
      TableName: 'CrossStitchItems',
      IndexName: 'DesignsByID-index',
      KeyConditionExpression: 'EntityType = :entityType AND DesignID = :designId',
      ExpressionAttributeValues: {
        ':entityType': 'DESIGN',
        ':designId': id,
      },
    });

    const response = await docClient.send(command);

    // Check if design exists
    if (!response.Items || response.Items.length === 0) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

  
    // Map DynamoDB item to Design interface
    const item = response.Items[0];
    const imageUrl = item.AlbumID && item.DesignID
      ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${item.AlbumID}/${item.DesignID}/4.jpg`
      : null;

    const design: Design = {
      DesignID: item.DesignID,
      AlbumID: item.AlbumID || 0, // Default to 0 if missing
      Caption: item.Caption || '',
      Description: item.Description || '',
      NDownloaded: item.NDownloaded || 0,
      Width: item.Width || 0,
      Height: item.Height || 0,
      Notes: item.Notes || '',
      Text: item.Text || '',
      NPage: parseInt(item.NPage, 10) || 0, // Convert string to number
      ImageUrl: imageUrl || null,
      PdfUrl: item.PdfUrl || null,
    };

    // Return the design
    return NextResponse.json(design, { status: 200 });
  } catch (error) {
    console.error('Error fetching design:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}