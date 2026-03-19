
import React, { useState } from 'react';
import { MoreVertical, Shield, Calendar, UserCheck, UserX, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../store';
import { ROLE_LABELS } from '../constants';
import { UserModal } from '../components/UserModal';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const UsersPage: React.FC = () => {
  const { users, currentUser, pendingApprovals, approveUser, rejectUser } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { sortedData: sortedUsers, sortConfig, requestSort } = useTableSort(users);

  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Equipe</h2>
            <p className="text-fortis-mid text-sm font-semibold">Controle de acessos e permissões (RBAC).</p>
          </div>
        </div>

        {/* ── Aprovações Pendentes (somente ADMIN) ── */}
        {isAdmin && pendingApprovals.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden shadow-lg">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-500/20 bg-amber-500/10">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-sm">Aprovações Pendentes</h3>
                <p className="text-amber-400/80 text-xs font-medium">
                  {pendingApprovals.length} {pendingApprovals.length === 1 ? 'novo usuário aguarda' : 'novos usuários aguardam'} sua aprovação.
                </p>
              </div>
            </div>

            <div className="divide-y divide-amber-500/10">
              {pendingApprovals.map(approval => (
                <div key={approval.id} className="flex items-center gap-4 px-6 py-4 hover:bg-amber-500/5 transition-colors">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(approval.userName)}&background=d97706&color=fff`}
                    className="w-10 h-10 rounded-xl border border-amber-500/30 shrink-0"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{approval.userName}</p>
                    <p className="text-xs text-fortis-mid truncate">{approval.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {new Date(approval.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approveUser(approval.id, approval.userId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-xs font-bold transition-all"
                    >
                      <CheckCircle size={13} /> Aprovar
                    </button>
                    <button
                      onClick={() => rejectUser(approval.id, approval.userId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg text-xs font-bold transition-all"
                    >
                      <XCircle size={13} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-hidden shadow-xl custom-scrollbar overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-fortis-dark/50">
              <tr>
                <SortableTableHeader label="Usuário" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="Função" sortKey="role" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="E-mail" sortKey="email" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="Telefone" sortKey="phone" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="Última Atividade" sortKey="lastActivity" sortConfig={sortConfig} requestSort={requestSort} />
                <th className="px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fortis-surface">
              {paginatedUsers.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-fortis-surface/20 transition-colors group cursor-pointer"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-fortis-surface group-hover:border-fortis-brand transition-all" alt="" />
                        {user.approved === false && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Rejeitado">
                            <XCircle size={10} className="text-white" />
                          </span>
                        )}
                        {user.approved === null && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center animate-pulse" title="Aguardando aprovação">
                            <Clock size={10} className="text-white" />
                          </span>
                        )}
                        {user.approved === true && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center" title="Aprovado">
                            <UserCheck size={10} className="text-white" />
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold group-hover:text-fortis-brand transition-colors whitespace-nowrap">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-fortis-brand" />
                      <span className="text-[10px] font-bold text-fortis-brand uppercase tracking-widest whitespace-nowrap">{ROLE_LABELS[user.role]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-fortis-mid whitespace-nowrap">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-fortis-mid whitespace-nowrap">{user.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-fortis-mid whitespace-nowrap">
                      <Calendar size={12} />
                      {new Date(user.lastActivity).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-fortis-surface rounded transition-colors">
                      <MoreVertical size={16} className="text-fortis-mid" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-fortis-mid">
                    <div className="flex flex-col items-center gap-3">
                      <Shield size={32} className="opacity-20" />
                      <p className="text-sm font-bold opacity-50">Nenhum usuário cadastrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={sortedUsers.length}
        />
      </div>

      <UserModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />
    </>
  );
};
