'use client';

import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { contract } from '@/lib/contract';
import { diceManiaAbi, type DiceBet, type DicePoolView } from '@/lib/dice-mania-abi';
import { recordBetOnServer } from '@/lib/dice-mania-api';
import { useCallback } from 'react';

const address = contract.address as `0x${string}`;

/** Chain ID for BNB (BSC mainnet). Use when writing so wagmi targets correct chain. */
export const BSC_CHAIN_ID = 56;

// -----------------------------------------------------------------------------
// Read hooks
// -----------------------------------------------------------------------------

/**
 * Total number of pools (next pool id = total pools).
 * Use poolId - 1 for latest pool index when poolId > 0.
 */
export function useDiceManiaTotalPools() {
  const result = useReadContract({
    address,
    abi: diceManiaAbi,
    functionName: 'getTotalPools',
  });
  return {
    ...result,
    totalPools: result.data != null ? Number(result.data) : 0,
    nextPoolId: result.data != null ? Number(result.data) : 0,
  };
}

/**
 * Single pool by id. Returns pool details and total bet count.
 */
export function useDiceManiaPool(poolId: number | bigint) {
  const id = typeof poolId === 'number' ? BigInt(poolId) : poolId;
  const result = useReadContract({
    address,
    abi: diceManiaAbi,
    functionName: 'getPool',
    args: [id],
  });
  const raw = result.data;
  const pool: DicePoolView | null =
    raw && Array.isArray(raw)
      ? {
          id: raw[0],
          start: raw[1],
          end: raw[2],
          totalAmount: raw[3],
          result: raw[4],
          ended: raw[5],
          baseamount: raw[6],
          totalBets: raw[7],
        }
      : null;
  return {
    ...result,
    pool,
    /** Human-friendly: is betting still open (before end and not ended). */
    isBettingOpen: pool
      ? !pool.ended && BigInt(Math.floor(Date.now() / 1000)) < pool.end
      : false,
    /** Seconds remaining until pool end (0 if ended or past end). */
    secondsLeft: pool
      ? pool.ended
        ? 0
        : Math.max(0, Number(pool.end) - Math.floor(Date.now() / 1000))
      : 0,
  };
}

/**
 * All bets for a pool. Order is placement order (first bet = index 0).
 */
export function useDiceManiaBets(poolId: number | bigint) {
  const id = typeof poolId === 'number' ? BigInt(poolId) : poolId;
  const result = useReadContract({
    address,
    abi: diceManiaAbi,
    functionName: 'getBets',
    args: [id],
  });
  const bets: DiceBet[] = Array.isArray(result.data) ? (result.data as DiceBet[]) : [];
  return {
    ...result,
    bets,
  };
}

/**
 * Contract owner (admin). Only owner can createPool and resolvePool.
 */
export function useDiceManiaOwner() {
  return useReadContract({
    address,
    abi: diceManiaAbi,
    functionName: 'owner',
  });
}

// -----------------------------------------------------------------------------
// Write hooks (transactions)
// -----------------------------------------------------------------------------

/**
 * Place a bet on a pool. Send exact baseamount (in wei) as msg.value.
 * Target must be 1–12. Fails if pool closed, betting over, or wrong amount.
 * Returns the transaction hash.
 */
export function usePlaceBet() {
  const { writeContractAsync, ...rest } = useWriteContract();
  const placeBet = useCallback(
    async (poolId: number | bigint, target: number, valueWei: bigint) => {
      const id = typeof poolId === 'number' ? BigInt(poolId) : poolId;
      if (target < 1 || target > 12) throw new Error('Target must be 1–12');
      return writeContractAsync({
        address,
        abi: diceManiaAbi,
        functionName: 'placeBet',
        args: [id, BigInt(target)],
        value: valueWei,
      });
    },
    [writeContractAsync]
  );
  return { placeBet, ...rest };
}

/**
 * Place a bet and record it on the server (with tx hash) so the UI shows "Verify on BSCScan".
 * Call this when the user/agent places a bet and you have the current bet count (betIndex = count before this bet).
 */
export function usePlaceBetAndRecord() {
  const { address } = useAccount();
  const { placeBet, ...rest } = usePlaceBet();

  const placeBetAndRecord = useCallback(
    async (
      poolId: number,
      target: number,
      valueWei: bigint,
      betIndex: number
    ) => {
      const txHash = await placeBet(poolId, target, valueWei);
      if (address && txHash) {
        await recordBetOnServer({
          poolId,
          txHash,
          user: address,
          amountWei: valueWei,
          targetScore: target,
          betIndex,
        });
      }
      return txHash;
    },
    [placeBet, address]
  );

  return { placeBetAndRecord, placeBet, ...rest };
}

/**
 * Resolve a pool (owner only). Call after pool end time; picks random 1–12 and pays winners.
 */
export function useResolvePool() {
  const { writeContractAsync, ...rest } = useWriteContract();
  const resolvePool = useCallback(
    async (poolId: number | bigint) => {
      const id = typeof poolId === 'number' ? BigInt(poolId) : poolId;
      return writeContractAsync({
        address,
        abi: diceManiaAbi,
        functionName: 'resolvePool',
        args: [id],
      });
    },
    [writeContractAsync]
  );
  return { resolvePool, ...rest };
}

/**
 * Create a new pool (owner only). Duration in seconds, baseamount in wei per bet.
 */
export function useCreatePool() {
  const { writeContractAsync, ...rest } = useWriteContract();
  const createPool = useCallback(
    async (durationSeconds: number | bigint, baseAmountWei: bigint) => {
      const duration = typeof durationSeconds === 'number' ? BigInt(durationSeconds) : durationSeconds;
      return writeContractAsync({
        address,
        abi: diceManiaAbi,
        functionName: 'createPool',
        args: [duration, baseAmountWei],
      });
    },
    [writeContractAsync]
  );
  return { createPool, ...rest };
}

/**
 * Withdraw contract balance (owner only). Amount in wei.
 */
export function useWithdraw() {
  const { writeContractAsync, ...rest } = useWriteContract();
  const withdraw = useCallback(
    async (amountWei: bigint) => {
      return writeContractAsync({
        address,
        abi: diceManiaAbi,
        functionName: 'withdraw',
        args: [amountWei],
      });
    },
    [writeContractAsync]
  );
  return { withdraw, ...rest };
}

// -----------------------------------------------------------------------------
// Helpers for agents / UI
// -----------------------------------------------------------------------------

/** Minimum prediction number. */
export const MIN_TARGET = 1;
/** Maximum prediction number. */
export const MAX_TARGET = 12;

/**
 * Check if current wallet is contract owner (for admin actions).
 */
export function useIsDiceManiaOwner() {
  const { address: userAddress } = useAccount();
  const { data: ownerAddress } = useDiceManiaOwner();
  const isOwner =
    userAddress != null &&
    ownerAddress != null &&
    userAddress.toLowerCase() === (ownerAddress as string).toLowerCase();
  return { isOwner, ownerAddress: ownerAddress as `0x${string}` | undefined };
}
