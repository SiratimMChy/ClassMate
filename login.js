
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBr5S5yoBXdroviWV-T9pLaQl-dFFZ3eF8",
  authDomain: "classmateex.firebaseapp.com",
  projectId: "classmateex",
  storageBucket: "classmateex.firebasestorage.app",
  messagingSenderId: "325155552857",
  appId: "1:325155552857:web:b654aec07a4a6e2e233b48",
};

class LoginHandler {
  constructor(config) {
    this.app = initializeApp(config);
    this.auth = getAuth(this.app);

    this.emailPattern =
      /^(?:(?:cse|eee|law)_\d{10}@lus\.ac\.bd|[a-z0-9._]+@(gmail|yahoo)\.com)$/;
    this.passPattern =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+?><]).{8,20}$/;
  }

  clearErrors() {
    document.getElementById("email-error").textContent = "";
    document.getElementById("password-error").textContent = "";
  }

  validateInput(email, password) {
    this.clearErrors();
    let valid = true;

    if (!this.emailPattern.test(email)) {
      document.getElementById("email-error").textContent =
        "Email must be like: cse_1234567890@lus.ac.bd or valid Gmail/Yahoo.";
      valid = false;
    }

    if (!this.passPattern.test(password)) {
      document.getElementById("password-error").textContent =
        "Password must be 8–20 characters and include uppercase, lowercase, digit, and special character.";
      valid = false;
    }

    return valid;
  }

  async login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("ipass").value.trim();

    if (!this.validateInput(email, password)) {
      return false;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;

      if (!user.emailVerified) {
        alert(
          "Your email is not verified. Please verify your email before logging in."
        );
        await signOut(this.auth);
        return false;
      }

      alert("Login successful!");
      window.location.href = "main.html";
    } catch (error) {
      console.error("Firebase Auth Error:", error.code, error.message);

      switch (error.code) {
        case "auth/user-not-found":
          document.getElementById("email-error").textContent =
            "Email is not registered. Please register first.";
          break;
        case "auth/wrong-password":
          document.getElementById("password-error").textContent =
            "Password does not match. Please try again.";
          break;
        default:
          document.getElementById("email-error").textContent =
            "Please check your credentials.";
      }
    }

    return false;
  }
}

const loginHandler = new LoginHandler(firebaseConfig);
window.loginUser = loginHandler.login.bind(loginHandler);
