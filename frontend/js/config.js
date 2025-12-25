// config.js - MediChain Configuration

const MEDICHAIN_CONFIG = {
  // ============ NETWORK CONFIGURATION ============
  NETWORKS: {
    TESTNET: {
      name: "Sui Testnet",
      rpcUrl: "https://fullnode.testnet.sui.io:443",
      wsUrl: "wss://fullnode.testnet.sui.io:443",
      faucetUrl: "https://faucet.testnet.sui.io/gas",
      explorerUrl: "https://suiexplorer.com/?network=testnet",
      chainId: "sui:testnet",
    },
    DEVNET: {
      name: "Sui Devnet",
      rpcUrl: "https://fullnode.devnet.sui.io:443",
      wsUrl: "wss://fullnode.devnet.sui.io:443",
      faucetUrl: "https://faucet.devnet.sui.io/gas",
      explorerUrl: "https://suiexplorer.com/?network=devnet",
      chainId: "sui:devnet",
    },
    MAINNET: {
      name: "Sui Mainnet",
      rpcUrl: "https://fullnode.mainnet.sui.io:443",
      wsUrl: "wss://fullnode.mainnet.sui.io:443",
      explorerUrl: "https://suiexplorer.com/?network=mainnet",
      chainId: "sui:mainnet",
    },
    LOCAL: {
      name: "Local Network",
      rpcUrl: "http://127.0.0.1:9000",
      wsUrl: "ws://127.0.0.1:9000",
      explorerUrl: "http://localhost:3000",
      chainId: "sui:local",
    },
  },

  // Current network (change this to switch networks)
  CURRENT_NETWORK: "TESTNET",

  // ============ CONTRACT CONFIGURATION ============
  // UPDATE THESE WITH YOUR ACTUAL DEPLOYED CONTRACT ADDRESSES
  CONTRACT: {
    // Package ID (get this after deploying your Move package)
    PACKAGE_ID: "0xYOUR_PACKAGE_ID_HERE",

    // Module names (must match your Move modules)
    MODULES: {
      ACCESS_CONTROL: "access_control",
      PATIENT: "patient",
      DOCTOR: "doctor",
      MEDICAL_RECORD: "medical_record",
      PRESCRIPTION: "prescription",
      APPOINTMENT: "appointment",
    },

    // Object types (for querying)
    OBJECT_TYPES: {
      PATIENT: "Patient",
      DOCTOR: "Doctor",
      MEDICAL_RECORD: "MedicalRecord",
      PRESCRIPTION: "Prescription",
      APPOINTMENT: "Appointment",
      ACCESS_CAP: "AccessCap",
    },

    // Gas configuration
    GAS_BUDGET: {
      CREATE_PATIENT: 100000000, // 0.1 SUI
      CREATE_DOCTOR: 100000000, // 0.1 SUI
      CREATE_RECORD: 150000000, // 0.15 SUI
      CREATE_PRESCRIPTION: 120000000, // 0.12 SUI
      DEFAULT: 100000000, // 0.1 SUI
    },
  },

  // ============ WALLET CONFIGURATION ============
  WALLETS: {
    // Supported wallet types
    SUPPORTED: ["sui", "slush", "ethos", "martian", "suiet"],
    DEFAULT: "sui",

    // Auto-connect settings
    AUTO_CONNECT: true,
    CONNECTION_TIMEOUT: 30000, // 30 seconds

    // Session management
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    AUTO_DISCONNECT: false,
  },

  // ============ APP CONFIGURATION ============
  APP: {
    NAME: "MediChain",
    VERSION: "1.0.0",
    DESCRIPTION: "Hệ thống Quản lý Y tế Phi tập trung trên Sui Blockchain",
    AUTHOR: "MediChain Team",
    SUPPORT_EMAIL: "support@medichain.io",
    WEBSITE: "https://medichain.io",
    REPOSITORY: "https://github.com/medichain/medichain-web",
  },

  // ============ API CONFIGURATION ============
  API: {
    // If you have a backend server
    BASE_URL: "http://localhost:3000/api",
    VERSION: "v1",
    TIMEOUT: 30000, // 30 seconds

    // IPFS for file storage (optional)
    IPFS_GATEWAY: "https://ipfs.io/ipfs/",
    IPFS_API: "https://ipfs.infura.io:5001/api/v0",

    // Health check endpoints
    HEALTH_CHECK: "/health",
    READINESS_CHECK: "/ready",
  },

  // ============ FEATURE FLAGS ============
  FEATURES: {
    ENABLE_ZKLOGIN: false,
    ENABLE_DEEPBOOK: false,
    ENABLE_MULTISIG: false,
    ENABLE_OFFCHAIN_STORAGE: true,
    ENABLE_FILE_UPLOAD: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_ANALYTICS: false,
    ENABLE_BILLING: false,
  },

  // ============ UI/UX CONFIGURATION ============
  UI: {
    THEME: {
      primary: "#4361ee",
      secondary: "#06d6a0",
      accent: "#f72585",
      dark: "#1a1a2e",
      light: "#f8f9fa",
      success: "#06d6a0",
      warning: "#ffd166",
      error: "#ef476f",
      info: "#118ab2",
    },

    // Responsive breakpoints
    BREAKPOINTS: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    },

    // Animation
    ANIMATION: {
      duration: 300,
      easing: "ease-in-out",
    },

    // Pagination
    PAGINATION: {
      ITEMS_PER_PAGE: 10,
      MAX_PAGES_SHOWN: 5,
    },
  },

  // ============ TESTING & DEVELOPMENT ============
  DEVELOPMENT: {
    TEST_MODE: true,
    LOG_LEVEL: "debug", // 'debug', 'info', 'warn', 'error', 'none'
    ENABLE_MOCKS: true,
    SKIP_AUTH: false,

    // Test accounts for development
    TEST_ACCOUNTS: [
      {
        address:
          "0xTestPatient123456789012345678901234567890123456789012345678901234",
        name: "Nguyễn Văn A",
        role: "patient",
        avatar: "PA",
        balance: "100.50",
      },
      {
        address:
          "0xTestDoctor123456789012345678901234567890123456789012345678901234",
        name: "BS. Trần Thị B",
        role: "doctor",
        avatar: "DR",
        balance: "250.75",
      },
      {
        address:
          "0xTestHospital12345678901234567890123456789012345678901234567890",
        name: "Bệnh viện Đa khoa X",
        role: "hospital",
        avatar: "HX",
        balance: "1000.00",
      },
    ],

    // Demo data
    DEMO_DATA: {
      PATIENTS: 5,
      DOCTORS: 3,
      MEDICAL_RECORDS: 15,
      PRESCRIPTIONS: 20,
    },
  },

  // ============ STORAGE CONFIGURATION ============
  STORAGE: {
    // LocalStorage keys
    KEYS: {
      WALLET_ADDRESS: "medichain_wallet_address",
      WALLET_NAME: "medichain_wallet_name",
      CONNECTED: "medichain_connected",
      DEMO_MODE: "medichain_demo_mode",
      NETWORK: "medichain_network",
      USER_ROLE: "medichain_user_role",
      USER_PROFILE: "medichain_user_profile",
      SESSION_TOKEN: "medichain_session_token",
      SETTINGS: "medichain_settings",
    },

    // Session management
    SESSION: {
      TIMEOUT: 60 * 60 * 1000, // 1 hour
      REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
    },

    // Cache settings
    CACHE: {
      ENABLED: true,
      TTL: 5 * 60 * 1000, // 5 minutes
      MAX_ITEMS: 100,
    },
  },

  // ============ SECURITY CONFIGURATION ============
  SECURITY: {
    ENCRYPTION_ENABLED: true,
    ENCRYPTION_KEY: "medichain_secure_key_2024",
    SALT_ROUNDS: 10,

    // JWT settings (if using backend)
    JWT: {
      SECRET: "your-jwt-secret-key-change-this",
      EXPIRES_IN: "24h",
      ALGORITHM: "HS256",
    },

    // CORS settings
    CORS: {
      ENABLED: true,
      ALLOWED_ORIGINS: ["http://localhost:3000", "https://medichain.io"],
    },

    // Rate limiting
    RATE_LIMIT: {
      ENABLED: true,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },
  },

  // ============ NOTIFICATION CONFIGURATION ============
  NOTIFICATIONS: {
    ENABLED: true,
    DEFAULT_DURATION: 5000, // 5 seconds
    POSITION: "top-right",

    TYPES: {
      SUCCESS: {
        icon: "check-circle",
        color: "success",
      },
      ERROR: {
        icon: "exclamation-circle",
        color: "error",
      },
      WARNING: {
        icon: "exclamation-triangle",
        color: "warning",
      },
      INFO: {
        icon: "info-circle",
        color: "info",
      },
    },
  },

  // ============ ERROR MESSAGES ============
  ERRORS: {
    NO_WALLET: "Không tìm thấy ví. Vui lòng cài đặt Sui Wallet!",
    CONNECTION_FAILED: "Kết nối ví thất bại. Vui lòng thử lại.",
    TRANSACTION_FAILED: "Giao dịch thất bại.",
    INSUFFICIENT_BALANCE: "Không đủ SUI để thực hiện giao dịch.",
    NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
    UNAUTHORIZED: "Bạn không có quyền truy cập tính năng này.",
    NOT_FOUND: "Không tìm thấy dữ liệu.",
    VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
    UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định.",
  },

  // ============ SUCCESS MESSAGES ============
  SUCCESS: {
    WALLET_CONNECTED: "Kết nối ví thành công!",
    TRANSACTION_SUCCESS: "Giao dịch thành công!",
    DATA_SAVED: "Dữ liệu đã được lưu.",
    PROFILE_UPDATED: "Thông tin đã được cập nhật.",
    RECORD_CREATED: "Hồ sơ đã được tạo.",
    PRESCRIPTION_CREATED: "Đơn thuốc đã được tạo.",
  },
};

