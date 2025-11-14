// src/lib/users.ts
import {
  DynamoDBClient,
  PutItemCommand,
  type PutItemCommandInput,
  type AttributeValue,
} from '@aws-sdk/client-dynamodb';

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
