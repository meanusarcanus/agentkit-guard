import { AgentGuardEngine } from "../policy/engine.js";
import { AgentAction, Verdict } from "../types.js";

export interface GuardedToolOptions {
  engine: AgentGuardEngine;
  toolName: string;
}

export function wrapToolWithGuard<TArgs extends Record<string, unknown>, TResult>(
  options: GuardedToolOptions,
  executeFn: (args: TArgs) => Promise<TResult>
): (args: TArgs, context?: { userPrompt?: string; trace?: string }) => Promise<TResult> {
  return async (args: TArgs, context?: { userPrompt?: string; trace?: string }): Promise<TResult> => {
    const to = (args.to || args.recipient || args.targetContract || "0x0000000000000000000000000000000000000000") as string;
    const value = (args.value || args.amount || "0") as string;
    const data = (args.data || args.calldata || "0x") as string;

    const action: AgentAction = {
      type: "transaction",
      to,
      value,
      data,
      chainId: options.engine.getPolicy().network === "base-sepolia" ? 84532 : 8453,
      reasoningTrace: context?.trace,
      userInput: context?.userPrompt,
      metadata: { toolName: options.toolName }
    };

    const verdict: Verdict = options.engine.evaluate(action);
    if (!verdict.allowed) {
      throw new Error(`[AgentGuard Security Gate] Execution prohibited: ${verdict.reason} (Code: ${verdict.code})`);
    }

    return await executeFn(args);
  };
}
