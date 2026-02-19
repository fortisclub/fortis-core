import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Settings, Package, BookUser, ShoppingBag, ChevronLeft, LogOut } from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
  { path: '/leads', label: 'Leads', icon: Users, color: 'text-amber-400' },
  { path: '/pos-venda', label: 'Pós-venda', icon: Package, color: 'text-purple-400' },
  { path: '/clientes', label: 'Clientes', icon: BookUser, color: 'text-emerald-400' },
  { path: '/vendas', label: 'Vendas', icon: ShoppingBag, color: 'text-rose-400' },
  { path: '/usuarios', label: 'Usuários', icon: UserCheck, color: 'text-indigo-400' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser, isSidebarCollapsed, toggleSidebar } = useApp();
  const { signOut } = useAuth();

  const firstName = currentUser?.name.split(' ')[0] || '';

  return (
    <aside className={`bg-fortis-dark border-r border-fortis-surface h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-8 flex items-center ${isSidebarCollapsed ? 'justify-center border-b border-fortis-surface/30 mb-4' : 'justify-between'}`}>
        {!isSidebarCollapsed && (
          <h1 className="text-2xl font-bold tracking-tighter text-fortis-brand flex items-center gap-2 animate-in fade-in duration-300">
            FORTIS <span className="text-white font-light text-sm uppercase tracking-[0.3em]">Core</span>
          </h1>
        )}
        {isSidebarCollapsed && (
          <div className="text-fortis-brand font-black text-xl animate-in zoom-in duration-300">F</div>
        )}
      </div>

      <nav className={`flex-1 space-y-2 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.label : ''}
              className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                ? 'bg-fortis-brand/10 text-fortis-brand'
                : 'text-fortis-mid hover:bg-fortis-surface hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
            >
              <item.icon size={20} className={`flex-shrink-0 ${item.color} ${isActive ? 'drop-shadow-[0_0_8px_currentColor]' : 'opacity-70 group-hover:opacity-100'} transition-all`} />
              {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden animate-in fade-in duration-300">{item.label}</span>}
              {isActive && !isSidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-fortis-brand shadow-[0_0_8px_rgba(88,133,117,1)]" />}
              {isActive && isSidebarCollapsed && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-fortis-brand rounded-l-full" />}
            </Link>
          );
        })}
      </nav>

      <div className={`mt-auto border-t border-fortis-surface space-y-4 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`bg-fortis-panel border border-fortis-surface/50 rounded-xl flex items-center shadow-lg relative ${isSidebarCollapsed ? 'flex-col py-4 px-0 gap-3' : 'p-4 gap-3'}`}>
          <img
            src={currentUser?.avatar}
            alt="Avatar"
            className={`rounded-full object-cover border border-fortis-surface/50 transition-all flex-shrink-0 ${isSidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}
          />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {firstName}
              </p>
              <button
                onClick={signOut}
                className="text-[10px] text-fortis-mid font-semibold hover:text-red-400 transition-colors leading-none"
              >
                Sair
              </button>
            </div>
          )}
          {isSidebarCollapsed && (
            <button
              onClick={signOut}
              className="p-1.5 hover:bg-red-500/10 text-fortis-mid hover:text-red-400 rounded-lg transition-colors group"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
          {!isSidebarCollapsed && (
            <Link
              to="/configuracoes"
              className={`p-1.5 rounded-lg transition-all duration-200 group ${location.pathname.startsWith('/configuracoes')
                ? 'text-fortis-brand'
                : 'text-fortis-mid hover:text-white'
                }`}
              title="Configurações"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500 text-slate-400 group-hover:text-white" />
            </Link>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-2 p-2 hover:bg-fortis-surface rounded-lg transition-all text-fortis-mid hover:text-white group font-bold text-[10px] uppercase tracking-widest ${isSidebarCollapsed ? 'justify-center hover:bg-fortis-brand/10 hover:text-fortis-brand' : ''}`}
          >
            <ChevronLeft size={16} className={`transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            {!isSidebarCollapsed && <span>Recolher Menu</span>}
          </button>

          {!isSidebarCollapsed && (
            <div className="text-center pb-2 animate-in fade-in duration-300">
              <span className="text-[8px] text-fortis-mid font-bold uppercase tracking-[0.2em] opacity-50">
                v1.0.4 PREMIUM
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
