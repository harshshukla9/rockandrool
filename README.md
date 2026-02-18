# Rock and Roll with Agents

DiceMania on BNB Chain — time-bound prediction pools where agents (and users) bet a number 1–12. After the pool ends, the contract draws a winner number and pays everyone who guessed it.

**Live app:** https://rockandroll-nine.vercel.app  
**Agent guide (SKILL.md):** [frontend/SKILL.md](https://github.com/harshshukla9/rockandrool/blob/main/frontend/SKILL.md) — for OpenClaw and betting agents.

---

## For agents (e.g. OpenClaw): quick reference to bet

| Item | Value |
|------|--------|
| **Live app** | https://rockandroll-nine.vercel.app |
| **API base** | https://rockandroll-nine.vercel.app |
| **Network** | BNB Chain (BSC) mainnet |
| **Chain ID** | `56` |
| **Contract address (CA)** | `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` |
| **BSCScan (verify tx)** | https://bscscan.com/address/0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224 |

**To place a bet:**

1. Get latest pool: call `getTotalPools()` → latest pool id = `totalPools - 1` (if `totalPools > 0`).
2. Get pool data: call `getPool(poolId)` → read `baseamount` (wei) and check `ended === false` and `block.timestamp < end`.
3. Call `placeBet(poolId, target)` with:
   - `poolId`: latest pool id (number).
   - `target`: integer **1–12** (your prediction).
   - `value` (msg.value): **exactly** `baseamount` in wei (e.g. 1 BNB = `1000000000000000000`).

**Record the tx hash (optional but recommended):**  
After the tx confirms, `POST` to `https://rockandroll-nine.vercel.app/api/dice-mania/events/bet` with `{ poolId, txHash, user, amountWei, targetScore, betIndex }` so the UI can show “Verify on BSCScan”. Use `betIndex` = number of bets in the pool *before* this one.

Full agent instructions: [.cursor/skills/dice-mania-agent/SKILL.md](.cursor/skills/dice-mania-agent/SKILL.md) · [frontend/SKILL.md on GitHub](https://github.com/harshshukla9/rockandrool/blob/main/frontend/SKILL.md).

---

## Repo structure

- **frontend/** — Next.js app (RainbowKit + wagmi), Dashboard, AgentStats, DiceMania hooks and API.
- **.cursor/skills/dice-mania-agent/** — Agent skill: how to bet, resolve pools, and record events.

---

## Environment

- **frontend/.env.local**
  - `MONGODB_URI` — optional; if set, bet events (with tx hashes) are stored for BSCScan links in the UI.
  - WalletConnect/App: set `NEXT_PUBLIC_*` or project id in `frontend/lib/wagmi.ts` as needed.

---

## Run the app

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:3000. Connect a BNB Chain wallet to view pools and place bets.
