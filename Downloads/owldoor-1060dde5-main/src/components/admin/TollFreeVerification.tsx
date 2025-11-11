import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw } from "lucide-react";

export function TollFreeVerification() {
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSid, setEditingSid] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    twilioAccount: 'primary' as 'primary' | 'backup',
    businessName: "OwlDoor",
    businessWebsite: "https://owldoor.com",
    businessAddress: {
      street: "",
      street2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US"
    },
    useCaseCategories: ["2FA"],
    useCaseSummary: "Real estate agent matching notifications including match alerts, appointment reminders, and service updates",
    messageSamples: [
      "Welcome to OwlDoor! You'll receive agent match alerts to this number. Reply STOP to unsubscribe or HELP for support. Msg&data rates may apply.",
      "OwlDoor Alert: 3 new agents match your criteria in [City]. Log in to view matches: owldoor.com/matches Reply STOP to unsubscribe",
      "OwlDoor Reminder: Your consultation with [Agent Name] is tomorrow at 2 PM. Need to reschedule? Reply or call 888-888-8253",
      "OwlDoor: Your agent search preferences have been updated. You're now matching with agents in [Area]. Manage preferences: owldoor.com/settings",
      "OwlDoor: You've been unsubscribed from SMS alerts. You won't receive further messages. Questions? Call 888-888-8253"
    ],
    optInWorkflow: `Users explicitly opt-in to receive SMS messages through the following methods:

1. WEBSITE FORM: 
   - Users enter their phone number on owldoor.com/get-started
   - A checkbox requires explicit consent with clear disclosure
   - Consent language states: "By providing your phone number and checking this box, you agree to receive SMS messages from OwlDoor regarding real estate agent matching services. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe."
   - Timestamp and IP address are logged for compliance

2. DOUBLE OPT-IN CONFIRMATION:
   - After form submission, we send a confirmation SMS
   - User must reply YES to confirm subscription
   - Only after confirmation do they receive service messages

3. VERBAL CONSENT:
   - During phone consultations, agents ask for SMS consent
   - Verbal consent is recorded with timestamp
   - Confirmation SMS is sent documenting the consent

All opt-ins are logged with: timestamp, method, IP address (for web), and full consent language shown.`,
    optOutWorkflow: `Users can opt-out instantly through multiple methods:

1. TEXT MESSAGE: Reply STOP to any message
2. PHONE: Call 888-888-8253 to request removal
3. WEBSITE: Unsubscribe link in user account settings
4. EMAIL: Send request to support@owldoor.com

Opt-outs are processed immediately and automatically. Users receive a final confirmation message. Opt-out list is maintained indefinitely to prevent re-subscription without explicit new consent.`,
    messageVolume: "5000",
    phoneNumberSid: ""
  });

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('twilio-toll-free-verification', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setVerifications(data.tollfree_verifications || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phoneNumberSid && !editingSid) {
      toast.error("Phone Number SID is required");
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('twilio-toll-free-verification', {
        body: {
          action: editingSid ? 'update' : 'create',
          data: editingSid ? { sid: editingSid, ...formData } : formData
        }
      });

      if (error) throw error;

      toast.success(editingSid ? "Verification updated successfully" : "Verification submitted successfully");
      setShowForm(false);
      setEditingSid(null);
      loadVerifications();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit verification");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (verification: any) => {
    setFormData({
      twilioAccount: 'primary',
      businessName: verification.business_name || "",
      businessWebsite: verification.business_website || "",
      businessAddress: {
        street: verification.business_street_address || "",
        street2: verification.business_street_address_2 || "",
        city: verification.business_city || "",
        state: verification.business_state_province_region || "",
        postalCode: verification.business_postal_code || "",
        country: verification.business_country || "US"
      },
      useCaseCategories: verification.use_case_categories || [],
      useCaseSummary: verification.use_case_summary || "",
      messageSamples: verification.production_message_sample?.split('\n\n') || [],
      optInWorkflow: verification.opt_in_workflow_description || "",
      optOutWorkflow: verification.opt_out_workflow_description || "",
      messageVolume: verification.message_volume || "100",
      phoneNumberSid: verification.tollfree_phone_number_sid || ""
    });
    setEditingSid(verification.sid);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Toll-Free Verification</CardTitle>
              <CardDescription>
                Manage Twilio toll-free verification requests for compliance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadVerifications} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => { setShowForm(true); setEditingSid(null); }} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && verifications.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : verifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No verification requests found</p>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <Card key={verification.sid}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold">Status:</span>{" "}
                          <span className={`${
                            verification.status === 'approved' ? 'text-green-600' :
                            verification.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {verification.status}
                          </span>
                        </div>
                        <div><span className="font-semibold">Business:</span> {verification.business_name}</div>
                        <div><span className="font-semibold">Phone:</span> {verification.tollfree_phone_number_sid}</div>
                        {verification.rejection_reason && (
                          <div className="text-red-600">
                            <span className="font-semibold">Rejection Reason:</span> {verification.rejection_reason}
                          </div>
                        )}
                      </div>
                      {verification.status === 'rejected' && (
                        <Button onClick={() => handleEdit(verification)} size="sm">
                          Edit & Resubmit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSid ? 'Edit' : 'Create'} Toll-Free Verification</CardTitle>
            <CardDescription>
              Submit accurate information for Twilio compliance review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="twilioAccount">Twilio Account *</Label>
                <Select
                  value={formData.twilioAccount}
                  onValueChange={(value: 'primary' | 'backup') => setFormData({ ...formData, twilioAccount: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Account</SelectItem>
                    <SelectItem value="backup">Backup Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessWebsite">Business Website *</Label>
                  <Input
                    id="businessWebsite"
                    type="url"
                    value={formData.businessWebsite}
                    onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Business Address</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={formData.businessAddress.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessAddress: { ...formData.businessAddress, street: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.businessAddress.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessAddress: { ...formData.businessAddress, city: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.businessAddress.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessAddress: { ...formData.businessAddress, state: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.businessAddress.postalCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessAddress: { ...formData.businessAddress, postalCode: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumberSid">Toll-Free Phone Number SID *</Label>
                <Input
                  id="phoneNumberSid"
                  value={formData.phoneNumberSid}
                  onChange={(e) => setFormData({ ...formData, phoneNumberSid: e.target.value })}
                  placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  disabled={!!editingSid}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCaseSummary">Use Case Summary *</Label>
                <Textarea
                  id="useCaseSummary"
                  value={formData.useCaseSummary}
                  onChange={(e) => setFormData({ ...formData, useCaseSummary: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageSamples">Message Samples (one per line) *</Label>
                <Textarea
                  id="messageSamples"
                  value={formData.messageSamples.join('\n\n')}
                  onChange={(e) => setFormData({ ...formData, messageSamples: e.target.value.split('\n\n') })}
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optInWorkflow">Opt-In Workflow Description *</Label>
                <Textarea
                  id="optInWorkflow"
                  value={formData.optInWorkflow}
                  onChange={(e) => setFormData({ ...formData, optInWorkflow: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optOutWorkflow">Opt-Out Workflow Description *</Label>
                <Textarea
                  id="optOutWorkflow"
                  value={formData.optOutWorkflow}
                  onChange={(e) => setFormData({ ...formData, optOutWorkflow: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditingSid(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSid ? 'Update' : 'Submit'} Verification
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
