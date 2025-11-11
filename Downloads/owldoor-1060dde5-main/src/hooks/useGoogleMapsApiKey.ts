import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-maps-config');
        if (data?.googleMapsApiKey) {
          setApiKey(data.googleMapsApiKey);
        }
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  return { apiKey, loading };
};
