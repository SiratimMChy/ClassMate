
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBw9ZTVtz20p-Q6su5hVMHP0JrI4xmiL54",
  authDomain: "classmate-2c272.firebaseapp.com",
  projectId: "classmate-2c272",
  storageBucket: "classmate-2c272.firebasestorage.app",
  messagingSenderId: "259430838635",
  appId: "1:259430838635:web:a49e703aad79f7fdb81c2e",
  measurementId: "G-TJ6D20JK8F"
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
      window.location.href = "index.html";
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
