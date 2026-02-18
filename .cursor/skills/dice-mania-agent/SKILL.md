---
name: dice-mania-agent
description: How to interact with the DiceMania smart contract (BNB Chain) as an agent—place bets, understand game flow, resolve pools (admin), and record data for MongoDB. Use this for OpenClaw or any betting agent.
---

# DiceMania Agent Skill

Use this skill when implementing or reasoning about **DiceMania** on BNB Chain: betting, pool lifecycle, resolution, and persisting game data to MongoDB. **OpenClaw** and other agents can use the quick reference below to place bets.

---

## Quick reference for OpenClaw / betting agents

Copy-paste values and steps. Everything an agent needs to bet in one place.

| Item | Value |
|------|--------|
| **Contract address (CA)** | `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` |
| **Network** | BNB Chain (BSC) mainnet |
| **Chain ID** | `56` |
| **BSCScan (contract)** | https://bscscan.com/address/0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224 |
| **BSCScan (tx)** | https://bscscan.com/tx/{txHash} |
| **Prediction range** | `1` to `12` (inclusive) |

**Minimal steps to place a bet:**

1. **Latest pool id:** `getTotalPools()` → latest pool = `totalPools - 1` (if `totalPools > 0`).
2. **Pool state:** `getPool(poolId)` → need `baseamount` (wei), and betting open = `!ended` and `block.timestamp < end`.
3. **Transaction:** Call `placeBet(poolId, target)` with:
   - `poolId`: number (e.g. `totalPools - 1`).
   - `target`: integer **1–12**.
   - **value (msg.value):** exactly `baseamount` wei (e.g. 1 BNB = `1000000000000000000`).
4. **Record tx (optional):** After tx confirms, `POST` to app base URL + `/api/dice-mania/events/bet` with body: `{ "poolId": <number>, "txHash": "<0x...>", "user": "<wallet address>", "amountWei": "<baseamount string>", "targetScore": <1-12>, "betIndex": <number of bets before this one> }` so the UI shows “Verify on BSCScan”.

**Contract ABI / code:** `frontend/lib/contract.ts` (address + abi), `frontend/lib/dice-mania-abi.ts` (typed ABI).

---

## Contract Overview

- **Network**: BNB Chain (BSC), mainnet.
- **Contract address (CA)**: `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` (also in `frontend/lib/contract.ts` as `contract.address`).
- **Game**: Time-bound pools. Users (agents) bet a **number from 1 to 12**. After a **fixed duration**, the **admin** calls `resolvePool`; the contract picks a **winner number 1–12** on-chain. All agents who predicted that number **split the prize pool** (see Payout rules below).

## How the Game Runs

1. **Pool creation (owner only)**  
   Admin calls `createPool(duration, baseamount)`:
   - `duration`: pool lifetime in **seconds** (betting allowed until `starttime + duration`).
   - `baseamount`: required bet per prediction, in **wei** (e.g. 1e18 = 1 BNB).

2. **Betting window**  
   From `starttime` until `endtime` (= start + duration):
   - Any connected wallet (including agent) can call `placeBet(poolId, target)` with `msg.value === baseamount`.
   - `target`: **integer from 1 to 12** (the predicted winning number).
   - Bets are ordered: first bet = index 0, second = 1, etc. (useful for “early guesser” logic if you add it later).

3. **After the fixed time**  
   When `block.timestamp >= endtime`:
   - Betting is over. **Only the owner** may call `resolvePool(poolId)`.
   - The contract derives a **random number 1–12** (keccak of timestamp, prevrandao, sender, pool total, bet count).
   - That number is the **winning result** for the pool.
   - The contract then **distributes funds** (see Payout rules).

4. **Payout rules (current contract)**  
   - **Winners**: Every bet whose `targetScore` equals the drawn result shares the **entire pool** equally (`poolTotalAmount / winnerCount`).
   - **No winners**: If nobody guessed the number, the **owner** receives the full pool.
   - There is **no 80/20 or “top 10 early guesser”** logic in the current deployed contract; that would require a contract upgrade.

## Intended design (80% pool / 20% early guessers)

If you later deploy a new version of the contract or an overlay:
- **80%** of the pool could go to all agents who predicted the winning number (split equally among them).
- **20%** could go to the **top 10 earliest** guessers (by bet index) who predicted the winning number.
- The frontend hooks and MongoDB schema below support recording **bet index** and **pool result** so you can compute “early guessers” and apply such rules off-chain or in a future contract.

## How to Bet / Predict the Number (Agent)

1. **Get the active pool**  
   - Read `getTotalPools()` → `totalPools`. Latest pool id is `totalPools - 1` (if `totalPools > 0`).
   - Call `getPool(poolId)` to get `start`, `end`, `totalAmount`, `ended`, `baseamount`, `totalBets`.

2. **Check if betting is open**  
   - `!ended` and `block.timestamp < end`.  
   - In the app, use hook `useDiceManiaPool(poolId)` and use `isBettingOpen` / `secondsLeft`.

3. **Place a bet**  
   - Choose a **target number in [1, 12]** (e.g. from model, random, or strategy).
   - Send **exactly** `baseamount` wei with the transaction.  
   - Call `placeBet(poolId, target)` with `value: baseamount` (in wei).  
   - Frontend: use `usePlaceBet().placeBet(poolId, target, valueWei)`.

4. **Validation**  
   - Contract reverts if: pool ended, current time ≥ end, target not in 1–12, or `msg.value != baseamount`.

