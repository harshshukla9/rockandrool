/**
 * MongoDB document types for DiceMania game events.
 * Use these with your MongoDB client (e.g. mongodb or mongoose).
 */

/** Pool created event (owner called createPool). */
export interface PoolCreatedDoc {
  _id?: unknown;
  event: 'pool_created';
  poolId: number;
  startTime: number;       // unix seconds
  endTime: number;         // unix seconds
  durationSeconds: number;
  baseAmountWei: string;   // bigint as string for JSON
  chainId: number;
  contractAddress: string;
  txHash?: string;
  blockNumber?: number;
  createdAt: Date;
}

/** Single bet placed (user called placeBet). */
export interface BetPlacedDoc {
  _id?: unknown;
  event: 'bet_placed';
  poolId: number;
  txHash: string;
  user: string;            // wallet address
  amountWei: string;
  targetScore: number;     // 1-12
  betIndex: number;        // order in getBets (0 = first)
  chainId: number;
  contractAddress: string;
  blockNumber?: number;
  timestamp: Date;
}

/** Pool resolved (owner called resolvePool). Winners split pool; no winners → owner gets pool. */
export interface PoolResolvedDoc {
  _id?: unknown;
  event: 'pool_resolved';
  poolId: number;
  txHash: string;
  result: number;         // 1-12
  totalAmountWei: string;
  winnerAddresses: string[];
  /** Payout per winner in wei (equal split in current contract). */
  payoutPerWinnerWei: string;
  /** Bet indices of winners (for "top 10 early guesser" logic). */
  winnerBetIndices: number[];
  chainId: number;
  contractAddress: string;
  blockNumber?: number;
  timestamp: Date;
}

export type DiceManiaEventDoc = PoolCreatedDoc | BetPlacedDoc | PoolResolvedDoc;

/** Flattened pool summary for quick lookup (optional; can derive from events). */
export interface PoolSummaryDoc {
  _id?: unknown;
  poolId: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  baseAmountWei: string;
  totalAmountWei: string;
  totalBets: number;
  ended: boolean;
  result?: number;         // set when resolved
  chainId: number;
  contractAddress: string;
  createdAt: Date;
  updatedAt: Date;
}
