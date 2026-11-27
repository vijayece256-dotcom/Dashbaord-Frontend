import { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeContext = createContext(null);
const THEME_KEY = "baluns_dashboard_theme";

function initialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Keep the selected theme for this session when storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider.");
  return value;
}
