export function wrapToolWithGuard(options, executeFn) {
    return async (args, context) => {
        const to = (args.to || args.recipient || args.targetContract || "0x0000000000000000000000000000000000000000");
        const value = (args.value || args.amount || "0");
        const data = (args.data || args.calldata || "0x");
        const action = {
            type: "transaction",
            to,
            value,
            data,
            chainId: options.engine.getPolicy().network === "base-sepolia" ? 84532 : 8453,
            reasoningTrace: context?.trace,
            userInput: context?.userPrompt,
            metadata: { toolName: options.toolName }
        };
        const verdict = options.engine.evaluate(action);
        if (!verdict.allowed) {
            throw new Error(`[AgentGuard Security Gate] Execution prohibited: ${verdict.reason} (Code: ${verdict.code})`);
        }
        return await executeFn(args);
    };
}
//# sourceMappingURL=langchain.js.map