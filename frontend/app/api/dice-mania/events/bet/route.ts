import { NextRequest, NextResponse } from 'next/server';
import { getDiceManiaRepository } from '@/lib/db/mongo';

/**
 * POST /api/dice-mania/events/bet
 * Record a bet (call after placeBet tx confirms).
 * Body: { poolId, txHash, user, amountWei, targetScore, betIndex, blockNumber? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolId, txHash, user, amountWei, targetScore, betIndex, blockNumber } = body;

    if (
      typeof poolId !== 'number' ||
      typeof txHash !== 'string' ||
      typeof user !== 'string' ||
      (typeof amountWei !== 'string' && typeof amountWei !== 'number') ||
      typeof targetScore !== 'number' ||
      typeof betIndex !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid: poolId, txHash, user, amountWei, targetScore, betIndex' },
        { status: 400 }
      );
    }

    if (targetScore < 1 || targetScore > 12) {
      return NextResponse.json({ error: 'targetScore must be 1–12' }, { status: 400 });
    }

    const repo = await getDiceManiaRepository();
    if (!repo) {
      return NextResponse.json(
        { error: 'Database not configured (MONGODB_URI)' },
        { status: 503 }
      );
    }

    const wei = typeof amountWei === 'string' ? BigInt(amountWei) : BigInt(amountWei);
    await repo.recordBet({
      poolId,
      txHash,
      user,
      amountWei: wei,
      targetScore,
      betIndex,
      blockNumber: typeof blockNumber === 'number' ? blockNumber : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/dice-mania/events/bet', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
