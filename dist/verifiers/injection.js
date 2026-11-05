const HEURISTIC_PATTERNS = [
    { pattern: /ignore\s+(all\s+)?(previous\s+)?instructions/i, name: "Instruction Override", score: 85 },
    { pattern: /disregard\s+(the\s+)?(safety|system|guard)/i, name: "Safety Bypass Attempt", score: 80 },
    { pattern: /bypass\s+(the\s+)?(policy|firewall|guardrail|limits)/i, name: "Policy Bypass Attempt", score: 85 },
    { pattern: /drain\s+(the\s+)?(wallet|balance|funds|vault)/i, name: "Wallet Drain Command", score: 95 },
    { pattern: /transfer\s+all\s+(funds|eth|usdc|tokens|balance)/i, name: "Total Transfer Command", score: 90 },
    { pattern: /send\s+(entire|all|whole)\s+(balance|funds|tokens)/i, name: "Exhaustive Send Command", score: 90 },
    { pattern: /system:\s*override/i, name: "System Prefix Impersonation", score: 90 },
    { pattern: /\[system\s+notice\]/i, name: "System Notice Impersonation", score: 85 },
    { pattern: /admin\s+mode\s+enabled/i, name: "Fake Admin Escalation", score: 75 },
    { pattern: /developer\s+debug\s+mode/i, name: "Debug Mode Escalation", score: 70 },
    { pattern: /approve\s+(max|unlimited|0xffffff)/i, name: "Unlimited Approval Prompt", score: 85 },
    { pattern: /<!--.*?(ignore|bypass|transfer|drain).*?-->/is, name: "Hidden HTML Comment Injection", score: 80 }
];
export function scanForPromptInjection(textToScan, config) {
    if (!config.enabled || !textToScan) {
        return {
            hasInjection: false,
            riskScore: 0,
            matchedPatterns: [],
            findings: []
        };
    }
    const normalized = textToScan.trim();
    let maxScore = 0;
    const matchedPatterns = [];
    const findings = [];
    // Check custom blocked patterns
    for (const rawPattern of config.blockedPatterns) {
        if (normalized.toLowerCase().includes(rawPattern.toLowerCase())) {
            matchedPatterns.push(rawPattern);
            findings.push(`Matched blocked policy keyword: "${rawPattern}"`);
            maxScore = Math.max(maxScore, 80);
        }
    }
    // Check heuristic patterns
    for (const item of HEURISTIC_PATTERNS) {
        if (item.pattern.test(normalized)) {
            matchedPatterns.push(item.name);
            findings.push(`Triggered heuristic guardrail: ${item.name}`);
            maxScore = Math.max(maxScore, item.score);
        }
    }
    // Detect suspicious markdown / delimiter obfuscation
    const codeBlockCount = (normalized.match(/```/g) || []).length;
    if (codeBlockCount >= 4 && /system|instruction|execute/i.test(normalized)) {
        findings.push("Detected multi-nested codeblock injection attempt");
        maxScore = Math.max(maxScore, 65);
    }
    const hasInjection = config.strictMode ? maxScore >= 60 : maxScore >= 80;
    return {
        hasInjection,
        riskScore: maxScore,
        matchedPatterns,
        findings
    };
}
//# sourceMappingURL=injection.js.map