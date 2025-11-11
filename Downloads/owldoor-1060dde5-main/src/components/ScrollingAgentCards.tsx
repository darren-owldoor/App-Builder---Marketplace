import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ScrollingAgentCards = () => {
  const agents = [
    { initials: "JD", name: "John Doe", role: "Buyer's Agent", color: "from-blue-500 to-blue-600" },
    { initials: "SM", name: "Sarah Miller", role: "Listing Specialist", color: "from-purple-500 to-purple-600" },
    { initials: "RJ", name: "Robert Johnson", role: "Team Leader", color: "from-green-500 to-green-600" },
    { initials: "MK", name: "Maria Kim", role: "Luxury Agent", color: "from-orange-500 to-orange-600" },
    { initials: "TW", name: "Tom Wilson", role: "Commercial Agent", color: "from-pink-500 to-pink-600" },
    { initials: "LC", name: "Lisa Chen", role: "Property Manager", color: "from-teal-500 to-teal-600" },
    { initials: "DB", name: "David Brown", role: "Senior Agent", color: "from-indigo-500 to-indigo-600" },
    { initials: "AP", name: "Anna Parker", role: "Buyer Specialist", color: "from-cyan-500 to-cyan-600" },
    { initials: "JM", name: "James Martin", role: "Investment Agent", color: "from-red-500 to-red-600" },
    { initials: "NK", name: "Nina Kelly", role: "Relocation Pro", color: "from-amber-500 to-amber-600" },
    { initials: "CT", name: "Chris Taylor", role: "New Homes Agent", color: "from-lime-500 to-lime-600" },
    { initials: "EH", name: "Emma Harris", role: "Broker", color: "from-rose-500 to-rose-600" },
  ];

  // Duplicate agents to create seamless loop
  const duplicatedAgents = [...agents, ...agents];

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
      
      <motion.div
        className="flex gap-6"
        animate={{
          x: [0, -1920], // Move left by approximately half the total width
        }}
        transition={{
          x: {
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedAgents.map((agent, index) => (
          <motion.div
            key={`${agent.initials}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: index * 0.5,
              },
            }}
            className="flex-shrink-0"
          >
            <Card
              className={`w-64 p-5 shadow-xl border-2 border-border bg-gradient-to-br ${agent.color}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-foreground">
                    {agent.initials}
                  </span>
                </div>
                <div className="flex-1 text-white min-w-0">
                  <p className="text-base font-semibold truncate">{agent.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {agent.role}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
