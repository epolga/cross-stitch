// route.ts
import { NextResponse } from 'next/server';
import { createUser, createTestUser } from '@/lib/DataAccess';
import { sendEmailToAdmin } from '@/lib/email-service';

import AWS from 'aws-sdk';

// Configure AWS SDK with credentials from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// POST handler for subscription confirmation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Print request JSON to console
    const { email, password, username, subscriptionId, receiveUpdates } = body;
    console.log('Request JSON:', email, password, username, subscriptionId, receiveUpdates);

    // Validate request body
    if (!email || !password || !username || !subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if request is from localhost
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost');

    // Call appropriate user creation function
    if (isLocalhost) {
      console.log('Request from localhost, creating test user');
      await createTestUser(email, password, username, subscriptionId, receiveUpdates ?? false);
    } else {
      console.log('Request from non-localhost, creating regular user');
      await createUser(email, password, username, subscriptionId, receiveUpdates ?? false);
    }

    // Extract user's IP address from headers
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0].trim()) || 'Unknown';

    // Format the email body as HTML for clarity, including IP
    const emailBody = `
      <h2>New Subscription Notification</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
      <p><strong>Receive Updates:</strong> ${receiveUpdates ? 'Yes' : 'No'}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
    `;

    // Send the email and await completion
    await sendEmailToAdmin('New Subscription Notification', emailBody, true);

    return NextResponse.json(
      { message: 'User created and notification email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing subscription confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}