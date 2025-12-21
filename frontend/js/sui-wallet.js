// Sui Wallet Connection & Interaction

let walletAdapter = null;
let currentAccount = null;

// Connect to Sui Wallet
async function connectWallet() {
  try {
    // Check if Sui Wallet is installed
    if (typeof window.suiWallet === "undefined") {
      throw new Error("Sui Wallet chưa được cài đặt");
    }

    // Request connection
    const accounts = await window.suiWallet.requestPermissions();

    if (accounts && accounts.length > 0) {
      currentAccount = accounts[0];

      // Save to localStorage
      localStorage.setItem("sui_wallet_address", currentAccount);
      localStorage.setItem("sui_wallet_connected", "true");

      console.log("Đã kết nối ví:", currentAccount);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Lỗi kết nối ví:", error);
    throw error;
  }
}

// Disconnect wallet
function disconnectWallet() {
  currentAccount = null;
  localStorage.removeItem("sui_wallet_address");
  localStorage.removeItem("sui_wallet_connected");
  window.location.href = "index.html";
}

// Get current wallet address
function getCurrentWallet() {
  if (!currentAccount) {
    currentAccount = localStorage.getItem("sui_wallet_address");
  }
  return currentAccount;
}

// Check if wallet is connected
function isWalletConnected() {
  return localStorage.getItem("sui_wallet_connected") === "true";
}

// Execute transaction on Sui blockchain
async function executeTransaction(transactionBlock) {
  try {
    if (!window.suiWallet) {
      throw new Error("Sui Wallet không khả dụng");
    }

    const result = await window.suiWallet.signAndExecuteTransactionBlock({
      transactionBlock: transactionBlock,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    console.log("Transaction result:", result);
    return result;
  } catch (error) {
    console.error("Lỗi thực thi transaction:", error);
    throw error;
  }
}

// Get wallet balance
async function getWalletBalance() {
  try {
    const address = getCurrentWallet();
    if (!address) return "0";

    const response = await fetch(SUI_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "suix_getBalance",
        params: [address, "0x2::sui::SUI"],
      }),
    });

    const data = await response.json();
    if (data.result) {
      // Convert từ MIST sang SUI (1 SUI = 10^9 MIST)
      const balance = parseInt(data.result.totalBalance) / 1000000000;
      return balance.toFixed(4);
    }
    return "0";
  } catch (error) {
    console.error("Lỗi lấy balance:", error);
    return "0";
  }
}

// Call smart contract function (Move call)
async function callContractFunction(
  moduleName,
  functionName,
  typeArguments = [],
  functionArguments = []
) {
  try {
    const tx = {
      kind: "moveCall",
      data: {
        packageObjectId: PACKAGE_ID,
        module: moduleName,
        function: functionName,
        typeArguments: typeArguments,
        arguments: functionArguments,
        gasBudget: 10000000,
      },
    };

    return await executeTransaction(tx);
  } catch (error) {
    console.error("Lỗi gọi contract function:", error);
    throw error;
  }
}

// Format address (shorten)
function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Check authentication on protected pages
function requireAuth() {
  if (!isWalletConnected()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// Initialize wallet on page load
window.addEventListener("load", () => {
  const address = getCurrentWallet();
  if (address) {
    console.log("Wallet đã kết nối:", address);
    // Update UI if wallet info element exists
    const walletInfoEl = document.getElementById("walletAddress");
    if (walletInfoEl) {
      walletInfoEl.textContent = formatAddress(address);
    }
  }
});
