import { AttributeValue, DynamoDBClient, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import type { Design, DesignsResponse } from '@/app/types/design';

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
    const albums: { albumId: number; Caption: string }[] = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    // Scan parameters with explicit type and ExclusiveStartKey initialized
    const scanParams: ScanCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: "begins_with(ID, :idPrefix) AND NPage = :nPage",
      ExpressionAttributeValues: {
        ":idPrefix": { S: "ALB#" },
        ":nPage": { S: "00000" },
      },
      ExclusiveStartKey: undefined, // Initialize to avoid type narrowing
    };

    // Continue scanning until all items are fetched
    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(scanParams));
      lastEvaluatedKey = LastEvaluatedKey;

      if (Items && Items.length > 0) {
        const newAlbums = Items.map((item) => {
          const id = item.ID?.S || "";
          const albumId = parseInt(id.replace("ALB#", "")) || 0; // Extract numeric albumId
          const caption = item.Caption?.S || "";
          return { albumId, Caption: caption };
        }).filter((album) => album.albumId > 0 && album.Caption); // Filter out invalid entries
        albums.push(...newAlbums);
      }

      console.debug(`Fetched ${Items?.length || 0} items, Total so far: ${albums.length}, LastEvaluatedKey: ${!!lastEvaluatedKey}`);
    } while (lastEvaluatedKey);

    if (albums.length === 0) {
      console.warn(`No albums found`);
      return [];
    }

    console.info(`Total albums fetched: ${albums.length}`);
    return albums;
  } catch (error) {
    console.error(`Error fetching all album captions:`, error);
    return undefined;
  }
}

function getPDFUrl(albumId: AttributeValue, designId: AttributeValue): string | null
{
    return (albumId?.N && designId?.N) 
        ? `https://d2o1uvvg91z7o4.cloudfront.net/pdfs/${albumId.N}/Stitch${designId.N}_Kit.pdf`
        :null
}

export async function getDesignById(designId: number): Promise<Design | undefined> {
  try {
    // Query the DesignsByID-index
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      IndexName: 'DesignsByID-index',
      KeyConditionExpression: 'EntityType = :entityType AND DesignID = :designId',
      ExpressionAttributeValues: {
        ':entityType': { S: 'DESIGN' },
        ':designId': { N: designId.toString() },
      },
      Limit: 1,
    };

    const { Items } = await dynamoDBClient.send(new QueryCommand(queryParams));

    if (!Items || Items.length === 0) {
      console.warn(`No design found for DesignID ${designId}`);
      return undefined;
    }

    // Map DynamoDB item to Design interface
    const item = Items[0];   
    const design: Design = {
      DesignID: parseInt(item.DesignID?.N || '0', 10),
      AlbumID: parseInt(item.AlbumID?.N || '0', 10),
      Caption: item.Caption?.S || '',
      Description: item.Description?.S || '',
      NColors: parseInt(item.NColors?.N || '0', 10),
      NDownloaded: parseInt(item.NDownloaded?.N || '0', 10),
      Width: parseInt(item.Width?.N || '0', 10),
      Height: parseInt(item.Height?.N || '0', 10),
      Notes: item.Notes?.S || '',
      Text: item.Text?.S || '',
      NPage: parseInt(item.NPage?.S || '0', 10), // Convert string to number
      ImageUrl: item.ImageUrl?.S || (item.AlbumID?.N && item.DesignID?.N
        ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${item.AlbumID.N}/${item.DesignID.N}/4.jpg`
        : null),
        PdfUrl: getPDFUrl(item.AlbumID, item.DesignID)      
    };

    return design;
  } catch (error) {
    console.error(`Error fetching design for DesignID ${designId}:`, error);
    return undefined;
  }
}

export async function getDesigns(pageSize: number, nPage: number): Promise<DesignsResponse> {
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

    const responseData: DesignsResponse = {
      designs: [],
      entryCount: totalItems,
      page: nPage,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
    };

    if (totalItems === 0) {
      console.warn("No designs found in DynamoDB query");
      return responseData;
    }

    // Calculate NGlobalPage range for the requested page (inclusive bounds)
    const startPage = totalItems - (nPage - 1) * pageSize; // Inclusive upper bound
    const endPage = totalItems - nPage * pageSize + 1; // Inclusive lower bound
    console.info(`totalItems = ${totalItems} startPage = ${startPage} endPage = ${endPage}`);
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
      return responseData;
    }

    const enrichedDesigns = Items.map((item) => {
      const design: Design = {
        DesignID: item.DesignID?.N ? parseInt(item.DesignID.N) : 0,
        AlbumID: item.AlbumID?.N ? parseInt(item.AlbumID.N) : 0,
        Caption: item.Caption?.S || "",
        Description: item.Description?.S || "",
        NDownloaded: item.NDownloaded?.N ? parseInt(item.NDownloaded.N) : 0,
        NColors: item.NColors?.N ? parseInt(item.NColors.N) : 0,
        Width: item.Width?.N ? parseInt(item.Width.N) : 0,
        Height: item.Height?.N ? parseInt(item.Height.N) : 0,
        Notes: item.Notes?.S || "",
        Text: item.Text?.S || "",
        NPage: item.NPage?.S ? parseInt(item.NPage.S) : 0, // Convert string to number
        ImageUrl: item.ImageUrl?.S || (item.AlbumID?.N && item.DesignID?.N
          ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${item.AlbumID.N}/${item.DesignID.N}/4.jpg`
          : null),
        PdfUrl: getPDFUrl(item.AlbumID, item.DesignID)   
      };
      return design;
    });

    responseData.designs = enrichedDesigns;
    return responseData;
  } catch (error) {
    console.error("Error fetching designs:", error);
    throw error; // Let caller handle the error
  }
}

