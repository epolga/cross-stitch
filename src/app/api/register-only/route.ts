// src/app/api/register-only/route.ts
import { NextResponse } from 'next/server';
import {
  saveUserToDynamoDB,
  EmailExistsError,
  type NewUserRegistration,
} from '@/lib/users';

type RegisterRequest = NewUserRegistration;

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as Partial<RegisterRequest>;

    if (!body.email || !body.firstName || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const result = await saveUserToDynamoDB({
      email: body.email,
      firstName: body.firstName,
      password: body.password,
    });

    return NextResponse.json(
      { ok: true, userId: result.userId },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof EmailExistsError) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 },
      );
    }

    const message =
      error instanceof Error ? error.message : 'Server error';

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
