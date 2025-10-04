// src/app/api/notify-admin/route.ts
import { NextResponse } from 'next/server';
import { sendEmailToAdmin } from '@/lib/email-service';  // Use the correct filename (email-service.ts)

export async function POST() {
  try {
    await sendEmailToAdmin(
      'Registration Form Opened',
      'A user has opened the registration form.',
      false
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error sending admin notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}