import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { firebaseConfig } from "./firebaseConfig.js";


const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

function updateNavBar() {
    const navRoot = document.querySelector('classmate-navbar')?.shadowRoot || document;
    const dropdownMenu = navRoot.getElementById('user-dropdown-menu');
    const adminOnlyEls = navRoot.querySelectorAll('.admin-only');
    const userBtn      = navRoot.getElementById('userBtn');

    if (!dropdownMenu) return;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin     = currentUser?.role === 'admin';

    adminOnlyEls.forEach(el => {
        el.style.display = isAdmin ? 'inline-flex' : 'none';
    });

    dropdownMenu.innerHTML = '';

    if (currentUser) {
        const email    = currentUser.email || '';
        const role     = isAdmin ? 'Administrator' : 'Student';
        const initial  = email.charAt(0).toUpperCase();

        // Remove any existing auth buttons first
        navRoot.querySelectorAll('.nav-auth-btn').forEach(el => el.remove());

        // Show dropdown trigger, hide login button
        if (userBtn) {
            userBtn.style.display = '';
            userBtn.classList.add('logged-in');
        }

        dropdownMenu.innerHTML = `
          <div class="nav-dd-profile">
            <div class="nav-dd-initial">${initial}</div>
            <div class="nav-dd-info">
              <div class="nav-dd-name-row">
                <span class="nav-dd-name">${role}</span>
                ${isAdmin ? '<span class="nav-dd-badge">Admin</span>' : ''}
              </div>
              <span class="nav-dd-email">${email}</span>
            </div>
          </div>
          <div class="nav-dd-sep"></div>
          ${isAdmin ? `
          <a href="admin.html" class="nav-dd-item">
            <span class="nav-dd-item-icon"><i class="fas fa-th-large"></i></span>
            <span>Dashboard</span>
          </a>` : ''}
          <a href="submitQ.html" class="nav-dd-item">
            <span class="nav-dd-item-icon"><i class="fas fa-upload"></i></span>
            <span>Submit Question</span>
          </a>
          <a href="PreviousQ.html" class="nav-dd-item">
            <span class="nav-dd-item-icon"><i class="fas fa-book-open"></i></span>
            <span>Question Bank</span>
          </a>
          <div class="nav-dd-sep"></div>
          <a href="#" class="nav-dd-item nav-dd-signout" id="signOutBtn">
            <span class="nav-dd-item-icon"><i class="fas fa-sign-out-alt"></i></span>
            <span>Sign Out</span>
          </a>
        `;

        navRoot.getElementById('signOutBtn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            try { if (!isAdmin) await signOut(auth); } catch (err) { console.error(err); }
            window.location.href = 'index.html';
        });

    } else {
        // Hide dropdown trigger, show login/signup buttons inline
        if (userBtn) userBtn.style.display = 'none';

        // Put login/signup directly in the dropdown menu div
        // but also show them as inline buttons via the nav-actions area
        const navActions = navRoot.querySelector('.nav-actions');
        // Remove any existing auth buttons first
        navRoot.querySelectorAll('.nav-auth-btn').forEach(el => el.remove());

        if (navActions) {
            const loginBtn = document.createElement('a');
            loginBtn.href = 'login.html';
            loginBtn.className = 'nav-auth-btn nav-login-btn';
            loginBtn.innerHTML = 'Get Started';

            const hamburger = navRoot.getElementById('hamburger');
            navActions.insertBefore(loginBtn, hamburger);
        }
    }
}

onAuthStateChanged(auth, () => updateNavBar());
updateNavBar();
