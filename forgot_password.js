import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"; 

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
