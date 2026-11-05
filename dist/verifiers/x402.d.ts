import { X402Challenge, X402Config } from "../types.js";
import { SpendTracker } from "./spend.js";
export interface X402ValidationResult {
    valid: boolean;
    error?: string;
    code?: "X402_DISABLED" | "X402_EXPIRED" | "X402_UNAUTHORIZED_MERCHANT" | "X402_INVALID_TOKEN" | "X402_EXCEEDS_CAP" | "X402_MALFORMED";
    sanitizedChallenge?: X402Challenge;
}
export declare function validateX402Challenge(challenge: X402Challenge, config: X402Config, tracker?: SpendTracker, now?: number): X402ValidationResult;
//# sourceMappingURL=x402.d.ts.map