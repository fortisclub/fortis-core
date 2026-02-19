import React, { useState, useMemo } from 'react';
import { Search, MapPin, Phone, Mail, FileText, User, Filter, X } from 'lucide-react';
import { useApp } from '../store';
import { ClientModal } from '../components/ClientModal';
import { AFTER_SALES_STATUS_MAP } from '../constants';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const Clients: React.FC = () => {
    const { leads, users, tags, hasMore, isLoadingMore, loadMore, fetchAllClients } = useApp();

    const [localFilters, setLocalFilters] = useState({
        search: '',
        status: 'ALL' as string,
        responsibleId: 'ALL',
        tags: [] as string[],
        origin: 'ALL',
        channel: 'ALL'
    });

    // Carregar todos os clientes ao montar a página
    React.useEffect(() => {
        fetchAllClients();
    }, [fetchAllClients]);

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const [showFilters, setShowFilters] = useState(false);
    const [showTagFilter, setShowTagFilter] = useState(false);

    const customers = useMemo(() => {
        const AFTER_SALES_KEYS = ['PRIMEIRA_COMPRA', 'RECORRENTE', 'VIP', 'INATIVO', 'GANHO', 'FINALIZADO'];
        return leads.filter(l =>
            AFTER_SALES_KEYS.includes(l.status) ||
            AFTER_SALES_KEYS.includes(l.afterSalesStatus as any)
        );
    }, [leads]);

    const availableOrigins = useMemo(() => {
        const set = new Set(customers.map(l => l.origin).filter(Boolean));
        return Array.from(set).sort();
    }, [customers]);

    const availableChannels = useMemo(() => {
        const set = new Set(customers.map(l => l.channel).filter(Boolean));
        return Array.from(set).sort();
    }, [customers]);

    const filteredClients = useMemo(() => {
        return customers.filter(l => {
            const matchSearch = l.name.toLowerCase().includes(localFilters.search.toLowerCase()) ||
                l.email.toLowerCase().includes(localFilters.search.toLowerCase()) ||
                (l.cpf && l.cpf.includes(localFilters.search));

            const matchStatus = localFilters.status === 'ALL' || l.afterSalesStatus === localFilters.status || l.status === localFilters.status;
            const matchResp = localFilters.responsibleId === 'ALL' || l.responsibleId === localFilters.responsibleId;
            const matchOrigin = localFilters.origin === 'ALL' || l.origin === localFilters.origin;
            const matchChannel = localFilters.channel === 'ALL' || l.channel === localFilters.channel;
            const matchTags = localFilters.tags.length === 0 || localFilters.tags.every(t => (l.tags || []).includes(t));

            return matchSearch && matchStatus && matchResp && matchOrigin && matchChannel && matchTags;
        });
    }, [customers, localFilters]);

    const { sortedData, sortConfig, requestSort } = useTableSort(filteredClients);

    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [localFilters]);

    return (
        <>
            <div className="space-y-6 h-full flex flex-col relative">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Clientes</h2>
                        <p className="text-fortis-mid text-sm font-semibold">Base de contatos e informações cadastrais.</p>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${showFilters ? 'bg-fortis-brand border-fortis-brand text-white' : 'bg-fortis-panel border-fortis-surface text-fortis-mid hover:text-white'}`}
                    >
                        <Filter size={16} /> Filtros {(localFilters.status !== 'ALL' || localFilters.responsibleId !== 'ALL' || localFilters.tags.length > 0 || localFilters.origin !== 'ALL' || localFilters.channel !== 'ALL' || localFilters.search !== '') && <span className="w-2 h-2 rounded-full bg-white ml-1" />}
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-fortis-panel/50 border border-fortis-surface p-6 rounded-2xl grid grid-cols-6 gap-4 animate-in slide-in-from-top-4 duration-300">
                        {/* Nome */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Nome</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fortis-mid" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar..."
                                    value={localFilters.search}
                                    onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Status</label>
                            <select
                                value={localFilters.status}
                                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value as any })}
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                            >
                                <option value="ALL">Todos os Status</option>
                                {Object.entries(AFTER_SALES_STATUS_MAP).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Responsável */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Responsável</label>
                            <select
                                value={localFilters.responsibleId}
                                onChange={(e) => setLocalFilters({ ...localFilters, responsibleId: e.target.value })}
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                            >
                                <option value="ALL">Todos os Responsáveis</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Tag's</label>
                            <div
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs text-white font-bold cursor-pointer flex items-center justify-between"
                                onClick={() => setShowTagFilter(!showTagFilter)}
                            >
                                <span className="truncate">{localFilters.tags.length === 0 ? 'Todas as Tags' : `${localFilters.tags.length} selecionada(s)`}</span>
                                <Filter size={12} className="text-fortis-mid" />
                            </div>

                            {showTagFilter && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowTagFilter(false)} />
                                    <div className="absolute top-full left-0 w-full mt-2 bg-fortis-panel border border-fortis-surface rounded-xl shadow-2xl z-50 p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {tags.map(tag => (
                                            <div
                                                key={tag.id}
                                                onClick={() => {
                                                    if (localFilters.tags.includes(tag.label)) {
                                                        setLocalFilters({ ...localFilters, tags: localFilters.tags.filter(t => t !== tag.label) });
                                                    } else {
                                                        setLocalFilters({ ...localFilters, tags: [...localFilters.tags, tag.label] });
                                                    }
                                                }}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${localFilters.tags.includes(tag.label) ? 'bg-fortis-brand/20 text-fortis-brand' : 'hover:bg-fortis-surface text-fortis-mid'}`}
                                            >
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                <span className="text-[10px] font-bold uppercase">{tag.label}</span>
                                                {localFilters.tags.includes(tag.label) && <X size={10} className="ml-auto" />}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Origem */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Origem</label>
                            <select
                                value={localFilters.origin}
                                onChange={(e) => setLocalFilters({ ...localFilters, origin: e.target.value })}
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                            >
                                <option value="ALL">Todas as Origens</option>
                                {availableOrigins.map(origin => (
                                    <option key={origin} value={origin}>{origin}</option>
                                ))}
                            </select>
                        </div>

                        {/* Canal */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Canal</label>
                            <select
                                value={localFilters.channel}
                                onChange={(e) => setLocalFilters({ ...localFilters, channel: e.target.value })}
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                            >
                                <option value="ALL">Todos os Canais</option>
                                {availableChannels.map(channel => (
                                    <option key={channel} value={channel}>{channel}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-auto shadow-xl custom-scrollbar min-h-0">
                    <table className="w-full text-left min-w-[1200px]">
                        <thead className="bg-fortis-dark/50">
                            <tr>
                                <SortableTableHeader label="ID do cliente" sortKey="id" sortConfig={sortConfig} requestSort={requestSort} className="whitespace-nowrap" />
                                <SortableTableHeader label="Nome do Cliente" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="CPF" sortKey="cpf" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="E-mail" sortKey="email" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="Telefone" sortKey="phone" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="Origem" sortKey="origin" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="Canal" sortKey="channel" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="Cidade" sortKey="city" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableTableHeader label="UF" sortKey="uf" sortConfig={sortConfig} requestSort={requestSort} />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-fortis-surface">
                            {paginatedClients.map(client => (
                                <tr
                                    key={client.id}
                                    className="hover:bg-fortis-surface/20 cursor-pointer transition-colors group"
                                    onClick={() => setSelectedClientId(client.id)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-mono text-fortis-mid group-hover:text-white transition-colors">{client.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-fortis-surface rounded-lg text-fortis-brand bg-opacity-50">
                                                <User size={12} />
                                            </div>
                                            <span className="text-sm font-bold text-white">{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-white/80">{client.cpf || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                                            <Mail size={12} className="text-fortis-mid" />
                                            {client.email}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                                            <Phone size={12} className="text-fortis-mid" />
                                            {client.phone}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-white/80">{client.origin}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-white/80">{client.channel}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-white/80">{client.city || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] bg-fortis-dark text-white px-2 py-1 rounded border border-fortis-surface font-black uppercase">
                                            {client.uf}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && !isLoadingMore && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-fortis-mid">
                                        <div className="flex flex-col items-center gap-3">
                                            <Search size={32} className="opacity-20" />
                                            <p className="text-sm font-bold opacity-50">Nenhum cliente encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {(isLoadingMore || hasMore) && (
                        <div className="p-6 flex justify-center border-t border-fortis-surface bg-fortis-dark/30">
                            {isLoadingMore ? (
                                <div className="flex items-center gap-3 text-fortis-brand animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-fortis-brand animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-fortis-brand animate-bounce [animation-delay:-.3s]" />
                                    <div className="w-2 h-2 rounded-full bg-fortis-brand animate-bounce [animation-delay:-.5s]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest ml-2">Buscando mais clientes...</span>
                                </div>
                            ) : (
                                <button
                                    onClick={loadMore}
                                    className="px-8 py-2 rounded-xl bg-fortis-surface text-[10px] font-black uppercase tracking-widest hover:text-white transition-all border border-white/5"
                                >
                                    Carregar Mais
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={sortedData.length}
                />
            </div>

            <ClientModal
                isOpen={!!selectedClientId}
                onClose={() => setSelectedClientId(null)}
                clientId={selectedClientId}
            />
        </>
    );
};
