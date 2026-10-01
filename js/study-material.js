import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const smSearch = document.getElementById('smSearch');
const smClear = document.getElementById('smClear');
const smList = document.getElementById('smList');
const smMeta = document.getElementById('smMeta');

let allResources = [];
let timer = null;

function byTitleAsc(a, b) {
  const ta = (a.data.title || '').toLowerCase();
  const tb = (b.data.title || '').toLowerCase();
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return 0;
}

function matches(q, item) {
  if (!q) return true;
  q = q.toLowerCase();
  const d = item.data;
  const fields = [d.title, d.description, d.type, d.fileName, d.link];
  return fields.some(f => (f || '').toString().toLowerCase().includes(q));
}

function renderList(filterText) {
  const q = (typeof filterText === 'string') ? filterText.trim() : (smSearch ? smSearch.value.trim() : '');
  const filtered = allResources.filter(item => matches(q, item));
  smList.innerHTML = '';

  if (!filtered.length) {
    smList.innerHTML = `<div class="sm-empty"><i class="fas fa-folder-open"></i><p>No resources found.</p></div>`;
    smMeta.textContent = 'No results.';
    return;
  }

  const typeIcon = { pdf: 'fa-file-pdf', video: 'fa-play-circle', link: 'fa-link' };
  const typeClass = { pdf: 'pdf', video: 'video', link: 'link' };

  for (const item of filtered) {
    const r = item.data;
    const t = r.type || 'other';
    const icon = typeIcon[t] || 'fa-file';
    const cls  = typeClass[t] || 'other';
    const url  = r.fileURL || r.link || '';

    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = `
      <div class="resource-card-icon ${cls}"><i class="fas ${icon}"></i></div>
      <h3>${r.title || 'Untitled'}</h3>
      <div class="meta">
        <span class="resource-tag">${t.toUpperCase()}</span>
        ${r.fileName ? `<span class="resource-tag">${r.fileName}</span>` : ''}
      </div>
      ${r.description ? `<div class="desc">${r.description}</div>` : ''}
      ${url ? `<div class="resource-actions">
        <a href="${url}" target="_blank" rel="noopener" class="resource-link primary">
          <i class="fas ${r.fileURL ? 'fa-download' : 'fa-external-link-alt'}"></i>
          ${r.fileURL ? 'Open File' : 'Open Link'}
        </a>
      </div>` : ''}
    `;
    smList.appendChild(card);
  }

  smMeta.textContent = `Showing ${filtered.length} of ${allResources.length} resource${allResources.length !== 1 ? 's' : ''}.`;
}

const resourcesRef = ref(database, 'resources');
onValue(resourcesRef, (snap) => {
  const data = snap.val() || {};
  const arr = [];
  for (const k of Object.keys(data)) {
    const r = data[k];
    if (!r) continue;
    if (r.approved !== true) continue;
    arr.push({ id: k, data: r });
  }
  arr.sort(byTitleAsc);
  allResources = arr;
  renderList();
});

if (smSearch) {
  smSearch.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => renderList(smSearch.value), 180);
  });
}
if (smClear) {
  smClear.addEventListener('click', () => {
    if (smSearch) smSearch.value = '';
    renderList('');
  });
}

export {};