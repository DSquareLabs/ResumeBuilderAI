// app/static/js/auth.js

document.addEventListener("DOMContentLoaded", function() {
    updateAuthUI();
});

// --- 1. MULTI-TAB SYNC (The "Smart" Logout) ---
// If user logs out in Tab A, Tab B will immediately know and redirect.
window.addEventListener('storage', function(event) {
    if (event.key === 'user' && !event.newValue) {
        // User key was removed (logged out) in another tab
        window.location.href = '/'; 
    }
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
        if (navAuthSection) {
            navAuthSection.innerHTML = `
                <div class="user-menu" style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
                    <span class="user-badge">${escapeHtml(displayName)}</span>
                    <button onclick="handleSignOut()" class="btn-signout">Sign Out</button>
                </div>
            `;
        }

        // B. Update Hero Section (Hide Login, Show "Go to App")
        if (heroLoginArea) heroLoginArea.style.display = 'none';
        if (heroWelcomeArea) heroWelcomeArea.style.display = 'block';

    } else {
        // --- LOGGED OUT STATE ---
        if (navAuthSection) {
            // Restore Google Button container if needed
             navAuthSection.innerHTML = `
                <div class="g_id_signin"
                     data-type="standard"
                     data-size="medium"
                     data-theme="filled_blue"
                     data-text="signin"
                     data-shape="rectangular"
                     data-logo_alignment="left">
                </div>
            `;
        }
        
        if (heroLoginArea) heroLoginArea.style.display = 'block';
        if (heroWelcomeArea) heroWelcomeArea.style.display = 'none';
    }
}

// Security: Basic HTML escaping to prevent XSS
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- 2. LOGOUT WITH TOAST (The "Cool" Logout) ---
function handleSignOut() {
    // 1. Show the toast
    if (window.showToast) {
        window.showToast("Logging out... See you soon! 👋", "info");
    }

    // 2. Wait 800ms so they can read it, then kill the session
    setTimeout(() => {
        logout(); // Calls the clean logout function in common.js or below
    }, 800);
}

// The actual data cleanup
function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    localStorage.removeItem("currentProfile");
    window.location.href = "/";
}

// Existing Google Callback 
async function handleGoogleLogin(response) {
    try {
        const data = jwt_decode(response.credential);
        localStorage.setItem("user", JSON.stringify({
            name: data.name,
            email: data.email,
            picture: data.picture,
            token: response.credential 
        }));
        
        // Show success toast if available
        if (window.showToast) window.showToast("Signed in successfully!", "success");

        // Validate with backend
        const res = await fetch("/api/profile", {
            headers: {
                "Authorization": `Bearer ${response.credential}`
            }
        });

        if (res.ok) {
            const profile = await res.json();
            
            // Redirect based on whether profile exists
            if (profile && profile.email) {
                setTimeout(() => window.location.href = "/builder", 500);
            } else {
                setTimeout(() => window.location.href = "/profile", 500);
            }
        } else {
            console.error("Server check failed");
            window.location.href = "/profile";
        }
        
    } catch (error) {
        console.error("Login logic failed", error);
        window.location.href = "/profile";
    }
}