// DataAccess.ts
import { AttributeValue, DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import type { Design, DesignsResponse } from '@/app/types/design';
import type { Album, AlbumsResponse } from '@/app/types/album';

// Force SSR to avoid static generation issues
export const dynamic = 'force-dynamic';

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

// In-memory caches for designs and albums
const designCache: Map<number, Design> = new Map();
const albumCache: Map<number, Album> = new Map();
const albumCaptionCache: Map<number, string> = new Map();
let cacheInitialized: boolean = false;
let cacheInitializationPromise: Promise<void> | null = null;

// Initialize the cache by fetching all designs and albums from DynamoDB
async function initializeCache(): Promise<void> {
  if (cacheInitialized) {
    console.info('Cache already initialized');
    return;
  }

  if (cacheInitializationPromise) {
    console.info('Cache initialization already in progress');
    return cacheInitializationPromise;
  }

  cacheInitializationPromise = (async () => {
    try {
      console.info('Starting cache initialization');

      // Scan for designs
      const designScanParams: ScanCommandInput = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        FilterExpression: "EntityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": { S: "DESIGN" },
        },
      };

      let designLastEvaluatedKey: Record<string, AttributeValue> | undefined;
      let totalDesigns = 0;

      do {
        if (designLastEvaluatedKey) {
          designScanParams.ExclusiveStartKey = designLastEvaluatedKey;
        }

        const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(designScanParams));
        designLastEvaluatedKey = LastEvaluatedKey;

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
        
      } while (designLastEvaluatedKey);

      // Scan for albums
      const albumScanParams: ScanCommandInput = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        FilterExpression: "EntityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": { S: "ALBUM" },
        },
      };

      let albumLastEvaluatedKey: Record<string, AttributeValue> | undefined;
      let totalAlbums = 0;

      do {
        if (albumLastEvaluatedKey) {
          albumScanParams.ExclusiveStartKey = albumLastEvaluatedKey;
        }

        const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(albumScanParams));
        albumLastEvaluatedKey = LastEvaluatedKey;

        if (Items && Items.length > 0) {
          Items.forEach((item) => {
            const albumId = item.AlbumID?.N ? parseInt(item.AlbumID.N) : 0;
            const caption = item.Caption?.S || "";
            if (albumId > 0 && caption) {
              const album: Album = {
                AlbumID: albumId,
                Caption: caption,
              };
              albumCache.set(albumId, album);
              albumCaptionCache.set(albumId, caption); // Update caption cache
            }
          });
          totalAlbums += Items.length;
        }

      } while (albumLastEvaluatedKey);

      cacheInitialized = true;
      console.info(`Cache initialized with ${totalDesigns} designs and ${totalAlbums} albums`);
    } catch (error) {
      console.error('Error initializing cache:', error);
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
    await initializeCache();
  } else if (cacheInitializationPromise) {
    console.debug('Waiting for cache initialization');
    await cacheInitializationPromise;
  }
  return fn();
}

// Fetch album caption with caching
export async function getAlbumCaption(albumId: number): Promise<string | undefined> {
  // Check album cache first
  const album = albumCache.get(albumId);
  if (album) {
    return album.Caption;
  }

  // Fallback to caption cache
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
  return withCache(async () => {
    try {
      const albums = Array.from(albumCache.values()).map(album => ({
        albumId: album.AlbumID,
        Caption: album.Caption,
      }));

      if (albums.length === 0) {
        console.warn(`No albums found in cache`);
        return [];
      }

      console.info(`Fetched ${albums.length} albums from cache`);
      return albums;
    } catch (error) {
      console.error(`Error fetching all album captions:`, error);
      return undefined;
    }
  });
}

