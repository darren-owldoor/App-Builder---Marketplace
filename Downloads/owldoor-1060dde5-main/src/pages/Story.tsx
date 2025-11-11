import { HorizontalScrollSteps } from "@/components/HorizontalScrollSteps";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeSelector } from "@/components/ThemeSelector";

const Story = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="fixed top-6 right-6 z-50">
          <ThemeSelector />
        </div>
        <HorizontalScrollSteps />
      </div>
    </ThemeProvider>
  );
};

export default Story;
