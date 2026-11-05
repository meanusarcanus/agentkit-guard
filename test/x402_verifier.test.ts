import { describe, it, expect } from "vitest";
import { validateX402Challenge } from "../src/verifiers/x402.js";
import { DEFAULT_BASE_POLICY } from "../src/policy/defaults.js";
import { BASE_USDC } from "../src/types.js";

describe("x402 Protocol Challenge Verifier", () => {
  const config = DEFAULT_BASE_POLICY.x402Config;

  it("should approve valid micropayment challenge under cap", () => {
    const res = validateX402Challenge(
      {
        merchant: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amountUsdc: "1.50",
        resourceUri: "https://api.coinbase.com/v1/intel",
        nonce: "test_nonce_1",
        deadline: Math.floor(Date.now() / 1000) + 3600,
        tokenAddress: BASE_USDC,
        network: "base"
      },
      config
    );
    expect(res.valid).toBe(true);
  });

  it("should reject expired x402 payment challenge", () => {
    const res = validateX402Challenge(
      {
        merchant: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amountUsdc: "1.00",
        resourceUri: "https://api.coinbase.com/v1/intel",
        nonce: "test_nonce_2",
        deadline: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
        tokenAddress: BASE_USDC,
        network: "base"
      },
      config
    );
    expect(res.valid).toBe(false);
    expect(res.code).toBe("X402_EXPIRED");
  });

  it("should reject payment challenge exceeding USDC ceiling", () => {
    const res = validateX402Challenge(
      {
        merchant: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amountUsdc: "15.00", // default limit is 5.0 USDC
        resourceUri: "https://api.coinbase.com/v1/intel",
        nonce: "test_nonce_3",
        deadline: Math.floor(Date.now() / 1000) + 3600,
        tokenAddress: BASE_USDC,
        network: "base"
      },
      config
    );
    expect(res.valid).toBe(false);
    expect(res.code).toBe("X402_EXCEEDS_CAP");
  });
});
