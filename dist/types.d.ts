import { z } from "zod";
export declare const NetworkIdSchema: z.ZodEnum<{
    arbitrum: "arbitrum";
    base: "base";
    "base-sepolia": "base-sepolia";
    ethereum: "ethereum";
    optimism: "optimism";
}>;
export type NetworkId = z.infer<typeof NetworkIdSchema>;
export declare const ChainIdToNetwork: Record<number, NetworkId>;
export declare const NetworkToChainId: Record<NetworkId, number>;
export declare const BASE_USDC: string;
export declare const BASE_SEPOLIA_USDC: string;
export declare const SpendingLimitsSchema: z.ZodObject<{
    maxNativePerTx: z.ZodDefault<z.ZodString>;
    maxNativeDaily: z.ZodDefault<z.ZodString>;
    maxTokenPerTx: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    maxTokenDaily: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export type SpendingLimits = z.infer<typeof SpendingLimitsSchema>;
export declare const AllowlistsSchema: z.ZodObject<{
    destinations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tokens: z.ZodDefault<z.ZodArray<z.ZodString>>;
    methods: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type Allowlists = z.infer<typeof AllowlistsSchema>;
export declare const BlocklistsSchema: z.ZodObject<{
    destinations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    dangerousSelectors: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type Blocklists = z.infer<typeof BlocklistsSchema>;
export declare const X402ConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    allowedMerchantDomains: z.ZodDefault<z.ZodArray<z.ZodString>>;
    maxPaymentPerChallengeUsdc: z.ZodDefault<z.ZodString>;
    maxDailyX402Usdc: z.ZodDefault<z.ZodString>;
    allowedTokens: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type X402Config = z.infer<typeof X402ConfigSchema>;
export declare const PromptInjectionDefenseSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    strictMode: z.ZodDefault<z.ZodBoolean>;
    blockedPatterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type PromptInjectionDefense = z.infer<typeof PromptInjectionDefenseSchema>;
export declare const GuardPolicySchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodString>;
    network: z.ZodDefault<z.ZodEnum<{
        arbitrum: "arbitrum";
        base: "base";
        "base-sepolia": "base-sepolia";
        ethereum: "ethereum";
        optimism: "optimism";
    }>>;
    spendingLimits: z.ZodDefault<z.ZodObject<{
        maxNativePerTx: z.ZodDefault<z.ZodString>;
        maxNativeDaily: z.ZodDefault<z.ZodString>;
        maxTokenPerTx: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        maxTokenDaily: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    allowlists: z.ZodDefault<z.ZodObject<{
        destinations: z.ZodDefault<z.ZodArray<z.ZodString>>;
        tokens: z.ZodDefault<z.ZodArray<z.ZodString>>;
        methods: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    blocklists: z.ZodDefault<z.ZodObject<{
        destinations: z.ZodDefault<z.ZodArray<z.ZodString>>;
        dangerousSelectors: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    x402Config: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        allowedMerchantDomains: z.ZodDefault<z.ZodArray<z.ZodString>>;
        maxPaymentPerChallengeUsdc: z.ZodDefault<z.ZodString>;
        maxDailyX402Usdc: z.ZodDefault<z.ZodString>;
        allowedTokens: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    promptInjectionDefense: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        strictMode: z.ZodDefault<z.ZodBoolean>;
        blockedPatterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type GuardPolicy = z.infer<typeof GuardPolicySchema>;
export declare const AgentActionSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<{
        contract_call: "contract_call";
        message_sign: "message_sign";
        transaction: "transaction";
        x402_payment: "x402_payment";
    }>>;
    to: z.ZodString;
    value: z.ZodDefault<z.ZodString>;
    data: z.ZodDefault<z.ZodString>;
    chainId: z.ZodDefault<z.ZodNumber>;
    reasoningTrace: z.ZodOptional<z.ZodString>;
    userInput: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export declare const X402ChallengeSchema: z.ZodObject<{
    merchant: z.ZodString;
    amountUsdc: z.ZodString;
    resourceUri: z.ZodString;
    nonce: z.ZodString;
    deadline: z.ZodNumber;
    tokenAddress: z.ZodDefault<z.ZodString>;
    network: z.ZodDefault<z.ZodEnum<{
        arbitrum: "arbitrum";
        base: "base";
        "base-sepolia": "base-sepolia";
        ethereum: "ethereum";
        optimism: "optimism";
    }>>;
}, z.core.$strip>;
export type X402Challenge = z.infer<typeof X402ChallengeSchema>;
export type VerdictCode = "APPROVED" | "EXCEEDS_SPEND_LIMIT" | "UNAUTHORIZED_DESTINATION" | "DANGEROUS_CALLDATA" | "UNLIMITED_APPROVAL_ATTACK" | "PROMPT_INJECTION_DETECTED" | "X402_INVALID_CHALLENGE" | "X402_EXCEEDS_CAP" | "CHAIN_MISMATCH" | "DESTINATION_BLOCKLISTED" | "MALFORMED_ACTION";
export interface Verdict {
    allowed: boolean;
    code: VerdictCode;
    reason: string;
    riskScore: number;
    timestamp: number;
    diagnostics?: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map