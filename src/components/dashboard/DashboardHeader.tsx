import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  user: { name: string };
}

export default function DashboardHeader({ onMenuClick, user }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <p className="hidden truncate text-sm text-white/60 lg:block">Signed in as <span className="text-white">{user.name}</span></p>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to site
      </Link>
    </header>
  );
}
