import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

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
const database = getDatabase(app);
const auth = getAuth(app);


const ADMIN_UIDS = [];

const pendingListEl = document.getElementById('pendingList');
const refreshBtn = document.getElementById('refreshBtn');
const signOutBtn = document.getElementById('signOutBtn');

let currentUser = null;

const localAdmin = JSON.parse(localStorage.getItem('user'));
if (localAdmin && localAdmin.role === 'admin') {
  currentUser = { email: localAdmin.email, role: 'admin', uid: 'localAdmin' };
  const questionsRef = ref(database, 'questions');
  onValue(questionsRef, (snapshot) => {
    renderPending(snapshot.val());
  });
}

function renderPending(items) {
  pendingListEl.innerHTML = '';
  const keys = Object.keys(items || {});
  const pending = keys.filter(k => {
    const v = items[k];
    return !v || v.approved !== true;
  });

  if (pending.length === 0) {
    pendingListEl.innerHTML = '<p class="empty"><i class="fas fa-check-circle"></i> No pending questions.</p>';
    return;
  }

  for (const id of pending) {
    const data = items[id];
    const node = document.createElement('div');
    node.className = 'pending-item';

    const header = document.createElement('div');
    header.className = 'pending-header';

    const titleArea = document.createElement('div');

    const title = document.createElement('h3');
    title.className = 'pending-title';
    title.textContent = (data.courseCode || '—') + ' — ' + (data.courseTitle || 'Untitled');
    titleArea.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'pending-meta';
    meta.innerHTML = `
      <div><i class="fas fa-university"></i> ${data.department || '—'} • ${data.semester || '—'} ${data.year || '—'}</div>
      <div><i class="fas fa-user"></i> ${data.email || data.uid || 'unknown'}</div>
      <div><i class="fas fa-clock"></i> ${new Date(data.timestamp).toLocaleString()}</div>
    `;
    titleArea.appendChild(meta);

    header.appendChild(titleArea);

    if (data.fileURL) {
      const fileLink = document.createElement('a');
      fileLink.href = data.fileURL;
      fileLink.target = '_blank';
      fileLink.rel = 'noopener';
      fileLink.className = 'resource-link primary';
      fileLink.innerHTML = '<i class="fas fa-file-pdf"></i> View PDF';
      header.appendChild(fileLink);
    }

    const actions = document.createElement('div');
    actions.className = 'pending-actions';

    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-approve';
    approveBtn.innerHTML = '<i class="fas fa-check"></i> Approve';
    approveBtn.addEventListener('click', () => approveQuestion(id));

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn-reject';
    rejectBtn.innerHTML = '<i class="fas fa-times"></i> Reject';
    rejectBtn.addEventListener('click', () => rejectQuestion(id));

    actions.appendChild(approveBtn);
    actions.appendChild(rejectBtn);

    node.appendChild(header);
    node.appendChild(actions);

    pendingListEl.appendChild(node);
  }
}

function showAccessDenied() {
  pendingListEl.innerHTML = '<p class="empty">Access denied. You are not an admin.</p>';
}

onAuthStateChanged(auth, (user) => {
  if (currentUser) return;

  currentUser = user;
  if (!user) {
    alert('You must sign in as an admin to access this page.');
    window.location.href = 'login.html';
    return;
  }

  if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(user.uid)) {
    showAccessDenied();
    return;
  }

  const questionsRef = ref(database, 'questions');
  onValue(questionsRef, (snapshot) => renderPending(snapshot.val()));
});
async function approveQuestion(id) {
  if (!currentUser) return alert('Not signed in.');
  if (!confirm('Approve this question and make it available?')) return;
  const qRef = ref(database, 'questions/' + id);
  try {
    await update(qRef, { approved: true, status: 'approved', approvedBy: currentUser.uid, approvedAt: new Date().toISOString() });
    alert('Question approved.');
  } catch (err) {
    console.error(err);
    alert('Failed to approve.');
  }
}

async function rejectQuestion(id) {
  if (!currentUser) return alert('Not signed in.');
  if (!confirm('Reject this question? This will remove it from the database.')) return;
  const qRef = ref(database, 'questions/' + id);
  try {
    await remove(qRef);
    alert('Question rejected and removed.');
  } catch (err) {
    console.error(err);
    alert('Failed to reject.');
  }
}

// -------------------- Buttons --------------------
refreshBtn?.addEventListener('click', () => window.location.reload());

signOutBtn?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('user'); // also clear local admin session
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    alert('Failed to sign out.');
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  mobileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-container')) {
      mobileToggle.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileToggle.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
});