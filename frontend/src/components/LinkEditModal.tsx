"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Settings2, Link as LinkIcon, Globe, Smartphone, Lock, Calendar } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface LinkEditModalProps {
  link: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function LinkEditModal({ link, onClose, onUpdated }: LinkEditModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      originalUrl: link.originalUrl || '',
      customSlug: link.slug || '',
      password: '',
      expiry: link.settings?.expiry ? String(link.settings.expiry).slice(0, 16) : '',
      geoTargeting: Array.isArray(link.settings?.geoTargeting) && link.settings.geoTargeting.length > 0 ? link.settings.geoTargeting : [{ country: '', url: '' }],
      deviceTargeting: {
        mobile: link.settings?.deviceTargeting?.mobile || '',
        desktop: link.settings?.deviceTargeting?.desktop || '',
      }
    }
  });

  const { fields: geoFields, append: appendGeo, remove: removeGeo } = useFieldArray({
    control,
    name: 'geoTargeting'
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      data.geoTargeting = data.geoTargeting.filter((g: any) => g.country && g.url);
      if (!data.password) delete data.password;
      await api.put(`/links/${link.id}`, data);
      toast.success('Link updated');
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LinkIcon className="text-primary" />
            Edit Link
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="flex px-6 pt-4 border-b border-border">
          <button
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Details
          </button>
          <button
            className={`pb-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'advanced' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Settings2 size={16} />
            Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'basic' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Destination URL *</label>
                <input
                  {...register('originalUrl', { required: true })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Custom Slug (Optional)</label>
                <input
                  {...register('customSlug')}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={18} className="text-primary" />
                  <h4 className="font-medium">Password Protection</h4>
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Leave blank to remove password"
                />
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={18} className="text-primary" />
                  <h4 className="font-medium">Link Expiry</h4>
                </div>
                <input
                  type="datetime-local"
                  {...register('expiry')}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={18} className="text-primary" />
                  <h4 className="font-medium">Geo Targeting</h4>
                </div>
                {geoFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input {...register(`geoTargeting.${index}.country`)} placeholder="Country Code" className="w-24 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
                    <input {...register(`geoTargeting.${index}.url`)} placeholder="Redirect URL" className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
                    <button type="button" onClick={() => removeGeo(index)} className="p-2 text-muted-foreground hover:text-destructive">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => appendGeo({ country: '', url: '' })} className="text-xs text-primary font-medium hover:underline mt-1">
                  + Add Geo Rule
                </button>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone size={18} className="text-primary" />
                  <h4 className="font-medium">Device Targeting</h4>
                </div>
                <div className="space-y-2">
                  <input {...register('deviceTargeting.mobile')} placeholder="Mobile URL Redirect" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm" />
                  <input {...register('deviceTargeting.desktop')} placeholder="Desktop URL Redirect" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 mt-6 border-t border-border flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-70">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Link'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
