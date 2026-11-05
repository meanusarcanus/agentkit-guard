/**
 * Creates a pre-execution security hook for Coinbase AgentKit action providers.
 */
export function createAgentKitGuardHook(engine) {
    return async function guardHook(context, next) {
        const action = mapAgentKitToAction(context, engine);
        const verdict = engine.evaluate(action);
        if (!verdict.allowed) {
            const errorMsg = `[AgentKit-Guard BLOCKED] Code: ${verdict.code} | Risk: ${verdict.riskScore}/100 | Reason: ${verdict.reason}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        // Execute downstream action
        const result = await next(context.args);
        // If successful and was a spend, update tracker
        if (action.value && action.value !== "0") {
            try {
                engine.getSpendTracker().recordSpend("NATIVE", BigInt(action.value));
            }
            catch {
                // no-op
            }
        }
        return result;
    };
}
function mapAgentKitToAction(ctx, engine) {
    const to = (ctx.args.to || ctx.args.recipient || ctx.args.destination || "0x0000000000000000000000000000000000000000");
    const value = (ctx.args.value || ctx.args.amount || "0");
    const data = (ctx.args.data || ctx.args.calldata || "0x");
    return {
        type: "transaction",
        to,
        value,
        data,
        chainId: engine.getPolicy().network === "base-sepolia" ? 84532 : 8453,
        reasoningTrace: ctx.reasoning,
        userInput: ctx.userPrompt,
        metadata: {
            actionName: ctx.actionName,
            rawArgs: ctx.args
        }
    };
}
//# sourceMappingURL=agentkit.js.map