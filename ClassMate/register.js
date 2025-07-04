import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBr5S5yoBXdroviWV-T9pLaQl-dFFZ3eF8",
  authDomain: "classmateex.firebaseapp.com",
  projectId: "classmateex",
  storageBucket: "classmateex.firebasestorage.app",
  messagingSenderId: "325155552857",
  appId: "1:325155552857:web:b654aec07a4a6e2e233b48"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.form = function (event) {
  event.preventDefault();


  const fname = document.getElementById("ifname").value.trim();
  const studentId = document.getElementById("istudentid").value.trim();
  const dept = document.getElementById("idept").value.trim();
  const batch = document.getElementById("ibatch").value.trim();
  const mobile = document.getElementById("imob").value.trim();
  const email = document.getElementById("iemail").value.trim();
  const pass = document.getElementById("ipass").value.trim();

  const efname = document.getElementById("efname");
  const estudentId = document.getElementById("estudentid");
  const edept = document.getElementById("edept");
  const ebatch = document.getElementById("ebatch");
  const emob = document.getElementById("emob");
  const eemail = document.getElementById("eemail");
  const epass = document.getElementById("epass");

  let valid = true;


  const namePattern = /^[a-zA-Z.\s]{2,20}$/;
  const studentIdPattern = /^\d{10}$/;
  const deptPattern = /^(cse|eee|law)$/i;
  const batchPattern = /^\d{2}$/;
  const mobilePattern = /^(\+88)?-?01[3-9]\d{8}$/;
  const emailPattern = /^(?:(?:cse|eee|law)_\d{10}@lus\.ac\.bd|[a-z0-9._]+@(gmail|yahoo)\.com)$/;
  const passPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+?><]).{8,20}$/;


  if (!namePattern.test(fname)) {
    efname.innerText = "Username must be 2–20 letters (letters, dot, or space only)";
    valid = false;
  } else {
    efname.innerText = "";
  }

  if (!studentIdPattern.test(studentId)) {
    estudentId.innerText = "Student ID must be exactly 10 digits";
    valid = false;
  } else {
    estudentId.innerText = "";
  }

  if (!deptPattern.test(dept)) {
    edept.innerText = "Department must be one of: cse, eee, law";
    valid = false;
  } else {
    edept.innerText = "";
  }

  if (!batchPattern.test(batch)) {
    ebatch.innerText = "Batch must be a 2-digit number (e.g., 23)";
    valid = false;
  } else {
    ebatch.innerText = "";
  }

  if (!mobilePattern.test(mobile)) {
    emob.innerText = "Mobile must be valid Bangladeshi number (e.g., 017XXXXXXXX)";
    valid = false;
  } else {
    emob.innerText = "";
  }

  if (!emailPattern.test(email)) {
    eemail.innerText = "Email must be like: cse_1234567890@lus.ac.bd";
    valid = false;
  } else {
    eemail.innerText = "";
  }

  if (!passPattern.test(pass)) {
    epass.innerText = "Password must be 8–20 chars, include uppercase, lowercase, number & special character";
    valid = false;
  } else {
    epass.innerText = "";
  }

  if (!valid) {
    return;
  }


  createUserWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      alert("Registration successful!");
      document.querySelector("form").reset();
    })
    .catch((error) => {
      console.error("Error during registration:", error);
      let errorMessage = "Registration failed. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Error: This email is already in use. Please use a different email.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Error: The email address is not valid.";
          break;
        default:
          errorMessage = "Error: " + error.message;
      }
      alert(errorMessage);
    });
};
