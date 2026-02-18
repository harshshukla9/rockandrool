'use client';

import { Button } from "@/components/ui/button";
import { Settings, BarChart3, Bot, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Link to agent / OpenClaw skill (SKILL.md) in repo */
const SKILL_MD_URL = 'https://github.com/harshshukla9/rockandrool/blob/main/frontend/SKILL.md';


export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-16">
                <Link href="/" className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="relative h-12 w-12 md:h-16 md:w-16">
                        <Image
                            src="/LOGO.png"
                            alt="Rock and Roll Dice Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="font-outfit font-bold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400 drop-shadow-sm">Rock and Roll Dice</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-3">
                    {/* Stats Button */}
                    <Link href="/portfolio">
                        <Button
                            variant="ghost"
                            className={`h-9 px-4 rounded-full font-medium text-sm transition-all ${
                                pathname === '/portfolio'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Stats
                        </Button>
                    </Link>

                    <Link href="/settings">
                        <Button
                            variant="ghost"
                            className={`h-9 px-4 rounded-full font-medium text-sm transition-all ${
                                pathname === '/settings'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                            }`}
                        >
                            <Bot className="w-4 h-4 mr-2" />
                            How to Play
                        </Button>
                    </Link>

                    <a
                        href={SKILL_MD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                    >
                        <Button
                            variant="ghost"
                            className="h-9 px-4 rounded-full font-medium text-sm text-muted-foreground hover:text-primary hover:bg-primary/5"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Agent guide (SKILL.md)
                        </Button>
                    </a>

                    {/* Network Status */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-emerald-400">BNB Testnet Live</span>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-2">
                    <Link href="/portfolio">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`w-8 h-8 rounded-full ${
                                pathname === '/portfolio'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-[#1A1A1E] hover:bg-[#2A2A2E] text-white border border-white/5'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                        </Button>
                    </Link>
                    <a href={SKILL_MD_URL} target="_blank" rel="noopener noreferrer">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-[#1A1A1E] hover:bg-[#2A2A2E] text-white border border-white/5 w-8 h-8 rounded-full"
                            title="Agent guide (SKILL.md)"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </a>

                    {/* Mobile Network Status */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-emerald-400">BNB Testnet</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
