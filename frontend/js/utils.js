// utils.js - Utility Functions

class MediChainUtils {
  constructor() {
    this.version = "1.0.0";
  }

  // Format date
  formatDate(date, format = "dd/MM/yyyy") {
    if (!date) return "";

    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");

    switch (format) {
      case "dd/MM/yyyy":
        return `${day}/${month}/${year}`;
      case "yyyy-MM-dd":
        return `${year}-${month}-${day}`;
      case "dd/MM/yyyy HH:mm":
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      default:
        return d.toLocaleDateString();
    }
  }

  // Format address
  formatAddress(address, length = 6) {
    if (!address || typeof address !== "string") return "Not connected";
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  // Generate unique ID
  generateId(prefix = "rec") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate wallet address
  isValidAddress(address) {
    if (!address || typeof address !== "string") return false;
    // Sui address validation - starts with 0x and 64 hex characters
    return /^0x[0-9a-fA-F]{64}$/.test(address);
  }

  // Copy to clipboard
  async copyToClipboard(text) {
    if (!text || typeof text !== "string") return false;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      return successful;
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      return false;
    }
  }

  // Debounce function - FIXED: Use rest parameters instead of arguments
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function - FIXED: Use rest parameters instead of arguments
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Show notification
  showNotification(message, type = "info", duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelector(".medichain-notification");
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `medichain-notification notification-${type}`;

    const icon = this.getNotificationIcon(type);
    const color = this.getNotificationColor(type);

    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

    // Add animation styles if not already present
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                    line-height: 1;
                }
            `;
      document.head.appendChild(style);
    }

    // Add close functionality
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.onclick = () => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    };

    // Auto remove after duration
    const removeTimeout = setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, duration);

    // Clear timeout on hover
    notification.addEventListener("mouseenter", () => {
      clearTimeout(removeTimeout);
    });

    notification.addEventListener("mouseleave", () => {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = "slideOut 0.3s ease";
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        }
      }, 1000);
    });

    // Add to DOM
    document.body.appendChild(notification);

    return notification;
  }

  getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "check-circle";
      case "error":
        return "exclamation-circle";
      case "warning":
        return "exclamation-triangle";
      default:
        return "info-circle";
    }
  }

  getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#4361ee";
    }
  }

  // Parse query parameters
  getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);

    if (!queryString) return params;

    const pairs = queryString.split("&");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }

    return params;
  }

  // Safe JSON parse
  safeJsonParse(str, defaultValue = {}) {
    if (!str || typeof str !== "string") return defaultValue;

    try {
      return JSON.parse(str);
    } catch (error) {
      console.error("JSON parse error:", error);
      return defaultValue;
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (typeof bytes !== "number" || bytes < 0) return "0 Bytes";
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${sizes[i]}`;
  }

  // Validate email
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  // Generate random color from predefined palette
  getRandomColor() {
    const colors = [
      "#4361ee",
      "#3a0ca3",
      "#7209b7",
      "#f72585",
      "#06d6a0",
      "#118ab2",
      "#ef476f",
      "#ffd166",
      "#8338ec",
      "#3a86ff",
      "#fb5607",
      "#ff006e",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Get initials from name
  getInitials(name) {
    if (!name || typeof name !== "string") return "?";

    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  // Check if mobile device
  isMobile() {
    if (typeof navigator === "undefined") return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Check if touch device
  isTouchDevice() {
    if (typeof window === "undefined") return false;

    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  // Sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate avatar element
  createAvatar(name, size = 40) {
    const initials = this.getInitials(name);
    const color = this.getRandomColor();

    const avatar = document.createElement("div");
    avatar.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: ${size * 0.4}px;
        `;
    avatar.textContent = initials;

    return avatar;
  }

  // Capitalize first letter
  capitalize(text) {
    if (!text || typeof text !== "string") return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Truncate text with ellipsis
  truncate(text, maxLength = 100) {
    if (!text || typeof text !== "string") return "";
    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength) + "...";
  }

  // Validate Vietnamese phone number
  isValidVietnamesePhone(phone) {
    if (!phone || typeof phone !== "string") return false;

    const cleaned = phone.replace(/\s+/g, "");
    const regex = /^(0|\+84)(\d{9,10})$/;
    return regex.test(cleaned);
  }

  // Format Vietnamese phone number
  formatVietnamesePhone(phone) {
    if (!this.isValidVietnamesePhone(phone)) return phone;

    const cleaned = phone.replace(/\s+/g, "");
    if (cleaned.startsWith("+84")) {
      return cleaned.replace("+84", "0");
    }

    return cleaned;
  }

  // Get current timestamp
  getTimestamp() {
    return Date.now();
  }

  // Format timestamp to readable date
  timestampToDate(timestamp) {
    return this.formatDate(new Date(timestamp), "dd/MM/yyyy HH:mm");
  }

  // Generate QR code data URL (basic implementation)
  generateQRCodeDataURL(text, size = 128) {
    // Note: This is a simple implementation. For production, use a QR code library
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Simple pattern (for demo only)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.font = "10px Arial";
    ctx.fillText(`QR: ${this.truncate(text, 20)}`, 10, size / 2);

    return canvas.toDataURL("image/png");
  }

  // Check if object is empty
  isEmpty(obj) {
    if (!obj || typeof obj !== "object") return true;
    return Object.keys(obj).length === 0;
  }

  // Deep clone object
  deepClone(obj) {
    if (!obj || typeof obj !== "object") return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects
  mergeObjects(...objects) {
    return objects.reduce((merged, obj) => {
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          merged[key] = obj[key];
        });
      }
      return merged;
    }, {});
  }

  // Remove accents from Vietnamese text
  removeAccents(str) {
    if (!str || typeof str !== "string") return "";

    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  // Search in array of objects
  searchInArray(array, query, fields = []) {
    if (!Array.isArray(array) || !query) return [];

    const normalizedQuery = this.removeAccents(query.toLowerCase());

    return array.filter((item) => {
      if (!item || typeof item !== "object") return false;

      // If fields specified, search only in those fields
      if (fields.length > 0) {
        return fields.some((field) => {
          const value = item[field];
          if (value && typeof value === "string") {
            return this.removeAccents(value.toLowerCase()).includes(
              normalizedQuery
            );
          }
          return false;
        });
      }

      // Otherwise search in all string fields
      return Object.values(item).some((value) => {
        if (value && typeof value === "string") {
          return this.removeAccents(value.toLowerCase()).includes(
            normalizedQuery
          );
        }
        return false;
      });
    });
  }

  // Generate pagination array
  generatePagination(currentPage, totalPages, maxVisible = 5) {
    if (totalPages <= 1) return [];

    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    // Add first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add last page
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }

  // Create loading spinner
  createSpinner(size = 40, color = "#4361ee") {
    const spinner = document.createElement("div");
    spinner.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border: ${size / 10}px solid #f3f3f3;
            border-top: ${size / 10}px solid ${color};
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

    // Add animation if not exists
    if (!document.getElementById("spinner-animation")) {
      const style = document.createElement("style");
      style.id = "spinner-animation";
      style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
      document.head.appendChild(style);
    }

    return spinner;
  }
}

// Create global instance
if (!window.utils) {
  window.utils = new MediChainUtils();
  console.log("✅ MediChain Utilities loaded v" + window.utils.version);
}

// Export for modules (if using modules)
if (typeof module !== "undefined" && module.exports) {
  module.exports = MediChainUtils;
}
