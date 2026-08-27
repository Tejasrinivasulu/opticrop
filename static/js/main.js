(function initTheme() {
  const saved = localStorage.getItem("opticrop-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();

document.addEventListener("DOMContentLoaded", () => {
  const ring = document.querySelector(".accuracy-ring");
  if (ring) {
    const value = parseFloat(ring.dataset.value) || 0;
    const circle = ring.querySelector(".ring-fill");
    if (circle) {
      const circumference = 2 * Math.PI * 52;
      const offset = circumference - (value / 100) * circumference;
      requestAnimationFrame(() => {
        circle.style.strokeDashoffset = offset;
      });
    }
  }

  const themeBtn = document.getElementById("themeToggle");
  if (!themeBtn) return;

  const iconLight = themeBtn.querySelector(".theme-icon-light");
  const iconDark = themeBtn.querySelector(".theme-icon-dark");

  function syncThemeIcon() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    iconLight?.classList.toggle("d-none", isDark);
    iconDark?.classList.toggle("d-none", !isDark);
  }

  syncThemeIcon();

  themeBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("opticrop-theme", next);
    syncThemeIcon();
  });
});
