"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Copy, Pencil, Trash2, BarChart3, Search } from 'lucide-react';
import LinkEditModal from '@/components/LinkEditModal';
import LinkStatsModal from '@/components/LinkStatsModal';

export default function LinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'time' | 'views'>('time');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [statsLinkId, setStatsLinkId] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/links?q=${encodeURIComponent(search)}&sortBy=${sortBy}&order=${order}&page=${page}&limit=15`);
      setLinks(res.data.links || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [search, sortBy, order, page]);

  const getShortUrl = (link: any) => `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/${link.shortCode || (link.slug ? `${link.slug}/${link.uniqueId}` : link.uniqueId)}`;

  const copyLink = async (link: any) => {
    await navigator.clipboard.writeText(getShortUrl(link));
    toast.success('Copied to clipboard');
  };

  const deleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await api.delete(`/links/${id}`);
      toast.success('Link deleted');
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete link');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Links</h1>
          <p className="text-muted-foreground mt-1">Search, edit, delete, and analyze your links.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search slug or destination URL..." className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'time' | 'views')} className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm">
          <option value="time">Sort by time</option>
          <option value="views">Sort by views</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')} className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground text-sm">
                <th className="p-4 font-medium">Short URL</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Clicks</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading links...</td></tr>
              ) : links.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No links found.</td></tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4 text-primary font-medium">{getShortUrl(link)}</td>
                    <td className="p-4 max-w-[280px] truncate text-muted-foreground">{link.originalUrl}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(link.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-medium">{link.clicks || 0}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${link.status === 'expired' ? 'bg-yellow-500/10 text-yellow-500' : link.status === 'protected' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-500'}`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyLink(link)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Copy"><Copy size={16} /></button>
                        <button onClick={() => setEditingLink(link)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={16} /></button>
                        <button onClick={() => setStatsLinkId(link.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground" title="Stats"><BarChart3 size={16} /></button>
                        <button onClick={() => deleteLink(link.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-secondary disabled:opacity-50">Prev</button>
        <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-secondary disabled:opacity-50">Next</button>
      </div>

      {editingLink && <LinkEditModal link={editingLink} onClose={() => setEditingLink(null)} onUpdated={fetchLinks} />}
      {statsLinkId && <LinkStatsModal linkId={statsLinkId} onClose={() => setStatsLinkId(null)} />}
    </div>
  );
}
