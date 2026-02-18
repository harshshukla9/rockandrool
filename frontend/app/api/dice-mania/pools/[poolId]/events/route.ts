import { NextRequest, NextResponse } from 'next/server';
import { getDiceManiaRepository } from '@/lib/db/mongo';

/**
 * GET /api/dice-mania/pools/:poolId/events
 * Return all events for a pool (pool_created, bet_placed, pool_resolved).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId: poolIdStr } = await params;
    const poolId = parseInt(poolIdStr, 10);
    if (Number.isNaN(poolId) || poolId < 0) {
      return NextResponse.json({ error: 'Invalid poolId' }, { status: 400 });
    }

    const repo = await getDiceManiaRepository();
    if (!repo) {
      return NextResponse.json(
        { error: 'Database not configured (MONGODB_URI)' },
        { status: 503 }
      );
    }

    const events = await repo.getPoolEvents(poolId);
    return NextResponse.json({ events });
  } catch (e) {
    console.error('GET /api/dice-mania/pools/[poolId]/events', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
