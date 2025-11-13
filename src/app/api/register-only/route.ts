import { NextResponse } from 'next/server';
import { saveUserMock } from '@/lib/data-access';

interface RegisterRequest {
  email: string;
  firstName: string;
  password: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: RegisterRequest = await req.json();
    const { email, firstName, password } = body;

    // Validate payload
    if (!email || !firstName || !password) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    // Call mock persistence
    const result = await saveUserMock({ email, firstName, password });

    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : 'Unknown server error';
    return new NextResponse(message, { status: 500 });
  }
}
