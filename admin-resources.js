import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

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
const db = getDatabase(app);
const auth = getAuth(app);
const cloudName = "dbspyyci2";
const uploadPreset = "question_upload";
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

function renderResources(items) {
  const c = document.createElement("div");
  c.style.display = "grid"; c.style.gap = "0.6rem";
  const keys = Object.keys(items || {});
  if (!keys.length) {
    c.innerHTML = `<div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.04)">No resources yet.</div>`;
    return c;
  }
  for (const k of keys) {
    const r = items[k], el = document.createElement("div");
    el.style = "background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.04)";
    el.innerHTML = `<strong>${r.title || "Untitled"}</strong><div style="color:#6b7280">${r.type} • ${r.addedBy || "admin"}</div>`;
    const actions = document.createElement("div");
    actions.style.marginTop = "6px";
    const link = document.createElement("a");
    link.href = r.fileURL || r.link; link.target = "_blank"; link.rel = "noopener";
    link.textContent = r.fileURL ? "Open File" : r.link ? "Open Link" : "";
    link.style.color = "#0b6eff"; if (link.textContent) actions.appendChild(link);
    const rm = document.createElement("button");
    rm.textContent = "Remove"; rm.style = "margin-left:8px;background:#ef4444;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer";
    rm.onclick = () => deleteResource(k, r);
    actions.appendChild(rm); el.appendChild(actions); c.appendChild(el);
  }
  return c;
}

function updateResourceList(f = (searchInput?.value.trim() || "")) {
  const filtered = {};
  for (const k in currentResources) {
    const r = currentResources[k];
    if (r && matchesFilter(r, f)) filtered[k] = r;
  }
  const holder = document.getElementById("resourceListHolder") || document.querySelector("#list");
  if (holder) { holder.innerHTML = ""; holder.appendChild(renderResources(filtered)); }
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

export {};
