import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


const cloudName = "dbspyyci2";
const uploadPreset = "question_upload";


const firebaseConfig = {
  apiKey: "AIzaSyBw9ZTVtz20p-Q6su5hVMHP0JrI4xmiL54",
  authDomain: "classmate-2c272.firebaseapp.com",
  projectId: "classmate-2c272",
  storageBucket: "classmate-2c272.firebasestorage.app",
  messagingSenderId: "259430838635",
  appId: "1:259430838635:web:a49e703aad79f7fdb81c2e",
  measurementId: "G-TJ6D20JK8F"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

const submitForm = document.getElementById("submit-question-form");


let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ You must be logged in to submit a question.");
    window.location.href = "login.html";
  } else {
    currentUser = user;
  }
});


submitForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = submitForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = "Submitting...";
  submitButton.disabled = true;


  const user = auth.currentUser || currentUser;
  if (!user) {
    alert("Please log in to submit a question.");
    window.location.href = "login.html";
    return;
  }

  
  const courseCode = document.getElementById("course-code").value.trim();
  const courseTitle = document.getElementById("course-title").value.trim();
  const department = document.getElementById("department").value;
  const semester = document.getElementById("semester").value;
  const year = document.getElementById("year").value;
  const fileInput = document.getElementById("file-upload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file to upload.");
    resetButton();
    return;
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    alert("Only PDF files are allowed. Please upload a .pdf file.");
    fileInput.value = "";
    resetButton();
    return;
  }


  const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "questions");

  try {
    const response = await fetch(uploadURL, { method: "POST", body: formData });
    const data = await response.json();

    if (!data.secure_url) {
      console.error("Cloudinary upload failed:", data);
      throw new Error(data.error?.message || "Upload failed.");
    }

    const fileURL = data.secure_url;

  
    const questionId = Date.now();
    await set(ref(database, "questions/" + questionId), {
      uid: user.uid,
      email: user.email,
      courseCode,
      courseTitle,
      department,
      semester,
      year,
      fileName: file.name,
      fileType: file.type,
      fileURL,
      timestamp: new Date().toISOString(),
    });

    alert("✅ Question submitted successfully!");
    submitForm.reset();
  } catch (error) {
    console.error("Upload or save failed:", error);
    alert("❌ Error uploading your question. Please try again.");
  } finally {
    resetButton();
  }

  
  function resetButton() {
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
  }
});
