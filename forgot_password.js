import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

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

window.resetPassword = function (event) {
  event.preventDefault();

  const email = document.getElementById("reset-email").value.trim();
  const errorMsg = document.getElementById("reset-error");
  const message = document.getElementById("reset-message");

  errorMsg.text = "";
  message.text = "";

  if (!email) {
    errorMsg.text = "Please enter your email.";
    return false;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      message.text = "Password reset link sent! Check your email.";
    })
    .catch((error) => {
      console.log("Reset Error:", error.code, error.message);
      if (error.code === "auth/user-not-found") {
        errorMsg.text = "No user found with this email.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg.text = "Please enter a valid email address.";
      } else {
        errorMsg.text = "Something went wrong. Please try again.";
      }
    });

  return false;
};
