// dashboard.js - Dashboard Page Logic (ĐÃ SỬA)

/**
 * Dashboard State
 */
const DashboardState = {
  stats: {
    totalRecords: 0,
    totalPrescriptions: 0,
    totalAppointments: 0,
    totalDoctors: 0,
  },
  recentRecords: [],
  recentPrescriptions: [],
  upcomingAppointments: [],
  loading: false,
};

/**
 * Initialize Dashboard
 */
async function initDashboard() {
  console.log("🏥 Initializing Dashboard...");

  try {
    // Check wallet connection
    const isConnected = await window.walletAPI.isWalletConnected();

    if (!isConnected) {
      console.warn("⚠️ No wallet connected, redirecting...");
      window.location.href = "index.html";
      return;
    }

    // Get wallet address
    const address = await window.walletAPI.getWalletAddress();
    console.log("✅ Wallet connected:", address);

    // Update wallet display
    updateWalletDisplay(address);

    // Load dashboard data - LOAD DỮ LIỆU THỰC TỪ BLOCKCHAIN
    await loadDashboardData();

    // Setup event listeners
    setupEventListeners();

    console.log("✅ Dashboard initialized");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    showToast("Lỗi khởi tạo dashboard", "error");
  }
}

/**
 * Update wallet display
 */
function updateWalletDisplay(address) {
  const walletBadge = document.getElementById("walletBadge");
  const walletAddress = document.getElementById("walletAddress");

  if (walletBadge) {
    walletBadge.textContent = window.walletAPI.formatWalletAddress(address);
  }

  if (walletAddress) {
    walletAddress.textContent = address;
  }

  // Update wallet balance
  updateWalletBalance();
}

/**
 * Update wallet balance
 */
async function updateWalletBalance() {
  try {
    const balance = await window.walletAPI.getWalletBalance();
    const balanceEl = document.getElementById("walletBalance");

    if (balanceEl) {
      balanceEl.textContent = formatCurrency(balance);
    }
  } catch (error) {
    console.error("Error getting balance:", error);
  }
}

/**
 * Load dashboard data - DỮ LIỆU THỰC TỪ BLOCKCHAIN
 */
async function loadDashboardData() {
  DashboardState.loading = true;
  showLoading("Đang tải dữ liệu từ blockchain...");

  try {
    // Load all data in parallel - CHỈ LOAD DỮ LIỆU THỰC
    await Promise.all([
      loadStats(),
      loadRecentRecords(),
      loadRecentPrescriptions(),
      loadUpcomingAppointments(),
    ]);

    console.log("✅ Dashboard data loaded từ blockchain");
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    showToast("Lỗi tải dữ liệu từ blockchain", "error");
  } finally {
    DashboardState.loading = false;
    hideLoading();
  }
}

/**
 * Load statistics - TỪ BLOCKCHAIN
 */
async function loadStats() {
  try {
    const address = await window.walletAPI.getWalletAddress();

    // KIỂM TRA XEM CÓ CONTRACT SERVICE KHÔNG
    if (!window.contractService) {
      console.warn("ContractService not available - showing zero stats");
      displayZeroStats();
      return;
    }

    // LOAD DỮ LIỆU THỰC TỪ BLOCKCHAIN
    try {
      // 1. Load medical records count từ blockchain
      const records = await window.contractService
        .getMedicalRecordsByPatient(address)
        .catch(() => []);
      const totalRecords = records ? records.length : 0;

      // 2. Load prescriptions count từ blockchain
      const prescriptions = await window.contractService
        .getPrescriptionsByPatient(address)
        .catch(() => []);
      const totalPrescriptions = prescriptions ? prescriptions.length : 0;

      // 3. Load appointments count (chưa implement) - để 0
      const totalAppointments = 0;

      // 4. Load doctors count (chưa implement) - để 0
      const totalDoctors = 0;

      const realStats = {
        totalRecords,
        totalPrescriptions,
        totalAppointments,
        totalDoctors,
      };

      DashboardState.stats = realStats;
      displayStats(realStats);
      console.log("📊 Real stats from blockchain:", realStats);
    } catch (blockchainError) {
      console.error("Error loading stats from blockchain:", blockchainError);
      displayZeroStats();
    }
  } catch (error) {
    console.error("Error loading stats:", error);
    displayZeroStats();
  }
}

/**
 * Display zero statistics - HIỂN THỊ SỐ 0 THỰC TẾ
 */
function displayZeroStats() {
  const zeroStats = {
    totalRecords: 0,
    totalPrescriptions: 0,
    totalAppointments: 0,
    totalDoctors: 0,
  };

  DashboardState.stats = zeroStats;
  displayStats(zeroStats);
}

/**
 * Display statistics
 */
