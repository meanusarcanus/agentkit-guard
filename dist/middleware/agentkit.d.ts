import { AgentGuardEngine } from "../policy/engine.js";
export interface AgentKitActionHookContext {
    actionName: string;
    args: Record<string, unknown>;
    userPrompt?: string;
    reasoning?: string;
}
export type ActionExecutionHandler = (args: Record<string, unknown>) => Promise<unknown>;
/**
 * Creates a pre-execution security hook for Coinbase AgentKit action providers.
 */
export declare function createAgentKitGuardHook(engine: AgentGuardEngine): (context: AgentKitActionHookContext, next: ActionExecutionHandler) => Promise<unknown>;
//# sourceMappingURL=agentkit.d.ts.map