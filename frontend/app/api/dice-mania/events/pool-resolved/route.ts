import { NextRequest, NextResponse } from 'next/server';
import { getDiceManiaRepository } from '@/lib/db/mongo';

/**
 * POST /api/dice-mania/events/pool-resolved
 * Record pool resolution (call after resolvePool tx confirms).
 * Body: { poolId, txHash, result, totalAmountWei, winnerAddresses, payoutPerWinnerWei, winnerBetIndices, blockNumber? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      poolId,
      txHash,
      result,
      totalAmountWei,
      winnerAddresses,
      payoutPerWinnerWei,
      winnerBetIndices,
      blockNumber,
    } = body;

    if (
      typeof poolId !== 'number' ||
      typeof txHash !== 'string' ||
      typeof result !== 'number' ||
      (typeof totalAmountWei !== 'string' && typeof totalAmountWei !== 'number') ||
      !Array.isArray(winnerAddresses) ||
      (typeof payoutPerWinnerWei !== 'string' && typeof payoutPerWinnerWei !== 'number') ||
      !Array.isArray(winnerBetIndices)
    ) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid: poolId, txHash, result, totalAmountWei, winnerAddresses, payoutPerWinnerWei, winnerBetIndices',
        },
        { status: 400 }
      );
    }

    if (result < 1 || result > 12) {
      return NextResponse.json({ error: 'result must be 1–12' }, { status: 400 });
    }

    const repo = await getDiceManiaRepository();
    if (!repo) {
      return NextResponse.json(
        { error: 'Database not configured (MONGODB_URI)' },
        { status: 503 }
      );
    }

    const totalWei = typeof totalAmountWei === 'string' ? BigInt(totalAmountWei) : BigInt(totalAmountWei);
    const payoutWei =
      typeof payoutPerWinnerWei === 'string' ? BigInt(payoutPerWinnerWei) : BigInt(payoutPerWinnerWei);

    await repo.recordPoolResolved({
      poolId,
      txHash,
      result,
      totalAmountWei: totalWei,
      winnerAddresses: winnerAddresses as string[],
      payoutPerWinnerWei: payoutWei,
      winnerBetIndices: winnerBetIndices as number[],
      blockNumber: typeof blockNumber === 'number' ? blockNumber : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/dice-mania/events/pool-resolved', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
