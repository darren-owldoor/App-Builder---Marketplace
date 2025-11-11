import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface QuestionModalProps {
  open: boolean;
  onClose: () => void;
  question: any;
  onAnswer: (answer: any) => Promise<void>;
  isUpdating: boolean;
}

export function QuestionModal({ open, onClose, question, onAnswer, isUpdating }: QuestionModalProps) {
  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl">
            <span>{question.question}</span>
            <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {question.timeEstimate}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          {question.options.map((option: any, index: number) => (
            <Button
              key={index}
              className="w-full h-auto py-4 text-base bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02]"
              onClick={() => onAnswer(option)}
              disabled={isUpdating}
            >
              {option.label}
            </Button>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground text-center mt-4">
          Answer to improve your match quality
        </p>
      </DialogContent>
    </Dialog>
  );
}
