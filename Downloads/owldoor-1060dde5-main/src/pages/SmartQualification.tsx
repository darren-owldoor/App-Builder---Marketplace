import { SmartAgentQualification } from "@/components/SmartAgentQualification";
import { useNavigate } from "react-router-dom";

export default function SmartQualification() {
  const navigate = useNavigate();

  const handleComplete = () => {
    console.log("Qualification completed!");
    // Could redirect or show success message
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Smart Agent Qualification</h1>
          <p className="text-muted-foreground">Answer a few quick questions to get matched with the perfect team</p>
        </div>
        <SmartAgentQualification onComplete={handleComplete} />
      </div>
    </div>
  );
}
