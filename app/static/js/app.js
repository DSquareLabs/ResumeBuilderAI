/*************************************************
 * GLOBAL STATE
 *************************************************/
let currentUser = null;
let currentProfile = null;

/*************************************************
 * LOAD USER + PROFILE (ON PAGE LOAD)
 *************************************************/
async function loadUserProfile() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    if (window.location.pathname !== "/pricing") {
      window.location.href = "/";
    }
    return;
  }

  currentUser = JSON.parse(storedUser);

  if (!currentUser.email) {
    console.error("User email missing");
    window.location.href = "/";
    return;
  }

  try {
    const res = await fetch(
      `/api/profile?email=${encodeURIComponent(currentUser.email)}`
    );

    if (!res.ok) {
      console.error("Failed to load profile");
      return;
    }

    currentProfile = await res.json();

    // Show credits
    const creditEl = document.getElementById("creditCount");
    if (creditEl) {
      creditEl.innerText = currentProfile.credits ?? 0;
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

window.onload = loadUserProfile;

/*************************************************
 * LOADING FUNCTIONS
 *************************************************/
function startGenerate() {
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-round">hourglass_empty</span> Generating...';
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function finishGenerate() {
  const btn = document.getElementById('generateBtn');
  btn.disabled = false;
  btn.innerHTML = '<span class="material-icons-round">auto_awesome</span> Generate';
  document.getElementById('loadingOverlay').style.display = 'none';
}

/*************************************************
 * GENERATE RESUME
 *************************************************/
async function generateResume() {
  startGenerate();

  const resumeText = document.getElementById("resumeText").value.trim();
  const jobDescription = document.getElementById("jobDescription").value.trim();
  const style = document.getElementById("styleSelect")?.value || "harvard";

  if (!resumeText || !jobDescription) {
    alert("Please provide both resume text and job description.");
    finishGenerate();
    return;
  }

  // Auth check
  if (!currentUser || !currentUser.email) {
    alert("Session expired. Please login again.");
    window.location.href = "/";
    finishGenerate();
    return;
  }

  // Credit check (frontend UX only – backend enforces too)
  if (!currentProfile || currentProfile.credits <= 0) {
    showCreditPopup();
    finishGenerate();
    return;
  }

  try {
    const response = await fetch("/api/generate-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        style: style,
        resume_text: resumeText,
        job_description: jobDescription,

        // profile data
        full_name: currentProfile.full_name || currentUser.name || "",
        email: currentUser.email,
        phone: currentProfile.phone || "",
        location: currentProfile.location || "",
        linkedin: currentProfile.linkedin || "",
        portfolio: currentProfile.portfolio || ""
      })
    });

    const data = await response.json();

    if (!response.ok || !data.resume_html) {
      alert("Failed to generate resume");
      console.error(data);
      finishGenerate();
      return;
    }

    // Deduct credit locally for instant UX
    currentProfile.credits -= 1;
    const creditEl = document.getElementById("creditCount");
    if (creditEl) {
      creditEl.innerText = currentProfile.credits;
    }

    // Render resume
    document.getElementById("output").innerHTML = data.resume_html;
    document.getElementById("output").contentEditable = true;


    // ATS Score
    if (data.ats_score !== undefined) {
      const atsScoreEl = document.getElementById("atsScore");
      if (atsScoreEl) {
        atsScoreEl.innerText = data.ats_score;
        const level = data.ats_score >= 80 ? "high" : data.ats_score >= 60 ? "medium" : "low";
        atsScoreEl.parentElement.className = `score-circle ${level}`;  // Set class on the circle
        updateGauge(data.ats_score);  // Update the visual gauge
      }
    }

    document.getElementById("output").scrollIntoView({ behavior: "smooth" });

    const refineBar = document.getElementById("aiRefineBar");
    if (refineBar) {
        refineBar.style.display = "block"; 
    }
      
    finishGenerate();

  } catch (err) {
    console.error("Resume generation error:", err);
    alert("Something went wrong while generating resume.");
    finishGenerate();
  }
}

/*************************************************
 * CREDIT POPUP
 *************************************************/
