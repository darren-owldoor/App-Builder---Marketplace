import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeOption = "light" | "dark" | "monochrome" | "ocean" | "earth" | "forest" | "lavender" | "minimal" | "sage" | "terracotta" | "navy" | "sky" | "cyan" | "steel" | "blue" | "mint" | "trust-green" | "corporate-green";

interface ThemeContextType {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeOption>("corporate-green");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
