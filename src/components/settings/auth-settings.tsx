import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function AuthSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth-settings');
        const json = await res.json();
        setRequireApproval(Boolean(json?.data?.requireAdminApproval));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const save = async (value: boolean) => {
    setRequireApproval(value);
    try {
      await fetch('/api/auth-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requireAdminApproval: value }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Control authentication behavior for new signups.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Switch id="require-approval" checked={requireApproval} disabled={loading} onCheckedChange={save} />
          <div>
            <Label htmlFor="require-approval">Require admin approval for new signups</Label>
            <p className="text-sm text-muted-foreground">When enabled, new users cannot sign in until an admin approves the account.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

