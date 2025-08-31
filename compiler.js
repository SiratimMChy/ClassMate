// Navbar toggle (hamburger)
const toggler = document.getElementById('toggler');
const navbar = document.querySelector('.navbar');
if (toggler && navbar) {
    toggler.addEventListener('change', () => {
        navbar.classList.toggle('active');
    });
}

// Close dropdown automatically on mobile when a link is clicked
const dropdownLinks = document.querySelectorAll('.dropdown-menu li a');

dropdownLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Only close on small screens
        if (window.innerWidth <= 865) {
            toggler.checked = false; // close mobile menu
        }

        // Optionally, trigger editor language change
        const lang = link.getAttribute('data-lang');
        console.log("Selected language:", lang);
        // changeEditorLanguage(lang); // call your function here
    });
});


// Language modes for CodeMirror
const languageModes = {
    "71": "python",
    "54": "text/x-c++src",
    "50": "text/x-csrc",
    "62": "text/x-java",
    "63": "javascript",
    "html": "htmlmixed"
};

// Default templates
const languageTemplates = {
    "71": `# Python example\nprint("Hello, World!")`,
    "54": `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    "50": `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    "62": `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    "63": `console.log("Hello, World!");`,
    "html": {
        html: "<!DOCTYPE html>\n<html>\n<head><title>Page</title></head>\n<body><h1>Hello World</h1></body>\n</html>",
        css: "body { font-family: Arial; background: #f5f5f5; }",
        js: "console.log('Hello from JS');"
    }
};

// Setup
let editors = {}, currentLang = "";
const editorsContainer = document.querySelector(".editor-container");
const ioBox = document.getElementById("io-box");
const runBtn = document.querySelector(".run-btn");
const iframe = document.getElementById("htmlOutput");
const languageSelect = document.getElementById("language");

// Language selection
languageSelect.addEventListener("change", function () {
    currentLang = this.value;
    editorsContainer.innerHTML = '<div class="editor-header">Editor</div>';
    editors = {};
    iframe.style.display = "none";
    ioBox.style.display = "block";

    if (currentLang === "html") {
        ioBox.style.display = "none";
        iframe.style.display = "block";

        ['html', 'css', 'js'].forEach(lang => {
            const ta = document.createElement('textarea');
            ta.value = languageTemplates.html[lang];
            const wrapper = document.createElement('div');
            wrapper.className = 'editor';
            wrapper.appendChild(ta);
            editorsContainer.appendChild(wrapper);

            editors[lang] = CodeMirror.fromTextArea(ta, {
                mode: lang === 'html' ? 'htmlmixed' : lang,
                theme: 'dracula',
                lineNumbers: true
            });

            editors[lang].on('change', updateLivePreview);
        });

        updateLivePreview();
    } else {
        const ta = document.createElement('textarea');
        ta.value = languageTemplates[currentLang] || '';
        const wrapper = document.createElement('div');
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

// HTML/CSS/JS live preview
function updateLivePreview() {
    if (!editors['html']) return;
    const html = editors['html'].getValue();
    const css = editors['css'] ? `<style>${editors['css'].getValue()}</style>` : '';
    const js = editors['js'] ? `<script>${editors['js'].getValue()}<\/script>` : '';
    iframe.srcdoc = html + css + js;
    iframe.style.display = "block";
    ioBox.style.display = "none";
}

// Run code using Judge0 API
runBtn.addEventListener("click", async () => {
    if (!currentLang) return alert("Please select a language!");

    if (currentLang === "html") {
        updateLivePreview();
        return;
    }

    const code = editors['main'].getValue();
    const input = ioBox.value;
    const langId = parseInt(currentLang);

    ioBox.value = "⏳ Running...";

    try {
        const res = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": "73269129e1msh4959d9cca3d9fbcp1f1cdcjsn9b80de22c2d8",
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
            },
            body: JSON.stringify({
                source_code: code,
                language_id: langId,
                stdin: input
            })
        });

        const result = await res.json();
        if (result.stdout) ioBox.value = result.stdout;
        else if (result.stderr) ioBox.value = "❌ Runtime Error:\n" + result.stderr;
        else if (result.compile_output) ioBox.value = "⚠️ Compile Error:\n" + result.compile_output;
        else ioBox.value = "⚠️ No output or invalid response.";
    } catch (err) {
        ioBox.value = "🚨 Connection error:\n" + err.message;
    }
});
