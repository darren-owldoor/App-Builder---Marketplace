import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  requiresChange: boolean;
  currentPassword?: string;
}

export function PasswordChangeModal({ 
  open, 
  onOpenChange, 
  requiresChange,
  currentPassword 
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    validatePassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const allRequirementsMet = Object.values(passwordStrength).every(v => v);
    if (!allRequirementsMet) {
      toast({
        title: "Password too weak",
        description: "Please meet all password requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('change-password', {
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });

      if (error) throw error;

      toast({
        title: "Password changed successfully",
        description: "Your password has been updated. You can now use your new password to log in.",
      });

      // Close modal and refresh
      if (onOpenChange) {
        onOpenChange(false);
      }
      window.location.reload();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Failed to change password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={requiresChange ? undefined : onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onPointerDownOutside={requiresChange ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={requiresChange ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {requiresChange ? 'Password Change Required' : 'Change Password'}
          </DialogTitle>
          <DialogDescription>
            {requiresChange 
              ? 'For security reasons, you must change your temporary password before continuing.'
              : 'Create a strong password to protect your account.'
            }
          </DialogDescription>
        </DialogHeader>

        {requiresChange && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              You are currently using a temporary password. Please create a new secure password.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Password Requirements</Label>
            <div className="space-y-1 text-sm">
              <PasswordRequirement 
                met={passwordStrength.length} 
                text="At least 12 characters" 
              />
              <PasswordRequirement 
                met={passwordStrength.uppercase} 
                text="One uppercase letter" 
              />
              <PasswordRequirement 
                met={passwordStrength.lowercase} 
                text="One lowercase letter" 
              />
              <PasswordRequirement 
                met={passwordStrength.number} 
                text="One number" 
              />
              <PasswordRequirement 
                met={passwordStrength.special} 
                text="One special character (!@#$%^&*)" 
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {!requiresChange && onOpenChange && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !Object.values(passwordStrength).every(v => v)}
              className="flex-1"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );
}
