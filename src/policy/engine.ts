import { isAddress, getAddress } from "viem";
import {
  GuardPolicy,
  AgentAction,
  Verdict,
  NetworkToChainId,
  X402Challenge
} from "../types.js";
import { analyzeCalldata } from "../verifiers/calldata.js";
import { SpendTracker, validateNativeSpend, validateTokenSpend } from "../verifiers/spend.js";
import { scanForPromptInjection } from "../verifiers/injection.js";
import { validateX402Challenge } from "../verifiers/x402.js";

export class AgentGuardEngine {
  private policy: GuardPolicy;
  private tracker: SpendTracker;

  constructor(policy: GuardPolicy, tracker?: SpendTracker) {
    this.policy = policy;
    this.tracker = tracker || new SpendTracker();
  }

  public getPolicy(): GuardPolicy {
    return this.policy;
  }

  public updatePolicy(newPolicy: Partial<GuardPolicy>) {
    this.policy = { ...this.policy, ...newPolicy };
  }

  public getSpendTracker(): SpendTracker {
    return this.tracker;
  }

  /**
   * Main fail-closed evaluation entrypoint.
   */
  public evaluate(action: AgentAction, now: number = Date.now()): Verdict {
    const timestamp = now;

    // 1. Prompt Injection Scanning (Trace & Input)
    const combinedPrompt = `${action.userInput || ""} ${action.reasoningTrace || ""}`.trim();
    if (combinedPrompt) {
      const injectionResult = scanForPromptInjection(
        combinedPrompt,
        this.policy.promptInjectionDefense
      );

      if (injectionResult.hasInjection) {
        return {
          allowed: false,
          code: "PROMPT_INJECTION_DETECTED",
          reason: `Action blocked: Detected prompt injection or hostile instructions (${injectionResult.matchedPatterns.join(", ")})`,
          riskScore: injectionResult.riskScore,
          timestamp,
          diagnostics: {
            patterns: injectionResult.matchedPatterns,
            findings: injectionResult.findings
          }
        };
      }
    }

    // 2. Chain ID Verification
    const expectedChainId = NetworkToChainId[this.policy.network];
    if (action.chainId && expectedChainId && action.chainId !== expectedChainId) {
      return {
        allowed: false,
        code: "CHAIN_MISMATCH",
        reason: `Target chainId ${action.chainId} does not match active policy network ${this.policy.network} (expected ${expectedChainId})`,
        riskScore: 70,
        timestamp
      };
    }

    // 3. Address Formatting & Blocklist Check
    if (!isAddress(action.to)) {
      return {
        allowed: false,
        code: "MALFORMED_ACTION",
        reason: `Destination address '${action.to}' is not a valid Ethereum address`,
        riskScore: 90,
        timestamp
      };
    }

    const normalizedTo = action.to.toLowerCase();
    const blocklistSet = new Set(this.policy.blocklists.destinations.map((d) => d.toLowerCase()));
    if (blocklistSet.has(normalizedTo)) {
      return {
        allowed: false,
        code: "DESTINATION_BLOCKLISTED",
        reason: `Destination address ${action.to} is explicitly blocklisted`,
        riskScore: 100,
        timestamp
      };
    }

    // 4. Destination Allowlist Check (if configured)
    if (this.policy.allowlists.destinations.length > 0) {
      const allowlistSet = new Set(this.policy.allowlists.destinations.map((d) => d.toLowerCase()));
      if (!allowlistSet.has(normalizedTo)) {
        return {
          allowed: false,
          code: "UNAUTHORIZED_DESTINATION",
          reason: `Destination ${action.to} is not in the approved destinations allowlist`,
          riskScore: 85,
          timestamp
        };
      }
    }

    // 5. Calldata Analysis & Dangerous Selector Check
    const calldataResult = analyzeCalldata(
      action.data,
      this.policy.allowlists,
      this.policy.blocklists
    );

    if (!calldataResult.isValid) {
      return {
        allowed: false,
        code: "MALFORMED_ACTION",
        reason: `Invalid calldata format: ${calldataResult.error}`,
        riskScore: 80,
        timestamp
      };
    }

    if (calldataResult.isDangerousSelector) {
      return {
        allowed: false,
        code: "DANGEROUS_CALLDATA",
        reason: `Blocked critical function call: ${calldataResult.error}`,
        riskScore: 95,
        timestamp,
        diagnostics: { selector: calldataResult.selector }
      };
    }

    if (calldataResult.isUnlimitedApproval) {
      return {
        allowed: false,
        code: "UNLIMITED_APPROVAL_ATTACK",
        reason: "Detected unbounded/unlimited ERC-20 approval pattern. Approval must be exact and capped by policy.",
        riskScore: 90,
        timestamp,
        diagnostics: { args: calldataResult.args }
      };
    }

    // 6. Native Spending Validation
    if (action.value && action.value !== "0" && action.value !== "0x0" && action.value !== "0x") {
      const nativeSpend = validateNativeSpend(
        action.value,
        this.policy.spendingLimits,
        this.tracker,
        timestamp
      );

      if (!nativeSpend.valid) {
        return {
          allowed: false,
          code: "EXCEEDS_SPEND_LIMIT",
          reason: nativeSpend.error || "Native spend limit exceeded",
          riskScore: 75,
          timestamp,
          diagnostics: {
            value: nativeSpend.amountFormatted,
            limit: nativeSpend.limitFormatted
          }
        };
      }
    }

    // 7. Token Spend Validation (for transfer or approve)
    if (calldataResult.decodedMethod === "transfer" && calldataResult.args) {
      const tokenAddress = action.to; // The contract receiving the call is the token
      const transferAmount = calldataResult.args.amount as string;

      const tokenSpend = validateTokenSpend(
        tokenAddress,
        transferAmount,
        this.policy.spendingLimits,
        this.tracker,
        timestamp
      );

      if (!tokenSpend.valid) {
        return {
          allowed: false,
          code: "EXCEEDS_SPEND_LIMIT",
          reason: tokenSpend.error || "Token spend limit exceeded",
          riskScore: 75,
          timestamp,
          diagnostics: {
            token: tokenAddress,
            amount: tokenSpend.amountFormatted,
            limit: tokenSpend.limitFormatted
          }
        };
      }
    }

    // Everything passed: Approve transaction
    return {
      allowed: true,
      code: "APPROVED",
      reason: "Action verified against all active security policies and spend limits",
      riskScore: 0,
      timestamp,
      diagnostics: {
        destination: getAddress(action.to),
        method: calldataResult.decodedMethod || "native_transfer",
        network: this.policy.network
      }
    };
  }

  /**
   * Dedicated verification for x402 payment challenges
   */
  public evaluateX402(challenge: X402Challenge, now: number = Date.now()): Verdict {
    const timestamp = now;
    const result = validateX402Challenge(challenge, this.policy.x402Config, this.tracker, now);

    if (!result.valid) {
      return {
        allowed: false,
        code: result.code === "X402_EXCEEDS_CAP" ? "X402_EXCEEDS_CAP" : "X402_INVALID_CHALLENGE",
        reason: result.error || "Invalid x402 payment challenge",
        riskScore: 80,
        timestamp,
        diagnostics: { challenge }
      };
    }

    return {
      allowed: true,
      code: "APPROVED",
      reason: "x402 micropayment verified under configured Base USDC payment ceiling",
      riskScore: 0,
      timestamp,
      diagnostics: {
        merchant: result.sanitizedChallenge?.merchant,
        amountUsdc: challenge.amountUsdc,
        resourceUri: challenge.resourceUri
      }
    };
  }
}
