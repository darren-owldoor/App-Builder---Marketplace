import { Palette } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "corporate-green", label: "Corporate Green (Default)" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "monochrome", label: "Black/White/Grey" },
    { value: "minimal", label: "Minimal White" },
    { value: "blue", label: "Corporate Blue" },
    { value: "mint", label: "Mint Green" },
    { value: "sage", label: "Sage Green" },
    { value: "terracotta", label: "Terracotta" },
    { value: "ocean", label: "Ocean Blue" },
    { value: "navy", label: "Navy Blue" },
    { value: "sky", label: "Sky Blue" },
    { value: "cyan", label: "Cyan" },
    { value: "steel", label: "Steel Blue" },
    { value: "earth", label: "Earth Tones" },
    { value: "forest", label: "Forest" },
    { value: "lavender", label: "Lavender" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full bg-background/80 backdrop-blur-sm">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-background border">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value as any)}
            className={theme === t.value ? "bg-accent" : ""}
          >
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
