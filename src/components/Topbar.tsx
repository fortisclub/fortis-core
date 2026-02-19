
import React, { useState } from 'react';
import { Search, Bell, Plus } from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { useApp } from '../store';

export const Topbar: React.FC = () => {
  const [search, setSearch] = useState('');
  const location = useLocation();
  const { openModal } = useApp();

  const getActionButton = () => {
    if (location.pathname === '/leads') {
      return { label: 'Novo Lead', action: () => openModal('LEAD') };
    }
    return null;
  };

  const actionButton = getActionButton();

  return (
    <header className="absolute top-0 left-0 right-0 h-16 bg-fortis-dark/60 border-b border-fortis-surface/50 flex items-center justify-between px-8 z-40 backdrop-blur-2xl">
      <div className="flex items-center flex-1 max-w-xs">
        <div className="relative w-full group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fortis-mid group-focus-within:text-fortis-brand transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-fortis-panel/40 border border-fortis-surface/60 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-fortis-brand/50 transition-all placeholder:text-fortis-mid"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {actionButton && (
          <button
            onClick={actionButton.action}
            className="flex items-center gap-2 bg-fortis-brand hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-fortis-brand/20 active:scale-95"
          >
            <Plus size={18} />
            {actionButton.label}
          </button>
        )}

        <button className="text-fortis-mid hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-fortis-dark" />
        </button>
      </div>
    </header>
  );
};
