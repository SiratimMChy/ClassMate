import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


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

  // Update count badge
  const countEl = document.getElementById('pendingCount');
  if (countEl) countEl.textContent = pending.length;

  if (pending.length === 0) {
    pendingListEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle" style="color:var(--success)"></i>
        <p>All caught up — no pending questions.</p>
      </div>`;
    return;
  }

  for (const id of pending) {
    const data = items[id];
    const node = document.createElement('div');
    node.className = 'pending-item';
    node.innerHTML = `
      <div class="pending-header">
        <div class="pending-header-left">
          <h3 class="pending-title">${data.courseCode || '—'} — ${data.courseTitle || 'Untitled'}</h3>
          <div class="pending-meta">
            <span><i class="fas fa-university"></i> ${data.department || '—'}</span>
            <span><i class="fas fa-layer-group"></i> ${data.semester || '—'} ${data.year || ''}</span>
            <span><i class="fas fa-user"></i> ${data.email || data.uid || 'unknown'}</span>
            <span><i class="fas fa-clock"></i> ${new Date(data.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <span class="pending-badge"><i class="fas fa-hourglass-half"></i> Pending</span>
      </div>
      <div class="pending-actions">
        ${data.fileURL ? `<a href="${data.fileURL}" target="_blank" rel="noopener" class="btn btn-view"><i class="fas fa-file-pdf"></i> View PDF</a>` : ''}
        <button class="btn btn-approve" data-id="${id}"><i class="fas fa-check"></i> Approve</button>
        <button class="btn btn-reject"  data-id="${id}"><i class="fas fa-times"></i> Reject</button>
      </div>`;
    pendingListEl.appendChild(node);
  }

  // Bind buttons
  pendingListEl.querySelectorAll('.btn-approve').forEach(btn =>
    btn.addEventListener('click', () => approveQuestion(btn.dataset.id)));
  pendingListEl.querySelectorAll('.btn-reject').forEach(btn =>
    btn.addEventListener('click', () => rejectQuestion(btn.dataset.id)));
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