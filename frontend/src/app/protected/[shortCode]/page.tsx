"use client";
import { useState } from 'react';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useParams } from 'next/navigation';

export default function ProtectedPage() {
  const { shortCode } = useParams();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const res = await api.post(`/${shortCode}/verify`, { password: data.password });
      
      // Navigate to target URL
      if (res.data.targetUrl) {
        window.location.href = res.data.targetUrl;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Incorrect password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full shadow-2xl z-10">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Lock size={32} />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Password Protected</h1>
          <p className="text-muted-foreground text-sm">
            This link is protected. Please enter the password to continue to your destination.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input 
              type="password"
              {...register('password', { required: true })}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-center tracking-widest text-lg"
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Unlock Link
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
