import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

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

window.loginUser = function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");

    emailError.textContent = "";
    passwordError.textContent = "";

    
    const emailPattern = /^(?:(?:cse|eee|law)_\d{10}@lus\.ac\.bd|[a-z0-9._]+@(gmail|yahoo)\.com)$/;
    const passPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+?><]).{8,20}$/;

    let hasError = false;

    if (!emailPattern.test(email)) {
        emailError.textContent = "Email must be like: cse_1234567890@lus.ac.bd or valid Gmail/Yahoo.";
        hasError = true;
    }

    if (!passPattern.test(password)) {
        passwordError.textContent = "Password must be 8–20 characters and include uppercase, lowercase, digit, and special character.";
        hasError = true;
    }

    if (hasError) {
        return false; 
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Login successful!");
            window.location.href = "main.html"; 
        })
        .catch((error) => {
            
            console.log("Firebase Auth Error:", error.code, error.message);
            
            if (error.code === 'auth/user-not-found') {
                emailError.textContent = "Email is not registered. Please register first.";
            } else if (error.code === 'auth/wrong-password') {
                passwordError.textContent = "Password does not match. Please try again.";
            } else if (error.code === 'auth/email-already-in-use') {
                emailError.textContent = "This email is already in use. Please use a different email.";
            } else {
                emailError.textContent = "Please check your credentials.";
            }
        });

    return false;
};
