import { isAddress, getAddress } from "viem";
import { validateTokenSpend } from "./spend.js";
export function validateX402Challenge(challenge, config, tracker, now = Date.now()) {
    if (!config.enabled) {
        return {
            valid: false,
            code: "X402_DISABLED",
            error: "x402 automatic payments are disabled by policy"
        };
    }
    // Check merchant address validity
    if (!isAddress(challenge.merchant)) {
        return {
            valid: false,
            code: "X402_MALFORMED",
            error: `Invalid merchant Ethereum address: ${challenge.merchant}`
        };
    }
    // Check deadline (unix seconds or milliseconds)
    const deadlineMs = challenge.deadline > 1000000000000 ? challenge.deadline : challenge.deadline * 1000;
    if (deadlineMs < now) {
        return {
            valid: false,
            code: "X402_EXPIRED",
            error: `x402 challenge expired at ${new Date(deadlineMs).toISOString()}`
        };
    }
    // Check token address (must be allowed USDC or token on Base)
    const normalizedToken = challenge.tokenAddress.toLowerCase();
    const allowedTokensSet = new Set(config.allowedTokens.map((t) => t.toLowerCase()));
    if (!allowedTokensSet.has(normalizedToken)) {
        return {
            valid: false,
            code: "X402_INVALID_TOKEN",
            error: `Payment requested in unapproved token: ${challenge.tokenAddress}. Expected allowed token (e.g. Base USDC)`
        };
    }
    // Check merchant domain if configured
    if (!config.allowedMerchantDomains.includes("*")) {
        try {
            const url = new URL(challenge.resourceUri);
            const isAllowed = config.allowedMerchantDomains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
            if (!isAllowed) {
                return {
                    valid: false,
                    code: "X402_UNAUTHORIZED_MERCHANT",
                    error: `Resource domain ${url.hostname} is not in allowed merchant domains list`
                };
            }
        }
        catch {
            return {
                valid: false,
                code: "X402_MALFORMED",
                error: `Invalid resource URI: ${challenge.resourceUri}`
            };
        }
    }
    // Check amount against maxPaymentPerChallengeUsdc
    const spendCheck = validateTokenSpend(challenge.tokenAddress, challenge.amountUsdc, {
        maxNativePerTx: "0.05",
        maxNativeDaily: "0.2",
        maxTokenPerTx: { [normalizedToken]: config.maxPaymentPerChallengeUsdc },
        maxTokenDaily: { [normalizedToken]: config.maxDailyX402Usdc }
    }, tracker, now);
    if (!spendCheck.valid) {
        return {
            valid: false,
            code: "X402_EXCEEDS_CAP",
            error: `x402 payment of ${challenge.amountUsdc} USDC exceeds ceiling: ${spendCheck.error}`
        };
    }
    return {
        valid: true,
        sanitizedChallenge: {
            ...challenge,
            merchant: getAddress(challenge.merchant)
        }
    };
}
//# sourceMappingURL=x402.js.map