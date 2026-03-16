import { NextRequest, NextResponse } from 'next/server';
import { getDesignById } from '@/lib/data-access';
import {
  getDesignLikeState,
  isResourceNotFound,
  removeDesignLike,
  setDesignVote,
} from '@/lib/design-likes';

async function resolveDesignId(params: Promise<{ designId: string }>): Promise<number | null> {
  const { designId } = await params;
  const parsed = parseInt(designId, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getEmailFromRequest(request: NextRequest, bodyEmail?: string): string | undefined {
  const queryEmail = request.nextUrl.searchParams.get('email');
  const headerEmail = request.headers.get('x-user-email');
  const email = bodyEmail || queryEmail || headerEmail || '';
  const normalized = email.trim().toLowerCase();
  return normalized || undefined;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ designId: string }> }) {
  const designId = await resolveDesignId(params);
  if (designId === null) {
    return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
  }

  try {
    const state = await getDesignLikeState(designId, getEmailFromRequest(request));
    return NextResponse.json({ designId, ...state }, { status: 200 });
  } catch (error) {
    console.error('[design-like][GET] Failed to load like state:', error);
    const status = isResourceNotFound(error) ? 500 : 500;
    const message = isResourceNotFound(error)
      ? 'Likes table not found'
      : 'Failed to load like state';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ designId: string }> }) {
  const designId = await resolveDesignId(params);
  if (designId === null) {
    return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; direction?: 'up' | 'down' };
  const email = getEmailFromRequest(request, body.email);
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 401 });
  }
  if (body.direction !== 'up' && body.direction !== 'down') {
    return NextResponse.json({ error: 'Vote direction is required' }, { status: 400 });
  }

  const design = await getDesignById(designId);
  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }

  try {
    const state = await setDesignVote(designId, email, body.direction);
    return NextResponse.json({ designId, ...state }, { status: 200 });
  } catch (error) {
    console.error('[design-like][POST] Failed to update vote:', error);
    const message = isResourceNotFound(error) ? 'Likes table not found' : 'Failed to update vote';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ designId: string }> }) {
  const designId = await resolveDesignId(params);
  if (designId === null) {
    return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = getEmailFromRequest(request, body.email);
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 401 });
  }

  try {
    await removeDesignLike(designId, email);
    const state = await getDesignLikeState(designId, email);
    return NextResponse.json({ designId, ...state }, { status: 200 });
  } catch (error) {
    console.error('[design-like][DELETE] Failed to remove like:', error);
    const message = isResourceNotFound(error) ? 'Likes table not found' : 'Failed to remove like';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
