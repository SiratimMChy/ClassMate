import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { firebaseConfig, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./firebaseConfig.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


const app          = initializeApp(firebaseConfig);
const db           = getDatabase(app);
const auth         = getAuth(app);
const cloudName    = CLOUDINARY_CLOUD_NAME;
const uploadPreset = CLOUDINARY_UPLOAD_PRESET;
const ADMIN_UIDS = [];

const resType = document.getElementById("resType"),
  pdfRow = document.getElementById("pdfRow"),
  linkRow = document.getElementById("linkRow"),
  resFile = document.getElementById("resFile"),
  pdfPreview = document.getElementById("pdfPreview"),
  resourceMessage = document.getElementById("resourceMessage"),
  saveBtn = document.getElementById("saveResource");

let currentUser = null,
  currentResources = {};

function updateFormByType() {
  const t = resType.value;
  pdfRow.style.display = t === "pdf" ? "block" : "none";
  linkRow.style.display = (t === "video" || t === "link") ? "block" : "none";
}
resType.addEventListener("change", updateFormByType);
updateFormByType();

resFile?.addEventListener("change", function () {
  const f = this.files?.[0];
  pdfPreview.textContent = f ? `Selected file: ${f.name} (${Math.round(f.size / 1024)} KB)` : "";
});

const resourcesRef = ref(db, "resources");
onValue(resourcesRef, s => { currentResources = s.val() || {}; updateResourceList(); });

const searchInput = document.getElementById("resourceSearch"),
  clearSearch = document.getElementById("clearSearch");
let searchTimer = null;

function matchesFilter(r, q) {
  if (!q) return true;
  q = q.toLowerCase();
  return [r.title, r.description, r.type, r.fileName, r.link].some(f => (f || "").toLowerCase().includes(q));
}

const typeIcon = { pdf: 'fa-file-pdf', video: 'fa-play-circle', link: 'fa-link' };
const typeLabel = { pdf: 'PDF', video: 'Video', link: 'Link' };

function renderResources(items) {
  const c = document.createElement('div');
  c.className = 'resource-grid';
  const keys = Object.keys(items || {});

  // Update count badge
  const countEl = document.getElementById('resourceCount');
  if (countEl) countEl.textContent = keys.length;

  if (!keys.length) {
    c.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>No resources yet. Add one above.</p>
      </div>`;
    return c;
  }

  for (const k of keys) {
    const r = items[k];
    const el = document.createElement('div');
    el.className = 'resource-item';
    const icon = typeIcon[r.type] || 'fa-file';
    const label = typeLabel[r.type] || r.type;
    const url = r.fileURL || r.link || '#';
    el.innerHTML = `
      <div class="resource-type-icon ${r.type || 'link'}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="resource-info">
        <div class="resource-title">${r.title || 'Untitled'}</div>
        ${r.description ? `<div class="resource-desc">${r.description}</div>` : ''}
        <div class="resource-meta">
          <span class="resource-tag">${label}</span>
          ${r.addedBy ? `<span class="resource-tag">${r.addedBy === 'local-admin' ? 'Admin' : r.addedBy}</span>` : ''}
        </div>
      </div>
      <div class="resource-actions">
        ${url !== '#' ? `<a href="${url}" target="_blank" rel="noopener" class="btn btn-view"><i class="fas fa-external-link-alt"></i> Open</a>` : ''}
        <button class="btn btn-remove" data-key="${k}"><i class="fas fa-trash-alt"></i> Remove</button>
      </div>`;
    c.appendChild(el);
  }
  return c;
}

function updateResourceList(f = (searchInput?.value.trim() || "")) {
  const filtered = {};
  for (const k in currentResources) {
    const r = currentResources[k];
    if (r && matchesFilter(r, f)) filtered[k] = r;
  }
  const holder = document.getElementById("resourceListHolder");
  if (holder) {
    holder.innerHTML = "";
    const grid = renderResources(filtered);
    holder.appendChild(grid);
    // Bind remove buttons
    holder.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        deleteResource(key, currentResources[key]);
      });
    });
  }
}

searchInput?.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => updateResourceList(searchInput.value), 180);
});
clearSearch?.addEventListener("click", () => { searchInput.value = ""; updateResourceList(""); });

onAuthStateChanged(auth, (user) => {
  const localUser = JSON.parse(localStorage.getItem("user"));
  if (localUser?.role === "admin") {
    currentUser = { uid: "local-admin", email: localUser.email };
    return;
  }
  if (!user) {
    alert("You must sign in as an admin to access this page.");
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  if (ADMIN_UIDS.length && !ADMIN_UIDS.includes(user.uid)) {
    alert("Access denied: you are not an admin.");
    window.location.href = "login.html";
  }
});

async function deleteResource(id, r) {
  if (!currentUser) { alert("You must be signed in as an admin."); return; }
  const ok = confirm(`Remove "${r?.title || "this resource"}"?`);
  if (!ok) return;
  try {
    resourceMessage.textContent = "Removing...";
    await remove(ref(db, `resources/${id}`));
    delete currentResources[id]; updateResourceList();
    resourceMessage.style.color = "#0b6eff"; resourceMessage.textContent = "Removed.";
    setTimeout(() => (resourceMessage.textContent = ""), 1500);
  } catch (e) {
    console.error(e); resourceMessage.style.color = "#e55353";
    resourceMessage.textContent = "Failed to remove resource.";
  }
}

async function uploadToCloudinary(f) {
  const formData = new FormData();
  formData.append("file", f);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "resources");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data;
}

saveBtn.addEventListener("click", async () => {
  const title = document.getElementById("resTitle").value.trim(),
    type = resType.value,
    desc = document.getElementById("resDesc").value.trim(),
    link = document.getElementById("resLink").value.trim(),
    file = resFile?.files?.[0];
  if (!title) return (resourceMessage.textContent = "Please provide a title.");
  if (type === "pdf" && !file) return (resourceMessage.textContent = "Please upload a PDF file.");
  if ((type === "video" || type === "link") && !link) return (resourceMessage.textContent = "Please provide a URL.");

  try {
    let fileURL = null, fileName = null, fileType = null;
    if (type === "pdf" && file) {
      resourceMessage.textContent = "Uploading file...";
      const up = await uploadToCloudinary(file);
      fileURL = up.secure_url; fileName = up.original_filename || file.name; fileType = file.type;
    }
    const newRef = push(ref(db, "resources"));
    await set(newRef, {
      title, type, description: desc || null,
      link: (type === "video" || type === "link") ? link : null,
      fileURL, fileName, fileType,
      addedBy: currentUser.uid, timestamp: new Date().toISOString(),
      approved: true, status: "published"
    });
    resourceMessage.style.color = "#0b6eff";
    resourceMessage.textContent = `Resource '${title}' saved.`;
    setTimeout(() => { document.getElementById("resourceForm").reset(); updateFormByType(); pdfPreview.textContent = ""; }, 1200);
  } catch (e) {
    console.error(e); resourceMessage.style.color = "#e55353";
    resourceMessage.textContent = "Upload failed. Try again.";
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
export { };
