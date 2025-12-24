// medical-record.js - Medical Record Form Logic

// ===== STATE =====

let selectedFiles = [];
let currentTxHash = null;
let currentAccount = null;

// ===== INITIALIZATION =====

/**
 * Initialize medical record form
 */
async function initMedicalRecordForm() {
  console.log("📋 Initializing medical record form...");

  try {
    // Initialize Slush Wallet
    await initializeSlushWallet();

    // Set default date to today
    const visitDateInput = document.getElementById("visitDate");
    if (visitDateInput) {
      visitDateInput.valueAsDate = new Date();
    }

    // Setup form event listener
    setupFormSubmitHandler();

    console.log("✅ Medical record form initialized");
  } catch (error) {
    console.error("❌ Error initializing form:", error);
  }
}

/**
 * Initialize Slush Wallet connection
 */
async function initializeSlushWallet() {
  try {
    // Check if Slush Wallet is installed
    if (!window.slush) {
      console.warn("⚠️ Slush Wallet not detected");
      showWalletNotInstalledWarning();
      return false;
    }

    // Get account
    const account = await window.slush.getAccount();

    if (account && account.address) {
      currentAccount = account.address;
      displayWalletAddress(currentAccount);
      console.log("✅ Connected to wallet:", currentAccount);
      return true;
    } else {
      // Request connection
      const result = await window.slush.connect();
      if (result && result.address) {
        currentAccount = result.address;
        displayWalletAddress(currentAccount);
        return true;
      }
    }
  } catch (error) {
    console.error("❌ Error connecting to Slush Wallet:", error);
    showWalletError(error.message);
  }
  return false;
}

/**
 * Display wallet address
 */
function displayWalletAddress(address) {
  const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);
  const walletBadge = document.getElementById("walletBadge");
  if (walletBadge) {
    walletBadge.textContent = shortAddress;
  }
}

/**
 * Show wallet not installed warning
 */
function showWalletNotInstalledWarning() {
  const banner = document.createElement("div");
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4757;
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    ⚠️ Chưa phát hiện Slush Wallet! 
    <a href="https://chromewebstore.google.com/detail/slush-sui-wallet/hioeanlpnkenjbhejaecmjpopolgnffl" 
       target="_blank" 
       style="color: white; text-decoration: underline; margin-left: 10px;">
       Cài đặt ngay
    </a>
  `;
  document.body.appendChild(banner);

  // Use mock data for testing
  displayWalletAddress("0x1234567890abcdef1234567890abcdef12345678");
}

/**
 * Show wallet error
 */
function showWalletError(message) {
  alert("Lỗi kết nối Slush Wallet: " + message);
}

// ===== DIAGNOSIS MANAGEMENT =====

/**
 * Add diagnosis field
 */
function addDiagnosis() {
  const diagnosisList = document.getElementById("diagnosisList");
  if (!diagnosisList) return;

  const newItem = document.createElement("div");
  newItem.className = "diagnosis-item";
  newItem.innerHTML = `
    <input type="text" placeholder="Nhập chẩn đoán..." class="diagnosis-input" />
    <button type="button" class="remove-btn" onclick="removeDiagnosis(this)">✕</button>
  `;
  diagnosisList.appendChild(newItem);
}

/**
 * Remove diagnosis field
 */
function removeDiagnosis(btn) {
  btn.parentElement.remove();
}

// ===== FILE MANAGEMENT =====

/**
 * Handle file selection
 */
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  selectedFiles = [...selectedFiles, ...files];
  displayFiles();
}

/**
 * Display selected files
 */
function displayFiles() {
  const fileList = document.getElementById("fileList");
  if (!fileList) return;

  fileList.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
      <div class="file-info">
        <span>📄</span>
        <span>${file.name} (${formatFileSize(file.size)})</span>
      </div>
      <button type="button" class="remove-btn" onclick="removeFile(${index})">✕</button>
    `;
    fileList.appendChild(fileItem);
  });
}

/**
 * Remove file
 */
function removeFile(index) {
  selectedFiles.splice(index, 1);
  displayFiles();
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ===== FORM HANDLING =====

/**
 * Setup form submit handler
 */
function setupFormSubmitHandler() {
  const form = document.getElementById("medicalRecordForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Collect form data
    const formData = collectFormData();

    // Validate
    if (!validateForm(formData)) {
      return;
    }

    // Show loading
    showLoading(true);

    try {
      // Call smart contract
      const txHash = await createMedicalRecord(formData);

      // Show success
      showLoading(false);
      showSuccess(txHash);
    } catch (error) {
      showLoading(false);
      alert("Lỗi: " + error.message);
      console.error("❌ Error creating medical record:", error);
    }
  });
}

/**
 * Collect form data
 */
function collectFormData() {
  // Collect diagnoses
  const diagnosisInputs = document.querySelectorAll(".diagnosis-input");
  const diagnoses = Array.from(diagnosisInputs)
    .map((input) => input.value.trim())
    .filter((val) => val !== "");

  return {
    patientId: document.getElementById("patientId")?.value.trim() || "",
    patientName: document.getElementById("patientName")?.value.trim() || "",
    dateOfBirth: document.getElementById("dateOfBirth")?.value || "",
    gender: document.getElementById("gender")?.value || "",
    doctorId: document.getElementById("doctorId")?.value.trim() || "",
    doctorName: document.getElementById("doctorName")?.value.trim() || "",
    visitDate: document.getElementById("visitDate")?.value || "",
    visitType: document.getElementById("visitType")?.value || "",
    symptoms: document.getElementById("symptoms")?.value.trim() || "",
    diagnoses: diagnoses,
    treatment: document.getElementById("treatment")?.value.trim() || "",
    notes: document.getElementById("notes")?.value.trim() || "",
    files: selectedFiles,
  };
}

