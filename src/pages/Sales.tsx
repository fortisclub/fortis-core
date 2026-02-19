import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { useApp } from '../store';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';
import { PAID_PURCHASE_STATUSES, UNPAID_PURCHASE_STATUSES } from '../constants';

export const Sales: React.FC = () => {
    const { leads, hasMore, isLoadingMore, loadMore } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const filteredSales = useMemo(() => {
        const allSales = [];
        for (const lead of leads) {
            if (lead.purchaseHistory && lead.purchaseHistory.length > 0) {
                for (const purchase of lead.purchaseHistory) {
                    const matchSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (purchase.id && purchase.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        lead.id.toLowerCase().includes(searchTerm.toLowerCase());

                    if (matchSearch) {
                        allSales.push({
                            ...purchase,
                            clientId: lead.id,
                            clientName: lead.name,
                        });
                    }
                }
            }
        }
        return allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [leads, searchTerm]);

    const { sortedData: sortedSales, sortConfig, requestSort } = useTableSort(filteredSales, { key: 'date', direction: 'desc' });

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedSales.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedSales, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedSales.length / itemsPerPage);

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Vendas</h2>
                    <p className="text-fortis-mid text-sm font-semibold">Histórico completo de transações.</p>
                </div>

                <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou ID do pedido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-fortis-panel border border-fortis-surface rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-fortis-brand text-white placeholder:text-fortis-mid/50 font-bold"
                    />
                </div>
            </div>

            <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-auto shadow-xl custom-scrollbar">
                <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-fortis-dark/50">
                        <tr>
                            <SortableTableHeader label="ID do Cliente" sortKey="clientId" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Nome do Cliente" sortKey="clientName" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="ID do Pedido" sortKey="id" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Data" sortKey="date" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Valor" sortKey="value" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-fortis-surface">
                        {paginatedSales.map(sale => (
                            <tr
                                key={sale.id || `${sale.clientId}-${sale.date}`}
                                className="hover:bg-fortis-surface/20 transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-mono text-fortis-mid group-hover:text-white transition-colors">{sale.clientId}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-white">{sale.clientName}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-fortis-surface rounded-lg text-rose-400 bg-opacity-50">
                                            <ShoppingBag size={12} />
                                        </div>
                                        <span className="text-xs font-mono font-semibold text-white/80">{sale.id || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase ${PAID_PURCHASE_STATUSES.includes(sale.status)
                                        ? 'border-fortis-brand text-fortis-brand bg-fortis-brand/10'
                                        : UNPAID_PURCHASE_STATUSES.includes(sale.status)
                                            ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                                            : 'border-fortis-mid text-fortis-mid bg-fortis-mid/10'
                                        }`}>
                                        {sale.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-semibold text-white/80">
                                        {new Date(sale.date).toLocaleDateString('pt-BR')} <span className="text-[10px] text-fortis-mid">{new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-black text-fortis-brand">
                                        {sale.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredSales.length === 0 && !isLoadingMore && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-fortis-mid">
                                    <div className="flex flex-col items-center gap-3">
                                        <Search size={32} className="opacity-20" />
                                        <p className="text-sm font-bold opacity-50">Nenhuma venda encontrada</p>
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
                                <span className="text-[10px] font-black uppercase tracking-widest ml-2">Buscando mais transações...</span>
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
                totalItems={sortedSales.length}
            />
        </div>
    );
};
