document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("theme-toggle");
  const icon = toggleBtn.querySelector("i");

  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      icon.classList.replace("fa-moon", "fa-sun");
    } else {
      document.body.classList.remove("dark-mode");
      icon.classList.replace("fa-sun", "fa-moon");
    }
    localStorage.setItem("theme", theme); // Save user choice
  }

  // Load theme from localStorage (default = light)
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  applyTheme(savedTheme);

  // Toggle theme when clicked
  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
});
