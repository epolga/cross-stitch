// route.ts — strict TS, SES via AWS SDK v3. No aws-sdk (v2) imports.

import { NextResponse } from 'next/server';
import { createUser, createTestUser } from '@/lib/data-access';
import { sendEmailToAdmin } from '@/lib/email-service';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password, username, subscriptionId, receiveUpdates } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Dev convenience: localhost -> createTestUser; otherwise createUser
    const host = request.headers.get('host') ?? '';
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

    if (isLocal) {
      await createTestUser(email, password, username, subscriptionId, Boolean(receiveUpdates));
    } else {
      await createUser(email, password, username, subscriptionId, Boolean(receiveUpdates));
    }

    // Sender IP for the admin email (if available)
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0].trim()) || 'Unknown';

    const emailBody = `
      <h2>New Subscription Notification</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Subscription ID:</strong> ${subscriptionId ?? 'N/A'}</p>
      <p><strong>Receive Updates:</strong> ${Boolean(receiveUpdates)}</p>
      <p><strong>IP:</strong> ${ip}</p>
    `;

    await sendEmailToAdmin('New Subscription Notification', emailBody, true);

    return NextResponse.json(
      { message: 'User created and notification email sent' },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
