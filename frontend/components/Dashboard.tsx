'use client';

import { Card } from "@/components/ui/card";
import AnimatedNumbers from "react-animated-numbers";
import DiceAnimation from "@/components/DiceAnimation";
import { Users, Dice5, Coins, Timer } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  useDiceManiaTotalPools,
  useDiceManiaPool,
  useDiceManiaBets,
} from "@/lib/hooks/use-dice-mania";
import { usePoolBetEvents } from "@/lib/hooks/use-pool-bet-events";
import { weiToBnb, shortenAddress, formatDuration, getBscScanTxUrl } from "@/lib/utils";

export function Dashboard() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const { totalPools } = useDiceManiaTotalPools();
  const latestPoolId = totalPools > 0 ? totalPools - 1 : null;
  const { pool } = useDiceManiaPool(latestPoolId ?? 0);
  const { bets } = useDiceManiaBets(latestPoolId ?? 0);
  const { bets: apiBets } = usePoolBetEvents(latestPoolId);
  const txHashByBetIndex = useMemo(() => {
    const map: Record<number, string> = {};
    apiBets.forEach((b) => {
      map[b.betIndex] = b.txHash;
    });
    return map;
  }, [apiBets]);

  // Refresh countdown every second when there's an active pool
  useEffect(() => {
    if (!pool || pool.ended) return;
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, [pool?.ended, pool?.id]);

  const secondsLeft = useMemo(() => {
    if (!pool || pool.ended) return 0;
    return Math.max(0, Number(pool.end) - now);
  }, [pool, now]);

  const stats = useMemo(() => {
    const uniqueAgents = new Set(bets.map((b) => b.user.toLowerCase())).size;
    const totalBetsCount = pool ? Number(pool.totalBets) : 0;
    const poolBnb = pool ? weiToBnb(pool.totalAmount) : 0;
    return {
      agents: uniqueAgents,
      rolls: totalBetsCount,
      poolBnb,
      secondsLeft,
    };
  }, [bets, pool, secondsLeft]);

  // Last 6 bets (newest first) for live activity
  const recentBets = useMemo(() => {
    return [...bets].reverse().slice(0, 6);
  }, [bets]);

  return (
    <div className="container pt-0 md:pt-8 pb-24 space-y-8 max-w-screen-2xl mx-auto px-4 md:px-16">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT CARDS - from smart contract */}
        <div className="flex flex-col gap-6 w-full lg:w-[360px] shrink-0 lg:sticky lg:top-20">
          <StatCard
            title="Agents"
            value={stats.agents}
            subtitle="Unique bettors this pool"
            icon={<Users className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Dice Rolls"
            value={stats.rolls}
            subtitle="Total bets this pool"
            icon={<Dice5 className="w-5 h-5 text-purple-400" />}
          />
          <StatCard
            title="Total Pool"
            value={stats.poolBnb.toFixed(4)}
            subtitle="BNB in pool"
            icon={<Coins className="w-5 h-5 text-yellow-400" />}
          />
          <StatCard
            title="Ending Time"
            value={
              totalPools === 0
                ? "No pool"
                : pool && !pool.ended
                  ? formatDuration(stats.secondsLeft)
                  : pool?.ended
                    ? "Ended"
                    : "—"
            }
            subtitle={totalPools === 0 ? "Create a pool first" : pool?.ended ? "Pool resolved" : "Time remaining"}
            icon={<Timer className="w-5 h-5 text-red-400" />}
          />
        </div>

        {/* RIGHT SIDE → DICES */}
        <div className="flex-1">
          <Card className="border-none shadow-none bg-transparent">
            <DiceAnimation />
          </Card>
          <LiveActivity
            bets={recentBets}
            totalBetCount={bets.length}
            poolResult={pool?.ended ? Number(pool.result) : null}
            txHashByBetIndex={txHashByBetIndex}
          />
        </div>
      </div>
    </div>
  );
}

/* =============================
   Live Activity (from contract bets + tx hash for BSCScan)
============================= */
interface LiveActivityProps {
  bets: { user: `0x${string}`; amount: bigint; targetScore: bigint }[];
  totalBetCount: number;
  poolResult: number | null;
  txHashByBetIndex: Record<number, string>;
}

function LiveActivity({ bets, totalBetCount, poolResult, txHashByBetIndex }: LiveActivityProps) {
  if (bets.length === 0) {
    return (
      <div className="fixed bottom-6 right-6 z-50 text-sm text-muted-foreground">
        No bets yet. Connect wallet and place a bet!
      </div>
    );
  }
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-1 text-sm font-medium text-right">
      {bets.map((bet, i) => {
        const bnb = weiToBnb(bet.amount);
        const target = Number(bet.targetScore);
        const isWin = poolResult != null && target === poolResult;
        const betIndex = totalBetCount - 1 - i;
        const txHash = txHashByBetIndex[betIndex];
        const label = poolResult != null
          ? `${shortenAddress(bet.user)} bet ${bnb.toFixed(4)} BNB on ${target} — ${isWin ? "win" : "not win"}`
          : `${shortenAddress(bet.user)} bet ${bnb.toFixed(4)} BNB on ${target}`;
        return (
          <div
            key={`${bet.user}-${i}`}
            className={`animate-in slide-in-from-bottom-3 fade-in duration-300 ${isWin ? "text-emerald-400" : poolResult != null ? "text-red-400" : "text-white"}`}
          >
            {label}
            {txHash && (
              <>
                {" "}
                <a
                  href={getBscScanTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-xs"
                >
                  Verify on BSCScan
                </a>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =============================
   Stat Card
============================= */
function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number | string | React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
}) {
  const isNumeric =
    typeof value === "number" ||
    (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.replace(/,/g, "")));
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(value.replace(/,/g, "")) || 0
        : 0;

  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-[#0A0A0B] border border-white/10 p-6 md:p-8 transition-all hover:bg-white/[0.04] shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          {title}
        </span>
      </div>
      <div className="text-3xl md:text-5xl font-bold text-white mb-2">
        {isNumeric ? (
          <AnimatedNumbers
            animateToNumber={numericValue}
            transitions={(i) => ({
              type: "spring",
              duration: 0.6 + i * 0.1,
            })}
            fontStyle={{
              fontSize: "inherit",
              fontWeight: "inherit",
              color: "inherit",
            }}
          />
        ) : (
          value
        )}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground/50">
        {subtitle}
      </div>
    </div>
  );
}