// ============ HELPER FUNCTIONS ============
MEDICHAIN_CONFIG.getCurrentNetwork = function () {
  return this.NETWORKS[this.CURRENT_NETWORK];
};

MEDICHAIN_CONFIG.getRpcUrl = function () {
  return this.getCurrentNetwork().rpcUrl;
};

MEDICHAIN_CONFIG.getExplorerUrl = function () {
  return this.getCurrentNetwork().explorerUrl;
};

MEDICHAIN_CONFIG.getPackageId = function () {
  return this.CONTRACT.PACKAGE_ID;
};

MEDICHAIN_CONFIG.getModuleAddress = function (moduleName) {
  return `${this.getPackageId()}::${this.CONTRACT.MODULES[moduleName]}`;
};

MEDICHAIN_CONFIG.getObjectType = function (moduleName, objectType) {
  return `${this.getPackageId()}::${this.CONTRACT.MODULES[moduleName]}::${
    this.CONTRACT.OBJECT_TYPES[objectType]
  }`;
};

MEDICHAIN_CONFIG.getGasBudget = function (operation) {
  return (
    this.CONTRACT.GAS_BUDGET[operation] || this.CONTRACT.GAS_BUDGET.DEFAULT
  );
};

MEDICHAIN_CONFIG.isTestMode = function () {
  return this.DEVELOPMENT.TEST_MODE;
};

