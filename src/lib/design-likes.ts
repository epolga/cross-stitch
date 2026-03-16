import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const LIKES_TABLE_NAME = process.env.DDB_LIKES_TABLE || 'CrossStitchLikes';

const client = new DynamoDBClient({ region: REGION });

export interface DesignLikeState {
  count: number;
  currentUserVote: 'up' | 'down' | null;
}

type StoredVote = 'up' | 'down' | null;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length > 3 && normalized.includes('@') && normalized.includes('.');
}

function designPk(designId: number): string {
  return `DESIGN#${designId}`;
}

function userSk(email: string): string {
  return `USER#${normalizeEmail(email)}`;
}

function userGsiPk(email: string): string {
  return `USER#${normalizeEmail(email)}`;
}

function designGsiSk(designId: number): string {
  return `DESIGN#${designId}`;
}

export function ensureValidLikeEmail(email: string): string {
  if (!isValidEmail(email)) {
    throw new Error('Valid email is required');
  }
  return normalizeEmail(email);
}

function parseStoredVote(item?: Record<string, { S?: string; N?: string }>): StoredVote {
  const voteDirection = item?.VoteDirection?.S;
  if (voteDirection === 'up' || voteDirection === 'down') {
    return voteDirection;
  }

  const voteValue = item?.VoteValue?.N;
  if (voteValue === '1') {
    return 'up';
  }
  if (voteValue === '-1') {
    return 'down';
  }

  if (item?.EntityType?.S === 'LIKE') {
    return 'up';
  }

  return null;
}

export async function getDesignLikeCount(designId: number): Promise<number> {
  const response = await client.send(
    new QueryCommand({
      TableName: LIKES_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: designPk(designId) },
      },
      ProjectionExpression: 'VoteDirection, VoteValue, EntityType',
    }),
  );

  return (response.Items ?? []).reduce((total, item) => {
    const vote = parseStoredVote(item);
    if (vote === 'up') {
      return total + 1;
    }
    if (vote === 'down') {
      return total - 1;
    }
    return total;
  }, 0);
}

export async function getUserDesignVote(designId: number, email: string): Promise<StoredVote> {
  const normalizedEmail = ensureValidLikeEmail(email);
  const response = await client.send(
    new GetItemCommand({
      TableName: LIKES_TABLE_NAME,
      Key: {
        PK: { S: designPk(designId) },
        SK: { S: userSk(normalizedEmail) },
      },
      ProjectionExpression: 'VoteDirection, VoteValue, EntityType',
    }),
  );

  return parseStoredVote(response.Item);
}

export async function getDesignLikeState(designId: number, email?: string): Promise<DesignLikeState> {
  const count = await getDesignLikeCount(designId);
  if (!email) {
    return {
      count,
      currentUserVote: null,
    };
  }

  const currentUserVote = await getUserDesignVote(designId, email);
  return {
    count,
    currentUserVote,
  };
}

async function putDesignVote(designId: number, email: string, vote: Exclude<StoredVote, null>): Promise<void> {
  const normalizedEmail = ensureValidLikeEmail(email);
  const now = new Date().toISOString();
  const voteValue = vote === 'up' ? '1' : '-1';

  await client.send(
    new PutItemCommand({
      TableName: LIKES_TABLE_NAME,
      Item: {
        PK: { S: designPk(designId) },
        SK: { S: userSk(normalizedEmail) },
        GSI1PK: { S: userGsiPk(normalizedEmail) },
        GSI1SK: { S: designGsiSk(designId) },
        EntityType: { S: 'VOTE' },
        DesignID: { N: String(designId) },
        UserEmail: { S: normalizedEmail },
        VoteDirection: { S: vote },
        VoteValue: { N: voteValue },
        CreatedAt: { S: now },
        UpdatedAt: { S: now },
      },
    }),
  );
}

export async function removeDesignLike(designId: number, email: string): Promise<void> {
  const normalizedEmail = ensureValidLikeEmail(email);

  await client.send(
    new DeleteItemCommand({
      TableName: LIKES_TABLE_NAME,
      Key: {
        PK: { S: designPk(designId) },
        SK: { S: userSk(normalizedEmail) },
      },
    }),
  );
}

export async function setDesignVote(
  designId: number,
  email: string,
  requestedVote: Exclude<StoredVote, null>,
): Promise<DesignLikeState> {
  const currentVote = await getUserDesignVote(designId, email);

  if (currentVote === requestedVote) {
    return getDesignLikeState(designId, email);
  }

  if (currentVote === null) {
    await putDesignVote(designId, email, requestedVote);
    return getDesignLikeState(designId, email);
  }

  await removeDesignLike(designId, email);

  return getDesignLikeState(designId, email);
}

export function isConditionalCheckFailure(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  return (
    name === 'ConditionalCheckFailedException' ||
    message.includes('ConditionalCheckFailed') ||
    message.includes('ConditionalCheckFailedException')
  );
}

export function isResourceNotFound(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  return name === 'ResourceNotFoundException' || message.includes('ResourceNotFoundException');
}