function displayStats(stats) {
  document.getElementById("totalRecords").textContent = stats.totalRecords || 0;
  document.getElementById("totalPrescriptions").textContent =
    stats.totalPrescriptions || 0;
  document.getElementById("totalAppointments").textContent =
    stats.totalAppointments || 0;
  document.getElementById("totalDoctors").textContent = stats.totalDoctors || 0;

  // Hiển thị thông báo phù hợp
  const allZero = stats.totalRecords === 0 && stats.totalPrescriptions === 0;
  const statsDescription = document.getElementById("statsDescription");
  if (statsDescription) {
    statsDescription.textContent = allZero
      ? "Chưa có dữ liệu. Hãy tạo hồ sơ đầu tiên!"
      : `Cập nhật từ blockchain lúc ${new Date().toLocaleTimeString("vi-VN")}`;
  }
}

/**
 * Load recent medical records - TỪ BLOCKCHAIN
 */
async function loadRecentRecords() {
  try {
    const address = await window.walletAPI.getWalletAddress();

    // KIỂM TRA CONTRACT SERVICE
    if (!window.contractService) {
      console.warn("ContractService not available");
      displayEmptyStateWithAction(
        "recentRecords",
        "Hệ thống blockchain đang khởi tạo",
        "Vui lòng thử lại sau",
        () => handleRefresh()
      );
      return;
    }

    // LOAD DỮ LIỆU THỰC TỪ BLOCKCHAIN
    try {
      const records = await window.contractService.getMedicalRecordsByPatient(
        address
      );

      if (records && records.length > 0) {
        // Có dữ liệu thực - format và hiển thị
        const formattedRecords = records.slice(0, 5).map((record) => ({
          id: record.id || record.objectId,
          date: record.createdAt || new Date().toISOString().split("T")[0],
          diagnosis: record.diagnosis || "Khám bệnh",
          doctor: record.doctorName || "Bác sĩ",
          status: "completed",
          details: record.treatment || record.notes || "",
        }));

        DashboardState.recentRecords = formattedRecords;
        displayRecentRecords(formattedRecords);
        console.log("📋 Real records loaded:", formattedRecords.length);
      } else {
        // KHÔNG CÓ DỮ LIỆU - hiển thị empty state
        DashboardState.recentRecords = [];
        displayEmptyStateWithAction(
          "recentRecords",
          "Chưa có bệnh án nào",
          "Tạo bệnh án đầu tiên",
          () => (window.location.href = "create-medical-record.html")
        );
      }
    } catch (blockchainError) {
      console.error("Error loading records from blockchain:", blockchainError);
      DashboardState.recentRecords = [];
      displayEmptyStateWithAction(
        "recentRecords",
        "Lỗi kết nối blockchain",
        "Thử lại",
        () => handleRefresh()
      );
    }
  } catch (error) {
    console.error("Error loading records:", error);
    DashboardState.recentRecords = [];
    displayEmptyState("recentRecords", "Lỗi tải dữ liệu");
  }
}

/**
 * Display recent records
 */