MEDICHAIN_CONFIG.isDemoMode = function () {
  const demoMode = localStorage.getItem(this.STORAGE.KEYS.DEMO_MODE);
  return demoMode === "true" || this.isTestMode();
};

MEDICHAIN_CONFIG.getStorageKey = function (key) {
  return this.STORAGE.KEYS[key] || key;
};

MEDICHAIN_CONFIG.getErrorMessage = function (errorCode) {
  return this.ERRORS[errorCode] || this.ERRORS.UNKNOWN_ERROR;
};

MEDICHAIN_CONFIG.getSuccessMessage = function (successCode) {
  return this.SUCCESS[successCode] || "Thành công!";
};

// ============ INITIALIZATION ============
(function initConfig() {
  console.log(
    `🚀 ${MEDICHAIN_CONFIG.APP.NAME} v${MEDICHAIN_CONFIG.APP.VERSION}`
  );
  console.log(`🌐 Network: ${MEDICHAIN_CONFIG.CURRENT_NETWORK}`);
  console.log(
    `🔧 Environment: ${
      MEDICHAIN_CONFIG.isTestMode() ? "Development" : "Production"
    }`
  );

  // Set CSS variables for theme
  const root = document.documentElement;
  const theme = MEDICHAIN_CONFIG.UI.THEME;

  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--color-dark", theme.dark);
  root.style.setProperty("--color-light", theme.light);
  root.style.setProperty("--color-success", theme.success);
  root.style.setProperty("--color-warning", theme.warning);
  root.style.setProperty("--color-error", theme.error);
  root.style.setProperty("--color-info", theme.info);

  // Log configuration (only in development)
  if (MEDICHAIN_CONFIG.DEVELOPMENT.LOG_LEVEL === "debug") {
    console.log("📋 Configuration loaded:", {
      network: MEDICHAIN_CONFIG.getCurrentNetwork(),
      packageId: MEDICHAIN_CONFIG.getPackageId(),
      features: MEDICHAIN_CONFIG.FEATURES,
    });
  }
})();

// Make config global
window.CONFIG = MEDICHAIN_CONFIG;

// Export for Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = MEDICHAIN_CONFIG;
}

// Export for ES6 modules
if (typeof exports !== "undefined") {
  exports.default = MEDICHAIN_CONFIG;
}
