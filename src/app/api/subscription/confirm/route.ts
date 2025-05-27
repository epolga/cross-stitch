import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/DataAccess';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, email, password, username } = await request.json();
    console.log('API: Confirming subscription:', { subscriptionId, email, username });

    if (!subscriptionId || !email || !password || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store user in DynamoDB
    await createUser(email, password, username, subscriptionId);
    console.log('API: User registered successfully:', email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Error confirming subscription:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    );
  }
}