"use client";
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Key, User, Shield, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const refreshApiKey = async () => {
    try {
      setLoading(true);
      await api.post('/auth/apikey/refresh');
      await checkAuth(); // Refresh user state
      toast.success('API Key regenerated successfully');
    } catch (err) {
      toast.error('Failed to regenerate API key');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      toast.success('API Key copied to clipboard');
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and API keys.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <User className="text-primary" />
          <h3 className="text-lg font-bold">Profile Settings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Username</label>
              <input 
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm opacity-70 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Username cannot be changed currently.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Role</label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium capitalize">
                <Shield size={16} className={user?.role === 'admin' ? 'text-primary' : 'text-muted-foreground'} />
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Key className="text-primary" />
          <h3 className="text-lg font-bold">Developer API</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Your API Key</label>
              <div className="flex gap-2 max-w-lg">
                <input 
                  type="password"
                  value={user?.apiKey || ''}
                  disabled
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono"
                />
                <button 
                  onClick={copyApiKey}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use this key in the Authorization header: <code className="bg-secondary px-1 rounded">Bearer YOUR_API_KEY</code>
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <button 
                onClick={refreshApiKey}
                disabled={loading}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Regenerate API Key
              </button>
              <p className="text-xs text-destructive mt-2 font-medium">
                Warning: Regenerating your API key will immediately invalidate your old key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
