import { CalendarIntegration } from "@/components/agent/CalendarIntegration";

const Calendar = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Calendar Integration</h1>
          <p className="text-muted-foreground">
            Connect your calendar to manage availability and appointments
          </p>
        </div>

        <CalendarIntegration />
      </div>
    </div>
  );
};

export default Calendar;
