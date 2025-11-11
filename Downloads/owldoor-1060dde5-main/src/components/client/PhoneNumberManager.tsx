import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { toast } from "sonner";

const PhoneNumberManager = () => {
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!clientData) throw new Error("Client not found");
      setClientId(clientData.id);

      const { data, error } = await supabase
        .from("client_phone_numbers")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error: any) {
      toast.error("Failed to load phone numbers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Phone className="h-5 w-5" />
        <h2 className="text-xl font-bold">OwlDoor Phone Number</h2>
        <p className="text-sm text-muted-foreground ml-auto">
          Managed by admin
        </p>
      </div>

      {phoneNumbers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No phone numbers assigned yet. Contact your administrator to request phone numbers.
        </div>
      ) : (
        <div className="space-y-2">
          {phoneNumbers.map((number) => (
            <div
              key={number.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-mono font-medium">{number.phone_number}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {number.active ? (
                      <span className="text-green-600">● Active</span>
                    ) : (
                      <span className="text-muted-foreground">● Inactive</span>
                    )}
                    {" • "}
                    Assigned {new Date(number.assigned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PhoneNumberManager;
