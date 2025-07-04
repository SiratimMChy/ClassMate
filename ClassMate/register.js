import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

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

// OOP class for registration
class RegistrationHandler {
  constructor(authInstance) {
    this.auth = authInstance;
  }

  validateInput(value, pattern, errorMessage) {
    return pattern.test(value) ? "" : errorMessage;
  }

  validateForm(formData) {
    const validations = [
      {
        value: formData.fname,
        pattern: /^[a-zA-Z.\s]{2,20}$/,
        errorElement: "efname",
        errorMessage: "Username must be 2–20 letters (letters, dot, or space only)"
      },
      {
        value: formData.studentId,
        pattern: /^\d{10}$/,
        errorElement: "estudentid",
        errorMessage: "Student ID must be exactly 10 digits"
      },
      {
        value: formData.dept,
        pattern: /^(cse|eee|law)$/i,
        errorElement: "edept",
        errorMessage: "Department must be one of: cse, eee, law"
      },
      {
        value: formData.batch,
        pattern: /^\d{2}$/,
        errorElement: "ebatch",
        errorMessage: "Batch must be a 2-digit number (e.g., 23)"
      },
      {
        value: formData.mobile,
        pattern: /^(\+88)?-?01[3-9]\d{8}$/,
        errorElement: "emob",
        errorMessage: "Mobile must be valid Bangladeshi number (e.g., 017XXXXXXXX)"
      },
      {
        value: formData.email,
        pattern: /^(?:(?:cse|eee|law|bba|thm|eng|phm|arch)_\d{10}@lus\.ac\.bd|[a-z0-9._]+@(gmail|yahoo)\.com)$/,
        errorElement: "eemail",
        errorMessage: "Email must be like: cse_1234567890@lus.ac.bd"
      },
      {
        value: formData.pass,
        pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+?><]).{8,20}$/,
        errorElement: "epass",
        errorMessage: "Password must be 8–20 chars, include uppercase, lowercase, number & special character"
      }
    ];

    let isValid = true;

    validations.forEach(({ value, pattern, errorElement, errorMessage }) => {
      const error = this.validateInput(value, pattern, errorMessage);
      document.getElementById(errorElement).innerText = error;
      if (error) isValid = false;
    });

    return isValid;
  }

  registerUser(formData) {
    createUserWithEmailAndPassword(this.auth, formData.email, formData.pass)
      .then((userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user)
          .then(() => {
            alert("Registration successful! A verification email has been sent. Please check your inbox.");
            document.querySelector("form").reset();
          })
          .catch((error) => {
            console.error("Verification email failed:", error);
            alert("Registered, but failed to send verification email. Please try again.");
          });
      })
      .catch((error) => {
        console.error("Registration error:", error);
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
  }

  handleFormSubmit(event) {
    event.preventDefault();

    const formData = {
      fname: document.getElementById("ifname").value.trim(),
      studentId: document.getElementById("istudentid").value.trim(),
      dept: document.getElementById("idept").value.trim(),
      batch: document.getElementById("ibatch").value.trim(),
      mobile: document.getElementById("imob").value.trim(),
      email: document.getElementById("iemail").value.trim(),
      pass: document.getElementById("ipass").value.trim()
    };

    if (this.validateForm(formData)) {
      this.registerUser(formData);
    }
  }
}

// Instantiate and bind
const registrationHandler = new RegistrationHandler(auth);
window.form = registrationHandler.handleFormSubmit.bind(registrationHandler);