export async function getDesignsByAlbumId(albumId: string, pageSize: number, nPage: number): Promise<DesignsResponse> {
  try {
    // Fetch album caption
    const albumCaption = await getAlbumCaption(parseInt(albumId)) || "Unknown Album";

    // Pad albumId to 4 digits with leading zeros
    const paddedAlbumId = albumId.padStart(4, "0");
    const partitionKey = `ALB#${paddedAlbumId}`;

    // Query to get the design with the maximum NPage for totalItems
    const maxPageParams: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id",
      FilterExpression: "EntityType = :entityType",
      ExpressionAttributeValues: {
        ":id": { S: partitionKey },
        ":entityType": { S: "DESIGN" },
      },
      ProjectionExpression: "NPage",
      Limit: 1,
      ScanIndexForward: false, // Descending order to get max NPage
    };

    console.debug(`Querying DynamoDB for max NPage with partitionKey: ${partitionKey}`);
    const maxPageResult = await dynamoDBClient.send(new QueryCommand(maxPageParams));
    const totalItems = maxPageResult.Items && maxPageResult.Items?.length > 0 && maxPageResult.Items[0].NPage?.S
      ? parseInt(maxPageResult.Items[0].NPage.S)
      : 0;

    const responseData: DesignsResponse = {
      designs: [],
      entryCount: totalItems,
      page: nPage,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
      albumCaption,
    };
    console.info(`totalItems = ${totalItems}`);

    if (totalItems === 0) {
      console.warn(`No designs found for AlbumID ${albumId}`);
      return responseData;
    }

    // Calculate NPage range for the requested page (inclusive bounds)
    const startPage = totalItems - (nPage - 1) * pageSize; // Inclusive upper bound
    const endPage = Math.max(totalItems - nPage * pageSize + 1, 1); // Inclusive lower bound, ensure >= 1
    console.info(`totalItems = ${totalItems}, startPage = ${startPage}, endPage = ${endPage}`);

    // Query designs for the current page
    const queryParams: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id AND NPage BETWEEN :endPage AND :startPage",
      FilterExpression: "EntityType = :entityType",
      ExpressionAttributeValues: {
        ":id": { S: partitionKey },
        ":entityType": { S: "DESIGN" },
        ":endPage": { S: endPage.toString().padStart(5, "0") }, // Pad to match NPage format
        ":startPage": { S: startPage.toString().padStart(5, "0") }, // Pad to match NPage format
      },
      Limit: pageSize,
      ScanIndexForward: false, // Descending order
    };

    console.debug(`Querying DynamoDB for designs with partitionKey: ${partitionKey}, startPage: ${startPage}, endPage: ${endPage}`);
    const { Items } = await dynamoDBClient.send(new QueryCommand(queryParams));

    if (!Items || Items.length === 0) {
      console.warn(`No items found for AlbumID ${albumId} on page ${nPage}`);
      return responseData;
    }

    const enrichedDesigns = Items.map((item) => {
      const design: Design = {
        DesignID: item.DesignID?.N ? parseInt(item.DesignID.N) : 0,
        AlbumID: item.AlbumID?.N ? parseInt(item.AlbumID.N) : 0,
        Caption: item.Caption?.S || "",
        Description: item.Description?.S || "",
        NDownloaded: item.NDownloaded?.N ? parseInt(item.NDownloaded.N) : 0,
        NColors: item.NColors?.N ? parseInt(item.NColors.N) : 0,
        Width: item.Width?.N ? parseInt(item.Width.N) : 0,
        Height: item.Height?.N ? parseInt(item.Height.N) : 0,
        Notes: item.Notes?.S || "",
        Text: item.Text?.S || "",
        NPage: item.NPage?.S ? parseInt(item.NPage.S || "0") : 0,
        ImageUrl: item.ImageUrl?.S || (item.AlbumID?.N && item.DesignID?.N
          ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${item.AlbumID.N}/${item.DesignID.N}/4.jpg`
          : null),
        PdfUrl: getPDFUrl(item.AlbumID, item.DesignID),
      };
      return design;
    });

    responseData.designs = enrichedDesigns;
    return responseData;
  } catch (error) {
    console.error(`Error fetching designs for AlbumID ${albumId}:`, error);
    throw error; // Let caller handle the error
  }
}

interface FilterOptions {
  widthFrom: number;
  widthTo: number;
  heightFrom: number;
  heightTo: number;
  ncolorsFrom: number;
  ncolorsTo: number;
  page: number;
  pageSize: number;
}

export async function fetchFilteredDesigns(filters: FilterOptions): Promise<DesignsResponse> {  
  const params: ScanCommandInput = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    IndexName: 'Designs-index',
    FilterExpression:
      '#e = :etype AND Width BETWEEN :w1 AND :w2 AND Height BETWEEN :h1 AND :h2 AND NColors BETWEEN :c1 AND :c2',
    ExpressionAttributeNames: {
      '#e': 'EntityType',
    },
    ExpressionAttributeValues: {
      ':etype': { S: 'DESIGN' },
      ':w1': { N: filters.widthFrom.toString() },
      ':w2': { N: filters.widthTo.toString() },
      ':h1': { N: filters.heightFrom.toString() },
      ':h2': { N: filters.heightTo.toString() },
      ':c1': { N: filters.ncolorsFrom.toString() },
      ':c2': { N: filters.ncolorsTo.toString() },
    },
  };

  console.log((`Inside fetchFilteredDesigns filters = ${JSON.stringify(filters)}`));
  //const result = await dynamoDBClient.send(new ScanCommand(params));
  const { Items } = await dynamoDBClient.send(new ScanCommand(params));
  //const allItems = result.Items?.map((item) => unmarshall(item) as Design) || [];
  const responseData: DesignsResponse = {
    designs: [],
    entryCount: 0,
    page: 0,
    pageSize : 0,
    totalPages: 0,
  };

  if (!Items || Items.length === 0) {
    console.warn("No items found in DynamoDB query");
    return responseData;
  }

  const enrichedDesigns = Items.map((item) => {
    const design: Design = {
      DesignID: item.DesignID?.N ? parseInt(item.DesignID.N) : 0,
      AlbumID: item.AlbumID?.N ? parseInt(item.AlbumID.N) : 0,
      Caption: item.Caption?.S || "",
      Description: item.Description?.S || "",
      NDownloaded: item.NDownloaded?.N ? parseInt(item.NDownloaded.N) : 0,
      NColors: item.NColors?.N ? parseInt(item.NColors.N) : 0,
      Width: item.Width?.N ? parseInt(item.Width.N) : 0,
      Height: item.Height?.N ? parseInt(item.Height.N) : 0,
      Notes: item.Notes?.S || "",
      Text: item.Text?.S || "",
      NPage: item.NPage?.S ? parseInt(item.NPage.S) : 0, // Convert string to number
      ImageUrl: item.ImageUrl?.S || (item.AlbumID?.N && item.DesignID?.N
        ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${item.AlbumID.N}/${item.DesignID.N}/4.jpg`
        : null),
      PdfUrl: getPDFUrl(item.AlbumID, item.DesignID)   
    };
    return design;
  });

  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize;
  const pagedItems = enrichedDesigns?.slice(start, end);
  const totalPages = enrichedDesigns?.length ? (Math.ceil(enrichedDesigns.length / filters.pageSize)) : 0;

  return {
    designs: pagedItems,
    entryCount: enrichedDesigns.length,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
  };
}
