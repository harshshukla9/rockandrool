import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatMoney = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
};

/**
 * Format token amounts with subscript notation for tiny values.
 * e.g. 0.0000032 → "0.0₅32" where ₅ is rendered as subscript.
 * Returns a string for non-tiny values, or a React node for tiny values.
 */
export const formatTokenAmount = (num: number): string => {
    if (num === 0) return '0';
    if (num >= 1) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (num >= 0.01) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (num >= 0.0001) return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

    // For very small numbers, return compact string like <0.0001
    // The JSX subscript version is in formatSmallNumber below
    return '<0.0001';
};

/**
 * Format tiny token amounts with subscript zero-count notation.
 * 0.0000032 → React element: "0.0(5)32" with (5) as <sub>.
 * For normal amounts, returns plain text.
 */
export function formatSmallNumber(num: number): React.ReactNode {
    if (num === 0) return '0';
    if (num >= 0.0001) return formatTokenAmount(num);

    // Count leading zeros after "0."
    const str = num.toFixed(20); // max precision
    const match = str.match(/^0\.(0+)(\d{2,4})/);
    if (!match) return formatTokenAmount(num);

    const zeroCount = match[1].length;
    const significantDigits = match[2];

    return React.createElement(
        'span',
        null,
        '0.0',
        React.createElement('sub', null, zeroCount.toString()),
        significantDigits
    );
}

/**
 * Get the number of decimals for a token on BSC.
 * Most BSC tokens use 18 decimals.
 */
export const TOKEN_DECIMALS: Record<string, number> = {
    'BTCB': 18,
    'ETH': 18,
    'BNB': 18,
    'WBNB': 18,
    'USDT': 18,
    'USDC': 18,
    'BUSD': 18,
    'DAI': 18,
    'XRP': 18,
    'ADA': 18,
    'CAKE': 18,
    'FDUSD': 18,
    'LINK': 18,
    'DOT': 18,
    'LTC': 18,
    'FIL': 18,
    'SOL': 18,
    'WBETH': 18,
    'BCH': 18,
};

export function getTokenDecimals(symbol: string): number {
    return TOKEN_DECIMALS[symbol] || 18;
}

/** Convert wei (bigint) to BNB for display (18 decimals). */
export function weiToBnb(wei: bigint): number {
    return Number(wei) / 1e18;
}

/** Shorten address for display: 0x1234...5678 */
export function shortenAddress(address: string, chars = 4): string {
    if (!address || address.length < chars * 2 + 2) return address;
    return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

/** BSC (BNB Chain) mainnet block explorer. Use for tx and address links. */
export const BSC_SCAN_BASE = 'https://bscscan.com';

/** Link to a transaction on BSCScan (verify / view on explorer). */
export function getBscScanTxUrl(txHash: string): string {
    return `${BSC_SCAN_BASE}/tx/${txHash}`;
}

export function getBscScanAddressUrl(address: string): string {
    return `${BSC_SCAN_BASE}/address/${address}`;
}

/**
 * Format seconds as human-readable countdown: "2d 5h 27m", "3h 12m 53s", "47m 53s", "53s".
 * No timezone — it's a duration, not a clock time.
 */
export function formatDuration(seconds: number): string {
    if (seconds <= 0) return '0s';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
}

/**
 * Converts a number to a plain string, avoiding scientific notation.
 * Trims unnecessary trailing zeros for a clean display.
 */
export function toPlainString(num: number): string {
    // We use toFixed with a large precision to avoid scientific notation,
    // then regex to remove trailing zeros and the decimal point if it's no longer needed.
    return num.toFixed(18).replace(/\.?0+$/, "");
}
