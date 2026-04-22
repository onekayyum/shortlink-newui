"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Activity, Link2, MousePointerClick, Plus, TrendingUp, MoreHorizontal, Copy, ExternalLink, QrCode } from 'lucide-react';
import LinkModal from '@/components/LinkModal';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, linksRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/links')
      ]);
      setStats(statsRes.data);
      setLinks(linksRes.data.links);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (shortCode: string) => {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const statCards = [
    { title: 'Total Links', value: stats?.totalLinks || 0, icon: Link2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Clicks', value: stats?.totalClicks || 0, icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Growth', value: `${stats?.growth || 0}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Here is what's happening with your links today.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={20} />
          Create Link
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index} 
            className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 hover:border-primary/50 transition-colors"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border p-6 rounded-2xl"
      >
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-primary" size={20} />
          <h3 className="text-lg font-bold">Clicks over last 7 days</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.dailyGraph || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#181b21', border: '1px solid #272a30', borderRadius: '0.75rem', color: '#fff' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Links Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold">Recent Links</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground text-sm">
                <th className="p-4 font-medium">Short Link</th>
                <th className="p-4 font-medium">Original URL</th>
                <th className="p-4 font-medium">Clicks</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-secondary/10 transition-colors group">
                  <td className="p-4">
                    <div className="font-medium text-primary">{process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/{link.shortCode}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(link.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 max-w-[200px] truncate text-muted-foreground">
                    {link.originalUrl}
                  </td>
                  <td className="p-4 font-medium">{link.clicks || 0}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                      Active
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(link.shortCode)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Copy">
                        <Copy size={16} />
                      </button>
                      <a href={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/${link.shortCode}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Open">
                        <ExternalLink size={16} />
                      </a>
                      <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="QR Code">
                        <QrCode size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No links created yet. Create your first short link above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {isModalOpen && <LinkModal onClose={() => setIsModalOpen(false)} onCreated={fetchData} />}
    </div>
  );
}