5. **Store tx hash so users can verify on BSCScan**  
   - After a successful `placeBet` tx, the agent (or frontend) must record the bet with its **transaction hash** so the UI can show a “Verify on BSCScan” link.  
   - Call `POST /api/dice-mania/events/bet` with body: `{ poolId, txHash, user, amountWei, targetScore, betIndex }`. Use the **tx hash** returned from the wallet/contract call. Use **betIndex** = number of bets in the pool *before* this one (e.g. from `getBets(poolId).length` before placing).  
   - Frontend: use `usePlaceBetAndRecord()` and `placeBetAndRecord(poolId, target, valueWei, betIndex)` so the bet is recorded automatically with the tx hash.

## How the Admin Agent Resolves a Pool

1. **Wait until pool end**  
   Ensure `block.timestamp >= pool.end` (e.g. poll `getPool(poolId)` or use `secondsLeft === 0`).

2. **Call resolve**  
   As the **contract owner**, call `resolvePool(poolId)`.  
   - Frontend: `useResolvePool().resolvePool(poolId)`.

3. **On-chain effect**  
   - Contract sets `result` (1–12) and `ended = true`, then distributes funds to winners (or owner if no winners).

4. **Record in DB**  
   After a successful tx: persist pool id, result, winner list, and payouts (see MongoDB section).

## Frontend Hooks (for agents / UI)

All hooks live in `frontend/lib/hooks/use-dice-mania.ts` (and are re-exported from `frontend/lib/hooks`).

| Hook | Purpose |
|------|--------|
| `useDiceManiaTotalPools()` | `totalPools` / next pool id |
| `useDiceManiaPool(poolId)` | Pool details, `isBettingOpen`, `secondsLeft` |
| `useDiceManiaBets(poolId)` | All bets (user, amount, targetScore) in order |
| `useDiceManiaOwner()` | Contract owner address |
| `usePlaceBet()` | `placeBet(poolId, target, valueWei)` |
| `useResolvePool()` | `resolvePool(poolId)` |
| `useCreatePool()` | `createPool(durationSeconds, baseAmountWei)` (owner) |
| `useWithdraw()` | `withdraw(amountWei)` (owner) |
| `useIsDiceManiaOwner()` | Whether current wallet is owner |

Constants: `MIN_TARGET = 1`, `MAX_TARGET = 12`, `BSC_CHAIN_ID = 56`.

## What to Record in MongoDB

Persist the following so you have a full history and can implement 80/20 + early guessers off-chain or in a future contract.

1. **Pool created**  
   - `poolId`, `startTime`, `endTime`, `duration`, `baseAmountWei`, `chainId`, `contractAddress`, `createdAt`.

2. **Bet placed**  
   - `poolId`, `txHash`, `user` (address), `amountWei`, `targetScore` (1–12), **betIndex** (order in `getBets`), `blockNumber`, `timestamp`.

3. **Pool resolved**  
   - `poolId`, `txHash`, `result` (1–12), `ended: true`, `winnerAddresses[]`, `payoutPerWinnerWei`, `totalAmountWei`, `blockNumber`, `timestamp`.  
   - Optionally: full list of bets with `targetScore` and `betIndex` for “top 10 early guessers” calculation.

4. **Indexes**  
   - `poolId` + `betIndex` for fast “early guesser” ordering.  
   - `user` + `poolId` for “user’s bet in this pool”.  
   - `poolId` for all events of one pool.

## Recording events in MongoDB (API)

After each on-chain transaction, call the API to persist the event so history and “early guesser” order are stored.

- **Set `MONGODB_URI`** in env so the API can connect.

- **Pool created** (after `createPool` tx confirms):  
  `POST /api/dice-mania/events/pool-created`  
  Body: `{ poolId, startTime, endTime, durationSeconds, baseAmountWei, txHash?, blockNumber? }`

- **Bet placed** (after `placeBet` tx confirms):  
  `POST /api/dice-mania/events/bet`  
  Body: `{ poolId, txHash, user, amountWei, targetScore, betIndex, blockNumber? }`  
  Use the bet’s index in `getBets(poolId)` as `betIndex` (0 = first bet).

- **Pool resolved** (after `resolvePool` tx confirms):  
  `POST /api/dice-mania/events/pool-resolved`  
  Body: `{ poolId, txHash, result, totalAmountWei, winnerAddresses, payoutPerWinnerWei, winnerBetIndices, blockNumber? }`  
  Compute winners and their bet indices from contract `getBets` + `getPool(_poolId).result`.

- **Read**:  
  `GET /api/dice-mania/pools/latest` → `{ poolId }`  
  `GET /api/dice-mania/pools/:poolId/events` → `{ events }`

Repository and types live in `frontend/lib/db/`; server wiring in `frontend/lib/db/mongo.ts`. Run `ensureDiceManiaIndexes()` once to create indexes.

## Summary for the Agent

- **CA (contract address):** `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` (BSC mainnet, chain id 56). BSCScan: https://bscscan.com/address/0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224
- **To bet**: Get active pool id (`getTotalPools() - 1`) → ensure betting open → call `placeBet(poolId, target, baseamountWei)` with `target` in 1–12 and exact `baseamount` wei.
- **Game flow**: Fixed-duration pool → betting until `endtime` → owner calls `resolvePool` → contract picks 1–12 and pays all winners equally (or owner if no winners).
- **Admin**: Create pools with `createPool(duration, baseamount)`; resolve with `resolvePool(poolId)` after end time.
- **DB**: After each tx, POST to the API above to record pool created, bet placed, or pool resolved. Use `betIndex` from contract bet order for “top 10 early guessers” logic. Types and repo are in `frontend/lib/db/`.
