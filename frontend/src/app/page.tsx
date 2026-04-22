"use client";
import Link from 'next/link';
import { LinkIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[150px] rounded-full pointer-events-none" />

      <header className="px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xl font-bold text-foreground">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <LinkIcon size={18} />
          </div>
          LinkSaaS
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
            Login
          </Link>
          <Link href="/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Shorten links.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              Expand your reach.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A premium, fast, and secure URL shortener with advanced analytics, geo-targeting, and password protection built for modern teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
              Start for free
              <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="w-full sm:w-auto bg-secondary hover:bg-secondary/80 text-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2">
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
