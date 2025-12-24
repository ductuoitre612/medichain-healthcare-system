// dashboard.js - Dashboard Page Logic

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

    // Load dashboard data
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
 * Load dashboard data
 */
async function loadDashboardData() {
  DashboardState.loading = true;
  showLoading("Đang tải dữ liệu...");

  try {
    // Load all data in parallel
    await Promise.all([
      loadStats(),
      loadRecentRecords(),
      loadRecentPrescriptions(),
      loadUpcomingAppointments(),
    ]);

    console.log("✅ Dashboard data loaded");
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    showToast("Lỗi tải dữ liệu", "error");
  } finally {
    DashboardState.loading = false;
    hideLoading();
  }
}

/**
 * Load statistics
 */
async function loadStats() {
  try {
    // TODO: Call blockchain to get real stats
    // For now, use mock data

    const mockStats = {
      totalRecords: 12,
      totalPrescriptions: 8,
      totalAppointments: 3,
      totalDoctors: 5,
    };

    DashboardState.stats = mockStats;
    displayStats(mockStats);
  } catch (error) {
    console.error("Error loading stats:", error);
    // Use default values
    displayStats(DashboardState.stats);
  }
}

/**
 * Display statistics
 */
function displayStats(stats) {
  document.getElementById("totalRecords").textContent = stats.totalRecords;
  document.getElementById("totalPrescriptions").textContent =
    stats.totalPrescriptions;
  document.getElementById("totalAppointments").textContent =
    stats.totalAppointments;
  document.getElementById("totalDoctors").textContent = stats.totalDoctors;
}

/**
 * Load recent medical records
 */
async function loadRecentRecords() {
  try {
    // TODO: Call blockchain to get real data
    // For now, use mock data

    const mockRecords = [
      {
        id: "1",
        date: "2024-12-15",
        diagnosis: "Khám tổng quát",
        doctor: "BS. Nguyễn Văn A",
        status: "completed",
      },
      {
        id: "2",
        date: "2024-12-10",
        diagnosis: "Tái khám tim mạch",
        doctor: "BS. Trần Thị B",
        status: "completed",
      },
      {
        id: "3",
        date: "2024-12-05",
        diagnosis: "Xét nghiệm máu",
        doctor: "BS. Lê Văn C",
        status: "completed",
      },
    ];

    DashboardState.recentRecords = mockRecords;
    displayRecentRecords(mockRecords);
  } catch (error) {
    console.error("Error loading records:", error);
    displayEmptyState("recentRecords", "Chưa có bệnh án nào");
  }
}

/**
 * Display recent records
 */
function displayRecentRecords(records) {
  const container = document.getElementById("recentRecords");

  if (!container) return;

  if (records.length === 0) {
    displayEmptyState("recentRecords", "Chưa có bệnh án nào");
    return;
  }

  const html = records
    .map(
      (record) => `
    <div class="list-item" onclick="viewRecord('${record.id}')">
      <div class="item-info">
        <h4>${record.diagnosis}</h4>
        <p>${formatDate(record.date)} - ${record.doctor}</p>
      </div>
      <span class="item-badge badge-success">Hoàn thành</span>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
}

/**
 * Load recent prescriptions
 */
async function loadRecentPrescriptions() {
  try {
    // TODO: Call blockchain to get real data

    const mockPrescriptions = [
      {
        id: "1",
        date: "2024-12-15",
        name: "Đơn thuốc huyết áp",
        duration: "30 ngày",
        status: "active",
      },
      {
        id: "2",
        date: "2024-12-10",
        name: "Thuốc kháng sinh",
        duration: "7 ngày",
        status: "completed",
      },
      {
        id: "3",
        date: "2024-12-01",
        name: "Vitamin tổng hợp",
        duration: "60 ngày",
        status: "active",
      },
    ];

    DashboardState.recentPrescriptions = mockPrescriptions;
    displayRecentPrescriptions(mockPrescriptions);
  } catch (error) {
    console.error("Error loading prescriptions:", error);
    displayEmptyState("recentPrescriptions", "Chưa có đơn thuốc nào");
  }
}

/**
 * Display recent prescriptions
 */
function displayRecentPrescriptions(prescriptions) {
  const container = document.getElementById("recentPrescriptions");

  if (!container) return;

  if (prescriptions.length === 0) {
    displayEmptyState("recentPrescriptions", "Chưa có đơn thuốc nào");
    return;
  }

  const html = prescriptions
    .map(
      (prescription) => `
    <div class="list-item" onclick="viewPrescription('${prescription.id}')">
      <div class="item-info">
        <h4>${prescription.name}</h4>
        <p>${formatDate(prescription.date)} - ${prescription.duration}</p>
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
 * Load upcoming appointments
 */
async function loadUpcomingAppointments() {
  try {
    // TODO: Call blockchain to get real data

    const mockAppointments = [
      {
        id: "1",
        date: "2024-12-25",
        time: "09:00",
        type: "Khám tim mạch",
        doctor: "BS. Nguyễn Văn A",
      },
      {
        id: "2",
        date: "2024-12-28",
        time: "14:00",
        type: "Tái khám",
        doctor: "BS. Trần Thị B",
      },
      {
        id: "3",
        date: "2025-01-02",
        time: "08:30",
        type: "Xét nghiệm định kỳ",
        doctor: "BS. Lê Văn C",
      },
    ];

    DashboardState.upcomingAppointments = mockAppointments;
    displayUpcomingAppointments(mockAppointments);
  } catch (error) {
    console.error("Error loading appointments:", error);
    displayEmptyState("upcomingAppointments", "Chưa có lịch hẹn nào");
  }
}

/**
 * Display upcoming appointments
 */
function displayUpcomingAppointments(appointments) {
  const container = document.getElementById("upcomingAppointments");

  if (!container) return;

  if (appointments.length === 0) {
    displayEmptyState("upcomingAppointments", "Chưa có lịch hẹn nào");
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
 * Display empty state
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
 * Setup event listeners
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
 * Handle disconnect
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
  showToast("Đang làm mới dữ liệu...", "info");
  await loadDashboardData();
  showToast("Đã làm mới!", "success");
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

// ===== AUTO-INITIALIZE =====

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}

console.log("✅ Dashboard script loaded");
