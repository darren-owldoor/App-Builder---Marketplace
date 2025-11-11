import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Database, DollarSign, Shield, Zap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description: string;
  category: string;
  updated_at: string;
}

export const SystemLimitsManager = () => {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingId: string, newValue: any) => {
    setSaving(settingId);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq("id", settingId);

      if (error) throw error;

      toast({
        title: "Setting Updated",
        description: "System limit has been updated successfully",
      });

      await loadSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const renderSettingInput = (setting: AdminSetting) => {
    const isSaving = saving === setting.id;

    if (setting.setting_type === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor={setting.id}>{formatLabel(setting.setting_key)}</Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Switch
            id={setting.id}
            checked={setting.setting_value === true}
            onCheckedChange={(checked) => updateSetting(setting.id, checked)}
            disabled={isSaving}
          />
        </div>
      );
    }

    if (setting.setting_type === "number") {
      return (
        <div className="space-y-2">
          <Label htmlFor={setting.id}>{formatLabel(setting.setting_key)}</Label>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
          <div className="flex gap-2">
            <Input
              id={setting.id}
              type="number"
              defaultValue={setting.setting_value}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value !== setting.setting_value) {
                  updateSetting(setting.id, value);
                }
              }}
              disabled={isSaving}
              className="max-w-xs"
            />
            {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={setting.id}>{formatLabel(setting.setting_key)}</Label>
        <p className="text-sm text-muted-foreground">{setting.description}</p>
        <div className="flex gap-2">
          <Input
            id={setting.id}
            defaultValue={setting.setting_value}
            onBlur={(e) => {
              if (e.target.value !== setting.setting_value) {
                updateSetting(setting.id, e.target.value);
              }
            }}
            disabled={isSaving}
            className="max-w-xs"
          />
          {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
      </div>
    );
  };

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "database":
        return <Database className="h-4 w-4" />;
      case "billing":
        return <DollarSign className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      case "api":
        return <Zap className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter((s) => s.category === category);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Limits & Configuration
        </CardTitle>
        <CardDescription>
          Control maximum limits for features, API usage, and billing across the entire platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="features">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="features" className="flex items-center gap-1">
              {getCategoryIcon("features")}
              Features
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-1">
              {getCategoryIcon("api")}
              API
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-1">
              {getCategoryIcon("database")}
              Database
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1">
              {getCategoryIcon("billing")}
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              {getCategoryIcon("security")}
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6 pt-6">
            {getSettingsByCategory("features").map((setting) => (
              <div key={setting.id} className="border-b pb-4 last:border-0">
                {renderSettingInput(setting)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="api" className="space-y-6 pt-6">
            {getSettingsByCategory("api").map((setting) => (
              <div key={setting.id} className="border-b pb-4 last:border-0">
                {renderSettingInput(setting)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="database" className="space-y-6 pt-6">
            {getSettingsByCategory("database").map((setting) => (
              <div key={setting.id} className="border-b pb-4 last:border-0">
                {renderSettingInput(setting)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 pt-6">
            {getSettingsByCategory("billing").map((setting) => (
              <div key={setting.id} className="border-b pb-4 last:border-0">
                {renderSettingInput(setting)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="security" className="space-y-6 pt-6">
            {getSettingsByCategory("security").length > 0 ? (
              getSettingsByCategory("security").map((setting) => (
                <div key={setting.id} className="border-b pb-4 last:border-0">
                  {renderSettingInput(setting)}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No security settings configured yet
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Changes to these settings take effect immediately and apply globally to all users and features.
            Exercise caution when modifying limits.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
