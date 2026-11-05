# 📝 Base Builder Grant & CDP AgentKit Bounty Application Kit

Use this document as a ready-to-submit, copy-paste application for the **Base Ecosystem Grants**, **Coinbase Developer Platform (CDP) AgentKit Bounties**, and registration on **Open Source Observer (OSO)**.

---

## 1. Project Overview

- **Project Name:** AgentKit Guard (`agentkit-guard`)
- **Tagline:** Zero-latency, fail-closed firewall, payment guardrails & x402 verification engine for Coinbase AgentKit & onchain AI agents on Base.
- **Repository URL:** `https://github.com/base-guard/agentkit-guard`
- **Package Registry:** `https://www.npmjs.com/package/agentkit-guard`
- **Target Network:** Base Mainnet (Chain ID 8453) & Base Sepolia (Chain ID 84532)
- **Grant Category:** Developer Tooling & Security Infrastructure / AI Agent Tooling
- **Requested Funding:** $20,000 USDC

---

## 2. Problem & Value Proposition

Autonomous onchain agents powered by Coinbase AgentKit and LangChain are rapidly expanding on Base. However, deploying agents with live private-key signing authority creates severe security vulnerabilities:
1. **Prompt Injection Drains:** Attackers trick LLMs into transferring user treasuries to malicious addresses.
2. **Unbounded ERC-20 Approvals:** Agents frequently approve `type(uint256).max` allowances to DEX routers, exposing wallets to future exploits.
3. **Runaway Multi-Step Spending:** Agents trapped in logical loops can exhaust onchain balances without human notice.
4. **x402 Micropayment Exploitation:** The emerging Coinbase HTTP 402 standard enables agents to pay for web resources, but lacks local client-side rate limits and address verification.

**AgentKit Guard** solves this by providing a lightweight, zero-latency, fail-closed firewall. It intercepts agent actions *before* signing or broadcasting, enforcing strict spend ceilings, calldata sanitation, prompt injection scanning, and x402 challenge verification.

---

## 3. Milestones & Deliverables Breakdown

### Milestone 1: Core Fail-Closed Engine & Calldata Analyzer (Shipped & Tested)
- **Deliverables:**
  - Complete TypeScript core engine with deterministic policy enforcement.
  - ERC-20 calldata decoder catching `approve(..., type(uint256).max)` and dangerous administrative selectors.
  - 24-hour rolling budget tracker for native ETH and Base USDC.
  - Automated test suite with 100% test pass rate across 5 test suites.
- **Verification Proof:** Live CLI terminal execution proof (`examples/terminal_proof.txt`) demonstrating interception of prompt injection and unlimited approvals.
- **Funding Allocation:** $7,000 USDC

### Milestone 2: x402 Protocol Verification & AI Agent Middleware (Shipped)
- **Deliverables:**
  - Implementation of Coinbase HTTP 402 Payment Required challenge validator.
  - Drop-in pre-execution security hooks for Coinbase AgentKit (`createAgentKitGuardHook`).
  - LangChain tool execution wrapper (`wrapToolWithGuard`).
  - Model Context Protocol (MCP) stdio server for Claude Code, Cursor, and local LLMs.
- **Verification Proof:** Runnable `examples/sample_agent.ts` running real-time attack interceptions.
- **Funding Allocation:** $7,000 USDC

### Milestone 3: CI/CD Distribution & Developer Ecosystem Adoption (Ongoing)
- **Deliverables:**
  - Reusable GitHub Action (`action.yml`) allowing any Base builder to enforce safety checks in `.github/workflows/` in 5 lines of YAML.
  - Production npm packaging (`npm publish`).
  - Open Source Observer indexing and dependency tracking.
  - Community documentation, quickstart templates, and hackathon starter kits.
- **Funding Allocation:** $6,000 USDC

---

## 4. Impact on Base Ecosystem

- **Unlocks Enterprise & High-Value Agent Deployment:** Founders and developers hesitate to fund AI agent wallets due to prompt injection risks. AgentKit Guard gives developers the confidence to deploy capitalized agents on Base.
- **Standardizes x402 Security:** As Base scales the Machine-to-Machine economy with x402, this tool provides the standard client-side verification layer.
- **Zero Ongoing Infrastructure Cost:** Operates as a local library/middleware with zero external RPC overhead or custodial risk.

---

## 5. Open Source Observer (OSO) Registration PR Template

Submit this YAML file as a Pull Request to `https://github.com/opensource-observer/oss-directory` under `data/projects/a/agentkit-guard.yaml`:

```yaml
version: 7
name: agentkit-guard
display_name: AgentKit Guard
description: Zero-latency, fail-closed firewall, payment guardrails & x402 verification engine for Coinbase AgentKit & onchain AI agents on Base.
websites:
  - url: https://github.com/base-guard/agentkit-guard
social:
  twitter: https://x.com/Base
github:
  - url: https://github.com/base-guard/agentkit-guard
npm:
  - url: https://www.npmjs.com/package/agentkit-guard
blockchain:
  - address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    networks:
      - base
    tags:
      - contract
      - developer-tooling
```