export async function getAllAlbums(pageSize: number, nPage: number): Promise<AlbumsResponse> {
  return withCache(async () => {
    try {
      const allAlbums = Array.from(albumCache.values());
      const totalItems = allAlbums.length;

      const responseData: AlbumsResponse = {
        albums: [],
        entryCount: totalItems,
        page: nPage,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      };

      if (totalItems === 0) {
        console.warn("No albums found in cache");
        return responseData;
      }

      // Sort by AlbumID
      allAlbums.sort((a, b) => a.AlbumID - b.AlbumID);

      // Paginate
      const startIndex = (nPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      responseData.albums = allAlbums.slice(startIndex, endIndex);

      if (responseData.albums.length === 0) {
        console.warn(`No albums found for page ${nPage}`);
      }

      return responseData;
    } catch (error) {
      console.error("Error fetching albums:", error);
      throw error;
    }
  });
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
export async function getDesignPhotoUrlById(designId: number): Promise<string | undefined | null> {
  return withCache(async () => {
    try {
      const design = designCache.get(designId);
      if (!design) {
        console.warn(`No design found for DesignID ${designId} in cache`);
        return null;
      }
      return design.ImageUrl;
    } catch (error) {
      console.error(`Error fetching design for DesignID ${designId}:`, error);
      return null;
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

      if (totalItems == 0) {
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

export async function fetchAllDesigns(): Promise<Design[]> {
  return withCache(async () => {
    try {
      const allDesigns = Array.from(designCache.values());
      return allDesigns;
    } catch (error) {
      console.error("Error fetching filtered designs:", error);
      throw error;
    }
  });
}

// Retrieve the maximum NPage value for existing users (prefixed with "USR#")
async function getMaxUserNPage(): Promise<number> {
  const scanParams: ScanCommandInput = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    FilterExpression: "#et = :et AND begins_with(ID, :prefix)",
    ExpressionAttributeNames: {
      "#et": "EntityType",
    },
    ExpressionAttributeValues: {
      ":et": { S: "USER" },
      ":prefix": { S: "USR#" },
    },
  };

  let maxNPage = 0;
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

  do {
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(scanParams));
    lastEvaluatedKey = LastEvaluatedKey;

    if (Items && Items.length > 0) {
      Items.forEach((item) => {
        if (item.NPage?.S) {
          const nPageNum = parseInt(item.NPage.S, 10);
          if (!isNaN(nPageNum) && nPageNum > maxNPage) {
            maxNPage = nPageNum;
          }
        }
      });
    }
  } while (lastEvaluatedKey);

  return maxNPage;
}

// Verify user credentials by email and password
export async function verifyUser(email: string, password: string): Promise<boolean> {
  try {
    console.log('verifyUser called with:', { email, password });
    const userId = `USR#${email}`;
    console.log('Querying DynamoDB with ID:', userId);
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "ID = :id",
      ExpressionAttributeValues: {
        ":id": { S: userId },
      },
      Limit: 1,
    };

    const { Items } = await dynamoDBClient.send(new QueryCommand(queryParams));
    console.log('DynamoDB query result:', Items);

    if (!Items || Items.length === 0) {
      console.log(`No user found for ID ${userId}`);
      return false;
    }

    const storedPassword = Items[0].OpenPwd?.S;
    console.log('Stored password:', storedPassword);
    if (!storedPassword) {
      console.log(`No OpenPwd found for ID ${userId}`);
      return false;
    }

    const isMatch = storedPassword === password;
    console.log('Password match:', isMatch);
    return isMatch;
  } catch (error) {
    console.error(`Error verifying user for ID USR#${email}:`, error);
    return false;
  }
}

// Create a new user in DynamoDB
export async function createUser(email: string, password: string, username: string, subscriptionId: string, receiveUpdates: boolean): Promise<void> {
  const userId = `USR#${email}`;
  try {
    console.log('Creating user:', { email, username, subscriptionId, receiveUpdates });
    const maxNPage = await getMaxUserNPage();
    const newNPageNum = maxNPage + 1;
    const newNPage = newNPageNum.toString().padStart(7, "0");
    const putParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: {
        ID: { S: userId },
        OpenPwd: { S: password },
        UserName: { S: username },
        Email: { S: email },
        SubscriptionId: { S: subscriptionId },
        ReceiveUpdates: { BOOL: receiveUpdates },
        DateCreated: { S: new Date().toISOString() },
        NPage: { S: newNPage },
        EntityType: { S: "USER" },
      },
      ConditionExpression: 'attribute_not_exists(ID)', // Prevent overwrites
    };

    await dynamoDBClient.send(new PutItemCommand(putParams));
    console.log('User created successfully:', userId);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { message: String(error), name: 'UnknownError', stack: '' };
    console.error(`Error creating user for ID ${userId}:`, errorDetails);
    throw error;
  }
}

// Create a new test user in DynamoDB
export async function createTestUser(email: string, password: string, username: string, subscriptionId: string, receiveUpdates: boolean): Promise<void> {
  const userId = `TST#${email}`+ Date.now();
  try {
    console.log('Creating test user:', { email, username, subscriptionId, receiveUpdates });
    const putParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: {
        ID: { S: userId },
        OpenPwd: { S: password },
        Username: { S: username },
        Email: { S: email },
        SubscriptionId: { S: subscriptionId },
        ReceiveUpdates: { BOOL: receiveUpdates },
        DateCreated: { S: new Date().toISOString() },
        NPage: { S: "00000" },
        EntityType: { S: "USER" },
      },
      ConditionExpression: 'attribute_not_exists(ID)', // Prevent overwrites
    };

    await dynamoDBClient.send(new PutItemCommand(putParams));
    console.log('Test user created successfully:', userId);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { message: String(error), name: 'UnknownError', stack: '' };
    console.error(`Error creating test user for ID ${userId}:`, errorDetails);
    throw error;
  }
}

export async function refreshCache(): Promise<void> {
  console.info('Refreshing cache');
  designCache.clear();
  albumCache.clear();
  albumCaptionCache.clear();
  cacheInitialized = false;
  cacheInitializationPromise = null;
  await initializeCache();
}

export function isCacheInitialized(): boolean {
  return cacheInitialized;
}

export async function getAlbumIdByCaption(caption: string): Promise<number | null> {
  return withCache(async () => {
    for (const album of albumCache.values()) {
      if (album.Caption === caption) {
        return album.AlbumID;
      }
    }
    return null;
  });
}

export async function getDesignIdByAlbumAndPage(albumId: number, nPage: number): Promise<number | null> {
  return withCache(async () => {
    nPage++; // Adjust for zero-based NPage
    for (const design of designCache.values()) {
      if (design.AlbumID === albumId && design.NPage === nPage) {
        return design.DesignID;
      }
    }
    return null;
  });
}

// ===== Mock registration persistence (replace with real DynamoDB later) =====

/** Payload for a new user created via the "register-only" dialog */
export type NewUserRegistration = {
  email: string;
  firstName: string;
  password: string;
};

/**
 * Mock function that pretends to save a new user to DynamoDB.
 * Replace this with AWS SDK v3 calls to DynamoDB when ready.
 */
export async function saveUserMock(
  user: NewUserRegistration
): Promise<{ userId: string }> {
  // Simulate network/DB latency
  await new Promise((r) => setTimeout(r, 200));

  // Server log to verify payload during development
  console.log('[data-access] saveUserMock:', {
    email: user.email,
    firstName: user.firstName,
    passwordLength: user.password?.length ?? 0,
  });

  // Return a mock ID
  return { userId: `mock-${Date.now()}` };
}
