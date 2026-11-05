import { AgentGuardEngine } from "../policy/engine.js";
export interface GuardedToolOptions {
    engine: AgentGuardEngine;
    toolName: string;
}
export declare function wrapToolWithGuard<TArgs extends Record<string, unknown>, TResult>(options: GuardedToolOptions, executeFn: (args: TArgs) => Promise<TResult>): (args: TArgs, context?: {
    userPrompt?: string;
    trace?: string;
}) => Promise<TResult>;
//# sourceMappingURL=langchain.d.ts.map