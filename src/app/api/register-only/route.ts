// src/app/api/register-only/route.ts
import { NextResponse } from 'next/server';
import {
  saveUserToDynamoDB,
  EmailExistsError,
  type NewUserRegistration,
} from '@/lib/users';
import { sendEmailToAdmin } from '@/lib/email-service';
import type { RegistrationSourceInfo } from '@/types/registration';

type RegisterRequest = NewUserRegistration & {
  sourceInfo?: RegistrationSourceInfo | null;
};

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as Partial<RegisterRequest>;

    if (!body.email || !body.firstName || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const sourceInfo = body.sourceInfo;

    const result = await saveUserToDynamoDB({
      email: body.email,
      firstName: body.firstName,
      password: body.password,
    });

    try {
      const sourceRows = sourceInfo
        ? [
            `<li><strong>Source:</strong> ${sourceInfo.label ?? sourceInfo.source}</li>`,
            sourceInfo.designUrl
              ? `<li><strong>Design:</strong> <a href="${sourceInfo.designUrl}">${
                  sourceInfo.designCaption ?? sourceInfo.designUrl
                }</a></li>`
              : '',
          ].join('')
        : '';

      await sendEmailToAdmin(
        `New user registered: ${body.firstName}`,
        `<p>A new user has registered on Cross Stitch Pattern.</p>
        <ul>
          <li><strong>Name:</strong> ${body.firstName}</li>
          <li><strong>Email:</strong> ${body.email}</li>
          ${sourceRows}
        </ul>
        <p>You can reach out to welcome them or verify their subscription status.</p>`
      );
    } catch (notifyError) {
      console.error('Failed to send admin registration email:', notifyError);
    }

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
