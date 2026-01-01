// app/static/js/auth.js

document.addEventListener("DOMContentLoaded", function() {
    updateAuthUI();
});

// --- 1. MULTI-TAB SYNC (The "Smart" Logout) ---
window.addEventListener('storage', function(event) {
    if (event.key === 'user' && !event.newValue) {
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

        // A. Update Navbar (Home Page & Pricing Page)
        if (navAuthSection) {
            navAuthSection.innerHTML = `
                <div class="user-menu" style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
                    <a href="/profile" class="user-badge" title="Go to Profile" 
                       style="text-decoration: none; cursor: pointer; color: inherit; font-weight: 600;">
                        ${escapeHtml(displayName)}
                    </a>
                    <button onclick="handleSignOut()" class="btn-signout">Sign Out</button>
                </div>
            `;
        }

        // B. Update Hero Section (Hide Login, Show "Go to App")
        if (heroLoginArea) heroLoginArea.style.display = 'none';
        if (heroWelcomeArea) heroWelcomeArea.style.display = 'block';

    } else {
        
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
    if (window.showToast) {
        window.showToast("Logging out... See you soon! 👋", "info");
    }

    setTimeout(() => {
        logout(); 
    }, 800);
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
        
        if (window.showToast) window.showToast("Signed in successfully!", "success");

        const res = await authorizedFetch("/api/profile", {
            headers: {
                "Authorization": `Bearer ${response.credential}`
            }
        });

        if (!res) return; // Network error handled by authorizedFetch

        if (res.ok) {
            const profile = await res.json();
            
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