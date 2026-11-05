import { z } from "zod";

export const NetworkIdSchema = z.enum([
  "base",
  "base-sepolia",
  "ethereum",
  "arbitrum",
  "optimism"
]);
export type NetworkId = z.infer<typeof NetworkIdSchema>;

export const ChainIdToNetwork: Record<number, NetworkId> = {
  8453: "base",
  84532: "base-sepolia",
  1: "ethereum",
  42161: "arbitrum",
  10: "optimism"
};

export const NetworkToChainId: Record<NetworkId, number> = {
  "base": 8453,
  "base-sepolia": 84532,
  "ethereum": 1,
  "arbitrum": 42161,
  "optimism": 10
};

// Known Standard Token Addresses on Base
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase();
export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e".toLowerCase();

export const SpendingLimitsSchema = z.object({
  maxNativePerTx: z.string().default("0.05"), // in ETH
  maxNativeDaily: z.string().default("0.2"),  // in ETH
  maxTokenPerTx: z.record(z.string(), z.string()).default({
    [BASE_USDC]: "50.0",
    [BASE_SEPOLIA_USDC]: "50.0"
  }),
  maxTokenDaily: z.record(z.string(), z.string()).default({
    [BASE_USDC]: "200.0",
    [BASE_SEPOLIA_USDC]: "200.0"
  })
});
export type SpendingLimits = z.infer<typeof SpendingLimitsSchema>;

export const AllowlistsSchema = z.object({
  destinations: z.array(z.string()).default([]),
  tokens: z.array(z.string()).default([BASE_USDC, BASE_SEPOLIA_USDC]),
  methods: z.array(z.string()).default([
    "0xa9059cbb", // transfer(address,uint256)
    "0x095ea7b3"  // approve(address,uint256)
  ])
});
export type Allowlists = z.infer<typeof AllowlistsSchema>;

export const BlocklistsSchema = z.object({
  destinations: z.array(z.string()).default([]),
  dangerousSelectors: z.array(z.string()).default([
    "0xf2fde38b", // transferOwnership(address)
    "0x715018a6", // renounceOwnership()
    "0x4f1ee3d0", // upgradeToAndCall(address,bytes)
    "0x3659cfe6", // upgradeTo(address)
    "0x42966c68"  // burn(uint256)
  ])
});
export type Blocklists = z.infer<typeof BlocklistsSchema>;

export const X402ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  allowedMerchantDomains: z.array(z.string()).default(["*"]),
  maxPaymentPerChallengeUsdc: z.string().default("5.0"),
  maxDailyX402Usdc: z.string().default("25.0"),
  allowedTokens: z.array(z.string()).default([BASE_USDC, BASE_SEPOLIA_USDC])
});
export type X402Config = z.infer<typeof X402ConfigSchema>;

export const PromptInjectionDefenseSchema = z.object({
  enabled: z.boolean().default(true),
  strictMode: z.boolean().default(true),
  blockedPatterns: z.array(z.string()).default([
    "ignore previous instructions",
    "ignore all instructions",
    "bypass safety",
    "drain wallet",
    "transfer all funds",
    "send balance",
    "override policy",
    "system: override",
    "admin mode",
    "jailbreak"
  ])
});
export type PromptInjectionDefense = z.infer<typeof PromptInjectionDefenseSchema>;

export const GuardPolicySchema = z.object({
  name: z.string().default("Default-Base-Agent-Policy"),
  network: NetworkIdSchema.default("base"),
  spendingLimits: SpendingLimitsSchema.default(() => SpendingLimitsSchema.parse({})),
  allowlists: AllowlistsSchema.default(() => AllowlistsSchema.parse({})),
  blocklists: BlocklistsSchema.default(() => BlocklistsSchema.parse({})),
  x402Config: X402ConfigSchema.default(() => X402ConfigSchema.parse({})),
  promptInjectionDefense: PromptInjectionDefenseSchema.default(() => PromptInjectionDefenseSchema.parse({}))
});
export type GuardPolicy = z.infer<typeof GuardPolicySchema>;

export const AgentActionSchema = z.object({
  type: z.enum(["transaction", "x402_payment", "contract_call", "message_sign"]).default("transaction"),
  to: z.string(),
  value: z.string().default("0"), // in Wei or native eth decimal string
  data: z.string().default("0x"),
  chainId: z.number().default(8453),
  reasoningTrace: z.string().optional(),
  userInput: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

export const X402ChallengeSchema = z.object({
  merchant: z.string(),
  amountUsdc: z.string(),
  resourceUri: z.string(),
  nonce: z.string(),
  deadline: z.number(),
  tokenAddress: z.string().default(BASE_USDC),
  network: NetworkIdSchema.default("base")
});
export type X402Challenge = z.infer<typeof X402ChallengeSchema>;

export type VerdictCode =
  | "APPROVED"
  | "EXCEEDS_SPEND_LIMIT"
  | "UNAUTHORIZED_DESTINATION"
  | "DANGEROUS_CALLDATA"
  | "UNLIMITED_APPROVAL_ATTACK"
  | "PROMPT_INJECTION_DETECTED"
  | "X402_INVALID_CHALLENGE"
  | "X402_EXCEEDS_CAP"
  | "CHAIN_MISMATCH"
  | "DESTINATION_BLOCKLISTED"
  | "MALFORMED_ACTION";

export interface Verdict {
  allowed: boolean;
  code: VerdictCode;
  reason: string;
  riskScore: number; // 0 (safe) to 100 (critical block)
  timestamp: number;
  diagnostics?: Record<string, unknown>;
}
