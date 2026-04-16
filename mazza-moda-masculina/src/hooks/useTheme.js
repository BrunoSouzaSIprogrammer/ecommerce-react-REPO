import { useState, useEffect } from "react";

const STORAGE_KEY = "mazza:theme";

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  return "dark";
}

export default function useTheme() {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    document.body.className = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Sincroniza entre abas / instâncias do hook na mesma página.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function setTheme(next) {
    setThemeState(next);
  }

  return { theme, setTheme };
}
