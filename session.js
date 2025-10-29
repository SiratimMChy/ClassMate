import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

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

function updateNavBar(user) {
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    const adminOnlyButtons = document.querySelectorAll('.admin-only');

    if (!userDropdownMenu) return;

    userDropdownMenu.innerHTML = '';

    let currentUser = JSON.parse(localStorage.getItem('user'));

    if (currentUser) {
        const isAdmin = currentUser.role === 'admin';

  
        adminOnlyButtons.forEach(btn => {
            btn.style.display = isAdmin ? 'inline-block' : 'none';
        });

 
        const signOutItem = document.createElement('li');
        const signOutLink = document.createElement('a');
        signOutLink.href = "#";
        signOutLink.textContent = "Sign Out";
        signOutLink.addEventListener('click', async (e) => {
            e.preventDefault();

       
            localStorage.removeItem('user');

        
            try {
                if (!isAdmin) {
                    await signOut(auth);
                }
                window.location.href = "index.html";
                alert("Logged out successfully.");
            } catch (error) {
                console.error("Sign Out Error:", error);
                alert("Error signing out.");
            }
        });
        signOutItem.appendChild(signOutLink);
        userDropdownMenu.appendChild(signOutItem);

    } else {
        adminOnlyButtons.forEach(btn => btn.style.display = 'none');

        const loginItem = document.createElement('li');
        loginItem.innerHTML = `<a href="login.html">Login</a>`;

        const signUpItem = document.createElement('li');
        signUpItem.innerHTML = `<a href="register.html">Sign Up</a>`;

        userDropdownMenu.appendChild(loginItem);
        userDropdownMenu.appendChild(signUpItem);
    }
}

onAuthStateChanged(auth, (user) => {
    updateNavBar(user);
});

updateNavBar();
