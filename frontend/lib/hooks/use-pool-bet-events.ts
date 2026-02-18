'use client';

import { useQuery } from '@tanstack/react-query';

export interface PoolBetEvent {
  poolId: number;
  txHash: string;
  user: string;
  amountWei: string;
  targetScore: number;
  betIndex: number;
  timestamp: string;
}

async function fetchPoolBets(poolId: number): Promise<PoolBetEvent[]> {
  const res = await fetch(`/api/dice-mania/pools/${poolId}/bets`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.bets ?? [];
}

/**
 * Fetches bet events for a pool from the API (includes txHash for BSCScan links).
 * Returns empty array if API is unavailable or pool has no recorded bets.
 */
export function usePoolBetEvents(poolId: number | null) {
  const { data: bets = [], isLoading } = useQuery({
    queryKey: ['dice-mania', 'pool-bets', poolId],
    queryFn: () => fetchPoolBets(poolId!),
    enabled: poolId != null && poolId >= 0,
  });
  return { bets, isLoading };
}
