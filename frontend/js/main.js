/**
 * MediChain Healthcare System - Main Initialization
 * Init chung cho tất cả pages
 */

// ===== GLOBAL STATE =====
const AppState = {
  initialized: false,
  walletConnected: false,
  currentUser: null,
  currentPage: "",
};

// ===== INITIALIZATION =====

/**
 * Initialize application
 */
async function initApp() {
  try {
    console.log("🚀 Initializing MediChain Application...");

    // 1. Log configuration
    logConfig();

    // 2. Check Sui Wallet installation
    checkWalletInstallation();

    // 3. Setup wallet event listeners
    setupWalletListeners();

    // 4. Try auto-connect
    await tryAutoConnect();

    // 5. Update UI based on connection status
    updateConnectionUI();

    // 6. Initialize page-specific features
    initPageFeatures();

    AppState.initialized = true;
    console.log("✅ Application initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing application:", error);
    showToast("Lỗi khởi tạo ứng dụng", "error");
  }
}

/**
 * Check if Sui Wallet is installed
 */
function checkWalletInstallation() {
  if (!walletManager.isWalletInstalled()) {
    console.warn("⚠️  Sui Wallet chưa được cài đặt");

    // Show installation prompt if on login page
    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname === "/"
    ) {
      showWalletInstallPrompt();
    }
    return false;
  }

  console.log("✅ Sui Wallet đã được cài đặt");
  return true;
}

/**
 * Show wallet installation prompt
 */
function showWalletInstallPrompt() {
  const promptHTML = `
    <div class="wallet-install-prompt card">
      <div class="flex items-center gap-3 mb-3">
        <span style="font-size: 32px;">💡</span>
        <h3 class="font-bold">Cài đặt Sui Wallet</h3>
      </div>
      <p class="mb-4 text-gray">
        Bạn cần cài đặt Sui Wallet extension để sử dụng MediChain.
      </p>
      <a 
        href="${walletManager.getInstallUrl()}" 
        target="_blank" 
        class="btn btn-primary btn-full"
      >
        🔗 Tải Sui Wallet Extension
      </a>
      <p class="mt-3 text-center" style="font-size: 13px; color: #999;">
        Sau khi cài đặt, reload trang để tiếp tục
      </p>
    </div>
  `;

  // Find connection area and show prompt
  const connectionArea = document.getElementById("walletConnectionArea");
  if (connectionArea) {
    connectionArea.innerHTML = promptHTML;
  }
}

/**
 * Setup wallet event listeners
 */
function setupWalletListeners() {
  // On wallet connect
  walletManager.on("connect", (address) => {
    console.log("✅ Wallet connected:", walletManager.formatAddress(address));
    AppState.walletConnected = true;
    AppState.currentUser = { address };

    updateConnectionUI();
    onWalletConnected(address);
  });

  // On wallet disconnect
  walletManager.on("disconnect", () => {
    console.log("🔴 Wallet disconnected");
    AppState.walletConnected = false;
    AppState.currentUser = null;

    updateConnectionUI();
    onWalletDisconnected();
  });

  // On account change
  walletManager.on("accountChange", (newAddress) => {
    console.log(
      "🔄 Account changed to:",
      walletManager.formatAddress(newAddress)
    );
    AppState.currentUser = { address: newAddress };

    updateConnectionUI();
    onAccountChanged(newAddress);
  });
}

/**
 * Try to auto-connect wallet
 */
async function tryAutoConnect() {
  try {
    const connected = await walletManager.autoConnect();
    if (connected) {
      console.log("✅ Auto-connected to wallet");
      AppState.walletConnected = true;
      return true;
    }
    return false;
  } catch (error) {
    console.log("ℹ️  No auto-connect available");
    return false;
  }
}

/**
 * Update UI based on connection status
 */
function updateConnectionUI() {
  // Update wallet display
  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) {
    if (AppState.walletConnected && AppState.currentUser) {
      walletDisplay.textContent = walletManager.formatAddress(
        AppState.currentUser.address
      );
    } else {
      walletDisplay.textContent = "Chưa kết nối";
    }
  }

  // Update connect button
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
    if (AppState.walletConnected) {
      connectBtn.textContent = "✓ Đã kết nối";
      connectBtn.classList.add("btn-success");
      connectBtn.classList.remove("btn-primary");
      connectBtn.disabled = true;
    } else {
      connectBtn.textContent = "🔗 Kết nối ví";
      connectBtn.classList.add("btn-primary");
      connectBtn.classList.remove("btn-success");
      connectBtn.disabled = false;
    }
  }

  // Update disconnect button visibility
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  if (disconnectBtn) {
    disconnectBtn.style.display = AppState.walletConnected
      ? "inline-flex"
      : "none";
  }

  // Show/hide protected content
  toggleProtectedContent();
}

/**
 * Toggle protected content based on wallet connection
 */
function toggleProtectedContent() {
  const protectedElements = document.querySelectorAll("[data-protected]");

  protectedElements.forEach((element) => {
    if (AppState.walletConnected) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });

  const publicElements = document.querySelectorAll("[data-public-only]");

  publicElements.forEach((element) => {
    if (AppState.walletConnected) {
      element.classList.add("hidden");
    } else {
      element.classList.remove("hidden");
    }
  });
}

