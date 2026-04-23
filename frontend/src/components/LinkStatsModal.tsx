"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, BarChart, Bar } from 'recharts';

export default function LinkStatsModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/${linkId}?range=${range}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load link analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-6xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Link Analytics</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-center gap-2">
            {['7d', '30d', '90d', '1y'].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-sm ${range === r ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {r}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-72 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4"><p className="text-xs text-muted-foreground">Total Clicks</p><p className="text-2xl font-bold">{data?.totalClicks || 0}</p></div>
                <div className="bg-secondary/30 rounded-xl p-4"><p className="text-xs text-muted-foreground">Unique Clicks</p><p className="text-2xl font-bold">{data?.uniqueClicks || 0}</p></div>
                <div className="bg-secondary/30 rounded-xl p-4"><p className="text-xs text-muted-foreground">Last Activity</p><p className="text-sm font-medium">{data?.lastActivity ? new Date(data.lastActivity).toLocaleString() : 'N/A'}</p></div>
              </div>

              <div className="bg-secondary/20 border border-border rounded-xl p-4">
                <h4 className="font-semibold mb-3">Daily Clicks</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.dailyGraph || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2e36" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fill="#3b82f655" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-secondary/20 border border-border rounded-xl p-4">
                  <h4 className="font-semibold mb-3">Devices</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.devices || []} dataKey="value" nameKey="name" outerRadius={80}>
                          {(data?.devices || []).map((_: any, i: number) => (
                            <Cell key={i} fill={['#3b82f6', '#22c55e', '#a855f7', '#f97316'][i % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-secondary/20 border border-border rounded-xl p-4 lg:col-span-2">
                  <h4 className="font-semibold mb-3">Countries</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.countries || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e36" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/20 border border-border rounded-xl p-4">
                <h4 className="font-semibold mb-3">Referrers</h4>
                <div className="space-y-2">
                  {(data?.referrers || []).map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.value} ({item.percent || 0}%)</span>
                    </div>
                  ))}
                  {(data?.referrers || []).length === 0 && <p className="text-sm text-muted-foreground">No referrer data yet.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
