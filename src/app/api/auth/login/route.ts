import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/data-access';
import { updateLastSeenAtByEmail } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Login request received');
    const { email, password } = await request.json();
    console.log('API: Received login request:', { email });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const isValid = await verifyUser(email, password);
    console.log('API: verifyUser result:', isValid);

    if (isValid) {
      try {
        await updateLastSeenAtByEmail(email);
      } catch (err) {
        console.error('[login] Failed to update LastSeenAt:', err);
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('API: Error during login:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
