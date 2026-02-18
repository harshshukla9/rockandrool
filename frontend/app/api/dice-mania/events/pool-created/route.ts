import { NextRequest, NextResponse } from 'next/server';
import { getDiceManiaRepository } from '@/lib/db/mongo';

/**
 * POST /api/dice-mania/events/pool-created
 * Record a pool creation (call after createPool tx confirms).
 * Body: { poolId, startTime, endTime, durationSeconds, baseAmountWei, txHash?, blockNumber? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      poolId,
      startTime,
      endTime,
      durationSeconds,
      baseAmountWei,
      txHash,
      blockNumber,
    } = body;

    if (
      typeof poolId !== 'number' ||
      typeof startTime !== 'number' ||
      typeof endTime !== 'number' ||
      typeof durationSeconds !== 'number' ||
      (typeof baseAmountWei !== 'string' && typeof baseAmountWei !== 'number')
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid: poolId, startTime, endTime, durationSeconds, baseAmountWei' },
        { status: 400 }
      );
    }

    const repo = await getDiceManiaRepository();
    if (!repo) {
      return NextResponse.json(
        { error: 'Database not configured (MONGODB_URI)' },
        { status: 503 }
      );
    }

    const wei = typeof baseAmountWei === 'string' ? BigInt(baseAmountWei) : BigInt(baseAmountWei);
    await repo.recordPoolCreated({
      poolId,
      startTime,
      endTime,
      durationSeconds,
      baseAmountWei: wei,
      txHash: typeof txHash === 'string' ? txHash : undefined,
      blockNumber: typeof blockNumber === 'number' ? blockNumber : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/dice-mania/events/pool-created', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
