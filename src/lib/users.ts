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

const client = new DynamoDBClient({ region: REGION });

export interface NewUserRegistration {
  email: string;
  firstName: string;
  password: string;
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
  const unsubscribeToken = randomUUID();
  const cid = randomUUID();

  if (!email || !firstName || !password) {
    throw new Error('Missing required fields');
  }

  const id = `USR#${email}`;
  const createdAt = new Date().toISOString();

  const item: Record<string, AttributeValue> = {
    ID: { S: id },
    Email: { S: email },
    FirstName: { S: firstName },
    Password: { S: password }, // Storing plain password for migration purposes
    CreatedAt: { S: createdAt },
    UnsubscribeToken: { S: unsubscribeToken },
    Unsubscribed: { BOOL: false },
    cid: { S: cid },
  };

  const params: PutItemCommandInput = {
    TableName: USERS_TABLE_NAME,
    Item: item,
    // Do not overwrite existing user
    ConditionExpression: 'attribute_not_exists(id)',
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
    Limit: 1,
  };

  const { Items } = await client.send(new ScanCommand(scanParams));
  const id = Items?.[0]?.ID?.S;
  if (!id) {
    console.warn(`No user found for c ${trimmedCid} in ${tableName}`);
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

  const scanParams: ScanCommandInput = {
    TableName: USERS_TABLE_NAME,
    FilterExpression: '#token = :token',
    ExpressionAttributeNames: {
      '#token': 'UnsubscribeToken',
    },
    ExpressionAttributeValues: {
      ':token': { S: trimmedToken },
    },
    ProjectionExpression: 'ID, Email, Unsubscribed',
    Limit: 1,
  };

  const scanResult = await client.send(new ScanCommand(scanParams));
  const user = scanResult.Items?.[0];

  const userId = user?.ID?.S;
  if (!user || !userId) {
    return { status: 'not-found' };
  }

  const alreadyUnsubscribed = user.Unsubscribed?.BOOL === true;

  if (!alreadyUnsubscribed) {
    const updateParams: UpdateItemCommandInput = {
      TableName: USERS_TABLE_NAME,
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
