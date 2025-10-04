// src/app/api/notify-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmailToAdmin } from '@/lib/email-service';  // Adjust path if necessary

export async function POST(req: NextRequest) {
  try {
    // Extract the client's IP from headers (handles proxies like Vercel or Cloudflare)
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = xForwardedFor
      ? xForwardedFor.split(',')[0].trim()  // Take the first IP in the chain (client's original IP)
      : req.headers.get('x-real-ip') || 'Unknown';  // Fallback for direct or other headers
    if(!clientIp.startsWith('66.249.')) { // Ignore Googlebot IPs      
      // Send the email with the IP included
      await sendEmailToAdmin(
        'Registration Form Opened',
        `A user has opened the registration form. Client IP: ${clientIp}`,
        false
      );    
  }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error sending admin notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}