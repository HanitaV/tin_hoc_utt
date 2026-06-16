(function () {
  const THEME_KEY = "tinHocUttTheme";
  const VALID_THEMES = new Set(["light", "dark"]);

  function getSavedTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (VALID_THEMES.has(savedTheme)) return savedTheme;
    } catch (error) {
      // Ignore storage errors in private or restricted contexts.
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function applyTheme(theme, shouldPersist) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;

    const button = document.querySelector("[data-theme-toggle]");
    if (button) {
      const isDark = nextTheme === "dark";
      button.textContent = isDark ? "Giao diện sáng" : "Giao diện tối";
      button.setAttribute("aria-pressed", isDark ? "true" : "false");
      button.setAttribute("title", isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
    }

    if (shouldPersist) persistTheme(nextTheme);
  }

  function addToggleStyles() {
    if (document.querySelector("style[data-theme-toggle-style]")) return;

    const style = document.createElement("style");
    style.setAttribute("data-theme-toggle-style", "");
    style.textContent = [
      ".tin-theme-toggle{position:fixed;right:18px;bottom:18px;z-index:9999;min-height:40px;padding:8px 12px;border:1px solid var(--line,#d9e2ec);border-radius:8px;background:var(--paper,var(--surface,#fff));color:var(--ink,#172033);box-shadow:var(--shadow,0 10px 28px rgba(23,32,51,.16));font:700 14px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer}",
      ".tin-theme-toggle:hover{border-color:var(--teal,#0f766e);color:var(--teal-strong,var(--teal,#0f766e))}",
      "@media (max-width:700px){.tin-theme-toggle{right:12px;bottom:12px;min-height:38px;padding:7px 10px;font-size:13px}}",
      "@media print{.tin-theme-toggle{display:none}}"
    ].join("");
    document.head.appendChild(style);
  }

  function isEmbeddedPage() {
    try {
      return window.self !== window.top;
    } catch (error) {
      return true;
    }
  }

  function addStandaloneToggle() {
    if (isEmbeddedPage()) return;
    if (document.querySelector("#themeButton, [data-theme-toggle]")) return;

    addToggleStyles();

    const button = document.createElement("button");
    button.type = "button";
    button.className = "tin-theme-toggle";
    button.setAttribute("data-theme-toggle", "");
    document.body.appendChild(button);

    button.addEventListener("click", function () {
      const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      applyTheme(currentTheme === "dark" ? "light" : "dark", true);
    });

    applyTheme(document.documentElement.dataset.theme || getSavedTheme(), false);
  }

  window.tinHocUttTheme = {
    apply: function (theme) {
      applyTheme(theme, true);
    },
    current: function () {
      return document.documentElement.dataset.theme || getSavedTheme();
    }
  };

  applyTheme(getSavedTheme(), false);

  window.addEventListener("storage", function (event) {
    if (event.key === THEME_KEY && VALID_THEMES.has(event.newValue)) {
      applyTheme(event.newValue, false);
    }
  });

  document.addEventListener("DOMContentLoaded", addStandaloneToggle);
}());
