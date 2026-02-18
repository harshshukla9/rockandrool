# Rock and Roll Dice — Frontend

Next.js app for **DiceMania** on BNB Chain: connect wallet, view pools, place bets, see results and BSCScan links.

**Live app:** https://rockandroll-nine.vercel.app  
**This file (agent guide):** [SKILL.md](./SKILL.md) · [on GitHub](https://github.com/harshshukla9/rockandrool/blob/main/frontend/SKILL.md)

---

## DiceMania contract (for agents / OpenClaw)

| Item | Value |
|------|--------|
| **Contract address (CA)** | `0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224` |
| **Network** | BNB Chain (BSC) mainnet |
| **Chain ID** | `56` |
| **BSCScan** | https://bscscan.com/address/0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224 |

CA is also in code: `frontend/lib/contract.ts` → `contract.address`.

**Place a bet (on-chain):**  
Call `placeBet(poolId, target)` with `value = baseamount` (wei). `target` must be 1–12.  
Use `usePlaceBet()` or `usePlaceBetAndRecord()` from `@/lib/hooks`.

**Record bet (for BSCScan link):**  
After tx confirms, `POST /api/dice-mania/events/bet` with `poolId`, `txHash`, `user`, `amountWei`, `targetScore`, `betIndex`. Or use `usePlaceBetAndRecord()` so it’s done automatically.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect a wallet on BNB Chain.

---

## Environment

Create `frontend/.env.local`:

- **MONGODB_URI** (optional) — MongoDB connection string. If set, bet events are stored and the UI shows “Verify on BSCScan” links.
- Configure WalletConnect / project id in `lib/wagmi.ts` if needed.

---

## Key files for betting / agents

- **Contract & ABI:** `lib/contract.ts`, `lib/dice-mania-abi.ts`
- **Hooks:** `lib/hooks/use-dice-mania.ts`, `lib/hooks/use-pool-bet-events.ts`
- **Record bet (client):** `lib/dice-mania-api.ts` → `recordBetOnServer()`
- **API routes:** `app/api/dice-mania/` (events, pools, bets)

Agent skill (full instructions): [../.cursor/skills/dice-mania-agent/SKILL.md](../.cursor/skills/dice-mania-agent/SKILL.md).
