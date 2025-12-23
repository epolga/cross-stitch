// src/lib/users.ts
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  type PutItemCommandInput,
  type AttributeValue,
  type ScanCommandInput,
  type UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

const REGION = process.env.AWS_REGION || 'us-east-1';
const USERS_TABLE_NAME = process.env.DDB_USERS_TABLE || 'CrossStitchUsers';
const PRIMARY_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

const client = new DynamoDBClient({ region: REGION });

export interface NewUserRegistration {
  email: string;
  firstName: string;
  password: string;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  username?: string;
  subscriptionId?: string;
  receiveUpdates?: boolean;
  idOverride?: string;
}

/** Error thrown when email already exists in the users table */
export class EmailExistsError extends Error {
  public readonly code = 'EmailExists';

  constructor(message = 'Email already registered') {
    super(message);
    this.name = 'EmailExistsError';
  }
}


/**
 * Save user to CrossStitchUsers with PK = USR#email.
 * Table schema:
 *  - pk: string (partition key) "USR#<email>"
 *  - email: string
 *  - firstName: string
 *  - passwordHash: string (hex)
 *  - passwordSalt: string (hex)
 *  - createdAt: ISO string
 */
export async function saveUserToDynamoDB(
  input: NewUserRegistration,
): Promise<{ userId: string }> {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const password = input.password;
  const subscriptionId = input.subscriptionId?.trim();
  const username = input.username?.trim();
  const receiveUpdates =
    typeof input.receiveUpdates === 'boolean' ? input.receiveUpdates : true;
  const unsubscribeToken = randomUUID();
  const cid = randomUUID();
  const verificationToken = input.verificationToken || randomUUID();
  const verificationTokenExpiresAt =
    input.verificationTokenExpiresAt ||
    new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(); // 48h default

  if (!email || !firstName || !password) {
    throw new Error('Missing required fields');
  }

  const overrideId = input.idOverride?.trim();
  const id = overrideId || `USR#${email}`;
  const createdAt = new Date().toISOString();

  const item: Record<string, AttributeValue> = {
    ID: { S: id },
    Email: { S: email },
    FirstName: { S: firstName },
    Password: { S: password }, // Storing plain password for migration purposes
    CreatedAt: { S: createdAt },
    ReceiveUpdates: { BOOL: receiveUpdates },
    UnsubscribeToken: { S: unsubscribeToken },
    Unsubscribed: { BOOL: false },
    cid: { S: cid },
    VerificationToken: { S: verificationToken },
    VerificationTokenExpiresAt: { S: verificationTokenExpiresAt },
    Verified: { BOOL: false },
    VerifiedAt: { S: '' },
  };

  if (subscriptionId) {
    item.SubscriptionId = { S: subscriptionId };
  }

  if (username) {
    item.UserName = { S: username };
  }

  const params: PutItemCommandInput = {
    TableName: USERS_TABLE_NAME,
    Item: item,
    // Do not overwrite existing user
    ConditionExpression: 'attribute_not_exists(ID)',
  };

  try {
    await client.send(new PutItemCommand(params));
    return { userId: id };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : String(error);

    if (
      msg.includes('ConditionalCheckFailed') ||
      msg.includes('ConditionalCheckFailedException')
    ) {
      throw new EmailExistsError();
    }
    console.error('Error saving user to DynamoDB:', error);
    throw error;
  }
}

export type UnsubscribeResult =
  | { status: 'updated'; email?: string }
  | { status: 'already-unsubscribed'; email?: string }
  | { status: 'not-found' };

/**
 * Fetch a verified user by cid (secondary users table).
 */
export async function getVerifiedUserByCid(
  cid: string,
): Promise<{ id: string; email?: string } | null> {
  const tableName = process.env.DDB_USERS_TABLE;
  if (!tableName) {
    console.warn('DDB_USERS_TABLE not set; cannot fetch verified user by cid');
    return null;
  }

  const trimmedCid = cid.trim();
  if (!trimmedCid) return null;

  const scanParams: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: '#cid = :cid',
    ExpressionAttributeNames: { '#cid': 'cid' },
    ExpressionAttributeValues: { ':cid': { S: trimmedCid } },
    ProjectionExpression: 'ID, Email, Verified, VerifiedAt',
  };

  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  let match: { id: string; email?: string; verified?: boolean; verifiedAt?: string } | null =
    null;

  do {
    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand({ ...scanParams, ExclusiveStartKey: lastEvaluatedKey }),
    );
    const found = Items?.find((item) => item?.ID?.S);
    if (found?.ID?.S) {
      match = {
        id: found.ID.S,
        email: found.Email?.S,
        verified: found.Verified?.BOOL,
        verifiedAt: found.VerifiedAt?.S,
      };
      break;
    }
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (!match) return null;
  if (match.verified || (match.verifiedAt && match.verifiedAt.length > 0)) {
    return { id: match.id, email: match.email };
  }
  return null;
}

