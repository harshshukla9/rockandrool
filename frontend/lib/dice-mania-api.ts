/**
 * Client-side helpers for DiceMania API (record events so tx hashes show in UI / BSCScan links).
 * Call these after successful on-chain transactions.
 */

export interface RecordBetParams {
  poolId: number;
  txHash: string;
  user: string;
  amountWei: bigint | string;
  targetScore: number;
  betIndex: number;
  blockNumber?: number;
}

/**
 * Record a bet event with tx hash (call after placeBet tx confirms).
 * This stores the tx hash so the UI can show "Verify on BSCScan" links.
 * Agents and frontend should call this after a successful placeBet().
 */
export async function recordBetOnServer(params: RecordBetParams): Promise<void> {
  const body = {
    poolId: params.poolId,
    txHash: params.txHash,
    user: params.user,
    amountWei: typeof params.amountWei === 'bigint' ? params.amountWei.toString() : params.amountWei,
    targetScore: params.targetScore,
    betIndex: params.betIndex,
    ...(params.blockNumber != null && { blockNumber: params.blockNumber }),
  };
  const res = await fetch('/api/dice-mania/events/bet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Failed to record bet');
  }
}
