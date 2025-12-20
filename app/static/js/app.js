async function generateResume() {
  const resumeText = document.getElementById("resumeText").value;
  const jobDescription = document.getElementById("jobDescription").value;

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription
    })
  });

  const data = await response.json();
  document.getElementById("output").innerHTML = data.html;
}

/* OPEN NEW PAGE AND PRINT */
function printResume() {
  const content = document.getElementById("output").innerHTML;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Resume</title>
        <link rel="stylesheet" href="../css/resume.css">
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
