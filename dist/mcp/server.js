#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { AgentGuardEngine } from "../policy/engine.js";
import { loadGuardPolicy } from "../policy/loader.js";
import { scanForPromptInjection } from "../verifiers/injection.js";
const policy = loadGuardPolicy();
const engine = new AgentGuardEngine(policy);
const server = new Server({
    name: "agentkit-guard-mcp",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "evaluate_transaction",
                description: "Evaluates an onchain Ethereum/Base transaction against fail-closed security policies, spend limits, and calldata guardrails before execution.",
                inputSchema: {
                    type: "object",
                    properties: {
                        to: { type: "string", description: "Target Ethereum/contract address" },
                        value: { type: "string", description: "Value in Wei or decimal ETH string", default: "0" },
                        data: { type: "string", description: "Hex calldata", default: "0x" },
                        chainId: { type: "number", description: "EVM chain ID (default 8453 for Base)", default: 8453 },
                        reasoningTrace: { type: "string", description: "Agent's internal reasoning or scratchpad" },
                        userInput: { type: "string", description: "Original user prompt that triggered the action" }
                    },
                    required: ["to"]
                }
            },
            {
                name: "verify_x402_challenge",
                description: "Validates an HTTP 402 Payment Required challenge for Base USDC micropayments against maximum spend limits and merchant allowlists.",
                inputSchema: {
                    type: "object",
                    properties: {
                        merchant: { type: "string", description: "Merchant recipient address" },
                        amountUsdc: { type: "string", description: "Amount in USDC (e.g. '0.50')" },
                        resourceUri: { type: "string", description: "Resource URL being paid for" },
                        nonce: { type: "string", description: "Anti-replay unique nonce" },
                        deadline: { type: "number", description: "Unix timestamp deadline in seconds" },
                        tokenAddress: { type: "string", description: "Token contract address (default Base USDC)" }
                    },
                    required: ["merchant", "amountUsdc", "resourceUri", "nonce", "deadline"]
                }
            },
            {
                name: "check_prompt_injection",
                description: "Scans a user input or reasoning trace for prompt injection attempts, safety bypasses, and wallet drain instructions.",
                inputSchema: {
                    type: "object",
                    properties: {
                        text: { type: "string", description: "The prompt or conversation text to scan" }
                    },
                    required: ["text"]
                }
            },
            {
                name: "get_active_policies",
                description: "Returns the currently active security policies, spend ceilings, and destination allowlists.",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            }
        ]
    };
});
// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "evaluate_transaction") {
            const action = {
                type: "transaction",
                to: String(args?.to || ""),
                value: String(args?.value || "0"),
                data: String(args?.data || "0x"),
                chainId: Number(args?.chainId || 8453),
                reasoningTrace: args?.reasoningTrace ? String(args.reasoningTrace) : undefined,
                userInput: args?.userInput ? String(args.userInput) : undefined
            };
            const verdict = engine.evaluate(action);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(verdict, null, 2)
                    }
                ]
            };
        }
        if (name === "verify_x402_challenge") {
            const challenge = {
                merchant: String(args?.merchant),
                amountUsdc: String(args?.amountUsdc),
                resourceUri: String(args?.resourceUri),
                nonce: String(args?.nonce),
                deadline: Number(args?.deadline),
                tokenAddress: args?.tokenAddress ? String(args.tokenAddress) : undefined,
                network: policy.network
            };
            const verdict = engine.evaluateX402(challenge);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(verdict, null, 2)
                    }
                ]
            };
        }
        if (name === "check_prompt_injection") {
            const text = String(args?.text || "");
            const scanResult = scanForPromptInjection(text, policy.promptInjectionDefense);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(scanResult, null, 2)
                    }
                ]
            };
        }
        if (name === "get_active_policies") {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(engine.getPolicy(), null, 2)
                    }
                ]
            };
        }
        throw new Error(`Unknown tool: ${name}`);
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: error.message || String(error) }, null, 2)
                }
            ],
            isError: true
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[AgentKit Guard MCP Server] Connected and listening on stdio.");
}
main().catch((err) => {
    console.error("Fatal error starting AgentKit Guard MCP server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map