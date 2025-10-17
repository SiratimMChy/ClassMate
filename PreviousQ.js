import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


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
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const searchBtn = document.getElementById("search-btn");
const placeholder = document.getElementById("result-placeholder");

const semesterOrder = { "Fall": 1, "Summer": 2, "Spring": 3 };


document.body.style.display = "none";


onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ You must be logged in to view previous questions.");
    window.location.href = "login.html";
  } else {
    document.body.style.display = "block"; 
    initializePage();
  }
});


function fetchQuestions(callback) {
  const questionsRef = ref(database, "questions");
  onValue(
    questionsRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      const questions = Object.values(data);
      callback(questions);
    },
    (error) => {
      console.error("Firebase read failed:", error);
      placeholder.innerHTML = `<p>Error loading questions. Check Firebase permissions.</p>`;
    }
  );
}

// Filter based on user input
function filterQuestions(questions) {
  const courseCode = document.getElementById("course-code").value.trim().toLowerCase();
  const courseTitle = document.getElementById("course-title").value.trim().toLowerCase();
  const department = document.getElementById("department").value;
  const semester = document.getElementById("semester").value;
  const year = document.getElementById("year").value;

  return questions.filter((q) => {
    return (
      (!courseCode || (q.courseCode || "").toLowerCase().includes(courseCode)) &&
      (!courseTitle || (q.courseTitle || "").toLowerCase().includes(courseTitle)) &&
      (!department || q.department === department) &&
      (!semester || q.semester === semester) &&
      (!year || q.year === year)
    );
  });
}

// Sort questions (year ascending, then semester order)
function sortQuestions(questions) {
  return questions.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return semesterOrder[a.semester] - semesterOrder[b.semester];
  });
}

// Display results
function displayQuestions(questions) {
  placeholder.innerHTML = "";

  if (!questions.length) {
    placeholder.innerHTML = `<p>No exam questions found matching your criteria.</p>`;
    return;
  }

  questions.forEach((q) => {
    const card = document.createElement("div");
    card.classList.add("file-card");
    card.style.background = "#fff";
    card.style.padding = "1rem";
    card.style.margin = "1rem 0";
    card.style.borderRadius = "8px";
    card.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    card.innerHTML = `
      <h3>${q.courseCode || "N/A"} - ${q.courseTitle || "N/A"}</h3>
      <p><strong>Department:</strong> ${q.department || "N/A"}</p>
      <p><strong>Semester:</strong> ${q.semester || "N/A"} | <strong>Year:</strong> ${q.year || "N/A"}</p>
      <a href="${q.fileURL}" target="_blank">📄 Download</a>
    `;
    placeholder.appendChild(card);
  });
}

function initializePage() {
  placeholder.innerHTML = `<p>Loading results...</p>`;
  fetchQuestions((allQuestions) => {
    const sorted = sortQuestions(allQuestions);
    displayQuestions(sorted);
  });


  searchBtn.addEventListener("click", () => {
    placeholder.innerHTML = `<p>Loading results...</p>`;
    fetchQuestions((allQuestions) => {
      const filtered = filterQuestions(allQuestions);
      const sorted = sortQuestions(filtered);
      displayQuestions(sorted);
    });
  });
}
