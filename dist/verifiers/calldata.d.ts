import { Blocklists, Allowlists } from "../types.js";
export interface CalldataAnalysis {
    isValid: boolean;
    selector?: string;
    decodedMethod?: string;
    args?: Record<string, unknown>;
    isDangerousSelector: boolean;
    isUnlimitedApproval: boolean;
    error?: string;
}
export declare function analyzeCalldata(data: string, allowlists: Allowlists, blocklists: Blocklists): CalldataAnalysis;
//# sourceMappingURL=calldata.d.ts.map