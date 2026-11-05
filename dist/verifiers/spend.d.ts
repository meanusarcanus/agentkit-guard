import { SpendingLimits } from "../types.js";
export interface SpendRecord {
    timestamp: number;
    asset: "NATIVE" | string;
    amountWei: bigint;
}
export declare class SpendTracker {
    private history;
    constructor();
    recordSpend(asset: "NATIVE" | string, amountWei: bigint, timestamp?: number): void;
    get24HourTotal(asset: "NATIVE" | string, now?: number): bigint;
    clear(): void;
}
export interface SpendValidationResult {
    valid: boolean;
    error?: string;
    asset: "NATIVE" | string;
    amountFormatted: string;
    limitFormatted: string;
}
export declare function validateNativeSpend(valueString: string, limits: SpendingLimits, tracker?: SpendTracker, now?: number): SpendValidationResult;
export declare function validateTokenSpend(tokenAddress: string, rawAmount: string | bigint, limits: SpendingLimits, tracker?: SpendTracker, now?: number): SpendValidationResult;
//# sourceMappingURL=spend.d.ts.map