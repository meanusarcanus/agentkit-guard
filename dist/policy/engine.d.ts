import { GuardPolicy, AgentAction, Verdict, X402Challenge } from "../types.js";
import { SpendTracker } from "../verifiers/spend.js";
export declare class AgentGuardEngine {
    private policy;
    private tracker;
    constructor(policy: GuardPolicy, tracker?: SpendTracker);
    getPolicy(): GuardPolicy;
    updatePolicy(newPolicy: Partial<GuardPolicy>): void;
    getSpendTracker(): SpendTracker;
    /**
     * Main fail-closed evaluation entrypoint.
     */
    evaluate(action: AgentAction, now?: number): Verdict;
    /**
     * Dedicated verification for x402 payment challenges
     */
    evaluateX402(challenge: X402Challenge, now?: number): Verdict;
}
//# sourceMappingURL=engine.d.ts.map