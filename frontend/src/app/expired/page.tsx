"use client";
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
        <p className="text-muted-foreground mb-8">
          The link you are trying to access has expired and is no longer available.
        </p>
        <Link href="/" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all inline-block">
          Create your own short links
        </Link>
      </div>
    </div>
  );
}