/**
 * Initialize page-specific features
 */
function initPageFeatures() {
  const path = window.location.pathname;

  // Detect current page
  if (path.includes("dashboard.html")) {
    AppState.currentPage = "dashboard";
    initDashboard();
  } else if (path.includes("medical-records.html")) {
    AppState.currentPage = "medical-records";
    initMedicalRecords();
  } else if (path.includes("prescriptions.html")) {
    AppState.currentPage = "prescriptions";
    initPrescriptions();
  } else if (path.includes("index.html") || path === "/") {
    AppState.currentPage = "landing";
    initLanding();
  }
}

// ===== EVENT HANDLERS =====

/**
 * Handler when wallet connects
 */
function onWalletConnected(address) {
  showToast("Kết nối ví thành công!", "success");

  // Redirect to dashboard if on landing page
  if (AppState.currentPage === "landing") {
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  }

  // Load user data
  loadUserData(address);
}

/**
 * Handler when wallet disconnects
 */
function onWalletDisconnected() {
  showToast("Đã ngắt kết nối ví", "info");

  // Redirect to landing page if on protected page
  const protectedPages = ["dashboard", "medical-records", "prescriptions"];
  if (protectedPages.includes(AppState.currentPage)) {
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }
}

/**
 * Handler when account changes
 */
function onAccountChanged(newAddress) {
  showToast("Tài khoản đã thay đổi", "warning");

  // Reload page to refresh data
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

/**
 * Load user data from backend
 */
async function loadUserData(address) {
  try {
    showLoading("userData");

    // Get patient data
    const response = await apiClient.getPatientByWallet(address);

    if (response.success) {
      AppState.currentUser = {
        ...AppState.currentUser,
        ...response.data,
      };
      console.log("✅ User data loaded:", AppState.currentUser);
    }

    hideLoading("userData");
  } catch (error) {
    console.log("ℹ️  No user data found or error loading:", error.message);
    hideLoading("userData");
  }
}

// ===== GLOBAL FUNCTIONS (accessible from HTML) =====

/**
 * Connect wallet button handler
 */
async function connectWallet() {
  try {
    if (!walletManager.isWalletInstalled()) {
      showToast("Vui lòng cài đặt Sui Wallet extension trước", "error");
      window.open(walletManager.getInstallUrl(), "_blank");
      return;
    }

    showLoading("connectingWallet");

    const address = await walletManager.connect();

    hideLoading("connectingWallet");

    console.log("✅ Connected:", address);
  } catch (error) {
    hideLoading("connectingWallet");
    console.error("❌ Connection error:", error);
    showToast(error.message || "Không thể kết nối ví", "error");
  }
}

/**
 * Disconnect wallet button handler
 */
async function disconnectWallet() {
  try {
    const confirmed = confirm("Bạn có chắc muốn ngắt kết nối ví?");
    if (!confirmed) return;

    await walletManager.disconnect();
  } catch (error) {
    console.error("❌ Disconnect error:", error);
    showToast("Lỗi ngắt kết nối", "error");
  }
}

/**
 * Copy wallet address to clipboard
 */
function copyWalletAddress() {
  if (AppState.currentUser && AppState.currentUser.address) {
    copyToClipboard(AppState.currentUser.address);
  }
}

/**
 * View on explorer
 */
function viewOnExplorer(type, id) {
  let url;
  switch (type) {
    case "object":
      url = getObjectExplorerUrl(id);
      break;
    case "transaction":
      url = getTransactionExplorerUrl(id);
      break;
    case "address":
      url = getAddressExplorerUrl(id);
      break;
    default:
      console.error("Unknown explorer type:", type);
      return;
  }
  window.open(url, "_blank");
}

// ===== PAGE INITIALIZERS (to be implemented in separate files) =====

function initLanding() {
  console.log("📄 Initializing landing page...");
  // Will be implemented in landing page
}

function initDashboard() {
  console.log("📄 Initializing dashboard...");
  // Will be implemented in dashboard.js
}

function initMedicalRecords() {
  console.log("📄 Initializing medical records...");
  // Will be implemented in medical-record.js
}

function initPrescriptions() {
  console.log("📄 Initializing prescriptions...");
  // Will be implemented in prescription.js
}

// ===== ERROR HANDLING =====

/**
 * Global error handler
 */
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  // Don't show toast for every error, only critical ones
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// ===== KEYBOARD SHORTCUTS =====

document.addEventListener("keydown", (event) => {
  // Ctrl/Cmd + K: Focus search
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.focus();
  }

  // Escape: Close modals
  if (event.key === "Escape") {
    closeAllModals();
  }
});

function closeAllModals() {
  const modals = document.querySelectorAll(".modal.show");
  modals.forEach((modal) => modal.classList.remove("show"));
}

// ===== AUTO-INIT ON PAGE LOAD =====

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM already loaded
  initApp();
}

// ===== EXPORT =====

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AppState,
    initApp,
    connectWallet,
    disconnectWallet,
    copyWalletAddress,
    viewOnExplorer,
  };
}
