import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { BASE_USDC, BASE_SEPOLIA_USDC } from "../types.js";
export class SpendTracker {
    history = [];
    constructor() { }
    recordSpend(asset, amountWei, timestamp = Date.now()) {
        this.history.push({
            timestamp,
            asset: asset.toLowerCase(),
            amountWei
        });
    }
    get24HourTotal(asset, now = Date.now()) {
        const cutoff = now - 24 * 60 * 60 * 1000;
        const targetAsset = asset.toLowerCase();
        // Prune history older than 48 hours to save memory
        this.history = this.history.filter((item) => item.timestamp >= now - 48 * 60 * 60 * 1000);
        return this.history
            .filter((item) => item.asset === targetAsset && item.timestamp >= cutoff)
            .reduce((acc, item) => acc + item.amountWei, BigInt(0));
    }
    clear() {
        this.history = [];
    }
}
export function validateNativeSpend(valueString, limits, tracker, now = Date.now()) {
    let valueWei;
    try {
        // If input is hex or decimal integer, or ether string
        if (valueString.startsWith("0x")) {
            valueWei = BigInt(valueString);
        }
        else if (valueString.includes(".")) {
            valueWei = parseEther(valueString);
        }
        else {
            valueWei = BigInt(valueString);
        }
    }
    catch {
        return {
            valid: false,
            error: `Invalid native transaction value: ${valueString}`,
            asset: "NATIVE",
            amountFormatted: valueString,
            limitFormatted: limits.maxNativePerTx
        };
    }
    const maxPerTxWei = parseEther(limits.maxNativePerTx);
    if (valueWei > maxPerTxWei) {
        return {
            valid: false,
            error: `Native spend ${formatEther(valueWei)} ETH exceeds per-tx limit of ${limits.maxNativePerTx} ETH`,
            asset: "NATIVE",
            amountFormatted: formatEther(valueWei),
            limitFormatted: limits.maxNativePerTx
        };
    }
    if (tracker) {
        const dailyUsed = tracker.get24HourTotal("NATIVE", now);
        const maxDailyWei = parseEther(limits.maxNativeDaily);
        if (dailyUsed + valueWei > maxDailyWei) {
            return {
                valid: false,
                error: `Cumulative 24h native spend (${formatEther(dailyUsed + valueWei)} ETH) exceeds daily limit of ${limits.maxNativeDaily} ETH`,
                asset: "NATIVE",
                amountFormatted: formatEther(dailyUsed + valueWei),
                limitFormatted: limits.maxNativeDaily
            };
        }
    }
    return {
        valid: true,
        asset: "NATIVE",
        amountFormatted: formatEther(valueWei),
        limitFormatted: limits.maxNativePerTx
    };
}
export function validateTokenSpend(tokenAddress, rawAmount, limits, tracker, now = Date.now()) {
    const normalizedToken = tokenAddress.toLowerCase();
    const isUsdc = normalizedToken === BASE_USDC || normalizedToken === BASE_SEPOLIA_USDC;
    const decimals = isUsdc ? 6 : 18;
    let amountUnits;
    try {
        if (typeof rawAmount === "bigint") {
            amountUnits = rawAmount;
        }
        else if (rawAmount.startsWith("0x")) {
            amountUnits = BigInt(rawAmount);
        }
        else if (rawAmount.includes(".")) {
            amountUnits = parseUnits(rawAmount, decimals);
        }
        else {
            amountUnits = BigInt(rawAmount);
        }
    }
    catch {
        return {
            valid: false,
            error: `Invalid token amount: ${rawAmount}`,
            asset: tokenAddress,
            amountFormatted: rawAmount.toString(),
            limitFormatted: "unknown"
        };
    }
    const perTxLimitStr = limits.maxTokenPerTx[normalizedToken] || limits.maxTokenPerTx[BASE_USDC] || "50.0";
    const dailyLimitStr = limits.maxTokenDaily[normalizedToken] || limits.maxTokenDaily[BASE_USDC] || "200.0";
    const maxPerTxUnits = parseUnits(perTxLimitStr, decimals);
    if (amountUnits > maxPerTxUnits) {
        return {
            valid: false,
            error: `Token spend ${formatUnits(amountUnits, decimals)} exceeds per-tx limit of ${perTxLimitStr}`,
            asset: tokenAddress,
            amountFormatted: formatUnits(amountUnits, decimals),
            limitFormatted: perTxLimitStr
        };
    }
    if (tracker) {
        const dailyUsed = tracker.get24HourTotal(normalizedToken, now);
        const maxDailyUnits = parseUnits(dailyLimitStr, decimals);
        if (dailyUsed + amountUnits > maxDailyUnits) {
            return {
                valid: false,
                error: `Cumulative 24h token spend (${formatUnits(dailyUsed + amountUnits, decimals)}) exceeds daily limit of ${dailyLimitStr}`,
                asset: tokenAddress,
                amountFormatted: formatUnits(dailyUsed + amountUnits, decimals),
                limitFormatted: dailyLimitStr
            };
        }
    }
    return {
        valid: true,
        asset: tokenAddress,
        amountFormatted: formatUnits(amountUnits, decimals),
        limitFormatted: perTxLimitStr
    };
}
//# sourceMappingURL=spend.js.map