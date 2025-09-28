import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SigninForm } from '@/components/auth/signin-form';
import { RegisterForm } from '@/components/auth/register-form';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTab?: 'signin' | 'signup';
}

export function AuthDialog({ open, onOpenChange, onSuccess, defaultTab = 'signin' }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog auth-dialog__content">
        <DialogHeader>
          <DialogTitle className="auth-dialog__title">Welcome</DialogTitle>
          <DialogDescription className="auth-dialog__description">
            Sign in or create an account to continue.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="auth-dialog__tabs">
          <TabsList className="auth-dialog__tabs-list">
            <TabsTrigger className="auth-dialog__tabs-trigger" value="signin">Sign In</TabsTrigger>
            <TabsTrigger className="auth-dialog__tabs-trigger" value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent className="auth-dialog__tab auth-dialog__tab--signin" value="signin">
            <SigninForm disableNavigate onSuccess={() => onSuccess?.()} />
          </TabsContent>
          <TabsContent className="auth-dialog__tab auth-dialog__tab--signup" value="signup">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