/**
 * Validate form
 */
function validateForm(data) {
  if (!data.patientId || !data.patientId.startsWith("0x")) {
    alert("Vui lòng nhập ID bệnh nhân hợp lệ (bắt đầu bằng 0x)");
    return false;
  }
  if (!data.doctorId || !data.doctorId.startsWith("0x")) {
    alert("Vui lòng nhập ID bác sĩ hợp lệ (bắt đầu bằng 0x)");
    return false;
  }
  if (data.diagnoses.length === 0) {
    alert("Vui lòng nhập ít nhất một chẩn đoán");
    return false;
  }
  return true;
}

// ===== BLOCKCHAIN INTERACTION =====

/**
 * Create medical record on blockchain
 */
async function createMedicalRecord(data) {
  console.log("📝 Creating medical record with data:", data);

  // Check if wallet is connected
  if (!currentAccount && !window.slush) {
    console.log("⚠️ Slush Wallet not available, using mock transaction");
    return await mockBlockchainTransaction(data);
  }

  try {
    // Prepare transaction data
    const functionName = `${CONFIG.PACKAGE_ID}::${CONFIG.MODULES.MEDICAL_RECORD}::create_record`;

    console.log("🔗 Calling function:", functionName);
    console.log("📊 With arguments:", {
      patient_registry: CONFIG.PATIENT_REGISTRY_ID,
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      symptoms: data.symptoms,
      diagnosis: data.diagnoses.join("; "),
      treatment: data.treatment || "",
      visit_date: new Date(data.visitDate).getTime(),
      notes: data.notes || "",
    });

    // Build transaction block
    const txb = {
      kind: "moveCall",
      data: {
        packageObjectId: CONFIG.PACKAGE_ID,
        module: CONFIG.MODULES.MEDICAL_RECORD,
        function: "create_record",
        typeArguments: [],
        arguments: [
          CONFIG.PATIENT_REGISTRY_ID, // patient_registry
          data.patientId, // patient_id
          data.doctorId, // doctor_id
          data.symptoms, // symptoms (string)
          data.diagnoses.join("; "), // diagnosis (string)
          data.treatment || "", // treatment (string)
          String(new Date(data.visitDate).getTime()), // visit_date (u64 as string)
          data.notes || "", // notes (string)
        ],
        gasBudget: 10000000, // 0.01 SUI
      },
    };

    // Sign and execute transaction with Slush Wallet
    console.log("✍️ Requesting signature from Slush Wallet...");

    const result = await window.slush.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    console.log("✅ Transaction result:", result);

    // Get transaction digest
    const txDigest = result.digest || result.effects?.transactionDigest;

    if (!txDigest) {
      throw new Error("Transaction digest not found in result");
    }

    // Log created objects
    if (result.objectChanges) {
      const createdObjects = result.objectChanges.filter(
        (change) => change.type === "created"
      );
      console.log("📦 Created objects:", createdObjects);
    }

    return txDigest;
  } catch (error) {
    console.error("❌ Blockchain transaction error:", error);

    // Check for specific error types
    if (error.message && error.message.includes("User rejected")) {
      throw new Error("Bạn đã từ chối giao dịch trong Slush Wallet");
    } else if (error.message && error.message.includes("Insufficient")) {
      throw new Error(
        "Không đủ SUI để thực hiện giao dịch. Vui lòng nạp thêm SUI vào ví."
      );
    } else {
      throw new Error("Lỗi blockchain: " + error.message);
    }
  }
}

/**
 * Mock blockchain transaction for testing
 */
async function mockBlockchainTransaction(data) {
  console.log("=== MOCK BLOCKCHAIN TRANSACTION ===");
  console.log(
    "Function:",
    `${CONFIG.PACKAGE_ID}::${CONFIG.MODULES.MEDICAL_RECORD}::create_record`
  );
  console.log("Arguments:", {
    patient_registry: CONFIG.PATIENT_REGISTRY_ID,
    patient_id: data.patientId,
    doctor_id: data.doctorId,
    symptoms: data.symptoms,
    diagnosis: data.diagnoses.join("; "),
    treatment: data.treatment || "",
    visit_date: new Date(data.visitDate).getTime(),
    notes: data.notes || "",
  });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock transaction hash
  const txHash =
    "0x" +
    Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");

  console.log("Mock Transaction Hash:", txHash);
  console.log("=== END MOCK TRANSACTION ===");

  return txHash;
}

// ===== UI HELPERS =====

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  if (overlay) {
    overlay.style.display = show ? "flex" : "none";
  }

  if (submitBtn) {
    submitBtn.disabled = show;
  }
}

/**
 * Show success modal
 */
function showSuccess(txHash) {
  currentTxHash = txHash;

  const txHashEl = document.getElementById("txHash");
  if (txHashEl) {
    txHashEl.textContent =
      "Transaction: " + txHash.slice(0, 10) + "..." + txHash.slice(-8);
  }

  const successModal = document.getElementById("successModal");
  if (successModal) {
    successModal.style.display = "flex";
  }
}

/**
 * View on explorer
 */
function viewOnExplorer() {
  if (currentTxHash) {
    window.open(`${CONFIG.EXPLORER_URL}/tx/${currentTxHash}`, "_blank");
  }
}

/**
 * Back to dashboard
 */
function backToDashboard() {
  window.location.href = "dashboard.html";
}

/**
 * Go back
 */
function goBack() {
  if (confirm("Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.")) {
    window.history.back();
  }
}

// ===== AUTO-INITIALIZE =====

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMedicalRecordForm);
} else {
  initMedicalRecordForm();
}

console.log("✅ Medical record script loaded");
