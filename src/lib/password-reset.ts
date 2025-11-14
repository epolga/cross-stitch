// src/lib/password-reset.ts
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  type AttributeValue,
} from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

const REGION = process.env.AWS_REGION || 'us-east-1';
const USERS_TABLE_NAME =
  process.env.DDB_USERS_TABLE || 'CrossStitchUsers';
const RESET_TABLE_NAME =
  process.env.DDB_RESET_TOKENS_TABLE || 'PasswordResetTokens';

const client = new DynamoDBClient({ region: REGION });

const RESET_TTL_SECONDS =
  Number(process.env.PASSWORD_RESET_TTL_SECONDS ?? '7200'); // 2 часа по умолчанию

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Проверка, что пользователь существует.
 * Просто GetItem по ключу ID = USR#email.
 */
export async function userExists(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const id = `USR#${normalized}`;

  const res = await client.send(
    new GetItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        ID: { S: id },
      },
      ProjectionExpression: 'ID',
    }),
  );

  return !!res.Item;
}

/**
 * Создаёт токен восстановления для email и записывает его в таблицу PasswordResetTokens.
 * Возвращает сам токен (строка).
 */
export async function createPasswordResetToken(
  email: string,
): Promise<string> {
  const normalized = normalizeEmail(email);
 console.log('Normalized email for token:', normalized);
  // криптостойкий токен
  const token = crypto.randomBytes(32).toString('hex');
  console.log('RESET_TABLE_NAME :', RESET_TABLE_NAME);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + RESET_TTL_SECONDS;
 console.log('Normalized email for token:', normalized);
  const item: Record<string, AttributeValue> = {
    Token: { S: token },
    Email: { S: normalized },
    CreatedAt: { S: new Date().toISOString() },
    ExpiresAtEpoch: { N: String(expiresAt) },
  };

  await client.send(
    new PutItemCommand({
      TableName: RESET_TABLE_NAME,
      Item: item,
    }),
  );

  return token;
}

/**
 * Проверяет токен:
 *  - если нет записи или токен просрочен — возвращает null
 *  - если валиден — удаляет его и возвращает email пользователя
 */
export async function consumePasswordResetToken(
  token: string,
): Promise<string | null> {
  const res = await client.send(
    new GetItemCommand({
      TableName: RESET_TABLE_NAME,
      Key: {
        Token: { S: token },
      },
    }),
  );

  if (!res.Item) {
    return null;
  }

  const email = res.Item.Email?.S;
  const expiresAtRaw = res.Item.ExpiresAtEpoch?.N;

  if (!email || !expiresAtRaw) {
    // что-то не так с записью — на всякий случай удалим
    await client.send(
      new DeleteItemCommand({
        TableName: RESET_TABLE_NAME,
        Key: { Token: { S: token } },
      }),
    );
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(expiresAtRaw);

  if (Number.isNaN(expiresAt) || now > expiresAt) {
    // просрочен — удаляем
    await client.send(
      new DeleteItemCommand({
        TableName: RESET_TABLE_NAME,
        Key: { Token: { S: token } },
      }),
    );
    return null;
  }

  // токен валиден — сразу удаляем (одноразовый)
  await client.send(
    new DeleteItemCommand({
      TableName: RESET_TABLE_NAME,
      Key: { Token: { S: token } },
    }),
  );

  return email;
}

/**
 * Обновляет пароль пользователя в CrossStitchUsers.
 * Поле Password — в том же виде, как вы сейчас его храните.
 */
export async function updateUserPassword(
  email: string,
  newPassword: string,
): Promise<void> {
  const normalized = normalizeEmail(email);
  const id = `USR#${normalized}`;

  await client.send(
    new UpdateItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        ID: { S: id },
      },
      UpdateExpression: 'SET #pwd = :pwd',
      ExpressionAttributeNames: {
        '#pwd': 'Password',
      },
      ExpressionAttributeValues: {
        ':pwd': { S: newPassword },
      },
    }),
  );
}
