import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { dashboardAPI, Pro, Match, ProfileCompletionData } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';

export function useDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pro, setPro] = useState<Pro | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: proData, error: proError } = await dashboardAPI.getProProfile(user.id);
      
      if (proError || !proData) {
        throw new Error('Failed to load profile');
      }

      setPro(proData);

      const completion = await dashboardAPI.getProfileCompletion(proData.id);
      setProfileCompletion(completion);

      const { data: matchData } = await dashboardAPI.getMatches(proData.id);
      if (matchData) {
        setMatches(matchData);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const updateField = async (field: string, value: any) => {
    if (!pro) return;

    const { data, error } = await dashboardAPI.updateProField(pro.id, field, value);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
      return;
    }

    await refresh();

    toast({
      title: 'Updated! ✅',
      description: `Profile is now ${profileCompletion?.completion}% complete`,
    });
  };

  const updateStage = async (stage: string) => {
    if (!pro) return;

    const { error } = await dashboardAPI.updatePipelineStage(pro.id, stage);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stage',
        variant: 'destructive',
      });
      return;
    }

    await refresh();
  };

  const viewMatch = async (matchId: string) => {
    await dashboardAPI.markMatchViewed(matchId);
    await refresh();
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user ID to avoid stale closures

  return {
    pro,
    matches,
    profileCompletion,
    loading,
    refreshing,
    refresh,
    updateField,
    updateStage,
    viewMatch,
  };
}
