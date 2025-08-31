// -------------------- Navbar Toggler --------------------
const toggler = document.getElementById('toggler');
const navbar = document.querySelector('.navbar');

if (toggler && navbar) {
    toggler.addEventListener('change', () => {
        navbar.classList.toggle('active');
    });
}

// Close mobile menu when a link is clicked
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navbar.classList.remove('active');
            toggler.checked = false;
        }
    });
});

// -------------------- Language Modes --------------------
const languageModes = {
    "71": "python",          
    "54": "text/x-c++src",    
    "50": "text/x-csrc",   
    "62": "text/x-java",     
    "63": "javascript",      
    "html": "htmlmixed"      
};

// -------------------- Language Templates --------------------
const languageTemplates = {
    "71": `# Write your Python code here\nprint("Hello, World!")`,
    "54": `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // write your code here\n    return 0;\n}`,
    "50": `#include <stdio.h>\n\nint main() {\n    // write your code here\n    return 0;\n}`,
    "62": `public class Main {\n    public static void main(String[] args) {\n        // write your code here\n    }\n}`,
    "63": `// Write your JavaScript code here\nconsole.log("Hello, World!");`,
    "html": {
        html: "<!-- Write your HTML here -->\n<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>",
        css: "/* Write your CSS here */\nbody { font-family: Arial; background: #f5f5f5; }",
        js: "// Write your JavaScript here\nconsole.log('Hello from JS!');"
    }
};

// -------------------- Editors and Elements --------------------
let editors = {}, currentLang = "";
const editorsContainer = document.getElementById("editors");
const ioBox = document.getElementById("io-box");
const runBtn = document.getElementById("run-btn");
const iframe = document.getElementById("htmlOutput");
const languageSelect = document.getElementById("language");

// -------------------- Language Switch --------------------
languageSelect.addEventListener("change", function () {
    currentLang = this.value;

    // Hide navbar after selecting language on mobile
    if (window.innerWidth <= 768) {
        navbar.classList.remove('active');
        toggler.checked = false;
    }

    editorsContainer.innerHTML = '<div class="editor-header">Editor</div>';
    iframe.style.display = "none";
    ioBox.style.display = "block";

    if (currentLang === "html") {
        ioBox.style.display = "none";
        iframe.style.display = "block";

        ['html', 'css', 'js'].forEach(lang => {
            let ta = document.createElement('textarea');
            ta.id = lang;
            ta.value = languageTemplates.html[lang]; 
            let wrapper = document.createElement('div');
            wrapper.className = 'editor';
            wrapper.appendChild(ta);
            editorsContainer.appendChild(wrapper);
            editors[lang] = CodeMirror.fromTextArea(ta, {
                mode: lang === 'html' ? 'htmlmixed' : lang,
                theme: 'dracula',
                lineNumbers: true
            });
        });
    } else {
        let ta = document.createElement('textarea');
        ta.id = 'code';
        ta.value = languageTemplates[currentLang] || '# Write your code here';
        let wrapper = document.createElement('div');
        wrapper.className = 'editor';
        wrapper.appendChild(ta);
        editorsContainer.appendChild(wrapper);
        editors['main'] = CodeMirror.fromTextArea(ta, {
            mode: languageModes[currentLang],
            theme: 'dracula',
            lineNumbers: true
        });
    }
});

// -------------------- HTML Live Preview --------------------
function updateLivePreview() {
    const html = editors['html'] ? editors['html'].getValue() : '';
    const css = editors['css'] ? `<style>${editors['css'].getValue()}</style>` : '';
    const js = editors['js'] ? `<script>${editors['js'].getValue()}<\/script>` : '';
    iframe.srcdoc = html + css + js;
}

// -------------------- Run Code --------------------
runBtn.addEventListener("click", async () => {
    if (!currentLang) {
        alert("Please select a language first!");
        return;
    }

    if (currentLang === 'html') {
        updateLivePreview();
        return;
    }

    const code = editors['main'].getValue();
    const input = ioBox.value;
    const langId = parseInt(currentLang);

    ioBox.value = "⏳ Running...";
    iframe.style.display = "none";
    ioBox.style.display = "block";

    try {
        const res = await fetch("https://ce.judge0.com/submissions/?base64_encoded=false&wait=true", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source_code: code, language_id: langId, stdin: input })
        });
        const result = await res.json();
        if (result.stdout) ioBox.value = result.stdout;
        else if (result.stderr) ioBox.value = "❌ Runtime Error:\n" + result.stderr;
        else if (result.compile_output) ioBox.value = "⚠️ Compile Error:\n" + result.compile_output;
        else ioBox.value = "⚠️ Unknown error";
    } catch (err) {
        ioBox.value = "🚨 Connection error:\n" + err;
    }
});
