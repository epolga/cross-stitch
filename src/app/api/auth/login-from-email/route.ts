import { NextResponse } from 'next/server';
import { getVerifiedUserByCid, updateLastEmailEntryInUsersTable } from '@/lib/users';
import { updateLastEmailEntryByCid } from '@/lib/data-access';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { eid?: string; cid?: string };
    const cid = (body.cid || '').trim();

    if (!cid) {
      return NextResponse.json({ success: false, error: 'Missing cid' }, { status: 400 });
    }

    const verifiedUser = await getVerifiedUserByCid(cid);
    if (!verifiedUser) {
      return NextResponse.json(
        { success: false, error: 'User not verified or not found' },
        { status: 403 },
      );
    }

    await Promise.all([
      updateLastEmailEntryInUsersTable(cid),
      updateLastEmailEntryByCid(cid),
    ]);

    return NextResponse.json(
      { success: true, email: verifiedUser.email ?? '' },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
