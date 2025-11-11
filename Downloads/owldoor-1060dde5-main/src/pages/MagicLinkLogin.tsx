import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MagicLinkLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your magic link...');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No token provided in the magic link');
      return;
    }

    verifyMagicLink();
  }, [token]);

  const verifyMagicLink = async () => {
    try {
      setStatus('verifying');
      setMessage('Verifying your magic link...');

      console.log('Verifying token:', token);

      // Call the verify-magic-link edge function
      const { data, error } = await supabase.functions.invoke('verify-magic-link', {
        body: { token }
      });

      if (error) {
        console.error('Edge function error:', error);
        // Try to extract error message from the response
        throw new Error(error.message || 'Failed to verify magic link');
      }

      if (data?.error) {
        console.error('Verification failed:', data.error);
        throw new Error(data.error);
      }

      if (data?.redirectUrl) {
        setStatus('success');
        setMessage('Magic link verified! Logging you in...');
        
        // Redirect to the authentication URL
        console.log('Redirecting to:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      } else {
        console.error('No redirect URL in response:', data);
        throw new Error('Invalid response from server. Please try again.');
      }
    } catch (error: any) {
      console.error('Magic link verification error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to verify magic link. It may have expired or already been used.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Magic Link Login</CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your link...'}
            {status === 'success' && 'Success! Redirecting you now...'}
            {status === 'error' && 'There was a problem with your link'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Return to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkLogin;
