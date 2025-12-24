// config.js - MediChain Configuration

const MEDICHAIN_CONFIG = {
  // Network Configuration
  NETWORK: "testnet",
  RPC_URL: "https://fullnode.testnet.sui.io:443",
  WS_URL: "wss://fullnode.testnet.sui.io:443",

  // Wallet Configuration
  WALLET_PREFERENCE: "slush", // 'slush' or 'sui'

  // Contract Addresses (Update after deployment)
  PACKAGE_ID: "",
  MEDICAL_RECORD_MODULE: "medical_record",
  PATIENT_MODULE: "patient",
  DOCTOR_MODULE: "doctor",
  PRESCRIPTION_MODULE: "prescription",

  // App Configuration
  APP_NAME: "MediChain",
  APP_VERSION: "1.0.0",
  APP_DESCRIPTION: "Healthcare Management System on Sui Blockchain",

  // API Configuration (if using backend)
  API_BASE_URL: "http://localhost:3000/api",
  IPFS_GATEWAY: "https://ipfs.io/ipfs/",

  // Features
  ENABLE_ZKLOGIN: false,
  ENABLE_DEEPBOOK: false,
  ENABLE_MULTISIG: false,

  // UI Configuration
  THEME: {
    primary: "#4361ee",
    secondary: "#06d6a0",
    accent: "#f72585",
    dark: "#1a1a2e",
  },

  // Test Data (for development)
  TEST_MODE: true,
  TEST_ACCOUNTS: [
    {
      address: "0xTestPatient123456789",
      name: "Nguyễn Văn A",
      role: "patient",
      avatar: "PA",
    },
    {
      address: "0xTestDoctor1234567890",
      name: "BS. Trần Thị B",
      role: "doctor",
      avatar: "DR",
    },
  ],

  // Storage
  LOCAL_STORAGE_KEY: "medichain_app",
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour

  // Logging
  LOG_LEVEL: "debug", // 'debug', 'info', 'warn', 'error'

  // Security
  ENCRYPTION_ENABLED: true,
  SALT_ROUNDS: 10,
};

// Make config global
window.CONFIG = MEDICHAIN_CONFIG;

// Initialize config on load
(function initConfig() {
  console.log(
    `🚀 ${MEDICHAIN_CONFIG.APP_NAME} v${MEDICHAIN_CONFIG.APP_VERSION}`
  );
  console.log(`🌐 Network: ${MEDICHAIN_CONFIG.NETWORK}`);
  console.log(
    `🔧 Environment: ${
      MEDICHAIN_CONFIG.TEST_MODE ? "Development" : "Production"
    }`
  );

  // Set theme colors
  document.documentElement.style.setProperty(
    "--primary",
    MEDICHAIN_CONFIG.THEME.primary
  );
  document.documentElement.style.setProperty(
    "--secondary",
    MEDICHAIN_CONFIG.THEME.secondary
  );
  document.documentElement.style.setProperty(
    "--accent",
    MEDICHAIN_CONFIG.THEME.accent
  );
  document.documentElement.style.setProperty(
    "--dark",
    MEDICHAIN_CONFIG.THEME.dark
  );
})();

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = MEDICHAIN_CONFIG;
}
