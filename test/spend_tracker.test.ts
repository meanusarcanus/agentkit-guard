import { describe, it, expect } from "vitest";
import { SpendTracker, validateNativeSpend, validateTokenSpend } from "../src/verifiers/spend.js";
import { DEFAULT_BASE_POLICY } from "../src/policy/defaults.js";
import { parseEther, parseUnits } from "viem";
import { BASE_USDC } from "../src/types.js";

describe("Spend Tracker & Limit Verifier", () => {
  const limits = DEFAULT_BASE_POLICY.spendingLimits;

  it("should allow native spend within per-tx ceiling", () => {
    const res = validateNativeSpend("0.02", limits);
    expect(res.valid).toBe(true);
  });

  it("should reject native spend exceeding per-tx ceiling", () => {
    const res = validateNativeSpend("0.1", limits); // limit is 0.05
    expect(res.valid).toBe(false);
    expect(res.error).toContain("exceeds per-tx limit");
  });

  it("should enforce rolling 24-hour native budget", () => {
    const tracker = new SpendTracker();
    const now = Date.now();

    // Spend 0.04 ETH 4 times = 0.16 ETH (under 0.20 daily limit)
    tracker.recordSpend("NATIVE", parseEther("0.04"), now - 10000);
    tracker.recordSpend("NATIVE", parseEther("0.04"), now - 8000);
    tracker.recordSpend("NATIVE", parseEther("0.04"), now - 6000);
    tracker.recordSpend("NATIVE", parseEther("0.04"), now - 4000);

    // Now try to spend 0.05 ETH -> 0.16 + 0.05 = 0.21 > 0.20
    const res = validateNativeSpend("0.05", limits, tracker, now);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("exceeds daily limit");
  });

  it("should enforce token per-tx limits for Base USDC", () => {
    // 40 USDC (valid)
    const validRes = validateTokenSpend(BASE_USDC, parseUnits("40", 6), limits);
    expect(validRes.valid).toBe(true);

    // 100 USDC (exceeds 50 USDC limit)
    const invalidRes = validateTokenSpend(BASE_USDC, parseUnits("100", 6), limits);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.error).toContain("exceeds per-tx limit");
  });
});
