const cloudName = "dbspyyci2";
const uploadPreset = "question_upload";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBr5S5yoBXdroviWV-T9pLaQl-dFFZ3eF8",
  authDomain: "classmateex.firebaseapp.com",
  projectId: "classmateex",
  storageBucket: "classmateex.firebasestorage.app",
  messagingSenderId: "325155552857",
  appId: "1:325155552857:web:b654aec07a4a6e2e233b48"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.getElementById("submit-question-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const courseCode = document.getElementById("course-code").value;
  const courseTitle = document.getElementById("course-title").value;
  const department = document.getElementById("department").value;
  const semester = document.getElementById("semester").value;
  const year = document.getElementById("year").value;
  const fileInput = document.getElementById("file-upload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "questions");

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    const fileURL = data.secure_url;

    await set(ref(database, 'questions/' + Date.now()), {
      courseCode,
      courseTitle,
      department,
      semester,
      year,
      fileName: file.name,
      fileType: file.type,
      fileURL
    });

    alert("Your question has been submitted successfully!");
    document.getElementById("submit-question-form").reset();
  } catch (error) {
    console.error("Error uploading file or saving data:", error);
    alert("There was an error submitting your question. Please try again.");
  }
});
