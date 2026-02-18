/**
 * DiceMania MongoDB repository.
 * Pass your MongoDB collections (from mongodb or mongoose) to record and query game events.
 *
 * Example with native driver:
 *   import { MongoClient } from 'mongodb';
 *   const client = await MongoClient.connect(process.env.MONGODB_URI!);
 *   const db = client.db('dice_mania');
 *   const repo = createDiceManiaRepository({
 *     events: db.collection('events'),
 *     poolSummaries: db.collection('pool_summaries'),
 *   }, { chainId: 56, contractAddress: '0x...' });
 */

import type {
  PoolCreatedDoc,
  BetPlacedDoc,
  PoolResolvedDoc,
  PoolSummaryDoc,
} from './dice-mania-types';

/** Minimal collection interface (matches MongoDB driver and Mongoose). */
export interface DiceManiaCollection<T extends { _id?: unknown }> {
  insertOne(doc: T): Promise<{ insertedId: unknown }>;
  insertMany(docs: T[]): Promise<{ insertedIds: Record<number, unknown> }>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  find(filter: Record<string, unknown>, options?: { sort?: Record<string, 1 | -1>; limit?: number }): Promise<T[]>;
  updateOne(
    filter: Record<string, unknown>,
    update: { $set: Partial<T> }
  ): Promise<{ matchedCount: number; modifiedCount: number }>;
}

export interface DiceManiaRepoConfig {
  chainId: number;
  contractAddress: string;
}

export interface DiceManiaRepoCollections {
  /** All events: pool_created, bet_placed, pool_resolved. */
  events: DiceManiaCollection<PoolCreatedDoc | BetPlacedDoc | PoolResolvedDoc>;
  /** Optional: pool summaries for fast lookup. If not provided, summary methods are no-ops or throw. */
  poolSummaries?: DiceManiaCollection<PoolSummaryDoc>;
}

function toWeiString(value: bigint): string {
  return value.toString();
}

/**
 * Create repository for recording and querying DiceMania events.
 */
export function createDiceManiaRepository(
  collections: DiceManiaRepoCollections,
  config: DiceManiaRepoConfig
) {
  const { chainId, contractAddress } = config;
  const { events, poolSummaries } = collections;

  async function recordPoolCreated(params: {
    poolId: number;
    startTime: number;
    endTime: number;
    durationSeconds: number;
    baseAmountWei: bigint;
    txHash?: string;
    blockNumber?: number;
  }) {
    const doc: PoolCreatedDoc = {
      event: 'pool_created',
      poolId: params.poolId,
      startTime: params.startTime,
      endTime: params.endTime,
      durationSeconds: params.durationSeconds,
      baseAmountWei: toWeiString(params.baseAmountWei),
      chainId,
      contractAddress,
      txHash: params.txHash,
      blockNumber: params.blockNumber,
      createdAt: new Date(),
    };
    await events.insertOne(doc);

    if (poolSummaries) {
      const summary: PoolSummaryDoc = {
        poolId: params.poolId,
        startTime: params.startTime,
        endTime: params.endTime,
        durationSeconds: params.durationSeconds,
        baseAmountWei: toWeiString(params.baseAmountWei),
        totalAmountWei: '0',
        totalBets: 0,
        ended: false,
        chainId,
        contractAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await poolSummaries.insertOne(summary);
    }
  }

  async function recordBet(params: {
    poolId: number;
    txHash: string;
    user: string;
    amountWei: bigint;
    targetScore: number;
    betIndex: number;
    blockNumber?: number;
  }) {
    const doc: BetPlacedDoc = {
      event: 'bet_placed',
      poolId: params.poolId,
      txHash: params.txHash,
      user: params.user,
      amountWei: toWeiString(params.amountWei),
      targetScore: params.targetScore,
      betIndex: params.betIndex,
      chainId,
      contractAddress,
      blockNumber: params.blockNumber,
      timestamp: new Date(),
    };
    await events.insertOne(doc);

    if (poolSummaries) {
      const summary = await poolSummaries.findOne({ poolId: params.poolId }) as PoolSummaryDoc | null;
      if (summary) {
        const newTotal = BigInt(summary.totalAmountWei) + params.amountWei;
        await poolSummaries.updateOne(
          { poolId: params.poolId },
          {
            $set: {
              totalAmountWei: newTotal.toString(),
              totalBets: summary.totalBets + 1,
              updatedAt: new Date(),
            } as Partial<PoolSummaryDoc>,
          }
        );
      }
    }
  }

  async function recordPoolResolved(params: {
    poolId: number;
    txHash: string;
    result: number;
    totalAmountWei: bigint;
    winnerAddresses: string[];
    payoutPerWinnerWei: bigint;
    winnerBetIndices: number[];
    blockNumber?: number;
  }) {
    const doc: PoolResolvedDoc = {
      event: 'pool_resolved',
      poolId: params.poolId,
      txHash: params.txHash,
      result: params.result,
      totalAmountWei: toWeiString(params.totalAmountWei),
      winnerAddresses: params.winnerAddresses,
      payoutPerWinnerWei: toWeiString(params.payoutPerWinnerWei),
      winnerBetIndices: params.winnerBetIndices,
      chainId,
      contractAddress,
      blockNumber: params.blockNumber,
      timestamp: new Date(),
    };
    await events.insertOne(doc);

    if (poolSummaries) {
      await poolSummaries.updateOne(
        { poolId: params.poolId },
        {
          $set: {
            ended: true,
            result: params.result,
            totalAmountWei: toWeiString(params.totalAmountWei),
            updatedAt: new Date(),
          } as Partial<PoolSummaryDoc>,
        }
      );
    }
  }

  async function getBetsForPool(poolId: number): Promise<BetPlacedDoc[]> {
    const list = await events.find(
      { event: 'bet_placed', poolId },
      { sort: { betIndex: 1 } }
    );
    return list as BetPlacedDoc[];
  }

  async function getPoolSummary(poolId: number): Promise<PoolSummaryDoc | null> {
    if (!poolSummaries) return null;
    return poolSummaries.findOne({ poolId }) as Promise<PoolSummaryDoc | null>;
  }

  /** Latest pool id that has a pool_created event (for “current” pool). */
  async function getLatestPoolId(): Promise<number | null> {
    const list = await events.find(
      { event: 'pool_created' },
      { sort: { poolId: -1 }, limit: 1 }
    );
    const doc = list[0] as PoolCreatedDoc | undefined;
    return doc ? doc.poolId : null;
  }

  /** Events for a single pool (created, all bets, resolved). */
  async function getPoolEvents(poolId: number) {
    return events.find({ poolId }, { sort: { timestamp: 1 } });
  }

  return {
    recordPoolCreated,
    recordBet,
    recordPoolResolved,
    getBetsForPool,
    getPoolSummary,
    getLatestPoolId,
    getPoolEvents,
  };
}

export type DiceManiaRepository = ReturnType<typeof createDiceManiaRepository>;
