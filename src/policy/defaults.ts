import { GuardPolicy, BASE_USDC, BASE_SEPOLIA_USDC } from "../types.js";

export const DEFAULT_BASE_POLICY: GuardPolicy = {
  name: "Default-Base-Agent-Guard",
  network: "base",
  spendingLimits: {
    maxNativePerTx: "0.05", // 0.05 ETH per tx
    maxNativeDaily: "0.20", // 0.20 ETH daily
    maxTokenPerTx: {
      [BASE_USDC]: "50.0",
      [BASE_SEPOLIA_USDC]: "50.0"
    },
    maxTokenDaily: {
      [BASE_USDC]: "200.0",
      [BASE_SEPOLIA_USDC]: "200.0"
    }
  },
  allowlists: {
    destinations: [], // Empty means open to unblocklisted unless destinations are explicitly restricted
    tokens: [BASE_USDC, BASE_SEPOLIA_USDC],
    methods: [
      "0xa9059cbb", // transfer(address,uint256)
      "0x095ea7b3"  // approve(address,uint256)
    ]
  },
  blocklists: {
    destinations: [
      "0x0000000000000000000000000000000000000000",
      "0x000000000000000000000000000000000000dead",
      "0x1111111254fb6c44bac0bed2854e76f90643097d" // 1inch router (example if blocked from direct router drains)
    ],
    dangerousSelectors: [
      "0xf2fde38b", // transferOwnership(address)
      "0x715018a6", // renounceOwnership()
      "0x4f1ee3d0", // upgradeToAndCall(address,bytes)
      "0x3659cfe6", // upgradeTo(address)
      "0x42966c68"  // burn(uint256)
    ]
  },
  x402Config: {
    enabled: true,
    allowedMerchantDomains: ["*"],
    maxPaymentPerChallengeUsdc: "5.0",
    maxDailyX402Usdc: "25.0",
    allowedTokens: [BASE_USDC, BASE_SEPOLIA_USDC]
  },
  promptInjectionDefense: {
    enabled: true,
    strictMode: true,
    blockedPatterns: [
      "ignore previous instructions",
      "ignore all instructions",
      "bypass safety",
      "drain wallet",
      "transfer all funds",
      "send balance",
      "override policy",
      "system: override",
      "admin mode",
      "jailbreak"
    ]
  }
};