function displayRecentRecords(records) {
  const container = document.getElementById("recentRecords");

  if (!container) return;

  if (records.length === 0) {
    displayEmptyStateWithAction(
      "recentRecords",
      "Chưa có bệnh án nào",
      "Tạo bệnh án đầu tiên",
      () => (window.location.href = "create-medical-record.html")
    );
    return;
  }

  const html = records
    .map(
      (record) => `
    <div class="list-item" onclick="viewRecord('${record.id}')">
      <div class="item-info">
        <h4>${record.diagnosis}</h4>
        <p>${formatDate(record.date)} - ${record.doctor}</p>
        ${
          record.details
            ? `<small class="text-muted">${record.details.substring(
                0,
                50
              )}...</small>`
            : ""
        }
      </div>
      <span class="item-badge badge-success">Hoàn thành</span>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
}

/**
 * Load recent prescriptions - TỪ BLOCKCHAIN
 */
async function loadRecentPrescriptions() {
  try {
    const address = await window.walletAPI.getWalletAddress();

    // KIỂM TRA CONTRACT SERVICE
    if (!window.contractService) {
      console.warn("ContractService not available");
      displayEmptyStateWithAction(
        "recentPrescriptions",
        "Hệ thống blockchain đang khởi tạo",
        "Vui lòng thử lại sau",
        () => handleRefresh()
      );
      return;
    }

    // LOAD DỮ LIỆU THỰC TỪ BLOCKCHAIN
    try {
      const prescriptions =
        await window.contractService.getPrescriptionsByPatient(address);

      if (prescriptions && prescriptions.length > 0) {
        // Có dữ liệu thực - format và hiển thị
        const formattedPrescriptions = prescriptions
          .slice(0, 5)
          .map((prescription) => {
            const now = new Date();
            const created = new Date(prescription.createdAt || now);
            const duration = parseInt(prescription.duration) || 30;
            const endDate = new Date(
              created.getTime() + duration * 24 * 60 * 60 * 1000
            );
            const isActive = now <= endDate;

            return {
              id: prescription.id || prescription.objectId,
              date:
                prescription.createdAt ||
                new Date().toISOString().split("T")[0],
              name: prescription.medication || "Đơn thuốc",
              medications: prescription.medications
                ? prescription.medications.split(",")
                : [prescription.medication || "Thuốc"],
              duration: `${duration} ngày`,
              status: isActive ? "active" : "completed",
              doctor: prescription.doctorName || "Bác sĩ",
            };
          });

        DashboardState.recentPrescriptions = formattedPrescriptions;
        displayRecentPrescriptions(formattedPrescriptions);
        console.log(
          "💊 Real prescriptions loaded:",
          formattedPrescriptions.length
        );
      } else {
        // KHÔNG CÓ DỮ LIỆU - hiển thị empty state
        DashboardState.recentPrescriptions = [];
        displayEmptyStateWithAction(
          "recentPrescriptions",
          "Chưa có đơn thuốc nào",
          "Tạo đơn thuốc đầu tiên",
          () => (window.location.href = "create-prescription.html")
        );
      }
    } catch (blockchainError) {
      console.error(
        "Error loading prescriptions from blockchain:",
        blockchainError
      );
      DashboardState.recentPrescriptions = [];
      displayEmptyStateWithAction(
        "recentPrescriptions",
        "Lỗi kết nối blockchain",
        "Thử lại",
        () => handleRefresh()
      );
    }
  } catch (error) {
    console.error("Error loading prescriptions:", error);
    DashboardState.recentPrescriptions = [];
    displayEmptyState("recentPrescriptions", "Lỗi tải dữ liệu");
  }
}

/**
 * Display recent prescriptions
 */
function displayRecentPrescriptions(prescriptions) {
  const container = document.getElementById("recentPrescriptions");

  if (!container) return;

  if (prescriptions.length === 0) {
    displayEmptyStateWithAction(
      "recentPrescriptions",
      "Chưa có đơn thuốc nào",
      "Tạo đơn thuốc đầu tiên",
      () => (window.location.href = "create-prescription.html")
    );
    return;
  }

  const html = prescriptions
    .map(
      (prescription) => `
    <div class="list-item" onclick="viewPrescription('${prescription.id}')">
      <div class="item-info">
        <h4>${prescription.name}</h4>
        <p>${formatDate(prescription.date)} - ${prescription.duration}</p>
        ${
          prescription.medications && prescription.medications.length > 0
            ? `<small class="text-muted">${prescription.medications
                .slice(0, 2)
                .join(", ")}${
                prescription.medications.length > 2 ? "..." : ""
              }</small>`
            : ""
        }
      </div>
      <span class="item-badge ${
        prescription.status === "active" ? "badge-warning" : "badge-success"
      }">
        ${prescription.status === "active" ? "Đang dùng" : "Hoàn thành"}
      </span>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
}

/**
 * Load upcoming appointments - TỪ BLOCKCHAIN
 */
