import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

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
    smList.innerHTML = '<div class="resource-card">No resources found.</div>';
    smMeta.textContent = 'No results.';
    return;
  }

  for (const item of filtered) {
    const r = item.data;
    const card = document.createElement('div');
    card.className = 'resource-card';

    const title = document.createElement('h3');
    title.textContent = r.title || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${r.type || 'resource'}${r.fileName ? ' • ' + r.fileName : ''}`;

    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = r.description || '';

    const actions = document.createElement('div');
    actions.className = 'resource-actions';

    if (r.fileURL) {
      const a = document.createElement('a');
      a.href = r.fileURL;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'resource-link primary';
      a.innerHTML = '<i class="fas fa-file-pdf"></i> Open File';
      actions.appendChild(a);
    }

    if (r.link && !r.fileURL) {
      const a = document.createElement('a');
      a.href = r.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'resource-link primary';
      a.innerHTML = '<i class="fas fa-external-link-alt"></i> Open Link';
      actions.appendChild(a);
    }

    card.appendChild(title);
    card.appendChild(meta);
    if (desc.textContent) card.appendChild(desc);
    if (actions.childElementCount) card.appendChild(actions);

    smList.appendChild(card);
  }

  smMeta.textContent = `Showing ${filtered.length} of ${allResources.length} approved resource(s).`;
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