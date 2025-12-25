// js/wallet.js - Wallet Manager với đầy đủ chức năng blockchain
class WalletManager {
  constructor() {
    this.availableWallets = [];
    this.connectedWallet = null;
    this.isConnecting = false;
    this.elements = {};

    // THÊM MỚI: State cho blockchain
    this.suiClient = null;
    this.address = null;
    this.balance = "0";
    this.network = CONFIG?.CURRENT_NETWORK || "TESTNET";
    this.isDemoMode = false;
    this.connected = false;

    this.init();
  }

  // Khởi tạo
  async init() {
    console.log("🚀 WalletManager Initializing...");
    this.cacheElements();

    // THÊM MỚI: Khởi tạo Sui Client
    await this.initializeSuiClient();

    this.detectWallets();
    this.setupEventListeners();
    await this.checkExistingConnection();
    this.setupAuthCallback();

    return this;
  }

  // THÊM MỚI: Khởi tạo Sui Client
  async initializeSuiClient() {
    try {
      // Đảm bảo Sui SDK đã được load
      if (typeof sui === "undefined") {
        console.warn("Sui SDK chưa được load, đang thử tải...");
        await this.loadSuiSDK();
      }

      // Khởi tạo Sui Client với config
      const currentNetwork = CONFIG?.getCurrentNetwork
        ? CONFIG.getCurrentNetwork()
        : CONFIG?.NETWORKS?.[this.network];
      const rpcUrl =
        currentNetwork?.rpcUrl || "https://fullnode.testnet.sui.io:443";

      this.suiClient = new sui.SuiClient({
        url: rpcUrl,
      });

      console.log("✅ Sui Client initialized:", rpcUrl);
    } catch (error) {
      console.error("❌ Failed to initialize Sui Client:", error);
    }
  }

  // THÊM MỚI: Load Sui SDK từ CDN nếu cần
  async loadSuiSDK() {
    return new Promise((resolve, reject) => {
      if (typeof sui !== "undefined") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/@mysten/sui.js/dist/index.umd.js";
      script.onload = () => {
        console.log("✅ Sui SDK loaded from CDN");
        resolve();
      };
      script.onerror = () => {
        console.error("❌ Failed to load Sui SDK");
        reject(new Error("Không thể load Sui SDK"));
      };
      document.head.appendChild(script);
    });
  }

  // Cache DOM elements
  cacheElements() {
    this.elements = {
      loadingOverlay: document.getElementById("loadingOverlay"),
      successModal: document.getElementById("successModal"),
      walletErrorModal: document.getElementById("walletErrorModal"),
      installWalletModal: document.getElementById("installWalletModal"),
      walletList: document.getElementById("walletList"),
      walletErrorMessage: document.getElementById("walletErrorMessage"),
      walletAddress: document.getElementById("walletAddress"),
      walletType: document.getElementById("walletType"),
      walletBadge: document.getElementById("walletBadge"),
      connectWalletBtn: document.getElementById("connectWalletBtn"),
      connectWalletBtn2: document.getElementById("connectWalletBtn2"),
      installWalletBtn: document.getElementById("installWalletBtn"),
      retryConnectionBtn: document.getElementById("retryConnectionBtn"),
      tryDemoBtn: document.getElementById("tryDemoBtn"),
      mobileMenuBtn: document.getElementById("mobileMenuBtn"),
      navLinks: document.getElementById("navLinks"),
    };
  }

