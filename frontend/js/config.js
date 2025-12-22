// config.js - MediChain Smart Contract Configuration

/**
 * Smart Contract Configuration
 * Update these values after deploying your Move contracts
 */
const CONFIG = {
  // Package ID (from `sui client publish`)
  PACKAGE_ID:
    "0x85bc1284ba93a8aeeaedebc0d9131dbe1189bdf91aa76131ce73f5b016e2c6ec",

  // Registry Object IDs (shared objects created during deployment)
  PATIENT_REGISTRY_ID:
    "0x0a177d13c5a97befb5c0383bcf71272d650ae5f2a5c812588778e6e2fcaf37d9",
  DOCTOR_REGISTRY_ID:
    "0x5215263fc42db3a3d251bd0897290f9f35080604887a436ae2c3d899ae24f49c1",

  // Network configuration
  NETWORK: "testnet", // "testnet" | "mainnet" | "devnet"
  SUI_RPC_URL: "https://fullnode.testnet.sui.io:443",

  // Module names (from your Move package)
  MODULES: {
    PATIENT: "patient",
    DOCTOR: "doctor",
    MEDICAL_RECORD: "medical_record",
    PRESCRIPTION: "prescription",
  },

  // Explorer URL
  EXPLORER_URL: "https://suiscan.xyz/testnet",

  // Gas budget (in MIST, 1 SUI = 1,000,000,000 MIST)
  GAS_BUDGET: 10000000, // 0.01 SUI
};

/**
 * Get full function name for Move call
 * @param {string} module - Module name (e.g., "patient", "medical_record")
 * @param {string} functionName - Function name (e.g., "create_patient")
 * @returns {string} - Full function name (e.g., "0x123::patient::create_patient")
 */
function getFullFunctionName(module, functionName) {
  return `${CONFIG.PACKAGE_ID}::${module}::${functionName}`;
}

/**
 * Get explorer URL for transaction
 * @param {string} txDigest - Transaction digest
 * @returns {string} - Explorer URL
 */
function getExplorerTxUrl(txDigest) {
  return `${CONFIG.EXPLORER_URL}/tx/${txDigest}`;
}

/**
 * Get explorer URL for object
 * @param {string} objectId - Object ID
 * @returns {string} - Explorer URL
 */
function getExplorerObjectUrl(objectId) {
  return `${CONFIG.EXPLORER_URL}/object/${objectId}`;
}

/**
 * Get explorer URL for address
 * @param {string} address - Wallet address
 * @returns {string} - Explorer URL
 */
function getExplorerAddressUrl(address) {
  return `${CONFIG.EXPLORER_URL}/address/${address}`;
}

/**
 * Validate configuration
 * @returns {boolean} - True if config is valid
 */
function validateConfig() {
  const errors = [];

  if (!CONFIG.PACKAGE_ID || !CONFIG.PACKAGE_ID.startsWith("0x")) {
    errors.push("Invalid PACKAGE_ID");
  }

  if (
    !CONFIG.PATIENT_REGISTRY_ID ||
    !CONFIG.PATIENT_REGISTRY_ID.startsWith("0x")
  ) {
    errors.push("Invalid PATIENT_REGISTRY_ID");
  }

  if (
    !CONFIG.DOCTOR_REGISTRY_ID ||
    !CONFIG.DOCTOR_REGISTRY_ID.startsWith("0x")
  ) {
    errors.push("Invalid DOCTOR_REGISTRY_ID");
  }

  if (!["testnet", "mainnet", "devnet"].includes(CONFIG.NETWORK)) {
    errors.push("Invalid NETWORK");
  }

  if (errors.length > 0) {
    console.error("Configuration errors:", errors);
    return false;
  }

  return true;
}

/**
 * Network configuration helpers
 */
const NetworkConfig = {
  testnet: {
    rpcUrl: "https://fullnode.testnet.sui.io:443",
    explorerUrl: "https://suiscan.xyz/testnet",
    faucetUrl: "https://discord.gg/sui", // Discord faucet channel
  },
  mainnet: {
    rpcUrl: "https://fullnode.mainnet.sui.io:443",
    explorerUrl: "https://suiscan.xyz/mainnet",
    faucetUrl: null,
  },
  devnet: {
    rpcUrl: "https://fullnode.devnet.sui.io:443",
    explorerUrl: "https://suiscan.xyz/devnet",
    faucetUrl: "https://discord.gg/sui",
  },
};

/**
 * Get network config
 * @returns {Object} - Network configuration
 */
function getNetworkConfig() {
  return NetworkConfig[CONFIG.NETWORK] || NetworkConfig.testnet;
}

/**
 * Log configuration (for debugging)
 */
function logConfig() {
  console.log("=== MediChain Configuration ===");
  console.log("Network:", CONFIG.NETWORK);
  console.log("Package ID:", CONFIG.PACKAGE_ID);
  console.log("Patient Registry:", CONFIG.PATIENT_REGISTRY_ID);
  console.log("Doctor Registry:", CONFIG.DOCTOR_REGISTRY_ID);
  console.log("RPC URL:", CONFIG.SUI_RPC_URL);
  console.log("Explorer:", CONFIG.EXPLORER_URL);
  console.log("Modules:", CONFIG.MODULES);
  console.log("===============================");
}

// Validate config on load
if (!validateConfig()) {
  console.warn("⚠️ Configuration is invalid. Please update config.js");
}

// Export for use in other files (if using modules)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CONFIG,
    getFullFunctionName,
    getExplorerTxUrl,
    getExplorerObjectUrl,
    getExplorerAddressUrl,
    validateConfig,
    getNetworkConfig,
    logConfig,
  };
}
