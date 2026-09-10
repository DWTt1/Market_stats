import { createContext, useContext, useEffect, useState } from "react";
export type Theme = "system" | "dark" | "light";
export const ThemeContext = createContext<"dark" | "light">("dark");
export const useResolvedTheme = () => useContext(ThemeContext);
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const t = localStorage.getItem("stock-theme");
      return t === "dark" || t === "light" ? t : "system";
    } catch {
      return "system";
    }
  });
  const [system, setSystem] = useState<"dark" | "light">(() =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const resolved = theme === "system" ? system : theme;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    try {
      localStorage.setItem("stock-theme", theme);
    } catch {
      /* private browsing */
    }
  }, [theme, resolved]);
  return { theme, setTheme, resolved };
}
