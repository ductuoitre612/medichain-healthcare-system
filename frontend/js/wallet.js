// wallet.js - Sui Wallet Connection Handler (FIXED VERSION)

/**
 * Get Sui Wallet using Wallet Standard API
 * @returns {Object|null} - Wallet object or null
 */
function getSuiWallet() {
  try {
    // Check for Wallet Standard API (new method)
    if (window.suiWallet) {
      return window.suiWallet;
    }

    // Check for Sui Wallet extension (alternative)
    if (window.suiWalletExtension) {
      return window.suiWalletExtension;
    }

    // Check for standard wallets
    if (window.wallets && window.wallets.length > 0) {
      const suiWallet = window.wallets.find(
        (wallet) => wallet.name && wallet.name.toLowerCase().includes("sui")
      );
      if (suiWallet) return suiWallet;
    }

    return null;
  } catch (error) {
    console.error("Error getting wallet:", error);
    return null;
  }
}

/**
 * Check if Sui Wallet is installed
 * @returns {boolean}
 */
function isWalletInstalled() {
  return getSuiWallet() !== null;
}

/**
 * Show wallet installation modal
 */
function showWalletInstallModal() {
  const modal = document.getElementById("walletErrorModal");
  const message = document.getElementById("walletErrorMessage");

  if (modal && message) {
    message.innerHTML = `
      <div style="text-align: center;">
        <p>Sui Wallet chưa được cài đặt.</p>
        <p style="margin-top: 10px;">
          <a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" 
             target="_blank" 
             style="color: #6366f1; text-decoration: underline;">
            Nhấn vào đây để cài đặt Sui Wallet
          </a>
        </p>
        <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
          Sau khi cài đặt, vui lòng tải lại trang.
        </p>
      </div>
    `;
    modal.style.display = "flex";
  }
}

/**
 * Connect to Sui Wallet
 * @returns {Promise<boolean>} - True if connected successfully
 */
