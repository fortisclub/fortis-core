
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { AfterSales } from './pages/AfterSales';
import { Settings } from './pages/Settings';
import { UsersPage } from './pages/Users';
import { Clients } from './pages/Clients';
import { Sales } from './pages/Sales';
import { LeadModal } from './components/LeadModal';
import { BellRing, X, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

const NotificationCenter = () => {
  const { notifications, clearNotification } = useApp();

  return (
    <div className="fixed bottom-8 right-8 z-[5000] space-y-4 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto bg-fortis-panel border border-fortis-surface p-4 rounded-2xl shadow-2xl min-w-[300px] animate-in slide-in-from-right-full duration-300 flex items-start gap-3"
        >
          <div className={`p-2 rounded-lg ${n.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : 'bg-fortis-brand/10 text-fortis-brand'}`}>
            <BellRing size={16} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">{n.title}</p>
            <p className="text-[10px] text-fortis-mid font-semibold mt-0.5">{n.message}</p>
          </div>
          <button onClick={() => clearNotification(n.id)} className="text-fortis-mid hover:text-white"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
};


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeModal, closeModal } = useApp();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-fortis-dark selection:bg-fortis-brand selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        <Topbar />
        <div className="flex-1 overflow-y-auto scroll-smooth pt-16 custom-scrollbar flex flex-col">
          <main className="p-8 pb-12 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>
      <LeadModal isOpen={activeModal === 'LEAD'} onClose={closeModal} />
      <NotificationCenter />
    </div>
  );
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-fortis-dark flex items-center justify-center">
        <Loader2 className="animate-spin text-fortis-brand" size={40} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
            <Route path="/leads" element={<RequireAuth><AppLayout><Leads /></AppLayout></RequireAuth>} />
            <Route path="/clientes" element={<RequireAuth><AppLayout><Clients /></AppLayout></RequireAuth>} />
            <Route path="/vendas" element={<RequireAuth><AppLayout><Sales /></AppLayout></RequireAuth>} />
            <Route path="/pos-venda" element={<RequireAuth><AppLayout><AfterSales /></AppLayout></RequireAuth>} />
            <Route path="/usuarios" element={<RequireAuth><AppLayout><UsersPage /></AppLayout></RequireAuth>} />
            <Route path="/configuracoes" element={<RequireAuth><AppLayout><Settings /></AppLayout></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
