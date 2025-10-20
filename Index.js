const toggleBtn = document.getElementById("theme-toggle");
const icon = toggleBtn.querySelector("i");


let currentTheme = "light";

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        icon.classList.replace("fa-moon", "fa-sun");
    } else {
        document.body.classList.remove("dark-mode");
        icon.classList.replace("fa-sun", "fa-moon");
    }
    currentTheme = theme;
}


toggleBtn.addEventListener("click", () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
});
