import { AttributeValue, DynamoDBClient, QueryCommand, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import type { Design, DesignsResponse } from '@/app/types/design';

// Force SSR to avoid static generation issues
export const dynamic = 'force-dynamic';

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

// In-memory cache for designs and album captions
const designCache: Map<number, Design> = new Map();
const albumCaptionCache: Map<number, string> = new Map();
let cacheInitialized: boolean = false;
let cacheInitializationPromise: Promise<void> | null = null;

// Initialize the cache by fetching all designs from DynamoDB
async function initializeDesignCache(): Promise<void> {
  if (cacheInitialized) {
    console.info('Design cache already initialized');
    return;
  }

  if (cacheInitializationPromise) {
    console.info('Cache initialization already in progress');
    return cacheInitializationPromise;
  }

  cacheInitializationPromise = (async () => {
    try {
      console.info('Starting design cache initialization');
      const scanParams: ScanCommandInput = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        FilterExpression: "EntityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": { S: "DESIGN" },
        },
      };

      let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
      let totalDesigns = 0;

      do {
        if (lastEvaluatedKey) {
          scanParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(scanParams));
        lastEvaluatedKey = LastEvaluatedKey;

        if (Items && Items.length > 0) {
          Items.forEach((item) => {
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
              NPage: item.NPage?.S ? parseInt(item.NPage.S) : 0,
              ImageUrl: item.ImageUrl?.S || (item.AlbumID?.N && item.DesignID?.N
                ? `https://d2o1uvvg91z7o4.cloudfront.net/photos/${item.AlbumID.N}/${item.DesignID.N}/4.jpg`
                : null),
              PdfUrl: getPDFUrl(item.AlbumID, item.DesignID),
              NGlobalPage: item.NGlobalPage?.N ? parseInt(item.NGlobalPage.N) : 0
            };
            if (design.DesignID > 0) {
              designCache.set(design.DesignID, design);
            }
          });
          totalDesigns += Items.length;
        }

        console.debug(`Fetched ${Items?.length || 0} designs, Total so far: ${totalDesigns}`);
      } while (lastEvaluatedKey);

      cacheInitialized = true;
      console.info(`Design cache initialized with ${totalDesigns} designs`);
    } catch (error) {
      console.error('Error initializing design cache:', error);
      cacheInitialized = false;
      throw error;
    } finally {
      cacheInitializationPromise = null;
    }
  })();

  return cacheInitializationPromise;
}

// Wrapper to initialize cache on first access
async function withCache<T>(fn: () => Promise<T>): Promise<T> {
  if (!cacheInitialized && !cacheInitializationPromise) {
    console.debug('First access, initializing cache');
    await initializeDesignCache();
  } else if (cacheInitializationPromise) {
    console.debug('Waiting for cache initialization');
    await cacheInitializationPromise;
  }
  return fn();
}

// Fetch album caption with caching
export async function getAlbumCaption(albumId: number): Promise<string | undefined> {
  // Check cache first
  if (albumCaptionCache.has(albumId)) {
    return albumCaptionCache.get(albumId);
  }

  try {
    const paddedAlbumId = albumId.toString().padStart(4, "0");
    const partitionKey = `ALB#${paddedAlbumId}`;

    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id AND NPage = :nPage",
      ExpressionAttributeValues: {
        ":id": { S: partitionKey },
        ":nPage": { S: "00000" },
      },
      Limit: 1,
      ScanIndexForward: false,
    };

    const { Items } = await dynamoDBClient.send(new QueryCommand(queryParams));

    if (!Items || Items.length === 0) {
      console.warn(`No album found for AlbumID ${albumId}`);
      albumCaptionCache.set(albumId, "");
      return undefined;
    }

    const caption = Items[0].Caption?.S || "";
    albumCaptionCache.set(albumId, caption);
    return caption;
  } catch (error) {
    console.error(`Error fetching album caption for AlbumID ${albumId}:`, error);
    albumCaptionCache.set(albumId, "");
    return undefined;
  }
}

export async function getAllAlbumCaptions(): Promise<{ albumId: number; Caption: string }[] | undefined> {
  try {
    const albums: { albumId: number; Caption: string }[] = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    const scanParams: ScanCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: "begins_with(ID, :idPrefix) AND NPage = :nPage",
      ExpressionAttributeValues: {
        ":idPrefix": { S: "ALB#" },
        ":nPage": { S: "00000" },
      },
      ExclusiveStartKey: undefined,
    };

    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(scanParams));
      lastEvaluatedKey = LastEvaluatedKey;

      if (Items && Items.length > 0) {
        const newAlbums = Items.map((item) => {
          const id = item.ID?.S || "";
          const albumId = parseInt(id.replace("ALB#", "")) || 0;
          const caption = item.Caption?.S || "";
          return { albumId, Caption: caption };
        }).filter((album) => album.albumId > 0 && album.Caption);
        albums.push(...newAlbums);
      }

      console.debug(`Fetched ${Items?.length || 0} items, Total so far: ${albums.length}, LastEvaluatedKey: ${!!lastEvaluatedKey}`);
    } while (lastEvaluatedKey);

    if (albums.length === 0) {
      console.warn(`No albums found`);
      return [];
    }

    // Update cache
    albums.forEach(({ albumId, Caption }) => albumCaptionCache.set(albumId, Caption));

    console.info(`Total albums fetched: ${albums.length}`);
    return albums;
  } catch (error) {
    console.error(`Error fetching all album captions:`, error);
    return undefined;
  }
}

