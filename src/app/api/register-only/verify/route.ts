import { NextResponse } from 'next/server';
import { verifyUserByToken } from '@/lib/users';
import { sendEmailToAdmin } from '@/lib/email-service';

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Missing verification token' },
        { status: 400 },
      );
    }

    const result = await verifyUserByToken(token);
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }

    try {
      await sendEmailToAdmin(
        'User email verified',
        `<p>User verified their email.</p>
         <ul>
           <li><strong>Email:</strong> ${result.email ?? 'unknown'}</li>
           <li><strong>Name:</strong> ${result.firstName ?? 'unknown'}</li>
         </ul>`,
      );
    } catch (notifyError) {
      console.error('Failed to send admin verification notification:', notifyError);
    }

    const host = req.headers.get('host') || 'cross-stitch-pattern.net';
    const protocol =
      host.includes('localhost') || host.startsWith('127.')
        ? 'http'
        : req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;

    if (result.cid) {
      const redirectUrl = `${baseUrl}/?cid=${encodeURIComponent(result.cid)}&eid=verified`;
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    return NextResponse.json({ ok: true, message: 'Email verified' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
