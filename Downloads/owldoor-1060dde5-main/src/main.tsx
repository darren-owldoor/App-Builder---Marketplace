import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/design-system.css";
import { ThemeProvider } from "./contexts/ThemeContext";

// Initialize theme from localStorage or default to sage
const storedTheme = localStorage.getItem("theme");
const theme = storedTheme || "sage";
if (theme === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
