'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  TableProperties, 
  Map, 
  Users, 
  Sparkles, 
  Bug, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import SprintSelector from '../ui/SprintSelector';
import { ADOIteration } from '../../lib/types';

interface SidebarProps {
  sprints: ADOIteration[];
  lastSyncTime?: string | null;
  appTitle?: string;
}

export default function Sidebar({ sprints, lastSyncTime, appTitle = 'eComm IT Portal' }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/sync/ado', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Sync failed');
      }
      // Refresh the page data after successful sync
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to sync ADO data. Check your connection or PAT.');
    } finally {
      setIsSyncing(false);
    }
  };

  const queryString = searchParams.toString();
  const querySuffix = queryString ? `?${queryString}` : '';

  const navItems = [
    { 
      name: 'Dashboard', 
      href: `/dashboard${querySuffix}`, 
      activePattern: /^\/dashboard/, 
      icon: LayoutDashboard 
    },
    { 
      name: 'Sprint Detail', 
      href: `/sprints${querySuffix}`, 
      activePattern: /^\/sprints/, 
      icon: TableProperties 
    },
    { 
      name: 'eComm Roadmap', 
      href: `/roadmap${querySuffix}`, 
      activePattern: /^\/roadmap/, 
      icon: Map 
    },
    { 
      name: 'Dev Performance', 
      href: `/performance${querySuffix}`, 
      activePattern: /^\/performance/, 
      icon: Users 
    },
    { 
      name: 'Sprint Recap (AI)', 
      href: `/recap${querySuffix}`, 
      activePattern: /^\/recap/, 
      icon: Sparkles 
    },
    { 
      name: 'Bug Trends', 
      href: `/bugs${querySuffix}`, 
      activePattern: /^\/bugs/, 
      icon: Bug 
    },
  ];

  return (
    <aside className="w-64 bg-[#FAFBFC] text-[#172B4D] flex flex-col h-screen fixed left-0 top-0 border-r border-[#DFE1E6] z-30 print:hidden">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-[#DFE1E6]">
        <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">
          {appTitle}
        </h1>
        <p className="text-[11px] text-[#6B778C] font-semibold tracking-wider uppercase mt-1">
          Executive Reporting
        </p>
      </div>

      {/* Active Sprint Info & Selector */}
      <div className="px-4 py-2 border-b border-[#DFE1E6] bg-white">
        <SprintSelector sprints={sprints} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-bold text-[#6B778C] uppercase tracking-wider">
          Pages
        </div>
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-[#DEEBFF] text-[#0052CC]' 
                  : 'text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#0052CC]' : 'text-[#6B778C]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#DFE1E6] bg-[#FAFBFC] text-[11px] text-[#6B778C] flex flex-col space-y-3">
        <div>
          <div className="font-bold text-[#172B4D] mb-0.5">ADO Analytics v4 OData</div>
          {lastSyncTime ? (
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006644]"></span>
              <span>Last synced: {new Date(lastSyncTime).toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8B00]"></span>
              <span>No data synced yet</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center w-full space-x-2 bg-white border border-[#DFE1E6] hover:bg-[#EBECF0] text-[#172B4D] font-semibold py-2 px-3 rounded shadow-sm disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync ADO Data'}</span>
        </button>
      </div>
    </aside>
  );
}
