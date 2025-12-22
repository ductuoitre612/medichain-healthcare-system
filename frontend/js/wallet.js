// wallet.js - Sui Wallet Connection Handler

/**
 * Connect to Sui Wallet
 * @returns {Promise<boolean>} - True if connected successfully
 */
async function connectWallet() {
  try {
    // Check if Sui Wallet is installed
    if (typeof window.suiWallet === "undefined") {
      console.error("Sui Wallet not installed");
      return false;
    }

    // Request permissions
    await window.suiWallet.requestPermissions();

    // Get accounts
    const accounts = await window.suiWallet.getAccounts();

    if (accounts && accounts.length > 0) {
      console.log("Connected to wallet:", accounts[0]);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
  try {
    localStorage.removeItem("medichain_wallet");
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
    if (typeof window.suiWallet === "undefined") {
      return null;
    }

    const accounts = await window.suiWallet.getAccounts();
    if (accounts && accounts.length > 0) {
      return accounts[0];
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
    // This is a placeholder
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
    if (typeof window.suiWallet === "undefined") {
      throw new Error("Sui Wallet not installed");
    }

    const result = await window.suiWallet.signAndExecuteTransactionBlock({
      transactionBlock: transactionBlock,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

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
  if (typeof window.suiWallet === "undefined") {
    return;
  }

  // Listen for account changes
  window.suiWallet.on("accountsChanged", async (accounts) => {
    console.log("Accounts changed:", accounts);

    if (accounts && accounts.length > 0) {
      localStorage.setItem("medichain_wallet", accounts[0]);
      // Reload page to update UI
      window.location.reload();
    } else {
      localStorage.removeItem("medichain_wallet");
      // Redirect to login
      if (window.location.pathname !== "/index.html") {
        window.location.href = "index.html";
      }
    }
  });

  // Listen for disconnection
  window.suiWallet.on("disconnect", () => {
    console.log("Wallet disconnected");
    localStorage.removeItem("medichain_wallet");
    window.location.href = "index.html";
  });
}

/**
 * Initialize wallet on page load
 */
async function initializeWallet() {
  try {
    // Setup event listeners
    setupWalletEventListeners();

    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem("medichain_wallet");
    if (savedAddress) {
      const currentAddress = await getWalletAddress();

      // Verify saved address matches current
      if (currentAddress !== savedAddress) {
        console.warn("Saved wallet address does not match current");
        localStorage.removeItem("medichain_wallet");
        return null;
      }

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
