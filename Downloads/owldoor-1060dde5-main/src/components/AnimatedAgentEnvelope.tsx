import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export const AnimatedAgentEnvelope = () => {
  const [visibleAgents, setVisibleAgents] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [flapOpen, setFlapOpen] = useState(false);

  const agents = [
    { initials: "JD", name: "John Doe", color: "from-blue-500 to-blue-600" },
    { initials: "SM", name: "Sarah Miller", color: "from-purple-500 to-purple-600" },
    { initials: "RJ", name: "Robert Johnson", color: "from-green-500 to-green-600" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleAgents((prev) => {
        const next = (prev + 1) % 4; // 0-3
        if (next === 1) {
          setShowNotification(true);
          setFlapOpen(true);
          setTimeout(() => {
            setShowNotification(false);
            setFlapOpen(false); // flap auto-close after 2s
          }, 2000);
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto h-[400px] flex items-center justify-center">
      {/* Notification Bubble */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="p-3 shadow-lg bg-primary text-primary-foreground border-0">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    rotate: [0, -15, 15, -15, 15, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: 2,
                  }}
                >
                  <Bell className="h-4 w-4" />
                </motion.div>
                <span className="text-sm font-semibold whitespace-nowrap">
                  New Agent Recruit!
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Envelope */}
      <div className="relative">
        {/* Envelope Body */}
        <motion.div
          className="relative w-80 h-52 bg-gradient-to-br from-card to-muted border-2 border-border rounded-lg shadow-xl overflow-hidden"
          animate={visibleAgents > 0 ? { y: 10 } : { y: 0 }}
        >
          {/* Envelope Flap */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-muted-foreground/20 to-transparent origin-top border-b-2 border-border"
            initial={{ rotateX: 0 }}
            animate={flapOpen ? { rotateX: -180 } : { rotateX: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            style={{ transformStyle: "preserve-3d" }}
          />
        </motion.div>

        {/* Agents Coming Out */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full flex flex-col items-center">
          <AnimatePresence mode="sync">
            {visibleAgents > 0 &&
              agents.slice(0, visibleAgents).map((agent, index) => (
                <motion.div
                  key={agent.initials}
                  initial={{ y: 100, opacity: 0, scale: 0.5 }}
                  animate={{
                    y: -index * 60,
                    opacity: 1,
                    scale: 1 - index * 0.1,
                    zIndex: 50 - index,
                  }}
                  exit={{ y: -200, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.2,
                  }}
                  className="absolute"
                  whileHover={{ scale: 1.05, y: -index * 60 - 5 }}
                >
                  <Card
                    className={`w-48 p-4 shadow-2xl border-2 border-border bg-gradient-to-br ${agent.color} cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                        <span className="text-lg font-bold text-foreground">
                          {agent.initials}
                        </span>
                      </div>
                      <div className="flex-1 text-white">
                        <p className="text-sm font-semibold">{agent.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          New Recruit
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
