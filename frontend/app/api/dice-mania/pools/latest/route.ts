import { NextResponse } from 'next/server';
import { getDiceManiaRepository } from '@/lib/db/mongo';

/**
 * GET /api/dice-mania/pools/latest
 * Return latest pool id from DB (most recent pool_created).
 */
export async function GET() {
  try {
    const repo = await getDiceManiaRepository();
    if (!repo) {
      return NextResponse.json(
        { error: 'Database not configured (MONGODB_URI)' },
        { status: 503 }
      );
    }

    const poolId = await repo.getLatestPoolId();
    return NextResponse.json({ poolId });
  } catch (e) {
    console.error('GET /api/dice-mania/pools/latest', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
