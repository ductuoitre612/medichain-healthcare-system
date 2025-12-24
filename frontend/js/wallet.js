// js/wallet.js
class WalletManager {
  constructor() {
    this.availableWallets = [];
    this.connectedWallet = null;
    this.isConnecting = false;
    this.elements = {};
  }

  // Khởi tạo
  init() {
    console.log("🚀 WalletManager Initializing...");
    this.cacheElements();
    this.detectWallets();
    this.setupEventListeners();
    this.checkExistingConnection();
    this.setupAuthCallback();
    return this;
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

  // Kết nối wallet
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

      console.log(`✅ Connected: ${address}`);

      this.handleSuccessfulConnection(address, wallet.name);
      this.showSuccessModal(address, wallet.name);

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

  // MỚI: Mở Slush App để đăng ký/kết nối
  launchSlushApp() {
    console.log("🚀 Launching Slush App...");

    // Đóng modal nếu đang mở
    const modal = document.querySelector(".app-connection-modal");
    if (modal) modal.remove();

    // Hiển thị hướng dẫn thay vì redirect
    this.showSlushInstructions();
  }

  // MỚI: Hiển thị hướng dẫn kết nối với Slush
  showSlushInstructions() {
    const instructionHtml = `
      <div class="app-connection-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 550px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        ">
          <button onclick="this.closest('.app-connection-modal').remove()"
                  style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #9ca3af;
                    cursor: pointer;
                    line-height: 1;
                  ">
            ×
          </button>
          
          <div style="margin-bottom: 30px;">
            <div style="
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fas fa-info-circle" style="font-size: 36px; color: white;"></i>
            </div>
            <h2 style="margin: 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Cách Kết nối với Slush</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.5;">Chọn một trong các phương án sau:</p>
          </div>
          
          <div style="text-align: left; margin: 30px 0;">
            <!-- Option 1: Extension -->
            <div style="
              background: #f0f9ff;
              border: 2px solid #3b82f6;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <div style="display: flex; align-items: start; gap: 15px;">
                <div style="
                  background: #3b82f6;
                  color: white;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  flex-shrink: 0;
                ">1</div>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">
                    <i class="fas fa-puzzle-piece" style="color: #3b82f6;"></i> 
                    Khuyên dùng: Cài Extension
                  </h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Nếu bạn đã có tài khoản Slush, cài extension và đăng nhập để kết nối dễ dàng với MediChain.
                  </p>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a href="https://chromewebstore.google.com/detail/slush-sui-wallet/hioeanlpnkenjbhejaecmjpopolgnffl" 
                       target="_blank"
                       style="
                         display: inline-flex;
                         align-items: center;
                         gap: 8px;
                         padding: 10px 16px;
                         background: #3b82f6;
                         color: white;
                         text-decoration: none;
                         border-radius: 8px;
                         font-size: 14px;
                         font-weight: 600;
                       ">
                      <i class="fas fa-download"></i>
                      Cài Extension
                    </a>
                    <button onclick="window.walletManager.recheckExtensions()"
                            style="
                              display: inline-flex;
                              align-items: center;
                              gap: 8px;
                              padding: 10px 16px;
                              background: white;
                              color: #3b82f6;
                              border: 2px solid #3b82f6;
                              border-radius: 8px;
                              font-size: 14px;
                              font-weight: 600;
                              cursor: pointer;
                            ">
                      <i class="fas fa-sync"></i>
                      Đã cài, kiểm tra lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Option 2: Manual Entry -->
            <div style="
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
            ">
              <div style="display: flex; align-items: start; gap: 15px;">
                <div style="
                  background: #6b7280;
                  color: white;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  flex-shrink: 0;
                ">2</div>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">
                    <i class="fas fa-keyboard" style="color: #6b7280;"></i> 
                    Nhập địa chỉ ví thủ công
                  </h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Copy địa chỉ ví từ Slush App và nhập vào đây để kết nối nhanh.
                  </p>
                  <div style="display: flex; gap: 10px;">
                    <input type="text" 
                           id="manualWalletAddress" 
                           placeholder="0x..."
                           style="
                             flex: 1;
                             padding: 10px 12px;
                             border: 2px solid #e5e7eb;
                             border-radius: 8px;
                             font-size: 14px;
                             font-family: monospace;
                           ">
                    <button onclick="window.walletManager.connectManualWallet()"
                            style="
                              padding: 10px 20px;
                              background: #6b7280;
                              color: white;
                              border: none;
                              border-radius: 8px;
                              font-size: 14px;
                              font-weight: 600;
                              cursor: pointer;
                              white-space: nowrap;
                            ">
                      <i class="fas fa-check"></i> Kết nối
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Option 3: Slush Web -->
            <div style="
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
            ">
              <div style="display: flex; align-items: start; gap: 15px;">
                <div style="
                  background: #6b7280;
                  color: white;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  flex-shrink: 0;
                ">3</div>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">
                    <i class="fas fa-external-link-alt" style="color: #6b7280;"></i> 
                    Tạo ví mới trên Slush
                  </h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Nếu chưa có ví, tạo tài khoản mới trên Slush Web App, sau đó quay lại và nhập địa chỉ ví.
                  </p>
                  <a href="https://slush.app/" 
                     target="_blank"
                     style="
                       display: inline-flex;
                       align-items: center;
                       gap: 8px;
                       padding: 10px 16px;
                       background: white;
                       color: #6b7280;
                       text-decoration: none;
                       border: 2px solid #e5e7eb;
                       border-radius: 8px;
                       font-size: 14px;
                       font-weight: 600;
                     ">
                    <i class="fas fa-external-link-alt"></i>
                    Mở Slush Web
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div style="
            background: #fffbeb;
            border: 1px solid #fbbf24;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: left;
          ">
            <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
              <i class="fas fa-lightbulb" style="color: #fbbf24;"></i> 
              <strong>Mẹo:</strong> Sau khi cài extension hoặc có địa chỉ ví, quay lại trang này và click "Kết nối Wallet" để hoàn tất.
            </p>
          </div>
        </div>
      </div>
    `;

    // Thêm style animation nếu chưa có
    if (!document.getElementById("modal-animation")) {
      const style = document.createElement("style");
      style.id = "modal-animation";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Xóa modal cũ nếu có
    const oldModal = document.querySelector(".app-connection-modal");
    if (oldModal) oldModal.remove();

    // Thêm modal vào DOM
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = instructionHtml;
    document.body.appendChild(modalContainer.firstElementChild);
  }

  // MỚI: Kết nối ví thủ công
  connectManualWallet() {
    const input = document.getElementById("manualWalletAddress");
    const address = input ? input.value.trim() : "";

    if (!address) {
      alert("Vui lòng nhập địa chỉ ví");
      return;
    }

    // Validate địa chỉ Sui (bắt đầu với 0x và có độ dài phù hợp)
    if (!address.startsWith("0x") || address.length < 40) {
      alert("Địa chỉ ví không hợp lệ. Địa chỉ Sui phải bắt đầu với 0x");
      return;
    }

    console.log("✅ Manual wallet connection:", address);

    // Đóng modal
    const modal = document.querySelector(".app-connection-modal");
    if (modal) modal.remove();

    // Lưu kết nối
    this.handleSuccessfulConnection(address, "Slush Wallet (Manual)");
    this.showSuccessModal(address, "Slush Wallet");

    // Redirect sau 2 giây
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);
  }

  // MỚI: Kiểm tra lại extension sau khi cài
  recheckExtensions() {
    console.log("🔄 Rechecking extensions...");

    // Đóng modal hiện tại
    const modal = document.querySelector(".app-connection-modal");
    if (modal) modal.remove();

    // Detect lại wallets
    this.detectWallets();

    // Nếu tìm thấy wallets, hiển thị modal chọn wallet
    if (this.availableWallets.length > 0) {
      alert(
        `✅ Tìm thấy ${this.availableWallets.length} wallet! Đang mở danh sách...`
      );
      this.showExtensionWallets();
    } else {
      alert(
        "⚠️ Chưa phát hiện extension nào. Vui lòng:\n1. Cài extension và đăng nhập\n2. Refresh trang (Ctrl+R)\n3. Thử lại"
      );
    }
  }

  // MỚI: Lắng nghe callback từ Slush App
  startListeningForCallback() {
    console.log("👂 Listening for callback from Slush App...");

    // Check URL params mỗi 500ms
    const checkInterval = setInterval(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const address = urlParams.get("address");
      const requestId = urlParams.get("requestId");

      if (address && requestId) {
        clearInterval(checkInterval);

        // Verify request ID
        const storedRequestId = localStorage.getItem(
          "slush_connection_request"
        );
        if (requestId === storedRequestId) {
          console.log("✅ Valid callback received");
          this.handleSlushCallback(address);
        } else {
          console.warn("⚠️ Invalid request ID");
        }
      }
    }, 500);

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 300000);
  }

  // MỚI: Xử lý callback từ Slush
  handleSlushCallback(address) {
    console.log("🎉 Slush connected:", address);

    // Lưu thông tin kết nối
    this.handleSuccessfulConnection(address, "Slush Wallet");

    // Xóa params khỏi URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    // Hiển thị modal thành công
    this.showSuccessModal(address, "Slush Wallet");

    // Auto redirect sau 2 giây
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);
  }

  // MỚI: Setup auth callback khi trang load
  setupAuthCallback() {
    // Check nếu có callback params trong URL
    const urlParams = new URLSearchParams(window.location.search);
    const address = urlParams.get("address");
    const requestId = urlParams.get("requestId");

    if (address && requestId) {
      const storedRequestId = localStorage.getItem("slush_connection_request");
      if (requestId === storedRequestId) {
        this.handleSlushCallback(address);
      }
    }
  }

  // MỚI: Hiển thị modal chọn cách kết nối
  showConnectionOptionsModal() {
    const modalHtml = `
      <div class="app-connection-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 450px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          position: relative;
        ">
          <button onclick="this.closest('.app-connection-modal').remove()"
                  style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #9ca3af;
                    cursor: pointer;
                    line-height: 1;
                  ">
            ×
          </button>
          
          <div style="margin-bottom: 25px;">
            <div style="
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fas fa-wallet" style="font-size: 36px; color: white;"></i>
            </div>
            <h2 style="margin: 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Kết nối Slush Wallet</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.5;">Chọn cách bạn muốn kết nối với MediChain</p>
          </div>
          
          <div style="margin: 30px 0; display: flex; flex-direction: column; gap: 15px;">
            <button onclick="window.walletManager.launchSlushApp()" 
                    style="
                      width: 100%;
                      padding: 20px;
                      background: linear-gradient(135deg, #6366f1, #4f46e5);
                      color: white;
                      border: none;
                      border-radius: 12px;
                      font-size: 16px;
                      font-weight: 600;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 12px;
                      transition: all 0.3s;
                      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(99, 102, 241, 0.4)'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(99, 102, 241, 0.3)'">
              <i class="fas fa-external-link-alt"></i>
              <span>Mở Slush App (Khuyên dùng)</span>
            </button>
            
            ${
              this.availableWallets.length > 0
                ? `
              <div style="position: relative; text-align: center; margin: 10px 0;">
                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e5e7eb;"></div>
                <span style="position: relative; background: white; padding: 0 15px; color: #9ca3af; font-size: 14px;">hoặc</span>
              </div>
              
              <button onclick="window.walletManager.showExtensionWallets()"
                      style="
                        width: 100%;
                        padding: 20px;
                        background: white;
                        color: #374151;
                        border: 2px solid #e5e7eb;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        transition: all 0.3s;
                      "
                      onmouseover="this.style.borderColor='#6366f1'; this.style.transform='translateY(-2px)'"
                      onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform=''">
                <i class="fas fa-puzzle-piece"></i>
                <span>Dùng Extension (${this.availableWallets.length} wallet)</span>
              </button>
            `
                : `
              <div style="
                padding: 15px;
                background: #f0f9ff;
                border-radius: 8px;
                border: 1px solid #bae6fd;
                text-align: left;
                margin-top: 10px;
              ">
                <p style="margin: 0; color: #0369a1; font-size: 14px; line-height: 1.5;">
                  <i class="fas fa-info-circle"></i> <strong>Chưa có extension?</strong><br>
                  Bạn có thể đăng ký và sử dụng Slush ngay trên web mà không cần cài đặt extension.
                </p>
              </div>
            `
            }
          </div>
          
          <div style="
            background: #f9fafb;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
          ">
            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
              <i class="fas fa-shield-alt" style="color: #10b981;"></i> 
              Thông tin ví của bạn được bảo mật và chỉ lưu trữ cục bộ
            </p>
          </div>
        </div>
      </div>
    `;

    // Thêm style animation nếu chưa có
    if (!document.getElementById("modal-animation")) {
      const style = document.createElement("style");
      style.id = "modal-animation";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Xóa modal cũ nếu có
    const oldModal = document.querySelector(".app-connection-modal");
    if (oldModal) oldModal.remove();

    // Thêm modal vào DOM
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
  }

  // MỚI: Hiển thị danh sách extension wallets
  showExtensionWallets() {
    // Đóng modal hiện tại
    const modal = document.querySelector(".app-connection-modal");
    if (modal) modal.remove();

    // Hiển thị modal chọn wallet từ extension
    let html = `
      <div style="text-align: left;">
        <h3 style="margin-bottom: 20px; color: #1f2937;">Chọn Wallet Extension</h3>
        <p style="color: #6b7280; margin-bottom: 25px;">Các wallet đã cài đặt trên trình duyệt:</p>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    this.availableWallets.forEach((wallet, index) => {
      html += `
        <button onclick="window.walletManager.connect(${index})" 
                style="display: flex; align-items: center; gap: 15px; padding: 18px; background: white; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.3s; text-align: left; width: 100%;">
          <div style="font-size: 28px">${wallet.icon}</div>
          <div style="flex: 1">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${wallet.name}</div>
            <div style="font-size: 14px; color: #6b7280;">Nhấn để kết nối</div>
          </div>
          <i class="fas fa-chevron-right" style="color: #9ca3af;"></i>
        </button>
      `;
    });

    html += `
        </div>
        
        <button onclick="window.walletManager.showConnectionOptionsModal()"
                style="
                  width: 100%;
                  margin-top: 20px;
                  padding: 12px;
                  background: #f3f4f6;
                  border: none;
                  border-radius: 8px;
                  color: #6b7280;
                  cursor: pointer;
                  font-size: 14px;
                ">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
      </div>
    `;

    this.elements.walletList.innerHTML = html;
    this.elements.installWalletModal.style.display = "flex";
  }

  // Cập nhật UI sau khi kết nối
  handleSuccessfulConnection(address, walletName) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    if (this.elements.walletBadge) {
      this.elements.walletBadge.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${shortAddress}</span>
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

    // Lưu thông tin wallet theo format cũ VÀ mới để tương thích với dashboard
    const walletData = {
      address: address,
      type: walletName,
      connected: true,
      connectedAt: new Date().toISOString(),
    };

    // Format mới (hiện tại)
    localStorage.setItem("medichain_wallet_address", address);
    localStorage.setItem("medichain_wallet_name", walletName);
    localStorage.setItem("medichain_connected", "true");

    // Format cũ (để dashboard đọc được)
    localStorage.setItem("medichain_wallet", JSON.stringify(walletData));

    console.log("✅ Wallet data saved:", walletData);
  }

  // Kiểm tra kết nối cũ
  checkExistingConnection() {
    const connected = localStorage.getItem("medichain_connected");
    const address = localStorage.getItem("medichain_wallet_address");
    const walletName = localStorage.getItem("medichain_wallet_name");
    const demoMode = localStorage.getItem("medichain_demo_mode");
    const walletData = localStorage.getItem("medichain_wallet");

    console.log("🔍 Checking existing connection:", {
      connected,
      address,
      walletName,
      demoMode,
      hasWalletData: !!walletData,
    });

    // Kiểm tra nếu đang ở trang landing (index.html)
    const isLandingPage =
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/") ||
      window.location.pathname === "/frontend/html/" ||
      !window.location.pathname.includes("dashboard");

    // Kiểm tra nếu đang ở trang dashboard
    const isDashboardPage = window.location.pathname.includes("dashboard.html");

    console.log("📍 Page detection:", {
      isLandingPage,
      isDashboardPage,
      pathname: window.location.pathname,
    });

    // Nếu có wallet data cũ nhưng không có format mới, convert sang format mới
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
      // Nếu đang ở dashboard, không làm gì
      return;
    }

    // Case 2: Real wallet connection
    if (connected === "true" && address) {
      console.log("✅ Valid wallet connection found");
      this.handleSuccessfulConnection(address, walletName || "Unknown Wallet");

      // Nếu đang ở landing page, redirect sang dashboard
      if (isLandingPage) {
        console.log("🚀 Redirecting to dashboard...");
        sessionStorage.setItem("medichain_redirecting", "true");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      }
      // Nếu đang ở dashboard, xóa flag redirect
      if (isDashboardPage) {
        sessionStorage.removeItem("medichain_redirecting");
      }
    } else if (connected === "true" && !address && demoMode !== "true") {
      // Case 3: Invalid state - clear everything
      console.log("⚠️ Invalid connection state, clearing...");
      this.clearStoredConnection(false);
    } else {
      // Case 4: No connection
      console.log("ℹ️ No connection found");
      // KHÔNG tự động redirect từ dashboard về landing
      // Dashboard sẽ tự xử lý việc này
    }
  }

  clearStoredConnection(showAlert = false) {
    localStorage.removeItem("medichain_wallet_address");
    localStorage.removeItem("medichain_wallet_name");
    localStorage.removeItem("medichain_connected");
    localStorage.removeItem("medichain_demo_mode");
    localStorage.removeItem("medichain_wallet"); // Xóa cả format cũ
    localStorage.removeItem("slush_connection_request");
    localStorage.removeItem("slush_connection_timestamp");

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

  updateWalletUI() {
    if (this.availableWallets.length > 0) {
      [this.elements.connectWalletBtn, this.elements.connectWalletBtn2].forEach(
        (btn) => {
          if (btn) {
            btn.innerHTML = `<i class="fas fa-wallet"></i> Kết nối Wallet`;
          }
        }
      );
    }
  }

  showLoading() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.style.display = "flex";
    }
  }

  hideLoading() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.style.display = "none";
    }
  }

  showSuccessModal(address, walletName) {
    if (this.elements.successModal) {
      this.elements.walletAddress.textContent = address;
      this.elements.walletType.textContent = walletName;
      this.elements.successModal.style.display = "flex";
    }
  }

  showError(message) {
    if (this.elements.walletErrorModal && this.elements.walletErrorMessage) {
      this.elements.walletErrorMessage.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="width: 60px; height: 60px; margin: 0 auto 15px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 28px; color: #dc2626;"></i>
          </div>
          <h3 style="margin-bottom: 10px; color: #1f2937;">Kết nối thất bại</h3>
          <p style="color: #6b7280; line-height: 1.5;">${message}</p>
        </div>
      `;
      this.elements.walletErrorModal.style.display = "flex";
    }
  }

  setupEventListeners() {
    // Connect buttons - UPDATED: Mở modal chọn cách kết nối
    [this.elements.connectWalletBtn, this.elements.connectWalletBtn2].forEach(
      (btn) => {
        if (btn) {
          btn.addEventListener("click", () => {
            this.showConnectionOptionsModal();
          });
        }
      }
    );

    if (this.elements.installWalletBtn) {
      this.elements.installWalletBtn.addEventListener("click", () => {
        this.showConnectionOptionsModal();
      });
    }

    if (this.elements.retryConnectionBtn) {
      this.elements.retryConnectionBtn.addEventListener("click", () => {
        this.elements.walletErrorModal.style.display = "none";
        this.showConnectionOptionsModal();
      });
    }

    if (this.elements.tryDemoBtn) {
      this.elements.tryDemoBtn.addEventListener("click", () => {
        console.log("🎮 Entering demo mode...");
        // Xóa tất cả connection cũ trước
        this.clearStoredConnection(false);
        // Set demo mode
        localStorage.setItem("medichain_demo_mode", "true");
        localStorage.setItem("medichain_connected", "true");
        // Redirect
        window.location.href = "dashboard.html";
      });
    }

    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", function () {
        this.closest(".modal-overlay").style.display = "none";
      });
    });

    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", function (e) {
        if (e.target === this) {
          this.style.display = "none";
        }
      });
    });
  }
}

// Tạo instance toàn cục
window.walletManager = new WalletManager();