/**
 * Mark user verified by verification token; returns basic info or null if not found/expired.
 */
export async function verifyUserByToken(
  token: string,
): Promise<{ email?: string; firstName?: string; cid?: string } | null> {
  const tableName = process.env.DDB_USERS_TABLE;
  if (!tableName) {
    console.warn('DDB_USERS_TABLE not set; cannot verify user');
    return null;
  }

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return null;
  }

  const scanParams: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: '#token = :token',
    ExpressionAttributeNames: { '#token': 'VerificationToken' },
    ExpressionAttributeValues: { ':token': { S: trimmedToken } },
    ProjectionExpression:
      'ID, Email, FirstName, VerificationTokenExpiresAt, Verified, cid',
  };

  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  let match:
    | {
        id: string;
        email?: string;
        firstName?: string;
        expiresAt?: string;
        verified?: boolean;
        cid?: string;
      }
    | undefined;

  do {
    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand({ ...scanParams, ExclusiveStartKey: lastEvaluatedKey }),
    );
    const found = Items?.find((item) => item?.ID?.S);
    if (found?.ID?.S) {
      match = {
        id: found.ID.S,
        email: found.Email?.S,
        firstName: found.FirstName?.S,
        expiresAt: found.VerificationTokenExpiresAt?.S,
        verified: found.Verified?.BOOL,
        cid: found.cid?.S,
      };
      break;
    }
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (!match) return null;

  if (match.verified) {
    return { email: match.email, firstName: match.firstName, cid: match.cid };
  }

  if (match.expiresAt && new Date(match.expiresAt).getTime() < Date.now()) {
    console.warn('Verification token expired for user', match.id);
    return null;
  }

  const nowIso = new Date().toISOString();

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: { ID: { S: match.id } },
      UpdateExpression:
        'SET #verified = :true, #verifiedAt = :now REMOVE #token, #tokenExp',
      ExpressionAttributeNames: {
        '#verified': 'Verified',
        '#verifiedAt': 'VerifiedAt',
        '#token': 'VerificationToken',
        '#tokenExp': 'VerificationTokenExpiresAt',
      },
      ExpressionAttributeValues: {
        ':true': { BOOL: true },
        ':now': { S: nowIso },
      },
    }),
  );

  return { email: match.email, firstName: match.firstName, cid: match.cid };
}

/**
 * Update LastEmailEntry for a user in the secondary users table by cid.
 * Uses a scan (no index on cid) and updates the first matching record.
 */
export async function updateLastEmailEntryInUsersTable(
  cid: string,
): Promise<void> {
  const tableName = process.env.DDB_USERS_TABLE;
  if (!tableName) {
    console.warn('DDB_USERS_TABLE not set; skipping LastEmailEntry update');
    return;
  }

  const trimmedCid = cid.trim();
  if (!trimmedCid) {
    console.warn('Empty cid provided; skipping LastEmailEntry update');
    return;
  } 
   
  const scanParams: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: '#cid = :cid',
    ExpressionAttributeNames: { '#cid': 'cid' },
    ExpressionAttributeValues: { ':cid': { S: trimmedCid } },
    ProjectionExpression: 'ID',
  };

  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  let id: string | undefined;

  do {
    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand({ ...scanParams, ExclusiveStartKey: lastEvaluatedKey }),
    );
    const match = Items?.find((item) => item?.ID?.S);
    if (match?.ID?.S) {
      id = match.ID.S;
      break;
    }
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (!id) {
    console.warn(`No user found for cid ${trimmedCid} in ${tableName}`);
    return;
  }

  const nowIso = new Date().toISOString();

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: { ID: { S: id } },
      UpdateExpression: 'SET #lastEmailEntry = :now',
      ExpressionAttributeNames: { '#lastEmailEntry': 'LastEmailEntry' },
      ExpressionAttributeValues: { ':now': { S: nowIso } },
    }),
  );
}