async function connectWallet() {
  try {
    // Check if wallet is installed
    if (!isWalletInstalled()) {
      console.error("Sui Wallet not installed");
      showWalletInstallModal();
      return false;
    }

    const wallet = getSuiWallet();

    // Request permissions/connection
    let accounts;

    // Try different connection methods
    if (wallet.requestPermissions) {
      await wallet.requestPermissions();
      accounts = await wallet.getAccounts();
    } else if (wallet.connect) {
      const result = await wallet.connect();
      accounts = result.accounts || [result.account];
    } else if (wallet.enable) {
      await wallet.enable();
      accounts = await wallet.getAccounts();
    } else {
      throw new Error("Wallet không hỗ trợ phương thức kết nối");
    }

    if (accounts && accounts.length > 0) {
      const address =
        typeof accounts[0] === "string" ? accounts[0] : accounts[0].address;
      console.log("Connected to wallet:", address);

      // Store in memory only (not localStorage for security)
      window.currentWalletAddress = address;

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error connecting wallet:", error);

    // Show user-friendly error
    const modal = document.getElementById("walletErrorModal");
    const message = document.getElementById("walletErrorMessage");
    if (modal && message) {
      message.textContent = `Lỗi kết nối: ${
        error.message || "Không thể kết nối với ví"
      }`;
      modal.style.display = "flex";
    }

    throw error;
  }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
  try {
    // Clear memory storage
    delete window.currentWalletAddress;

    // Try to disconnect from wallet
    const wallet = getSuiWallet();
    if (wallet && wallet.disconnect) {
      wallet.disconnect();
    }

    console.log("Wallet disconnected");
    return true;
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    return false;
  }
}

/**
 * Get current connected wallet address
 * @returns {Promise<string|null>} - Wallet address or null
 */
async function getWalletAddress() {
  try {
    // Return cached address if available
    if (window.currentWalletAddress) {
      return window.currentWalletAddress;
    }

    if (!isWalletInstalled()) {
      return null;
    }

    const wallet = getSuiWallet();
    let accounts;

    if (wallet.getAccounts) {
      accounts = await wallet.getAccounts();
    } else if (wallet.accounts) {
      accounts = wallet.accounts;
    }

    if (accounts && accounts.length > 0) {
      const address =
        typeof accounts[0] === "string" ? accounts[0] : accounts[0].address;
      window.currentWalletAddress = address;
      return address;
    }

    return null;
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return null;
  }
}

/**
 * Check if wallet is connected
 * @returns {Promise<boolean>}
 */
async function isWalletConnected() {
  try {
    const address = await getWalletAddress();
    return address !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Format wallet address for display
 * @param {string} address - Full wallet address
 * @returns {string} - Formatted address (0x1234...5678)
 */
function formatWalletAddress(address) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get wallet balance
 * @returns {Promise<number>} - Balance in SUI
 */
async function getWalletBalance() {
  try {
    const address = await getWalletAddress();
    if (!address) return 0;

    // TODO: Implement actual balance check using Sui RPC
    const wallet = getSuiWallet();
    if (wallet && wallet.getBalance) {
      const balance = await wallet.getBalance();
      return balance;
    }

    console.log("Getting balance for:", address);
    return 0;
  } catch (error) {
    console.error("Error getting balance:", error);
    return 0;
  }
}

/**
 * Sign and execute transaction
 * @param {Object} transactionBlock - Transaction block to execute
 * @returns {Promise<Object>} - Transaction result
 */
async function signAndExecuteTransaction(transactionBlock) {
  try {
    if (!isWalletInstalled()) {
      throw new Error("Sui Wallet not installed");
    }

    const wallet = getSuiWallet();

    let result;
    if (wallet.signAndExecuteTransactionBlock) {
      result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: transactionBlock,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });
    } else if (wallet.signAndExecuteTransaction) {
      result = await wallet.signAndExecuteTransaction({
        transaction: transactionBlock,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });
    } else {
      throw new Error("Wallet không hỗ trợ thực thi giao dịch");
    }

    console.log("Transaction result:", result);
    return result;
  } catch (error) {
    console.error("Error executing transaction:", error);
    throw error;
  }
}

/**
 * Listen for wallet events
 */
function setupWalletEventListeners() {
  if (!isWalletInstalled()) {
    return;
  }

  const wallet = getSuiWallet();

  // Listen for account changes
  if (wallet.on) {
    wallet.on("accountsChanged", async (accounts) => {
      console.log("Accounts changed:", accounts);

      if (accounts && accounts.length > 0) {
        const address =
          typeof accounts[0] === "string" ? accounts[0] : accounts[0].address;
        window.currentWalletAddress = address;
        // Reload page to update UI
        window.location.reload();
      } else {
        delete window.currentWalletAddress;
        // Redirect to login
        if (
          window.location.pathname !== "/index.html" &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "index.html";
        }
      }
    });

    // Listen for disconnection
    wallet.on("disconnect", () => {
      console.log("Wallet disconnected");
      delete window.currentWalletAddress;
      window.location.href = "index.html";
    });
  }
}

/**
 * Initialize wallet on page load
 */
async function initializeWallet() {
  try {
    // Check if wallet is installed
    if (!isWalletInstalled()) {
      console.warn("Sui Wallet not installed");
      return null;
    }

    // Setup event listeners
    setupWalletEventListeners();

    // Try to get current wallet address
    const currentAddress = await getWalletAddress();

    if (currentAddress) {
      console.log(
        "Wallet already connected:",
        formatWalletAddress(currentAddress)
      );
      return currentAddress;
    }

    return null;
  } catch (error) {
    console.error("Error initializing wallet:", error);
    return null;
  }
}

/**
 * Require wallet connection (for protected pages)
 */
async function requireWalletConnection() {
  const address = await initializeWallet();

  if (!address) {
    console.log("No wallet connected, redirecting to login...");
    window.location.href = "index.html";
    return false;
  }

  return true;
}

// Auto-initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeWallet);
} else {
  initializeWallet();
}

// Export functions for use in other files
window.walletAPI = {
  connectWallet,
  disconnectWallet,
  getWalletAddress,
  isWalletConnected,
  isWalletInstalled,
  formatWalletAddress,
  getWalletBalance,
  signAndExecuteTransaction,
  requireWalletConnection,
};
