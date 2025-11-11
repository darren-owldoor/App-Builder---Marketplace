import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, X, Loader2 } from 'lucide-react';
import { syncAgentCoverageToMarketCoverage, needsCoverageSync } from '@/utils/syncCoverageToMarketCoverage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CoverageSyncBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkIfNeedsSync();
  }, []);

  const checkIfNeedsSync = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      const needs = await needsCoverageSync(user.id);
      setShowBanner(needs);
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const handleSync = async () => {
    if (!userId) return;

    setSyncing(true);
    try {
      const result = await syncAgentCoverageToMarketCoverage(userId);
      
      if (result.success) {
        toast.success(result.message);
        setShowBanner(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to sync coverage areas');
    } finally {
      setSyncing(false);
    }
  };

  if (!showBanner) return null;

  return (
    <Alert className="border-primary bg-primary/5 mb-6">
      <MapPin className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <AlertTitle className="text-base font-semibold mb-2">
          Sync Your Coverage Areas
        </AlertTitle>
        <AlertDescription className="text-sm mb-3">
          We've upgraded our coverage system! Sync your existing coverage areas to access better management tools and automatic competition scoring.
        </AlertDescription>
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            size="sm"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
          <Button 
            onClick={() => setShowBanner(false)} 
            variant="outline"
            size="sm"
          >
            Maybe Later
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowBanner(false)}
        className="ml-auto"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};