  // Phát hiện wallet
  detectWallets() {
    console.log("🔍 Enhanced wallet detection...");
    this.availableWallets = [];

    // METHOD 1: Sui Wallet Standard API (Primary)
    if (window.sui && window.sui.getWallets) {
      try {
        const standardWallets = window.sui.getWallets();
        console.log("Standard wallets found:", standardWallets);

        standardWallets.forEach((wallet) => {
          const isSlush =
            wallet.name.toLowerCase().includes("slush") ||
            wallet.name === "Slush";

          this.availableWallets.push({
            name: wallet.name,
            adapter: wallet,
            icon: isSlush ? "🔵" : "💼",
            type: "standard",
          });
        });
      } catch (error) {
        console.warn("Error with standard API:", error);
      }
    }

    // METHOD 2: Direct global objects (Fallback)
    const walletObjects = [
      { name: "Sui Wallet", obj: window.suiWallet, icon: "🟢" },
      { name: "Slush Wallet", obj: window.slushWallet, icon: "🔵" },
      { name: "Slush (new API)", obj: window.slush, icon: "🔵" },
      { name: "Ethos Wallet", obj: window.ethosWallet, icon: "🟣" },
      { name: "Martian Wallet", obj: window.martian, icon: "🔴" },
    ];

    walletObjects.forEach((wallet) => {
      if (
        wallet.obj &&
        !this.availableWallets.some((w) => w.name === wallet.name)
      ) {
        console.log(`Found ${wallet.name} via global object`);
        this.availableWallets.push({
          name: wallet.name,
          adapter: wallet.obj,
          icon: wallet.icon,
          type: "global",
        });
      }
    });

    console.log(`📋 Total wallets detected: ${this.availableWallets.length}`);
    this.updateWalletUI();
    return this.availableWallets;
  }

  // Kết nối wallet - THÊM Sui Client
  async connect(walletIndex) {
    if (this.isConnecting) return;

    const wallet = this.availableWallets[walletIndex];
    if (!wallet) {
      this.showError("Wallet không hợp lệ");
      return;
    }

    this.isConnecting = true;
    this.showLoading();

    try {
      console.log(`🔗 Connecting to ${wallet.name}...`);

      let accounts = [];

      if (wallet.type === "standard") {
        await wallet.adapter.connect();
        accounts = await wallet.adapter.getAccounts();
      } else {
        if (wallet.adapter.connect) await wallet.adapter.connect();
        if (wallet.adapter.getAccounts) {
          accounts = await wallet.adapter.getAccounts();
        }
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("Không thể lấy địa chỉ ví");
      }

      const address = accounts[0];
      this.connectedWallet = { ...wallet, address };

      // THÊM MỚI: Cập nhật state blockchain
      this.address = address;
      this.connected = true;
      this.isDemoMode = false;

      console.log(`✅ Connected: ${address}`);

      // THÊM MỚI: Cập nhật balance
      await this.updateBalance();

      // THÊM MỚI: Bắt đầu polling balance
      this.startBalancePolling();

      this.handleSuccessfulConnection(address, wallet.name);
      this.showSuccessModal(address, wallet.name);

      // THÊM MỚI: Dispatch event
      this.dispatchWalletConnectedEvent();

      // Auto redirect
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
    } catch (error) {
      console.error("❌ Connection failed:", error);
      this.showError(error.message || "Không thể kết nối ví");
    } finally {
      this.isConnecting = false;
      this.hideLoading();
    }
  }

  // THÊM MỚI: Cập nhật số dư từ blockchain
  async updateBalance() {
    try {
      if (!this.address || !this.suiClient) {
        this.balance = "0";
        return;
      }

      const balance = await this.suiClient.getBalance({
        owner: this.address,
        coinType: "0x2::sui::SUI",
      });

      this.balance = (parseInt(balance.totalBalance) / 1_000_000_000).toFixed(
        4
      );
      this.updateBalanceDisplay();
    } catch (error) {
      console.error("Update balance error:", error);
      this.balance = "0.0000";
      this.updateBalanceDisplay();
    }
  }

  // THÊM MỚI: Hiển thị số dư
  updateBalanceDisplay() {
    const balanceElements = document.querySelectorAll(".wallet-balance");
    balanceElements.forEach((element) => {
      element.textContent = `${this.balance} SUI`;
    });
  }

  // THÊM MỚI: Polling số dư
  startBalancePolling() {
    this.stopBalancePolling();

    this.balanceInterval = setInterval(() => {
      if (this.connected && !this.isDemoMode) {
        this.updateBalance();
      }
    }, 30000);
  }

  stopBalancePolling() {
    if (this.balanceInterval) {
      clearInterval(this.balanceInterval);
      this.balanceInterval = null;
    }
  }

  // THÊM MỚI: Execute transaction (QUAN TRỌNG!)
  async executeTransaction(transactionBlock) {
    if (!this.connected) {
      throw new Error("Vui lòng kết nối ví trước!");
    }

    if (this.isDemoMode) {
      // Mock transaction cho demo mode
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        digest: `demo_${Date.now()}`,
        effects: { status: { status: "success" } },
        objectChanges: [],
        events: [],
      };
    }

