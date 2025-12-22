async function handleGoogleLogin(googleUser) {
  const decoded = jwt_decode(googleUser.credential);

  const user = {
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture || null
  };

  localStorage.setItem("user", JSON.stringify(user));

  const res = await fetch(
    `/api/profile?email=${encodeURIComponent(user.email)}`
  );
  const profile = await res.json();

  window.location.href = profile ? "/builder" : "/profile";
}


function logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      window.location.href = "/";
    }

document.addEventListener("DOMContentLoaded", function() {
    updateAuthUI();
});

function updateAuthUI() {
    // 1. Get User Data
    const savedUser = localStorage.getItem("user");
    const isAuthenticated = savedUser && savedUser !== 'null' && savedUser !== 'undefined';

    const navAuthSection = document.getElementById("nav-auth-section");
    const heroLoginArea = document.getElementById("hero-login-area");
    const heroWelcomeArea = document.getElementById("hero-welcome-area");

    if (isAuthenticated) {
        // --- LOGGED IN STATE ---
        const user = JSON.parse(savedUser);
        
        // Determine display name (First name or Email)
        let displayName = user.email;
        if (user.name) {
            displayName = user.name.split(' ')[0]; // Just get first name
        }

        // A. Update Navbar
        navAuthSection.innerHTML = `
            <div class="user-menu" style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
                <span class="user-badge">${escapeHtml(displayName)}</span>
                <button onclick="handleSignOut()" class="btn-signout">Sign Out</button>
            </div>
        `;

        // B. Update Hero Section (Hide Login, Show "Go to App")
        if (heroLoginArea) heroLoginArea.style.display = 'none';
        if (heroWelcomeArea) heroWelcomeArea.style.display = 'block';

    } else {
        // --- LOGGED OUT STATE ---
        // Ensure Google Sign-In is visible
        if (heroLoginArea) heroLoginArea.style.display = 'block';
        if (heroWelcomeArea) heroWelcomeArea.style.display = 'none';
    }
}

// Security: Basic HTML escaping to prevent XSS in the username
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Logout Function
function handleSignOut() {
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    // Reload page to reset UI to logged-out state
    window.location.reload();
}

// Existing Google Callback (Keep this connected to your current logic)
async function handleGoogleLogin(response) {
    try {
        const data = jwt_decode(response.credential);
        const user = {
            name: data.name,
            email: data.email,
            picture: data.picture
        };
        
        // Save to local storage
        localStorage.setItem("user", JSON.stringify(user));
        
        // Check for existing profile
        const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
        const profile = await res.json();
        
        // Update UI immediately without reload (optional, or just redirect)
        updateAuthUI();
        
        // Redirect based on profile existence
        window.location.href = profile ? "/builder" : "/profile";
        
    } catch (error) {
        console.error("Login failed", error);
    }
}