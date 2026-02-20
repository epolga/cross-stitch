import { NextResponse } from 'next/server';
import { createUser, createTestUser } from '@/lib/data-access';
import { sendEmailToAdmin } from '@/lib/email-service';
import { setSubscriptionActiveByEmail } from '@/lib/users';

interface ConfirmSubscriptionRequestBody {
  email?: string;
  password?: string;
  username?: string;
  subscriptionId?: string;
  receiveUpdates?: boolean;
}

function isDuplicateUserError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === 'EmailExistsError' ||
    (error as { code?: string }).code === 'EmailExists' ||
    error.message.includes('Email already registered')
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as
      | ConfirmSubscriptionRequestBody
      | null;

    const email = body?.email?.trim().toLowerCase() ?? '';
    const password = body?.password?.trim() ?? '';
    const username = body?.username?.trim() || email.split('@')[0] || 'User';
    const subscriptionId = body?.subscriptionId?.trim() ?? '';
    const receiveUpdates = Boolean(body?.receiveUpdates);

    if (!email || !subscriptionId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const host = request.headers.get('host') ?? '';
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

    if (password) {
      try {
        if (isLocal) {
          await createTestUser(email, password, username, subscriptionId, receiveUpdates);
        } else {
          await createUser(email, password, username, subscriptionId, receiveUpdates);
        }
      } catch (error) {
        if (!isDuplicateUserError(error)) {
          throw error;
        }
      }
    }

    const activated = await setSubscriptionActiveByEmail(email, subscriptionId);
    if (!activated) {
      return NextResponse.json(
        {
          error:
            'Subscription approved but user account was not found. Please register first, then retry subscription.',
        },
        { status: 404 },
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown';

    const emailBody = `
      <h2>New Subscription Notification</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
      <p><strong>Receive Updates:</strong> ${receiveUpdates}</p>
      <p><strong>IP:</strong> ${ip}</p>
    `;

    await sendEmailToAdmin('New Subscription Notification', emailBody, true);

    return NextResponse.json(
      { message: 'Subscription stored and notification email sent' },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