function showCreditPopup() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const popup = document.createElement("div");
  popup.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;

  popup.innerHTML = `
    <h2 style="color:#dc3545;margin-bottom:15px;">⚠️ Out of Credits</h2>
    <p style="margin-bottom:20px;color:#555;">
      You need credits to generate resumes.
    </p>
    <button id="buyCreditsBtn"
      style="background:#007bff;color:white;border:none;padding:12px 24px;border-radius:6px;font-size:16px;margin-right:10px;">
      Buy Credits
    </button>
    <button id="closePopupBtn"
      style="background:#6c757d;color:white;border:none;padding:12px 24px;border-radius:6px;font-size:16px;">
      Close
    </button>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  document.getElementById("buyCreditsBtn").onclick = () => {
    window.location.href = "/pricing";
  };

  document.getElementById("closePopupBtn").onclick = () => {
    document.body.removeChild(overlay);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
}


/*************************************************
 * UPDATE RESUME WITH AI (Refine)
 *************************************************/
async function updateResumeWithAI() {
  const inputEl = document.querySelector('.refine-input');
  const instruction = inputEl.value.trim();
  
  if (!instruction) return; // Don't send empty requests

  // 1. Credit Check (0.5 Credits)
  if (!currentProfile || currentProfile.credits < 0.5) {
    showCreditPopup();
    return;
  }

  // 2. UI Loading State (Spin the arrow)
  const btn = document.querySelector('.btn-refine-send');
  const originalIcon = btn.innerHTML;
  btn.innerHTML = '<span class="material-icons-round">hourglass_empty</span>';
  btn.disabled = true;
  inputEl.disabled = true;

  try {
    const currentHTML = document.getElementById('output').innerHTML;

    // 3. Send to Backend
    // Note: You need to create this endpoint in your Python/Node backend
    const response = await fetch("/api/refine-resume", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: currentHTML,
        instruction: instruction,
        email: currentUser.email
      })
    });

    const data = await response.json();

    if (!response.ok || !data.updated_html) {
      throw new Error(data.error || "Failed to update");
    }

    // 4. Update the Resume
    document.getElementById('output').innerHTML = data.updated_html;
    
    // 5. Deduct 0.5 Credits
  currentProfile.credits = data.credits_left;
  document.getElementById("creditCount").innerText = data.credits_left;


    // 6. Success Feedback
    inputEl.value = ''; // Clear input
    btn.style.background = "#10B981"; // Green flash
    setTimeout(() => { 
        btn.style.background = ""; // Reset color
    }, 1000);

  } catch (err) {
    console.error("Refine error:", err);
    alert("Could not update resume. Please try again.");
  } finally {
    // Reset UI
    btn.innerHTML = originalIcon;
    btn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
  }
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("profile");
  localStorage.removeItem("currentProfile");
  window.location.href = "/";
}

/*************************************************
 * COVER LETTER FUNCTIONALITY
 *************************************************/
 
// --- STATE ---
let activeView = 'resume'; // 'resume' | 'coverletter'

// --- VIEW SWITCHING ---
function switchView(view) {
    activeView = view;
    
    // 1. Update Tabs
    document.querySelectorAll('.view-tab').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // 2. Update Content Areas
    const resumeEl = document.getElementById('output');
    const clEl = document.getElementById('output-cl');
    const atsContainer = document.getElementById('atsContainer');
    const mainBtn = document.getElementById('generateBtn');

    if (view === 'resume') {
        resumeEl.style.display = 'block';
        clEl.style.display = 'none';
        atsContainer.style.opacity = '1'; // Show ATS score
        
        // Update Main Button Text
        mainBtn.innerHTML = '<span class="material-icons-round">auto_awesome</span> Generate Resume';
        mainBtn.onclick = generateResume;
    } else {
        resumeEl.style.display = 'none';
        clEl.style.display = 'block';
        atsContainer.style.opacity = '0'; // Hide ATS score (less relevant for CL)

        // Update Main Button Text
        mainBtn.innerHTML = '<span class="material-icons-round">mail</span> Generate Cover Letter';
        mainBtn.onclick = openCLModal; // Below Function is defined next
    }
}

// --- MODAL HANDLING ---
function openCLModal() {
    // Basic validation before opening
    const jobDesc = document.getElementById("jobDescription").value.trim();
    if(!jobDesc) { alert("Please paste a Job Description first."); return; }
    
    document.getElementById('clModal').style.display = 'flex';
}

function closeCLModal() {
    document.getElementById('clModal').style.display = 'none';
}

// --- GENERATE COVER LETTER API CALL ---
async function submitCoverLetterGen() {
    closeCLModal();
    startGenerate(); // Reuse existing loader

    const resumeText = document.getElementById("resumeText").value.trim();
    const jobDescription = document.getElementById("jobDescription").value.trim();
    const style = document.getElementById("styleSelect").value;
    
    // Modal Inputs
    const manager = document.getElementById("clManager").value;
    const motivation = document.getElementById("clMotivation").value;
    const highlight = document.getElementById("clHighlight").value;

    try {
        const response = await fetch("/api/generate-cover-letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: currentUser.email,
                style: "professional, concise, one-page format", // Fixed style for CL
                resume_text: resumeText,
                job_description: jobDescription,
                hiring_manager: manager,
                motivation: motivation,
                highlight: highlight
            })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);

        // Deduct Credit & Update UI
        currentProfile.credits = data.credits_left;
        document.getElementById("creditCount").innerText = currentProfile.credits;

        // Render HTML
        document.getElementById("output-cl").innerHTML = data.cover_letter_html;
        document.getElementById("output-cl").contentEditable = true; // Allow manual edits
        
        // Show Refine Bar
        document.getElementById("aiRefineBar").style.display = "block";

    } catch (err) {
        console.error(err);
        alert("Error generating cover letter");
    } finally {
        finishGenerate();
    }
}

// --- UNIFIED REFINE HANDLER ---
async function handleRefine() {
    if (activeView === 'resume') {
        updateResumeWithAI(); // Existing function
    } else {
        updateCoverLetterWithAI(); // New function similar to updateResumeWithAI
    }
}

async function updateCoverLetterWithAI() {
    // Implementation matches updateResumeWithAI but points to document.getElementById('output-cl')
    // and calls /api/refine-cover-letter
    const inputEl = document.getElementById('refineInput');
    const instruction = inputEl.value.trim();
    if (!instruction) return;

    // ... (Credit checks same as existing) ...

    try {
        const currentHTML = document.getElementById('output-cl').innerHTML;
        const res = await fetch("/api/refine-resume", { // Reuse endpoint or new one
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                 email: currentUser.email,
                 html: currentHTML,
                 instruction: instruction,
                 type: "cover_letter" // Add this flag to backend
             })
        });
        const data = await res.json();
        document.getElementById('output-cl').innerHTML = data.updated_html;
        
        // Clear input logic...
    } catch(e) { console.error(e); }
}


/**
 * 🖨️ UNIVERSAL PRINT FUNCTION
 * (Relaxed Margins Version)
 */
function printActiveDocument() {
  // 1. Determine which content to print
  let contentId, title;
  
  if (activeView === 'resume') {
    contentId = 'output';
    title = 'Resume';
  } else {
    contentId = 'output-cl';
    title = 'Cover Letter';
  }

  const contentElement = document.getElementById(contentId);
  
  // 2. Safety Check
  const hasEmptyState = contentElement ? contentElement.querySelector('.empty-state') : null;
  
  if (!contentElement || hasEmptyState || contentElement.innerText.trim() === "") {
      alert(`Your ${title} is not ready yet. Please generate it first.`);
      return;
  }

  // 3. Open Print Window
  const printWindow = window.open("", "_blank");
  
  // 4. Write the HTML
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Print ${title}</title>
        <meta charset="UTF-8">
        <style>
          /* RELAXED A4 SIZE: 
             We removed 'margin: 0' so the browser/printer handles the margins.
             This prevents content from being cut off on standard printers.
          */
          @page {
            size: A4; 
          }
          
          body {
            padding: 0;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            font-family: sans-serif;
          }

          /* Content scales to fit the printable area */
          .paper-a4 {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            box-shadow: none; 
          }
        </style>
      </head>
      <body>
        ${contentElement.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // 5. Trigger Print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}