import { NextResponse } from 'next/server';
import { createUser, createTestUser } from '@/lib/DataAccess';

// POST handler for subscription confirmation
export async function POST(request: Request) {
  try {
    const { email, password, username, subscriptionId } = await request.json();

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
      await createTestUser(email, password, username, subscriptionId);
    } else {
      console.log('Request from non-localhost, creating regular user');
      await createUser(email, password, username, subscriptionId);
    }

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing subscription confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}