async function loadUpcomingAppointments() {
  try {
    const address = await window.walletAPI.getWalletAddress();

    // KIỂM TRA CONTRACT SERVICE
    if (!window.contractService) {
      console.warn("ContractService not available");
      displayEmptyStateWithAction(
        "upcomingAppointments",
        "Hệ thống blockchain đang khởi tạo",
        "Vui lòng thử lại sau",
        () => handleRefresh()
      );
      return;
    }

    // LOAD DỮ LIỆU THỰC TỪ BLOCKCHAIN
    // (Giả sử có hàm getAppointmentsByPatient)
    try {
      // Hiện tại chưa có contract cho appointments
      // Để mảng rỗng cho chính xác
      const appointments = [];

      if (appointments.length > 0) {
        // Có dữ liệu thực
        DashboardState.upcomingAppointments = appointments.slice(0, 5);
        displayUpcomingAppointments(appointments);
      } else {
        // KHÔNG CÓ DỮ LIỆU - hiển thị empty state
        DashboardState.upcomingAppointments = [];
        displayEmptyStateWithAction(
          "upcomingAppointments",
          "Chưa có lịch hẹn nào",
          "Đặt lịch hẹn đầu tiên",
          () => (window.location.href = "create-appointment.html")
        );
      }
    } catch (blockchainError) {
      console.error(
        "Error loading appointments from blockchain:",
        blockchainError
      );
      DashboardState.upcomingAppointments = [];
      displayEmptyStateWithAction(
        "upcomingAppointments",
        "Lỗi kết nối blockchain",
        "Thử lại",
        () => handleRefresh()
      );
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
    DashboardState.upcomingAppointments = [];
    displayEmptyState("upcomingAppointments", "Lỗi tải dữ liệu");
  }
}

/**
 * Display upcoming appointments
 */
function displayUpcomingAppointments(appointments) {
  const container = document.getElementById("upcomingAppointments");

  if (!container) return;

  if (appointments.length === 0) {
    displayEmptyStateWithAction(
      "upcomingAppointments",
      "Chưa có lịch hẹn nào",
      "Đặt lịch hẹn đầu tiên",
      () => (window.location.href = "create-appointment.html")
    );
    return;
  }

  const html = appointments
    .map(
      (appointment) => `
    <div class="list-item" onclick="viewAppointment('${appointment.id}')">
      <div class="item-info">
        <h4>${appointment.type}</h4>
        <p>${formatDate(appointment.date)} - ${appointment.time} - ${
        appointment.doctor
      }</p>
      </div>
      <span class="item-badge badge-info">Sắp tới</span>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
}

/**
 * Display empty state với action button
 */
function displayEmptyStateWithAction(
  containerId,
  message,
  actionText,
  actionCallback
) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>${message}</p>
      <button onclick="(${actionCallback.toString()})()" class="btn btn-outline btn-sm">
        <i class="fas fa-plus"></i> ${actionText}
      </button>
    </div>
  `;
}

/**
 * Display empty state (giữ nguyên của bạn)
 */
function displayEmptyState(containerId, message) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Setup event listeners (giữ nguyên)
 */
function setupEventListeners() {
  // Disconnect button
  const disconnectBtn = document.getElementById("disconnectBtn");
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", handleDisconnect);
  }

  // Create record button
  const createRecordBtn = document.getElementById("createRecordBtn");
  if (createRecordBtn) {
    createRecordBtn.addEventListener("click", () => {
      window.location.href = "create-medical-record.html";
    });
  }

  // Create prescription button
  const createPrescriptionBtn = document.getElementById(
    "createPrescriptionBtn"
  );
  if (createPrescriptionBtn) {
    createPrescriptionBtn.addEventListener("click", () => {
      window.location.href = "create-prescription.html";
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", handleRefresh);
  }
}

/**
 * Handle disconnect (giữ nguyên)
 */
async function handleDisconnect() {
  const confirmed = confirm("Bạn có chắc muốn ngắt kết nối ví?");

  if (!confirmed) return;

  try {
    showLoading("Đang ngắt kết nối...");
    await window.walletAPI.disconnectWallet();
    hideLoading();
    showToast("Đã ngắt kết nối ví", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    hideLoading();
    console.error("Error disconnecting:", error);
    showToast("Lỗi ngắt kết nối", "error");
  }
}

/**
 * Handle refresh
 */
async function handleRefresh() {
  showToast("Đang làm mới dữ liệu từ blockchain...", "info");
  await loadDashboardData();
  showToast("Đã làm mới dữ liệu blockchain!", "success");
}

/**
 * View record detail
 */
function viewRecord(id) {
  console.log("View record:", id);
  window.location.href = `medical-record-detail.html?id=${id}`;
}

/**
 * View prescription detail
 */
function viewPrescription(id) {
  console.log("View prescription:", id);
  window.location.href = `prescription-detail.html?id=${id}`;
}

/**
 * View appointment detail
 */
function viewAppointment(id) {
  console.log("View appointment:", id);
  window.location.href = `appointment-detail.html?id=${id}`;
}

/**
 * Copy wallet address
 */
function copyWalletAddress() {
  const address = window.currentWalletAddress;
  if (address) {
    copyToClipboard(address, "Đã copy địa chỉ ví!");
  }
}

/**
 * View wallet on explorer
 */
function viewWalletOnExplorer() {
  const address = window.currentWalletAddress;
  if (address) {
    const url = getExplorerAddressUrl(address);
    window.open(url, "_blank");
  }
}

// Thêm các hàm format hỗ trợ
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

function formatCurrency(amount) {
  if (!amount) return "0 SUI";
  return `${parseFloat(amount).toFixed(4)} SUI`;
}

function copyToClipboard(text, message) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(message || "Đã sao chép!", "success");
  });
}

function getExplorerAddressUrl(address) {
  const network = CONFIG?.NETWORK || "testnet";
  return `https://suiexplorer.com/address/${address}?network=${network}`;
}

// ===== AUTO-INITIALIZE =====

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}

console.log("✅ Dashboard script loaded - BLOCKCHAIN MODE");