export async function updateLastSeenAtByEmail(email: string): Promise<void> {
  const tableName = USERS_TABLE_NAME;
  if (!tableName) {
    console.warn('DDB_USERS_TABLE not set; skipping LastSeenAt update');
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    console.warn('Empty email provided; skipping LastSeenAt update');
    return;
  }

  const nowIso = new Date().toISOString();
  const primaryId = `USR#${normalizedEmail}`;
  const updateParams: UpdateItemCommandInput = {
    TableName: tableName,
    Key: { ID: { S: primaryId } },
    UpdateExpression: 'SET #lastSeenAt = :now',
    ExpressionAttributeNames: { '#lastSeenAt': 'LastSeenAt' },
    ExpressionAttributeValues: { ':now': { S: nowIso } },
    ConditionExpression: 'attribute_exists(ID)',
  };

  try {
    await client.send(new UpdateItemCommand(updateParams));
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      !message.includes('ConditionalCheckFailed') &&
      !message.includes('ConditionalCheckFailedException')
    ) {
      console.error('Error updating LastSeenAt in users table:', error);
      return;
    }
  }

  const scanParams: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: '#email = :email',
    ExpressionAttributeNames: { '#email': 'Email' },
    ExpressionAttributeValues: { ':email': { S: normalizedEmail } },
    ProjectionExpression: 'ID',
    Limit: 100,
  };

  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  let id: string | undefined;

  do {
    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand({ ...scanParams, ExclusiveStartKey: lastEvaluatedKey }),
    );
    const match = Items?.find((item) => item?.ID?.S);
    if (match?.ID?.S) {
      id = match.ID.S;
      break;
    }
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (!id) {
    console.warn(`No user found for email ${normalizedEmail} in ${tableName}`);
    return;
  }

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: { ID: { S: id } },
      UpdateExpression: 'SET #lastSeenAt = :now',
      ExpressionAttributeNames: { '#lastSeenAt': 'LastSeenAt' },
      ExpressionAttributeValues: { ':now': { S: nowIso } },
      ConditionExpression: 'attribute_exists(ID)',
    }),
  );
}

async function findUserByUnsubscribeToken(
  tableName: string,
  token: string,
  entityType?: string,
): Promise<Record<string, AttributeValue> | null> {
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

  do {
    const expressionNames: Record<string, string> = {
      '#token': 'UnsubscribeToken',
    };
    const expressionValues: Record<string, AttributeValue> = {
      ':token': { S: token },
    };
    let filterExpression = '#token = :token';

    if (entityType) {
      expressionNames['#entityType'] = 'EntityType';
      expressionValues[':entityType'] = { S: entityType };
      filterExpression += ' AND #entityType = :entityType';
    }

    const scanParams: ScanCommandInput = {
      TableName: tableName,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ProjectionExpression: 'ID, Email, Unsubscribed',
      Limit: 100,
    };

    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand(scanParams),
    );
    const match = Items?.find((item) => item?.ID?.S);
    if (match) {
      return match;
    }
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return null;
}

/**
 * Marks a user as unsubscribed based on their unique unsubscribe token.
 * Scans CrossStitchUsers for the token, then flips Unsubscribed to true.
 */
export async function unsubscribeUserByToken(
  token: string,
): Promise<UnsubscribeResult> {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return { status: 'not-found' };
  }

  const tables: Array<{ name: string; entityType?: string }> = [];
  if (USERS_TABLE_NAME) {
    tables.push({ name: USERS_TABLE_NAME });
  }
  if (PRIMARY_TABLE_NAME && PRIMARY_TABLE_NAME !== USERS_TABLE_NAME) {
    tables.push({ name: PRIMARY_TABLE_NAME, entityType: 'USER' });
  }

  for (const table of tables) {
    const user = await findUserByUnsubscribeToken(
      table.name,
      trimmedToken,
      table.entityType,
    );
    const userId = user?.ID?.S;
    if (!user || !userId) {
      continue;
    }

    const alreadyUnsubscribed = user.Unsubscribed?.BOOL === true;

    if (!alreadyUnsubscribed) {
      const updateParams: UpdateItemCommandInput = {
        TableName: table.name,
        Key: { ID: { S: userId } },
        UpdateExpression: 'SET #unsub = :true',
        ExpressionAttributeNames: {
          '#unsub': 'Unsubscribed',
        },
        ExpressionAttributeValues: {
          ':true': { BOOL: true },
        },
      };

      await client.send(new UpdateItemCommand(updateParams));
    }

    return {
      status: alreadyUnsubscribed
        ? 'already-unsubscribed'
        : 'updated',
      email: user.Email?.S,
    };
  }

  return { status: 'not-found' };
}
