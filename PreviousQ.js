// fetchQuestions.js

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("search-btn");
  const placeholder = document.getElementById("result-placeholder");

  const cloudName = "dbspyyci2"; // Your Cloudinary cloud name
  const folder = "questions"; // Cloudinary folder name

  // Fetch all files from Cloudinary folder
  async function fetchQuestions() {
    try {
      const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/list/${folder}.json`);
      const data = await response.json();
      return data.resources;
    } catch (err) {
      console.error("Error fetching files:", err);
      return [];
    }
  }

  // Filter questions based on form inputs
  function filterQuestions(files) {
    const courseCode = document.getElementById("course-code").value.trim().toLowerCase();
    const courseTitle = document.getElementById("course-title").value.trim().toLowerCase();
    const department = document.getElementById("department").value;
    const semester = document.getElementById("semester").value;
    const year = document.getElementById("year").value;

    return files.filter(file => {
      const context = file.context && file.context.custom || {};
      return (
        (courseCode === "" || (context.courseCode || "").toLowerCase().includes(courseCode)) &&
        (courseTitle === "" || (context.courseTitle || "").toLowerCase().includes(courseTitle)) &&
        (department === "" || context.department === department) &&
        (semester === "" || context.semester === semester) &&
        (year === "" || context.year === year)
      );
    });
  }

  // Display questions in result section
  function displayQuestions(files) {
    placeholder.innerHTML = "";

    if (!files.length) {
      placeholder.innerHTML = `<p>No exam questions found matching your criteria. Try adjusting your filters.</p>`;
      return;
    }

    const resultsContainer = document.createElement("div");
    resultsContainer.classList.add("results-container");

    files.forEach(file => {
      const context = file.context && file.context.custom || {};
      const courseCode = context.courseCode || "N/A";
      const courseTitle = context.courseTitle || "N/A";
      const department = context.department || "N/A";
      const semester = context.semester || "N/A";
      const year = context.year || "N/A";

      const fileCard = document.createElement("div");
      fileCard.classList.add("file-card");
      fileCard.style.cssText = `
        background: white; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      `;
      fileCard.innerHTML = `
        <h3>${courseCode} - ${courseTitle}</h3>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Semester:</strong> ${semester} | <strong>Year:</strong> ${year}</p>
        <a href="${file.url}" target="_blank" style="
          display: inline-block; margin-top: 8px; padding: 8px 12px;
          background-color: var(--pink); color: white; text-decoration: none;
          border-radius: 5px;
        ">Download PDF</a>
      `;

      resultsContainer.appendChild(fileCard);
    });

    placeholder.appendChild(resultsContainer);
  }

  // Event listener for search button
  searchBtn.addEventListener("click", async () => {
    placeholder.innerHTML = `<p>Loading results...</p>`;
    const allFiles = await fetchQuestions();
    const filteredFiles = filterQuestions(allFiles);
    displayQuestions(filteredFiles);
  });
});
