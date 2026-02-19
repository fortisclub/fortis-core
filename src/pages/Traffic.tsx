
import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, DollarSign, MousePointer2, ShoppingCart, MessageSquare, UserPlus, Eye, Target, Calendar } from 'lucide-react';
import { useApp } from '../store';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const Traffic: React.FC = () => {
    const { trafficInvestments, isLoadingMore } = useApp();
    const [search, setSearch] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('ALL');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const filteredInvestments = useMemo(() => {
        return trafficInvestments.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
            const matchPlatform = filterPlatform === 'ALL' || item.platform === filterPlatform;
            return matchSearch && matchPlatform;
        });
    }, [trafficInvestments, search, filterPlatform]);

    const { sortedData, sortConfig, requestSort } = useTableSort(filteredInvestments);

    const paginatedTraffic = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [search, filterPlatform]);

    const stats = useMemo(() => {
        const totalSpent = filteredInvestments.reduce((acc, curr) => acc + curr.amountSpent, 0);
        const totalPurchases = filteredInvestments.reduce((acc, curr) => acc + curr.purchases, 0);
        const totalConvValue = filteredInvestments.reduce((acc, curr) => acc + curr.purchaseConversionValue, 0);
        const roas = totalSpent > 0 ? (totalConvValue / totalSpent).toFixed(2) : '0.00';

        return [
            { label: 'Investimento Total', value: totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Compras', value: totalPurchases, icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: 'Faturamento', value: totalConvValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
            { label: 'ROAS Médio', value: roas, icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        ];
    }, [filteredInvestments]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestão de Tráfego</h2>
                    <p className="text-fortis-mid text-sm font-semibold">Acompanhamento de performance de anúncios e investimentos.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                        <input
                            type="text"
                            placeholder="Buscar campanha..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-fortis-panel border border-fortis-surface rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-fortis-brand w-64 font-bold transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-fortis-panel border border-fortis-surface rounded-3xl p-6 flex items-center gap-5 shadow-lg">
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-auto shadow-xl custom-scrollbar">
                <table className="w-full text-left min-w-[2000px]">
                    <thead className="bg-fortis-dark/50 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <SortableTableHeader label="Campanha" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} className="sticky left-0 bg-fortis-dark/50 z-20" />
                            <SortableTableHeader label="Data" sortKey="date" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Valor Usado" sortKey="amountSpent" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Impressões" sortKey="impressions" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Alcance" sortKey="reach" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Cliques" sortKey="linkClicks" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Landing Page" sortKey="landingPageViews" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Carrinho" sortKey="addToCart" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Checkouts" sortKey="checkoutsInitiated" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Compras" sortKey="purchases" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Valor Conv." sortKey="purchaseConversionValue" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Contatos" sortKey="contacts" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Cadastros" sortKey="registrations" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableTableHeader label="Conversas" sortKey="messageConversationsStarted" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="px-6 py-4 text-[10px] font-black text-fortis-mid uppercase tracking-widest">CPC</th>
                            <th className="px-6 py-4 text-[10px] font-black text-fortis-mid uppercase tracking-widest">ROAS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-fortis-surface">
                        {paginatedTraffic.map((item) => {
                            const cpc = item.linkClicks > 0 ? (item.amountSpent / item.linkClicks).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
                            const roas = item.amountSpent > 0 ? (item.purchaseConversionValue / item.amountSpent).toFixed(2) : '0.00';

                            return (
                                <tr key={item.id} className="hover:bg-fortis-surface/20 transition-colors group">
                                    <td className="px-6 py-4 sticky left-0 bg-fortis-panel group-hover:bg-[#1a2321] transition-colors z-10 border-r border-fortis-surface/30">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white group-hover:text-fortis-brand transition-colors">{item.name}</span>
                                            <span className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">{item.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-white/70">
                                            <Calendar size={14} className="text-blue-400" />
                                            <span className="text-xs font-bold">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-white text-xs">
                                        {item.amountSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.impressions.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.reach.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.linkClicks.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.landingPageViews.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.addToCart.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.checkoutsInitiated.toLocaleString()}</td>
                                    <td className="px-6 py-4 font-black text-green-400 text-xs">{item.purchases}</td>
                                    <td className="px-6 py-4 font-black text-white text-xs">
                                        {item.purchaseConversionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.contacts}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.registrations}</td>
                                    <td className="px-6 py-4 text-fortis-mid text-xs font-bold">{item.messageConversationsStarted}</td>
                                    <td className="px-6 py-4 text-blue-400 text-xs font-black">{cpc}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase ${Number(roas) >= 2 ? 'border-fortis-brand text-fortis-brand bg-fortis-brand/10' : 'border-fortis-mid text-fortis-mid bg-fortis-mid/10'}`}>
                                            {roas}x
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedData.length === 0 && !isLoadingMore && (
                            <tr>
                                <td colSpan={16} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                        <Target size={48} className="text-fortis-mid" />
                                        <p className="text-sm font-black text-fortis-mid uppercase tracking-[0.2em]">Nenhum dado de tráfego disponível</p>
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
                totalItems={sortedData.length}
            />
        </div>
    );
};
