#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { AgentGuardEngine } from "./policy/engine.js";
import { loadGuardPolicy } from "./policy/loader.js";
import { DEFAULT_BASE_POLICY } from "./policy/defaults.js";
import { AgentActionSchema, X402ChallengeSchema } from "./types.js";
// ANSI colors for sharp terminal rendering
const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m"
};
const program = new Command();
program
    .name("agentkit-guard")
    .description("Zero-latency firewall and security policy engine for Coinbase AgentKit & onchain agents on Base")
    .version("1.0.0");
program
    .command("scan <tracePath>")
    .description("Evaluate an agent execution trace, transaction proposal, or calldata file against active security policies")
    .option("-c, --config <path>", "Custom policy configuration path")
    .option("--json", "Output results in raw JSON format")
    .action((tracePath, options) => {
    const fullPath = resolve(process.cwd(), tracePath);
    if (!existsSync(fullPath)) {
        console.error(`${c.red}Error:${c.reset} Target file not found: ${fullPath}`);
        process.exit(1);
    }
    let parsedAction;
    try {
        const raw = readFileSync(fullPath, "utf-8");
        parsedAction = JSON.parse(raw);
    }
    catch (err) {
        console.error(`${c.red}Error parsing JSON:${c.reset} ${err.message}`);
        process.exit(1);
    }
    const policy = loadGuardPolicy(options.config);
    const engine = new AgentGuardEngine(policy);
    const validatedAction = AgentActionSchema.parse(parsedAction);
    const verdict = engine.evaluate(validatedAction);
    if (options.json) {
        console.log(JSON.stringify(verdict, null, 2));
        process.exit(verdict.allowed ? 0 : 1);
    }
    // Terminal Banner
    console.log(`\n${c.bold}${c.cyan}🛡️  AGENTKIT-GUARD // ONCHAIN SECURITY FIREWALL${c.reset}`);
    console.log(`${c.dim}Network: ${policy.network.toUpperCase()} (Chain ID: ${validatedAction.chainId}) | Policy: ${policy.name}${c.reset}`);
    console.log(`${c.dim}Target:  ${validatedAction.to} | Value: ${validatedAction.value} | Action: ${validatedAction.type}${c.reset}\n`);
    if (verdict.allowed) {
        console.log(`${c.bold}${c.bgGreen}  VERDICT: APPROVED  ${c.reset}`);
        console.log(`${c.green}✔ Reason:${c.reset} ${verdict.reason}`);
        console.log(`${c.dim}Risk Score: ${verdict.riskScore}/100 (Safe)${c.reset}\n`);
        process.exit(0);
    }
    else {
        console.log(`${c.bold}${c.bgRed}  VERDICT: BLOCKED (FAIL-CLOSED)  ${c.reset}`);
        console.log(`${c.red}✖ Code:${c.reset}       ${c.bold}${verdict.code}${c.reset}`);
        console.log(`${c.red}✖ Reason:${c.reset}     ${verdict.reason}`);
        console.log(`${c.yellow}⚠ Risk Score:${c.reset} ${verdict.riskScore}/100 (HIGH RISK)`);
        if (verdict.diagnostics) {
            console.log(`\n${c.bold}Diagnostics:${c.reset}`);
            console.log(JSON.stringify(verdict.diagnostics, null, 2));
        }
        console.log(`\n${c.red}${c.bold}[SECURITY GATE FAILED] Transaction execution aborted.${c.reset}\n`);
        process.exit(1);
    }
});
program
    .command("x402 <challengePath>")
    .description("Validate an HTTP 402 Payment Required challenge payload against Base USDC micropayment caps")
    .option("-c, --config <path>", "Custom policy configuration path")
    .action((challengePath, options) => {
    const fullPath = resolve(process.cwd(), challengePath);
    if (!existsSync(fullPath)) {
        console.error(`${c.red}Error:${c.reset} File not found: ${fullPath}`);
        process.exit(1);
    }
    const raw = readFileSync(fullPath, "utf-8");
    const challenge = X402ChallengeSchema.parse(JSON.parse(raw));
    const policy = loadGuardPolicy(options.config);
    const engine = new AgentGuardEngine(policy);
    const verdict = engine.evaluateX402(challenge);
    console.log(`\n${c.bold}${c.magenta}⚡ x402 HTTP PAYMENT PROTOCOL VERIFIER${c.reset}`);
    console.log(`${c.dim}Merchant: ${challenge.merchant} | Amount: ${challenge.amountUsdc} USDC${c.reset}\n`);
    if (verdict.allowed) {
        console.log(`${c.bold}${c.green}✔ APPROVED:${c.reset} ${verdict.reason}`);
        process.exit(0);
    }
    else {
        console.log(`${c.bold}${c.red}✖ REJECTED:${c.reset} ${verdict.reason} (${verdict.code})`);
        process.exit(1);
    }
});
program
    .command("init")
    .description("Initialize a production-ready agentkit-guard.config.json in current directory")
    .action(() => {
    const target = resolve(process.cwd(), "agentkit-guard.config.json");
    if (existsSync(target)) {
        console.log(`${c.yellow}Notice:${c.reset} agentkit-guard.config.json already exists.`);
        return;
    }
    writeFileSync(target, JSON.stringify(DEFAULT_BASE_POLICY, null, 2));
    console.log(`${c.green}✔ Created agentkit-guard.config.json with Base Mainnet & Base Sepolia defaults.${c.reset}`);
});
program
    .command("check-policy [configPath]")
    .description("Validate an agentkit-guard configuration file syntax and schema")
    .action((configPath) => {
    try {
        const policy = loadGuardPolicy(configPath);
        console.log(`${c.green}✔ Policy file is valid! Loaded policy:${c.reset} ${policy.name}`);
        console.log(`  Network:        ${policy.network}`);
        console.log(`  Max Native/Tx:  ${policy.spendingLimits.maxNativePerTx} ETH`);
        console.log(`  x402 Enabled:   ${policy.x402Config.enabled}`);
        console.log(`  Strict Defense: ${policy.promptInjectionDefense.strictMode}`);
    }
    catch (err) {
        console.error(`${c.red}✖ Invalid policy configuration:${c.reset} ${err.message}`);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map