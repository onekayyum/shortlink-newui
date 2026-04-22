"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Users, Link2, ShieldAlert, Mail, Activity, Trash2, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, settingsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/settings')
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data.users);
        setSettings(settingsRes.data.settings);
      } catch (err) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAdminData();
    }
  }, [user, router]);

  const toggleBan = async (userId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'banned' ? `/admin/users/${userId}/unban` : `/admin/users/${userId}/ban`;
      await api.post(endpoint);
      setUsers(users.map(u => u.id === userId ? { ...u, status: currentStatus === 'banned' ? 'active' : 'banned' } : u));
      toast.success(`User ${currentStatus === 'banned' ? 'unbanned' : 'banned'} successfully`);
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user and all their links?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const updateSettings = async () => {
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Links', value: stats?.totalLinks || 0, icon: Link2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Total Clicks', value: stats?.totalClicks || 0, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Control Panel</h1>
        <p className="text-muted-foreground mt-1">Manage users, view system stats, and configure global settings.</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <ShieldAlert className="text-primary" />
            <h3 className="text-lg font-bold">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-sm">
                  <th className="p-4 font-medium">Username</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-medium">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.status === 'banned' ? 'bg-destructive/20 text-destructive' : 'bg-green-500/10 text-green-500'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {u.role !== 'admin' && (
                          <>
                            <button onClick={() => toggleBan(u.id, u.status)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title={u.status === 'banned' ? 'Unban' : 'Ban'}>
                              <Ban size={16} />
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-destructive/20 rounded-lg text-destructive" title="Delete User">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden h-fit">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <Mail className="text-primary" />
            <h3 className="text-lg font-bold">SMTP Settings</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable SMTP</label>
              <input 
                type="checkbox" 
                checked={settings?.smtp?.enabled || false}
                onChange={(e) => setSettings({...settings, smtp: {...settings.smtp, enabled: e.target.checked}})}
                className="w-5 h-5 rounded accent-primary"
              />
            </div>
            {settings?.smtp?.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Host</label>
                  <input 
                    type="text"
                    value={settings.smtp.host}
                    onChange={(e) => setSettings({...settings, smtp: {...settings.smtp, host: e.target.value}})}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Port</label>
                  <input 
                    type="number"
                    value={settings.smtp.port}
                    onChange={(e) => setSettings({...settings, smtp: {...settings.smtp, port: Number(e.target.value)}})}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
                  <input 
                    type="text"
                    value={settings.smtp.email}
                    onChange={(e) => setSettings({...settings, smtp: {...settings.smtp, email: e.target.value}})}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Password</label>
                  <input 
                    type="password"
                    value={settings.smtp.password}
                    onChange={(e) => setSettings({...settings, smtp: {...settings.smtp, password: e.target.value}})}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </>
            )}
            <button 
              onClick={updateSettings}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all mt-4"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
