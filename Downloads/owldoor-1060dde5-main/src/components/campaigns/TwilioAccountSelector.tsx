import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";

interface TwilioAccountSelectorProps {
  selectedAccountId?: string;
  selectedPhoneNumber?: string;
  onAccountChange: (accountId: string) => void;
  onPhoneNumberChange: (phoneNumber: string) => void;
}

interface TwilioAccount {
  id: string;
  account_name: string;
  account_sid: string;
}

interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  assignment_type: string;
}

export const TwilioAccountSelector = ({
  selectedAccountId,
  selectedPhoneNumber,
  onAccountChange,
  onPhoneNumberChange,
}: TwilioAccountSelectorProps) => {
  const [accounts, setAccounts] = useState<TwilioAccount[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchPhoneNumbers(selectedAccountId);
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("twilio_accounts")
        .select("id, account_name, account_sid")
        .eq("active", true)
        .order("account_name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching Twilio accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneNumbers = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("id, phone_number, friendly_name, assignment_type")
        .eq("twilio_account_id", accountId)
        .eq("active", true)
        .order("phone_number");

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Twilio Account</Label>
        <Select value={selectedAccountId} onValueChange={onAccountChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Twilio account..." />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name} ({account.account_sid.slice(0, 8)}...)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedAccountId && (
        <div>
          <Label>Phone Number</Label>
          <Select value={selectedPhoneNumber} onValueChange={onPhoneNumberChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select phone number..." />
            </SelectTrigger>
            <SelectContent>
              {phoneNumbers.map((phone) => (
                <SelectItem key={phone.id} value={phone.phone_number}>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {phone.friendly_name || phone.phone_number}
                    {phone.assignment_type === "admin" && " (Backup)"}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};