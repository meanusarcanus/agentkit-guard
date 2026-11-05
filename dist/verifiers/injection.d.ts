import { PromptInjectionDefense } from "../types.js";
export interface InjectionScanResult {
    hasInjection: boolean;
    riskScore: number;
    matchedPatterns: string[];
    findings: string[];
}
export declare function scanForPromptInjection(textToScan: string | undefined, config: PromptInjectionDefense): InjectionScanResult;
//# sourceMappingURL=injection.d.ts.map