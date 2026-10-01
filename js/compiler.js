/* ─────────────────────────────────────
   CONFIG
───────────────────────────────────── */
const MODES = {
  "71": "python", "54": "text/x-c++src", "50": "text/x-csrc",
  "62": "text/x-java", "63": "javascript", "html": "htmlmixed"
};

const LANG_NAMES = {
  "71":"Python","54":"C++","50":"C","62":"Java","63":"JavaScript","html":"HTML/CSS/JS"
};

const TEMPLATES = {
  "71": `# Python\nprint("Hello, World!")`,
  "54": `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  "50": `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  "62": `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  "63": `console.log("Hello, World!");`,
  "html": {
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>`,
    css:  `body {\n  font-family: Arial, sans-serif;\n  background: #f5f5f5;\n  padding: 2rem;\n}\nh1 { color: #FF4500; }`,
    js:   `console.log("Hello from JS!");`
  }
};

/* ─────────────────────────────────────
   DOM REFS
───────────────────────────────────── */
const langSelect     = document.getElementById("language");
const langMobile     = document.getElementById("language-mobile");
const runBtn         = document.getElementById("runBtn");
const editorMount    = document.getElementById("editorMount");
const editorTitle    = document.getElementById("editorTitle");
const outputBox      = document.getElementById("outputBox");
const outputPlaceholder = document.getElementById("outputPlaceholder");
const ioBox          = document.getElementById("io-box");
const htmlOutput     = document.getElementById("htmlOutput");
const stdinSection   = document.getElementById("stdinSection");
const htmlTabs       = document.getElementById("htmlTabs");
const copyBtn        = document.getElementById("copyBtn");
const clearEditorBtn = document.getElementById("clearEditorBtn");
const clearOutputBtn = document.getElementById("clearOutputBtn");
const hamburger      = document.getElementById("hamburger");
const navDrawer      = document.getElementById("navDrawer");
const mainHeader     = document.getElementById("mainHeader");

/* ─────────────────────────────────────
   STATE
───────────────────────────────────── */
let editors     = {};
let currentLang = "";
let activeTab   = "html"; // for HTML mode

/* ─────────────────────────────────────
   CODEMIRROR HELPERS
───────────────────────────────────── */
function cmHeight() {
  // full viewport minus navbar (62px) minus panel-bar (38px)
  return window.innerHeight - 62 - 38;
}

function createEditor(mode, value) {
  const ta = document.createElement("textarea");
  ta.value = value;
  editorMount.appendChild(ta);
  const isMobile = window.innerWidth <= 900;
  const h = isMobile ? "260px" : cmHeight() + "px";
  const cm = CodeMirror.fromTextArea(ta, {
    mode        : mode,
    theme       : "dracula",
    lineNumbers : true,
    lineWrapping: false,
    indentUnit  : 4,
    tabSize     : 4,
    autofocus   : true,
    extraKeys   : { "Ctrl-Enter": () => runBtn.click(), "Cmd-Enter": () => runBtn.click() }
  });
  cm.setSize("100%", h);
  return cm;
}

/* ─────────────────────────────────────
   LANGUAGE SWITCH
───────────────────────────────────── */
function switchLanguage(lang) {
  if (!lang) return;
  currentLang = lang;

  // destroy old editors
  editorMount.innerHTML = "";
  editors = {};

  // update title
  editorTitle.innerHTML = `<i class="fas fa-file-code"></i> ${LANG_NAMES[lang]}`;

  if (lang === "html") {
    // show HTML tabs, hide stdin, show iframe
    htmlTabs.style.display  = "flex";
    stdinSection.style.display = "none";
    htmlOutput.style.display   = "block";
    outputBox.style.display    = "none";
    activeTab = "html";

    // create all three editors but only show active one
    ["html","css","js"].forEach(t => {
      const mode = t === "html" ? "htmlmixed" : t;
      editors[t] = createEditor(mode, TEMPLATES.html[t]);
      editors[t].getWrapperElement().style.display = (t === activeTab) ? "block" : "none";
      editors[t].on("change", updatePreview);
    });

    // sync tab buttons
    document.querySelectorAll(".htab").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === activeTab)
    );
    updatePreview();

  } else {
    htmlTabs.style.display     = "none";
    stdinSection.style.display = "flex";
    htmlOutput.style.display   = "none";
    outputBox.style.display    = "flex";

    editors["main"] = createEditor(MODES[lang], TEMPLATES[lang] || "");
    setOutput("", "idle");
  }
}

/* ─────────────────────────────────────
   HTML LIVE PREVIEW
───────────────────────────────────── */
function updatePreview() {
  if (!editors["html"]) return;
  const h = editors["html"].getValue();
  const c = editors["css"] ? `<style>${editors["css"].getValue()}</style>` : "";
  const j = editors["js"]  ? `<script>${editors["js"].getValue()}<\/script>` : "";
  htmlOutput.srcdoc = h + c + j;
}

/* ─────────────────────────────────────
   OUTPUT HELPERS
───────────────────────────────────── */
function setOutput(text, state) {
  outputPlaceholder.style.display = "none";
  outputBox.className = "output-" + state;

  if (!text) {
    outputPlaceholder.style.display = "flex";
    outputBox.className = "";
    return;
  }
  // clear old content except placeholder
  Array.from(outputBox.children).forEach(c => {
    if (c !== outputPlaceholder) c.remove();
  });
  const pre = document.createElement("pre");
  pre.textContent = text;
  outputBox.appendChild(pre);
}

