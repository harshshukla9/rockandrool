/**
 * MongoDB connection and DiceMania repository for server-side use (API routes, server actions).
 * Set MONGODB_URI in env. If unset, getRepository() returns null and no DB writes occur.
 */

import { MongoClient, type Db, type Collection } from 'mongodb';
import { createDiceManiaRepository, type DiceManiaRepository } from './dice-mania-repository';
import type {
  PoolCreatedDoc,
  BetPlacedDoc,
  PoolResolvedDoc,
  PoolSummaryDoc,
} from './dice-mania-types';
import { contract } from '@/lib/contract';

const DB_NAME = 'dice_mania';
const EVENTS_COLLECTION = 'events';
const POOL_SUMMARIES_COLLECTION = 'pool_summaries';

let client: MongoClient | null = null;
let repo: DiceManiaRepository | null = null;

function getUri(): string | undefined {
  return process.env.MONGODB_URI;
}

/**
 * Get MongoDB client (lazy connect). Use only on server.
 */
export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getUri();
  if (!uri) return null;
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

/**
 * Get DB instance. Use only on server.
 */
export async function getDb(): Promise<Db | null> {
  const c = await getMongoClient();
  return c ? c.db(DB_NAME) : null;
}

/**
 * Get DiceMania repository wired to MongoDB. Use from API routes or server actions.
 * Contract address and chain are read from contract.ts and BSC.
 */
export async function getDiceManiaRepository(): Promise<DiceManiaRepository | null> {
  if (repo) return repo;
  const db = await getDb();
  if (!db) return null;

  const events = db.collection(EVENTS_COLLECTION) as Collection<PoolCreatedDoc | BetPlacedDoc | PoolResolvedDoc>;
  const poolSummaries = db.collection(POOL_SUMMARIES_COLLECTION) as Collection<PoolSummaryDoc>;

  repo = createDiceManiaRepository(
    {
      events: {
        insertOne: (doc) => events.insertOne(doc as never),
        insertMany: (docs) => events.insertMany(docs as never[]),
        findOne: (filter) => events.findOne(filter) as Promise<PoolCreatedDoc | BetPlacedDoc | PoolResolvedDoc | null>,
        find: (filter, options) => events.find(filter, options as never).toArray() as Promise<(PoolCreatedDoc | BetPlacedDoc | PoolResolvedDoc)[]>,
        updateOne: (filter, update) => events.updateOne(filter, update as never),
      },
      poolSummaries: {
        insertOne: (doc) => poolSummaries.insertOne(doc as never),
        insertMany: (docs) => poolSummaries.insertMany(docs as never[]),
        findOne: (filter) => poolSummaries.findOne(filter),
        find: (filter, options) => poolSummaries.find(filter, options as never).toArray(),
        updateOne: (filter, update) => poolSummaries.updateOne(filter, update as never),
      },
    },
    { chainId: 56, contractAddress: contract.address }
  );
  return repo;
}

/**
 * Create indexes for events and pool_summaries. Run once on deploy or first run.
 */
export async function ensureDiceManiaIndexes(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const events = db.collection(EVENTS_COLLECTION);
  const poolSummaries = db.collection(POOL_SUMMARIES_COLLECTION);
  await events.createIndex({ poolId: 1, event: 1 });
  await events.createIndex({ poolId: 1, betIndex: 1 });
  await events.createIndex({ user: 1, poolId: 1 });
  await events.createIndex({ event: 1, poolId: -1 });
  await poolSummaries.createIndex({ poolId: 1 }, { unique: true });
}
