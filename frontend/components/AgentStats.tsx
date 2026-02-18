'use client';

import React, { useMemo } from 'react';
import AnimatedNumbers from "react-animated-numbers";
import { Users, Dices, Coins, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useDiceManiaTotalPools,
  useDiceManiaPool,
  useDiceManiaBets,
} from '@/lib/hooks/use-dice-mania';
import { usePoolBetEvents } from '@/lib/hooks/use-pool-bet-events';
import { weiToBnb, shortenAddress, getBscScanTxUrl } from '@/lib/utils';

/* =============================
   Animated Number Component
============================= */
function AnimatedStat({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/,/g, "")) || 0
      : value || 0;
  const formattedValue = Number(num.toFixed(decimals));

  return (
    <span>
      {prefix}
      <AnimatedNumbers
        animateToNumber={formattedValue}
        transitions={(i) => ({
          type: "spring",
          duration: 0.5 + i * 0.1,
        })}
        fontStyle={{
          fontSize: "inherit",
          fontWeight: "inherit",
          color: "inherit",
        }}
      />
      {suffix}
    </span>
  );
}

/* =============================
   Main Component - data from smart contract
============================= */
export function AgentStats() {
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

  const summary = useMemo(() => {
    const uniqueAgents = new Set(bets.map((b) => b.user.toLowerCase())).size;
    const totalBetsCount = pool ? Number(pool.totalBets) : 0;
    const poolBnb = pool ? weiToBnb(pool.totalAmount) : 0;
    return {
      totalPools,
      totalAgents: uniqueAgents,
      totalBets: totalBetsCount,
      poolBnb,
      poolResult: pool?.ended ? Number(pool.result) : null as number | null,
    };
  }, [totalPools, bets, pool]);

  const recentBets = useMemo(() => [...bets].reverse().slice(0, 100), [bets]);

  return (
    <div className="container pt-0 md:pt-8 pb-24 max-w-screen-2xl mx-auto px-4 md:px-16">
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
        <div className="w-full lg:w-[650px] shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              icon={<Layers className="w-5 h-5 text-blue-400" />}
              title="Total Pools"
              value={<AnimatedStat value={summary.totalPools} />}
              subtitle="Pools created (on-chain)"
              color="text-blue-400"
            />
            <StatCard
              icon={<Users className="w-5 h-5 text-emerald-400" />}
              title="Unique Bettors"
              value={<AnimatedStat value={summary.totalAgents} />}
              subtitle="This pool"
              color="text-emerald-400"
            />
            <StatCard
              icon={<Coins className="w-5 h-5 text-yellow-400" />}
              title="Pool Size"
              value={<AnimatedStat value={summary.poolBnb.toFixed(4)} suffix=" BNB" />}
              subtitle="Current pool"
              color="text-yellow-400"
            />
            <StatCard
              icon={<Dices className="w-5 h-5 text-purple-400" />}
              title="Total Bets"
              value={<AnimatedStat value={summary.totalBets} />}
              subtitle="This pool"
              color="text-purple-400"
            />
          </div>
        </div>

        <div className="flex-1 h-screen overflow-y-auto pr-4 space-y-2 text-sm font-medium">
          {recentBets.length === 0 ? (
            <p className="text-muted-foreground">No bets in current pool yet.</p>
          ) : (
            recentBets.map((bet, idx) => {
              const betIndex = bets.length - 1 - idx;
              return (
                <HistoryMessage
                  key={`${bet.user}-${idx}`}
                  bet={bet}
                  betIndex={betIndex}
                  poolResult={summary.poolResult}
                  txHash={txHashByBetIndex[betIndex]}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* =============================
   History Message (from contract bet)
============================= */
function HistoryMessage({
  bet,
  betIndex,
  poolResult,
  txHash,
}: {
  bet: { user: `0x${string}`; amount: bigint; targetScore: bigint };
  betIndex: number;
  poolResult: number | null;
  txHash?: string;
}) {
  const bnb = weiToBnb(bet.amount);
  const target = Number(bet.targetScore);
  const isWin = poolResult != null && target === poolResult;

  const content = (
    <>
      <span className="text-white">{shortenAddress(bet.user)}</span> bet{" "}
      <span className="text-yellow-400">{bnb.toFixed(4)} BNB</span> on{" "}
      <span className="text-white">{target}</span>
      {poolResult != null && (
        <>
          {" "}
          —{" "}
          <span className={isWin ? "text-emerald-400" : "text-red-400"}>
            {isWin ? "win" : "not win"}
          </span>
        </>
      )}
    </>
  );

  return (
    <div className="flex justify-end">
      <div className="text-right max-w-[80%]">
        <div className="font-medium">{content}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 justify-end flex-wrap">
          <span>Bet #{betIndex + 1}</span>
          {txHash && (
            <a
              href={getBscScanTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Verify on BSCScan
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* =============================
   Stat Card
============================= */
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-[#0A0A0B] border border-white/10 p-6 md:p-8 hover:bg-white/[0.04] shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          {title}
        </span>
      </div>
      <div className={cn("text-3xl md:text-5xl font-bold mb-2", color)}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground/50">
        {subtitle}
      </div>
    </div>
  );
}
