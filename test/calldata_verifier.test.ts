import { describe, it, expect } from "vitest";
import { analyzeCalldata } from "../src/verifiers/calldata.js";
import { DEFAULT_BASE_POLICY } from "../src/policy/defaults.js";
import { encodeFunctionData, parseAbi } from "viem";

describe("Calldata Verifier", () => {
  const allowlists = DEFAULT_BASE_POLICY.allowlists;
  const blocklists = DEFAULT_BASE_POLICY.blocklists;

  it("should pass for empty or native transfer calldata", () => {
    const res = analyzeCalldata("0x", allowlists, blocklists);
    expect(res.isValid).toBe(true);
    expect(res.isDangerousSelector).toBe(false);
  });

  it("should flag dangerous selector (e.g. transferOwnership)", () => {
    // transferOwnership(address) = 0xf2fde38b
    const res = analyzeCalldata("0xf2fde38b000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e", allowlists, blocklists);
    expect(res.isValid).toBe(true);
    expect(res.isDangerousSelector).toBe(true);
    expect(res.error).toContain("Blocked dangerous function selector");
  });

  it("should detect unlimited approval vulnerability", () => {
    const abi = parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]);
    const maxUint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    const calldata = encodeFunctionData({
      abi,
      functionName: "approve",
      args: ["0x1111111254fb6c44bac0bed2854e76f90643097d", maxUint]
    });

    const res = analyzeCalldata(calldata, allowlists, blocklists);
    expect(res.isValid).toBe(true);
    expect(res.decodedMethod).toBe("approve");
    expect(res.isUnlimitedApproval).toBe(true);
  });

  it("should allow safe, bounded approval", () => {
    const abi = parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]);
    const safeAmount = BigInt("50000000"); // 50 USDC
    const calldata = encodeFunctionData({
      abi,
      functionName: "approve",
      args: ["0x1111111254fb6c44bac0bed2854e76f90643097d", safeAmount]
    });

    const res = analyzeCalldata(calldata, allowlists, blocklists);
    expect(res.isValid).toBe(true);
    expect(res.decodedMethod).toBe("approve");
    expect(res.isUnlimitedApproval).toBe(false);
  });
});
