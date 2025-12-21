async function generateResume() {
  const resumeText = document.getElementById("resumeText").value;
  const jobDescription = document.getElementById("jobDescription").value;
  const style = document.getElementById("styleSelect").value; // dropdown

  // Profile data (already saved earlier)
  const user = JSON.parse(localStorage.getItem("user"));
  const profile = JSON.parse(localStorage.getItem("profile")); // optional

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      style: style,
      resume_text: resumeText,
      job_description: jobDescription,

      // user profile data
      full_name: profile?.full_name || user?.name || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      linkedin: profile?.linkedin || "",
      portfolio: profile?.portfolio || ""
    })
  });

  const data = await response.json();

  if (!response.ok || !data.resume_html) {
    alert("Failed to generate resume");
    console.error(data);
    return;
  }

  // Render HTML (CSS is already embedded)
  document.getElementById("output").innerHTML = data.resume_html;

  // ATS Score - make it more visual
  const atsScoreElement = document.getElementById("atsScore");
  atsScoreElement.innerText = `${data.ats_score}`;
  // Add color coding
  atsScoreElement.className = data.ats_score >= 80 ? 'ats-score high' : data.ats_score >= 60 ? 'ats-score medium' : 'ats-score low';

  // Improvement Suggestions - better formatting
  document.getElementById("suggestions").innerHTML = data.improvement_suggestions
    .split("\n")
    .filter(item => item.trim())
    .map(item => `<li class="suggestion-item">${item.replace(/^-\s*/, "")}</li>`)
    .join("");

  // Show result section (keep inputs visible)
  document.getElementById("resultSection").style.display = "block";

  // Scroll to results
  document.getElementById("resultSection").scrollIntoView({ behavior: 'smooth' });
}


/* OPEN NEW PAGE AND PRINT */
function printResume() {
  const content = document.getElementById("output").innerHTML;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Resume</title>
        <meta charset="UTF-8">
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}
