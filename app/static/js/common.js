document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }
});


// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'error') icon = 'error_outline';

  toast.innerHTML = `
    <span class="material-icons-round">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Replace standard alerts with this globally accessible function
window.showToast = showToast;


// --- CUSTOM MODAL/POPUP SYSTEM ---
function showConfirmDialog(title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    `;

    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'modal-dialog';
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease-out;
    `;

    // Title
    const titleEl = document.createElement('h2');
    titleEl.style.cssText = `
      font-size: 1.5rem;
      font-weight: 700;
      color: #191919;
      margin-bottom: 12px;
      margin-top: 0;
    `;
    titleEl.textContent = title;

    // Message
    const messageEl = document.createElement('p');
    messageEl.style.cssText = `
      font-size: 1rem;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
      white-space: pre-wrap;
    `;
    messageEl.textContent = message;

    // Actions container
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.style.cssText = `
      padding: 12px 28px;
      border: 1px solid #ddd;
      background: #f5f5f5;
      color: #333;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
    `;
    cancelBtn.addEventListener('mouseover', () => {
      cancelBtn.style.background = '#e8e8e8';
    });
    cancelBtn.addEventListener('mouseout', () => {
      cancelBtn.style.background = '#f5f5f5';
    });
    cancelBtn.addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      modal.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve(false);
      }, 300);
    });

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    const confirmBg = isDangerous ? '#ff6b6b' : '#0a66c2';
    const confirmHover = isDangerous ? '#ff5252' : '#004182';
    confirmBtn.style.cssText = `
      padding: 12px 28px;
      border: none;
      background: ${confirmBg};
      color: white;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
    `;
    confirmBtn.addEventListener('mouseover', () => {
      confirmBtn.style.background = confirmHover;
      confirmBtn.style.transform = 'translateY(-2px)';
    });
    confirmBtn.addEventListener('mouseout', () => {
      confirmBtn.style.background = confirmBg;
      confirmBtn.style.transform = 'translateY(0)';
    });
    confirmBtn.addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      modal.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve(true);
      }, 300);
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add animations to document if not already there
    if (!document.getElementById('modal-animations')) {
      const style = document.createElement('style');
      style.id = 'modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(30px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Focus on confirm button
    confirmBtn.focus();
  });
}

window.showConfirmDialog = showConfirmDialog;

function logout() {
  // Clear all user-related data
  localStorage.removeItem("user");
  localStorage.removeItem("profile");
  localStorage.removeItem("currentProfile");

  // Clear all auto-saved content
  localStorage.removeItem("autosave_resume");
  localStorage.removeItem("autosave_cl");
  localStorage.removeItem("autosave_score");

  // Clear all draft data
  localStorage.removeItem("draft_resumeText");
  localStorage.removeItem("draft_jobDescription");
  localStorage.removeItem("draft_styleSelect");
  localStorage.removeItem("draft_color");
  localStorage.removeItem("target_role");
  // Clear UI preferences
  localStorage.removeItem("hide_desktop_nudge");

  // Reset global variables
  if (typeof currentUser !== 'undefined') currentUser = null;
  if (typeof currentProfile !== 'undefined') currentProfile = null;

  window.location.href = "/";
}

window.addEventListener('storage', function(event) {
  if (event.key === 'user' && !event.newValue) {
    console.log("Logged out in another tab. Redirecting...");
    window.location.href = '/'; 
  }
});



// Add this to app/static/js/auth.js

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        // buffer of 10 seconds
        return payload.exp < (currentTime + 10); 
    } catch (e) {
        return true; // If we can't read it, it's bad.
    }
}

function checkSession() {
    const savedUser = localStorage.getItem("user");
    
    if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        try {
            const user = JSON.parse(savedUser);
            const token = user.token;
            
            if (token && isTokenExpired(token)) {
                console.warn("Session expired. Logging out...");
                logout(); // Call the existing logout function
            }
        } catch (e) {
            console.error("Error parsing user data:", e);
            logout(); // If we can't parse user data, log out
        }
    }
}

// Run this immediately on page load
document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    
    // Also run periodic check every 5 minutes to catch expired tokens during active sessions
    setInterval(checkSession, 5 * 60 * 1000);
});

// In app/static/js/common.js

async function authorizedFetch(url, options = {}) {
    // Get token from user object, not google_token
    const savedUser = localStorage.getItem("user");
    let token = null;
    
    if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        try {
            const user = JSON.parse(savedUser);
            token = user.token;
        } catch (e) {
            console.error("Error parsing user data for token:", e);
        }
    }
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // THE FIX: Catch 401 (Unauthorized) errors globally
        if (response.status === 401 || response.status === 403) {
            console.error("Token invalid or expired. Forcing logout.");
            // Show a nice alert before reloading
            if (window.showToast) {
                window.showToast("Your session has expired. Please sign in again.", "error");
            }
            setTimeout(() => {
                logout();
            }, 1500);
            return null;
        }

        return response;
    } catch (error) {
        // NETWORK ERROR HANDLING: Log out and return to home on network errors
        console.error("Network error occurred:", error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // This is likely a network connectivity issue
            showToast("Network error. Logging out for security...", "error");
            setTimeout(() => {
                logout();
            }, 1500);
        }
        throw error;
    }
}

// Enhanced fetch wrapper with network error handling for non-authenticated requests
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        // NETWORK ERROR HANDLING: Log out and return to home on network errors
        console.error("Network error occurred:", error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // This is likely a network connectivity issue
            showToast("Network error. Logging out for security...", "error");
            setTimeout(() => {
                logout();
            }, 1500);
        }
        throw error;
    }
}