function getPDFUrl(albumId: AttributeValue, designId: AttributeValue): string | null {
  return (albumId?.N && designId?.N)
    ? `https://d2o1uvvg91z7o4.cloudfront.net/pdfs/${albumId.N}/Stitch${designId.N}_Kit.pdf`
    : null;
}

export async function getDesignById(designId: number): Promise<Design | undefined> {
  return withCache(async () => {
    try {
      const design = designCache.get(designId);
      if (!design) {
        console.warn(`No design found for DesignID ${designId} in cache`);
        return undefined;
      }
      return design;
    } catch (error) {
      console.error(`Error fetching design for DesignID ${designId}:`, error);
      return undefined;
    }
  });
}

export async function getDesigns(pageSize: number, nPage: number): Promise<DesignsResponse> {
  return withCache(async () => {
    try {
      const allDesigns = Array.from(designCache.values());
      const totalItems = allDesigns.length;

      const responseData: DesignsResponse = {
        designs: [],
        entryCount: totalItems,
        page: nPage,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      };

      if (totalItems === 0) {
        console.warn("No designs found in cache");
        return responseData;
      }

      allDesigns.sort((a, b) => (b.NGlobalPage || 0) - (a.NGlobalPage || 0));

      const startIndex = (nPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      responseData.designs = allDesigns.slice(startIndex, endIndex);

      if (responseData.designs.length === 0) {
        console.warn(`No designs found for page ${nPage}`);
      }

      return responseData;
    } catch (error) {
      console.error("Error fetching designs:", error);
      throw error;
    }
  });
}

export async function getDesignsByAlbumId(albumId: string, pageSize: number, nPage: number): Promise<DesignsResponse> {
  return withCache(async () => {
    try {
      const albumCaption = await getAlbumCaption(parseInt(albumId)) || "Unknown Album";

      const allDesigns = Array.from(designCache.values()).filter(
        (design) => design.AlbumID === parseInt(albumId)
      );
      const totalItems = allDesigns.length;

      const responseData: DesignsResponse = {
        designs: [],
        entryCount: totalItems,
        page: nPage,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
        albumCaption,
      };

      if (totalItems === 0) {
        console.warn(`No designs found for AlbumID ${albumId}`);
        return responseData;
      }

      allDesigns.sort((a, b) => (b.NPage || 0) - (a.NPage || 0));

      const startIndex = (nPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      responseData.designs = allDesigns.slice(startIndex, endIndex);

      if (responseData.designs.length === 0) {
        console.warn(`No designs found for AlbumID ${albumId} on page ${nPage}`);
      }

      return responseData;
    } catch (error) {
      console.error(`Error fetching designs for AlbumID ${albumId}:`, error);
      throw error;
    }
  });
}

interface FilterOptions {
  widthFrom: number;
  widthTo: number;
  heightFrom: number;
  heightTo: number;
  ncolorsFrom: number;
  ncolorsTo: number;
  nPage: number;
  pageSize: number;
  searchText?: string;
}

export async function fetchFilteredDesigns(filters: FilterOptions): Promise<DesignsResponse> {
  return withCache(async () => {
    try {
      const { nPage, pageSize, searchText } = filters;
      let allDesigns = Array.from(designCache.values());

      // Apply filters
      if (filters.widthFrom !== undefined && filters.widthTo !== undefined) {
        allDesigns = allDesigns.filter(
          (design) => design.Width >= filters.widthFrom && design.Width <= filters.widthTo
        );
      }
      if (filters.heightFrom !== undefined && filters.heightTo !== undefined) {
        allDesigns = allDesigns.filter(
          (design) => design.Height >= filters.heightFrom && design.Height <= filters.heightTo
        );
      }
      if (filters.ncolorsFrom !== undefined && filters.ncolorsTo !== undefined) {
        allDesigns = allDesigns.filter(
          (design) => design.NColors >= filters.ncolorsFrom && design.NColors <= filters.ncolorsTo
        );
      }
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        allDesigns = await Promise.all(
          allDesigns.map(async (design) => {
            const designCaption = design.Caption.toLowerCase();
            const albumCaption = (await getAlbumCaption(design.AlbumID))?.toLowerCase() || '';
            return designCaption.includes(searchLower) || albumCaption.includes(searchLower) ? design : null;
          })
        ).then((results) => results.filter((design): design is Design => design !== null));
      }

      const totalItems = allDesigns.length;
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;

      const responseData: DesignsResponse = {
        designs: [],
        entryCount: totalItems,
        page: nPage,
        pageSize,
        totalPages,
      };

      if (totalItems === 0) {
        console.warn("No designs found matching filters");
        return responseData;
      }

      allDesigns.sort((a, b) => b.DesignID - a.DesignID);

      const startIndex = (nPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      responseData.designs = allDesigns.slice(startIndex, endIndex);

      if (responseData.designs.length === 0) {
        console.warn(`No designs found for page ${nPage}`);
      }

      return responseData;
    } catch (error) {
      console.error("Error fetching filtered designs:", error);
      throw error;
    }
  });
}

export async function refreshDesignCache(): Promise<void> {
  console.info('Refreshing design cache');
  designCache.clear();
  albumCaptionCache.clear();
  cacheInitialized = false;
  cacheInitializationPromise = null;
  await initializeDesignCache();
}