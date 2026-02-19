
import React, { useState } from 'react';
import { MoreVertical, Shield, Calendar } from 'lucide-react';
import { useApp } from '../store';
import { ROLE_LABELS } from '../constants';
import { UserModal } from '../components/UserModal';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const UsersPage: React.FC = () => {
  const { users } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { sortedData: sortedUsers, sortConfig, requestSort } = useTableSort(users);

  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Equipe</h2>
            <p className="text-fortis-mid text-sm font-semibold">Controle de acessos e permissões (RBAC).</p>
          </div>
        </div>

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
                      <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-fortis-surface group-hover:border-fortis-brand transition-all" alt="" />
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
