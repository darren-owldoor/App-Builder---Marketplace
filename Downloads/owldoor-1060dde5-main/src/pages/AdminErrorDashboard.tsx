import { ErrorMonitoringDashboard } from "@/components/admin/ErrorMonitoringDashboard";
import { TwilioTestingTool } from "@/components/admin/TwilioTestingTool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminErrorDashboard() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="errors">Error Dashboard</TabsTrigger>
          <TabsTrigger value="testing">Testing Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <ErrorMonitoringDashboard />
        </TabsContent>

        <TabsContent value="testing">
          <TwilioTestingTool />
        </TabsContent>
      </Tabs>
    </div>
  );
}
