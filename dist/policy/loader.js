import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { GuardPolicySchema } from "../types.js";
import { DEFAULT_BASE_POLICY } from "./defaults.js";
export function loadGuardPolicy(configPath) {
    const targetPath = configPath
        ? resolve(process.cwd(), configPath)
        : resolve(process.cwd(), "agentkit-guard.config.json");
    if (!existsSync(targetPath)) {
        return DEFAULT_BASE_POLICY;
    }
    try {
        const rawContent = readFileSync(targetPath, "utf-8");
        const parsed = JSON.parse(rawContent);
        const validated = GuardPolicySchema.parse(parsed);
        return validated;
    }
    catch (error) {
        console.warn(`[agentkit-guard] Warning: Failed to parse policy at ${targetPath}. Falling back to default Base policy. Error:`, error);
        return DEFAULT_BASE_POLICY;
    }
}
//# sourceMappingURL=loader.js.map