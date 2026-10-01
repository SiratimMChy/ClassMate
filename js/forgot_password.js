import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"; 


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.resetPassword = function (event) {
  event.preventDefault();

  const email = document.getElementById("reset-email").value.trim();
  const errorMsg = document.getElementById("reset-error");
  const message = document.getElementById("reset-message");

  errorMsg.innerText = "";
  message.innerText = "";

  if (!email) {
    errorMsg.innerText = "Please enter your email.";
    return false;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      message.innerText = "✅ Password reset link sent! Check your email.";
    })
    .catch((error) => {
      console.log("Reset Error:", error.code, error.message);
      if (error.code === "auth/user-not-found") {
        errorMsg.innerText = "No user found with this email.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg.innerText = "Please enter a valid email address.";
      } else {
        errorMsg.innerText = "Something went wrong. Please try again.";
      }
    });

  return false;
};
