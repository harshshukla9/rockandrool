export {
  createDiceManiaRepository,
  type DiceManiaRepository,
  type DiceManiaRepoConfig,
  type DiceManiaRepoCollections,
  type DiceManiaCollection,
} from './dice-mania-repository';
export type {
  PoolCreatedDoc,
  BetPlacedDoc,
  PoolResolvedDoc,
  PoolSummaryDoc,
  DiceManiaEventDoc,
} from './dice-mania-types';
export {
  getMongoClient,
  getDb,
  getDiceManiaRepository,
  ensureDiceManiaIndexes,
} from './mongo';
