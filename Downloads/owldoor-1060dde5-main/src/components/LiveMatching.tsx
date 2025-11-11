import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const LiveMatching = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-background py-8 px-4">
        <div 
          className="mx-auto max-w-7xl cursor-pointer group"
          onClick={() => setIsModalOpen(true)}
        >
          <iframe
            src="/owldoor-crm.html"
            className="w-full border-0 rounded-lg shadow-2xl h-[500px] md:h-[850px] transition-transform duration-300 group-hover:scale-[1.02]"
            title="OwlDoor Live Matching Platform"
            allow="autoplay; loop"
          />
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <iframe
            src="/owldoor-crm.html"
            className="w-full h-[90vh] border-0 rounded-lg"
            title="OwlDoor Live Matching Platform - Full View"
            allow="autoplay; loop; fullscreen"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LiveMatching;