    try {
      const result =
        await this.connectedWallet.adapter.signAndExecuteTransaction({
          transaction: transactionBlock,
          chain: `sui:${this.network.toLowerCase()}`,
        });

      console.log("✅ Transaction executed:", result);
      return result;
    } catch (error) {
      console.error("❌ Transaction error:", error);
      throw error;
    }
  }

  // THÊM MỚI: Gọi Move function
  async callMoveFunction(
    packageId,
    moduleName,
    functionName,
    args = [],
    typeArguments = []
  ) {
    const tx = new sui.TransactionBlock();

    tx.moveCall({
      target: `${packageId}::${moduleName}::${functionName}`,
      arguments: args.map((arg) => tx.pure(arg)),
      typeArguments: typeArguments,
    });

    // Set gas budget
    const gasBudget = CONFIG?.getGasBudget
      ? CONFIG.getGasBudget("DEFAULT")
      : 100000000;
    tx.setGasBudget(gasBudget);

    return await this.executeTransaction(tx);
  }

  // THÊM MỚI: Sign message
  async signMessage(message) {
    if (!this.connected) {
      throw new Error("Vui lòng kết nối ví trước!");
    }

    if (this.isDemoMode) {
      return "demo_signature";
    }

    try {
      const result = await this.connectedWallet.adapter.signMessage({
        message: new TextEncoder().encode(message),
      });

      return result.signature;
    } catch (error) {
      console.error("❌ Sign message error:", error);
      throw error;
    }
  }

  // THÊM MỚI: Dispatch event
  dispatchWalletConnectedEvent() {
    const event = new CustomEvent("walletConnected", {
      detail: {
        address: this.address,
        isDemo: this.isDemoMode,
        balance: this.balance,
      },
    });
    window.dispatchEvent(event);
  }

  dispatchWalletDisconnectedEvent() {
    const event = new CustomEvent("walletDisconnected");
    window.dispatchEvent(event);
  }

  // Cập nhật UI sau khi kết nối - THÊM state blockchain
  handleSuccessfulConnection(address, walletName) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    if (this.elements.walletBadge) {
      this.elements.walletBadge.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${shortAddress}</span>
        ${this.isDemoMode ? '<span class="demo-badge">Demo</span>' : ""}
      `;
      this.elements.walletBadge.classList.add("connected");
    }

    [this.elements.connectWalletBtn, this.elements.connectWalletBtn2].forEach(
      (btn) => {
        if (btn) {
          btn.innerHTML = '<i class="fas fa-check"></i> Đã kết nối';
          btn.disabled = true;
        }
      }
    );

    // Lưu thông tin wallet đầy đủ
    const walletData = {
      address: address,
      type: walletName,
      connected: true,
      connectedAt: new Date().toISOString(),
      isDemo: this.isDemoMode,
      network: this.network,
      balance: this.balance,
    };

    // Format mới (hiện tại)
    localStorage.setItem("medichain_wallet_address", address);
    localStorage.setItem("medichain_wallet_name", walletName);
    localStorage.setItem("medichain_connected", "true");
    localStorage.setItem("medichain_demo_mode", this.isDemoMode.toString());
    localStorage.setItem("medichain_network", this.network);

    // Format cũ (để tương thích)
    localStorage.setItem("medichain_wallet", JSON.stringify(walletData));

    console.log("✅ Wallet data saved:", walletData);
  }

  // Kiểm tra kết nối cũ - THÊM khởi tạo Sui Client
  async checkExistingConnection() {
    const connected = localStorage.getItem("medichain_connected");
    const address = localStorage.getItem("medichain_wallet_address");
    const walletName = localStorage.getItem("medichain_wallet_name");
    const demoMode = localStorage.getItem("medichain_demo_mode");
    const network = localStorage.getItem("medichain_network");
    const walletData = localStorage.getItem("medichain_wallet");

    console.log("🔍 Checking existing connection:", {
      connected,
      address,
      walletName,
      demoMode,
      network,
      hasWalletData: !!walletData,
    });

    // Set network
    if (network) {
      this.network = network;
    }

    // Kiểm tra nếu đang ở trang landing
    const isLandingPage =
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/") ||
      window.location.pathname === "/frontend/html/" ||
      !window.location.pathname.includes("dashboard");

    // Kiểm tra nếu đang ở trang dashboard
    const isDashboardPage = window.location.pathname.includes("dashboard.html");

    // Nếu có wallet data cũ nhưng không có format mới, convert
    if (walletData && !address) {
      try {
        const wallet = JSON.parse(walletData);
        console.log("🔄 Converting old wallet format to new format");
        this.handleSuccessfulConnection(
          wallet.address,
          wallet.type || "Unknown Wallet"
        );
        return;
      } catch (e) {
        console.error("Error parsing old wallet data:", e);
      }
    }

    // Case 1: Demo mode
    if (demoMode === "true") {
      this.isDemoMode = true;
      this.connected = true;
      this.address = address;

      if (isLandingPage) {
        console.log(
          "Demo mode detected on landing, redirecting to dashboard..."
        );
        sessionStorage.setItem("medichain_redirecting", "true");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
        return;
      }
      return;
    }

    // Case 2: Real wallet connection
    if (connected === "true" && address) {
      console.log("✅ Valid wallet connection found");

      // THÊM: Khởi tạo Sui Client trước khi set state
      if (!this.suiClient) {
        await this.initializeSuiClient();
      }

      this.address = address;
      this.connected = true;
      this.isDemoMode = false;

      // THÊM: Cập nhật balance
      await this.updateBalance();
      this.startBalancePolling();

      this.handleSuccessfulConnection(address, walletName || "Unknown Wallet");

      // Nếu đang ở landing page, redirect sang dashboard
      if (isLandingPage) {
        console.log("🚀 Redirecting to dashboard...");
        sessionStorage.setItem("medichain_redirecting", "true");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      }

      if (isDashboardPage) {
        sessionStorage.removeItem("medichain_redirecting");
      }
    } else if (connected === "true" && !address && demoMode !== "true") {
      // Case 3: Invalid state - clear everything
      console.log("⚠️ Invalid connection state, clearing...");
      await this.clearStoredConnection(false);
    } else {
      // Case 4: No connection
      console.log("ℹ️ No connection found");
    }
  }

  // Clear stored connection - THÊM stop polling
  async clearStoredConnection(showAlert = false) {
    localStorage.removeItem("medichain_wallet_address");
    localStorage.removeItem("medichain_wallet_name");
    localStorage.removeItem("medichain_connected");
    localStorage.removeItem("medichain_demo_mode");
    localStorage.removeItem("medichain_network");
    localStorage.removeItem("medichain_wallet");
    localStorage.removeItem("slush_connection_request");
    localStorage.removeItem("slush_connection_timestamp");

    // Reset state
    this.address = null;
    this.balance = "0";
    this.isDemoMode = false;
    this.connected = false;
    this.connectedWallet = null;

    // Stop polling
    this.stopBalancePolling();

    // Dispatch event
    this.dispatchWalletDisconnectedEvent();

    if (this.elements.walletBadge) {
      this.elements.walletBadge.innerHTML = `
        <i class="fas fa-wallet"></i>
        <span>Chưa kết nối</span>
      `;
      this.elements.walletBadge.classList.remove("connected");
    }

    [this.elements.connectWalletBtn, this.elements.connectWalletBtn2].forEach(
      (btn) => {
        if (btn) {
          btn.innerHTML = '<i class="fas fa-wallet"></i> Kết nối Wallet';
          btn.disabled = false;
        }
      }
    );

    console.log("✅ Đã xóa thông tin kết nối cũ");
    if (showAlert) {
      alert("Đã xóa thông tin kết nối cũ. Vui lòng kết nối ví mới.");
    }
  }

  // THÊM MỚI: Getter methods
  getAddress() {
    return this.address;
  }

  isConnected() {
    return this.connected;
  }

  isDemo() {
    return this.isDemoMode;
  }

  getBalance() {
    return this.balance;
  }

  getClient() {
    return this.suiClient;
  }

  // Các hàm modal và UI (giữ nguyên)
  // ... [giữ nguyên tất cả các hàm showSlushInstructions, connectManualWallet, recheckExtensions, etc.]
}

// Tạo instance toàn cục
window.walletManager = new WalletManager();
// js/wallet.js - THÊM DEBUG FUNCTIONS
class WalletManager {
  constructor() {
    console.log("=== WALLET MANAGER CONSTRUCTOR ===");

    this.availableWallets = [];
    this.connectedWallet = null;
    this.isConnecting = false;
    this.elements = {};

    // State cho blockchain
    this.suiClient = null;
    this.address = null;
    this.balance = "0";
    this.network = CONFIG?.CURRENT_NETWORK || "TESTNET";
    this.isDemoMode = false;
    this.connected = false;

    // Debug
    console.log("Config loaded:", !!CONFIG);
    console.log("Sui SDK loaded:", typeof sui);

    // Kiểm tra DOM sẵn sàng
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM ready, initializing...");
        this.init();
      });
    } else {
      console.log("DOM already ready, initializing...");
      this.init();
    }
  }

  async init() {
    console.log("🚀 WalletManager Initializing...");

    try {
      this.cacheElements();
      console.log("Elements cached:", Object.keys(this.elements));

      // Khởi tạo Sui Client
      await this.initializeSuiClient();

      this.detectWallets();
      console.log("Wallets detected:", this.availableWallets.length);

      this.setupEventListeners();
      console.log("Event listeners setup");

      await this.checkExistingConnection();
      this.setupAuthCallback();

      // TEST: Thêm debug button
      this.addDebugButton();

      console.log("✅ WalletManager initialized successfully");
    } catch (error) {
      console.error("❌ WalletManager init error:", error);
    }
  }

  // Thêm debug button để test
  addDebugButton() {
    const debugBtn = document.createElement("button");
    debugBtn.innerHTML = "🐛 Debug";
    debugBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    debugBtn.addEventListener("click", () => {
      this.showDebugInfo();
    });

    document.body.appendChild(debugBtn);
  }

  showDebugInfo() {
    const debugInfo = `
      <div class="modal-overlay" style="display: flex; z-index: 10000;">
        <div class="modal" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>🐛 Wallet Debug Info</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">&times;</button>
          </div>
          <div class="modal-body">
            <h4>Wallet Manager State:</h4>
            <pre>${JSON.stringify(
              {
                address: this.address,
                connected: this.connected,
                isDemoMode: this.isDemoMode,
                balance: this.balance,
                network: this.network,
                availableWallets: this.availableWallets.length,
              },
              null,
              2
            )}</pre>
            
            <h4>Detected Wallets:</h4>
            <ul>
              ${this.availableWallets
                .map((w) => `<li>${w.name} (${w.type})</li>`)
                .join("")}
            </ul>
            
            <h4>Global Objects:</h4>
            <pre>${JSON.stringify(
              {
                sui: typeof window.sui,
                suiWallet: typeof window.suiWallet,
                slush: typeof window.slush,
                config: typeof CONFIG,
              },
              null,
              2
            )}</pre>
            
            <h4>Local Storage:</h4>
            <pre>${JSON.stringify(
              {
                medichain_connected: localStorage.getItem(
                  "medichain_connected"
                ),
                medichain_wallet_address: localStorage.getItem(
                  "medichain_wallet_address"
                ),
                medichain_demo_mode: localStorage.getItem(
                  "medichain_demo_mode"
                ),
              },
              null,
              2
            )}</pre>
            
            <h4>Test Actions:</h4>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
              <button onclick="window.walletManager.testModal()" class="btn btn-sm btn-primary">
                Test Modal
              </button>
              <button onclick="window.walletManager.testDemoMode()" class="btn btn-sm btn-warning">
                Test Demo Mode
              </button>
              <button onclick="window.walletManager.clearStorage()" class="btn btn-sm btn-danger">
                Clear Storage
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement("div");
    div.innerHTML = debugInfo;
    document.body.appendChild(div.firstElementChild);
  }

  // Test functions
  testModal() {
    this.showConnectionOptionsModal();
  }

  testDemoMode() {
    this.enterDemoMode();
  }

  clearStorage() {
    localStorage.clear();
    location.reload();
  }

  // ... rest of your wallet.js code ...
}
