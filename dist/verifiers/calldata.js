import { decodeFunctionData, parseAbi, isHex, getAddress } from "viem";
const ERC20_ABI = parseAbi([
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
]);
// 2^255 or MaxUint256 threshold for unlimited approval detection
const UNLIMITED_APPROVAL_THRESHOLD = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") - BigInt(1000000);
export function analyzeCalldata(data, allowlists, blocklists) {
    if (!data || data === "0x" || data === "") {
        return {
            isValid: true,
            isDangerousSelector: false,
            isUnlimitedApproval: false
        };
    }
    if (!isHex(data)) {
        return {
            isValid: false,
            isDangerousSelector: false,
            isUnlimitedApproval: false,
            error: "Calldata is not valid hex"
        };
    }
    if (data.length < 10) {
        return {
            isValid: false,
            isDangerousSelector: false,
            isUnlimitedApproval: false,
            error: "Calldata shorter than standard 4-byte selector"
        };
    }
    const selector = data.slice(0, 10).toLowerCase();
    // Check blocklisted dangerous selectors
    const dangerousSet = new Set(blocklists.dangerousSelectors.map((s) => s.toLowerCase()));
    if (dangerousSet.has(selector)) {
        return {
            isValid: true,
            selector,
            isDangerousSelector: true,
            isUnlimitedApproval: false,
            error: `Blocked dangerous function selector: ${selector}`
        };
    }
    // Attempt decoding known standard methods
    try {
        const decoded = decodeFunctionData({
            abi: ERC20_ABI,
            data: data
        });
        if (decoded.functionName === "approve") {
            const [spender, amount] = decoded.args;
            const isUnlimited = amount >= UNLIMITED_APPROVAL_THRESHOLD;
            return {
                isValid: true,
                selector,
                decodedMethod: "approve",
                args: {
                    spender: getAddress(spender),
                    amount: amount.toString()
                },
                isDangerousSelector: false,
                isUnlimitedApproval: isUnlimited
            };
        }
        if (decoded.functionName === "transfer") {
            const [to, amount] = decoded.args;
            return {
                isValid: true,
                selector,
                decodedMethod: "transfer",
                args: {
                    to: getAddress(to),
                    amount: amount.toString()
                },
                isDangerousSelector: false,
                isUnlimitedApproval: false
            };
        }
        if (decoded.functionName === "transferFrom") {
            const [from, to, amount] = decoded.args;
            return {
                isValid: true,
                selector,
                decodedMethod: "transferFrom",
                args: {
                    from: getAddress(from),
                    to: getAddress(to),
                    amount: amount.toString()
                },
                isDangerousSelector: false,
                isUnlimitedApproval: false
            };
        }
    }
    catch {
        // Unrecognized selector is acceptable unless allowlists.methods is strictly populated
        if (allowlists.methods.length > 0) {
            const allowed = allowlists.methods.some((m) => m.toLowerCase() === selector);
            if (!allowed) {
                return {
                    isValid: true,
                    selector,
                    isDangerousSelector: false,
                    isUnlimitedApproval: false,
                    error: `Selector ${selector} not in method allowlist`
                };
            }
        }
    }
    return {
        isValid: true,
        selector,
        isDangerousSelector: false,
        isUnlimitedApproval: false
    };
}
//# sourceMappingURL=calldata.js.map