import { NextResponse } from 'next/server';
import { getUserSubscriptionIdByEmail } from '@/lib/users';

interface StatusRequestBody {
  email?: string;
}

interface PayPalTokenResponse {
  access_token?: string;
  error_description?: string;
  message?: string;
}

interface PayPalSubscriptionResponse {
  status?: string;
  error_description?: string;
  message?: string;
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials');
  }

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await response.json()) as PayPalTokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.message || 'Failed to get PayPal access token');
  }

  return data.access_token;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as StatusRequestBody | null;
    const normalizedEmail = body?.email?.trim().toLowerCase() ?? '';

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const subscriptionId = await getUserSubscriptionIdByEmail(normalizedEmail);
    if (!subscriptionId) {
      return NextResponse.json({
        active: false,
        status: 'NONE',
      });
    }

    const accessToken = await getPayPalAccessToken();
    const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${apiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return NextResponse.json({
        active: false,
        status: 'NOT_FOUND',
        subscriptionId,
      });
    }

    const data = (await response.json().catch(() => ({}))) as PayPalSubscriptionResponse;
    if (!response.ok) {
      throw new Error(
        data.error_description ||
          data.message ||
          `Failed to fetch subscription status (${response.status})`,
      );
    }

    const status = (data.status || 'UNKNOWN').toUpperCase();

    return NextResponse.json({
      active: status === 'ACTIVE',
      status,
      subscriptionId,
    });
  } catch (error: unknown) {
    console.error('[subscription/status] Failed to check subscription:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to check subscription status';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
