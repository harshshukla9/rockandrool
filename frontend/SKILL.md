---
name: openclaw-dice-mania-frontend
description: OpenClaw skill for the DiceMania frontend—contract address (CA), where to bet, hooks, API, and file locations. Use when working in the frontend folder to place bets or integrate with the game.
---

# OpenClaw — DiceMania Frontend

Use this skill when working in the **frontend** codebase to bet, read pool data, or record events. All paths below are relative to `frontend/`.

---

## Contract & chain (copy-paste for OpenClaw)

| Item | Value |
|------|--------|
| **Contract address (CA)** | `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` |
| **Network** | BNB Chain (BSC) mainnet |
| **Chain ID** | `56` |
| **BSCScan (contract)** | https://bscscan.com/address/0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224 |
| **BSCScan (tx)** | https://bscscan.com/tx/{txHash} |
| **Prediction (target)** | Integer **1–12** |

**CA in code:** `lib/contract.ts` → `contract.address`  
**Typed ABI:** `lib/dice-mania-abi.ts` → `diceManiaAbi`, `DiceBet`, `DicePoolView`

---

## How to place a bet (from this frontend)

1. **Get latest pool and base amount**
   - `useDiceManiaTotalPools()` → `totalPools`; latest pool id = `totalPools - 1` (if `totalPools > 0`).
   - `useDiceManiaPool(poolId)` → `pool.baseamount` (wei), `pool.ended`, `isBettingOpen`, `secondsLeft`.

2. **Place the bet**
   - **Option A (recommended):** `usePlaceBetAndRecord()` → `placeBetAndRecord(poolId, target, valueWei, betIndex)`.
     - Uses connected wallet; sends tx then records it so the UI shows “Verify on BSCScan”.
     - `betIndex` = current number of bets in the pool *before* this one (e.g. `bets.length` from `useDiceManiaBets(poolId)`).
   - **Option B:** `usePlaceBet()` → `placeBet(poolId, target, valueWei)`.
     - Then call `recordBetOnServer({ poolId, txHash, user, amountWei, targetScore, betIndex })` from `lib/dice-mania-api.ts` so the tx appears in the feed with a BSCScan link.

3. **Values**
   - `target`: 1–12.
   - `valueWei`: exactly `pool.baseamount` (e.g. `pool.baseamount` from contract; 1 BNB = `1000000000000000000n`).

---

## Key files (frontend)

| Purpose | Path |
|---------|------|
| Contract address + ABI | `lib/contract.ts` |
| Typed ABI & types | `lib/dice-mania-abi.ts` |
| All DiceMania hooks | `lib/hooks/use-dice-mania.ts`, `lib/hooks/index.ts` |
| Pool bet events (with tx hash) | `lib/hooks/use-pool-bet-events.ts` |
| Record bet after tx | `lib/dice-mania-api.ts` → `recordBetOnServer()` |
| BSCScan URLs | `lib/utils.ts` → `getBscScanTxUrl(txHash)`, `getBscScanAddressUrl(address)` |
| Dashboard (live stats + bets) | `components/Dashboard.tsx` |
| Agent stats + history | `components/AgentStats.tsx` |
| DB types & repo | `lib/db/dice-mania-types.ts`, `lib/db/dice-mania-repository.ts` |
| MongoDB wiring | `lib/db/mongo.ts` |

---

## API (same app, for recording events)

Base URL is the app origin (e.g. `http://localhost:3000` in dev).

- **Record bet (so BSCScan link shows):**  
  `POST /api/dice-mania/events/bet`  
  Body: `{ "poolId": number, "txHash": "0x...", "user": "0x...", "amountWei": "string", "targetScore": 1-12, "betIndex": number }`

- **Get bets for a pool (include tx hashes):**  
  `GET /api/dice-mania/pools/:poolId/bets` → `{ bets: Array<{ txHash, user, amountWei, targetScore, betIndex, ... }> }`

- **Latest pool id from DB:**  
  `GET /api/dice-mania/pools/latest` → `{ poolId: number | null }`

Requires `MONGODB_URI` in `.env.local` for these to persist.

---

## Hooks quick reference

| Hook | Use |
|------|-----|
| `useDiceManiaTotalPools()` | `totalPools`; latest pool id = `totalPools - 1` |
| `useDiceManiaPool(poolId)` | `pool`, `isBettingOpen`, `secondsLeft` |
| `useDiceManiaBets(poolId)` | `bets` (user, amount, targetScore) in order |
| `usePlaceBet()` | `placeBet(poolId, target, valueWei)` → returns tx hash |
| `usePlaceBetAndRecord()` | `placeBetAndRecord(poolId, target, valueWei, betIndex)` — places bet and records tx |
| `usePoolBetEvents(poolId)` | `bets` from API (include `txHash` for BSCScan links) |
| `useResolvePool()` | `resolvePool(poolId)` (owner only) |
| `useCreatePool()` | `createPool(durationSeconds, baseAmountWei)` (owner only) |
| `useIsDiceManiaOwner()` | `isOwner` for current wallet |

Constants: `MIN_TARGET = 1`, `MAX_TARGET = 12`, `BSC_CHAIN_ID = 56` (from `lib/hooks/use-dice-mania.ts`).

---

## Summary for OpenClaw

- **CA:** `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` (BSC, chain 56). Defined in `lib/contract.ts`.
- **To bet in this app:** Use `usePlaceBetAndRecord(poolId, target, baseamountWei, betIndex)` so the bet is sent and the tx is recorded for BSCScan links. Otherwise use `usePlaceBet` and then `recordBetOnServer()` with the returned tx hash.
- **Target:** 1–12. **Value:** exactly the pool’s `baseamount` wei.
- **Full game/skill doc:** `../.cursor/skills/dice-mania-agent/SKILL.md` (repo root).