/* ─────────────────────────────────────
   RUN
───────────────────────────────────── */
runBtn.addEventListener("click", async () => {
  if (!currentLang) { alert("Please select a language first!"); return; }

  if (currentLang === "html") { updatePreview(); return; }

  const code  = editors["main"] ? editors["main"].getValue().trim() : "";
  const input = ioBox.value;

  if (!code) { setOutput("⚠️  Editor is empty.", "error"); return; }

  setOutput("⏳  Running…", "running");
  runBtn.disabled = true;
  runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span> Running</span>';

  try {
    const res = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        method : "POST",
        headers: {
          "Content-Type"   : "application/json",
          "X-RapidAPI-Key" : "73269129e1msh4959d9cca3d9fbcp1f1cdcjsn9b80de22c2d8",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        },
        body: JSON.stringify({ source_code: code, language_id: parseInt(currentLang), stdin: input })
      }
    );
    const r = await res.json();

    if      (r.stdout)         setOutput(r.stdout.trimEnd(), "success");
    else if (r.stderr)         setOutput("⚠️  Runtime Error:\n\n" + r.stderr, "error");
    else if (r.compile_output) setOutput("⚠️  Compile Error:\n\n" + r.compile_output, "error");
    else                       setOutput("⚠️  No output returned.", "error");

  } catch (err) {
    setOutput("❌  Connection error:\n" + err.message, "error");
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<i class="fas fa-play"></i><span> Run</span>';
  }
});

/* ─────────────────────────────────────
   HTML TABS
───────────────────────────────────── */
document.querySelectorAll(".htab").forEach(btn => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll(".htab").forEach(b => b.classList.toggle("active", b === btn));
    ["html","css","js"].forEach(t => {
      if (editors[t]) {
        editors[t].getWrapperElement().style.display = (t === activeTab) ? "block" : "none";
        if (t === activeTab) editors[t].refresh();
      }
    });
  });
});

/* ─────────────────────────────────────
   COPY / CLEAR
───────────────────────────────────── */
copyBtn.addEventListener("click", () => {
  const code = currentLang === "html"
    ? (editors[activeTab] ? editors[activeTab].getValue() : "")
    : (editors["main"]    ? editors["main"].getValue()    : "");
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i>', 1800);
  });
});

clearEditorBtn.addEventListener("click", () => {
  const target = currentLang === "html" ? editors[activeTab] : editors["main"];
  if (target) target.setValue("");
});

clearOutputBtn.addEventListener("click", () => setOutput("", "idle"));

/* ─────────────────────────────────────
   LANGUAGE SELECT EVENTS
───────────────────────────────────── */
langSelect.addEventListener("change", function () {
  langMobile.value = this.value;
  switchLanguage(this.value);
});

langMobile.addEventListener("change", function () {
  langSelect.value = this.value;
  switchLanguage(this.value);
  hamburger.classList.remove("open");
  navDrawer.classList.remove("open");
});

/* ─────────────────────────────────────
   NAVBAR
───────────────────────────────────── */
window.addEventListener("scroll", () =>
  mainHeader.classList.toggle("scrolled", window.scrollY > 4)
);

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navDrawer.classList.toggle("open");
});

navDrawer.querySelectorAll(".drawer-link").forEach(l =>
  l.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navDrawer.classList.remove("open");
  })
);

// Active nav link
document.querySelectorAll(".nav-link").forEach(l => {
  const linkFile = l.getAttribute("href").split("/").pop().split("?")[0];
  const currentFile = location.pathname.split("/").pop() || "index.html";
  if (linkFile === currentFile) l.classList.add("active");
});

/* ─────────────────────────────────────
   KEYBOARD SHORTCUT  Ctrl/Cmd + Enter
───────────────────────────────────── */
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runBtn.click();
  }
});

/* ─────────────────────────────────────
   RESIZE: keep CodeMirror height correct
───────────────────────────────────── */
window.addEventListener("resize", () => {
  if (window.innerWidth <= 900) return; // mobile uses fixed CSS height
  const h = cmHeight() + "px";
  Object.values(editors).forEach(cm => cm.setSize("100%", h));
});

/* ─────────────────────────────────────
   DRAG-TO-RESIZE DIVIDER
───────────────────────────────────── */
const divider    = document.getElementById("divider");
const ideWrap    = document.querySelector(".ide-wrap");
const editorSide = document.querySelector(".editor-side");
const outputSide = document.querySelector(".output-side");

let dragging = false;
divider.addEventListener("mousedown", e => {
  dragging = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});
document.addEventListener("mousemove", e => {
  if (!dragging) return;
  const rect  = ideWrap.getBoundingClientRect();
  const total = rect.width;
  const pos   = e.clientX - rect.left;
  const pct   = Math.min(Math.max(pos / total * 100, 20), 80);
  editorSide.style.flex = "none";
  editorSide.style.width = pct + "%";
  outputSide.style.flex  = "1";
  Object.values(editors).forEach(cm => cm.refresh());
});
document.addEventListener("mouseup", () => {
  dragging = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
});
