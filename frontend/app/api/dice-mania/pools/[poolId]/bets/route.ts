import { NextRequest, NextResponse } from 'next/server';
import { getDiceManiaRepository } from '@/lib/db/mongo';

/**
 * GET /api/dice-mania/pools/:poolId/bets
 * Returns bet events for the pool (with txHash for BSCScan links).
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

    const bets = await repo.getBetsForPool(poolId);
    return NextResponse.json({ bets });
  } catch (e) {
    console.error('GET /api/dice-mania/pools/[poolId]/bets', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
