import { NextResponse } from 'next/server';
import { getUserSubscriptionStatusByEmail } from '@/lib/users';

interface StatusRequestBody {
  email?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as StatusRequestBody | null;
    const normalizedEmail = body?.email?.trim().toLowerCase() ?? '';

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const subscription = await getUserSubscriptionStatusByEmail(normalizedEmail);
    if (!subscription?.subscriptionId) {
      return NextResponse.json({
        active: false,
        status: 'NONE',
      });
    }

    if (!subscription.subscriptionActive) {
      return NextResponse.json({
        active: false,
        status: 'INACTIVE_RECORDED',
        subscriptionId: subscription.subscriptionId,
      });
    }

    return NextResponse.json({
      active: true,
      status: 'ACTIVE_RECORDED',
      subscriptionId: subscription.subscriptionId,
      subscriptionStartedAt: subscription.subscriptionStartedAt,
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
