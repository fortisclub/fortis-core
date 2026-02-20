
import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, TrendingUp, AlertCircle, ShoppingCart, MoreVertical, X, History, FileText, Phone, AtSign, Compass, BadgeDollarSign, MessageSquareText, ArrowRight, Edit2, Calendar, User, Tags as TagsIcon, Check, ChevronDown } from 'lucide-react';
import { useApp } from '../store';
import { AFTER_SALES_STATUS_MAP, LEAD_STATUS_MAP } from '../constants';
import { AfterSalesStatus, LeadStatus, LeadHistory } from '../types';
import { LeadModal } from '../components/LeadModal';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const AfterSales: React.FC = () => {
  const { leads, users, tags, addLeadNote, addLeadSale, hasMore, isLoadingMore, loadMore, globalStats, fetchAllClients, updateLead } = useApp();

  // Carregar todos os clientes ao montar a página
  React.useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'ALL' as LeadStatus | 'ALL',
    responsibleId: 'ALL',
    tags: [] as string[],
    origin: 'ALL',
    channel: 'ALL'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId) || null, [leads, selectedLeadId]);

  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'history'>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'NOTE' | 'SALE'>('NOTE');
  const [manualNote, setManualNote] = useState('');
  const [manualValue, setManualValue] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const { fetchLeadHistory } = useApp();

  // Carregar histórico apenas quando necessário
  React.useEffect(() => {
    if (selectedLeadId && activeDetailTab === 'history') {
      setLoadingHistory(true);
      fetchLeadHistory(selectedLeadId).then(data => {
        setHistory(data);
        setLoadingHistory(false);
      });
    }
  }, [selectedLeadId, activeDetailTab, fetchLeadHistory]);

  const AFTER_SALES_KEYS = ['PRIMEIRA_COMPRA', 'RECORRENTE', 'VIP', 'INATIVO', 'GANHO', 'FINALIZADO'];

  const filtered = useMemo(() => {
    return leads.filter(l => {
      // Regra: Deve ser cliente
      const isClient = AFTER_SALES_KEYS.includes(l.status) || AFTER_SALES_KEYS.includes(l.afterSalesStatus as any);
      if (!isClient) return false;

      const matchSearch = l.name.toLowerCase().includes(localFilters.search.toLowerCase()) ||
        l.email.toLowerCase().includes(localFilters.search.toLowerCase());

      const matchStatus = localFilters.status === 'ALL' || l.afterSalesStatus === localFilters.status || l.status === localFilters.status;
      const matchResp = localFilters.responsibleId === 'ALL' || l.responsibleId === localFilters.responsibleId;
      const matchOrigin = localFilters.origin === 'ALL' || l.origin === localFilters.origin;
      const matchChannel = localFilters.channel === 'ALL' || l.channel === localFilters.channel;
      const matchTags = localFilters.tags.length === 0 || localFilters.tags.every(t => (l.tags || []).includes(t));

      return matchSearch && matchStatus && matchResp && matchOrigin && matchChannel && matchTags;
    }).map(client => ({
      ...client,
      afterSalesStatus: client.afterSalesStatus || 'PRIMEIRA_COMPRA' as AfterSalesStatus
    }));
  }, [leads, localFilters]);

  const { sortedData: sortedAfterSales, sortConfig, requestSort } = useTableSort(filtered);

  const paginatedAfterSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAfterSales.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAfterSales, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAfterSales.length / itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [localFilters]);

  const stats = [
    { label: '1ª Compra', count: globalStats.afterSalesCounts['PRIMEIRA_COMPRA'] || 0, icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'VIPs', count: globalStats.afterSalesCounts['VIP'] || 0, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Recorrentes', count: globalStats.afterSalesCounts['RECORRENTE'] || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Inativos', count: globalStats.afterSalesCounts['INATIVO'] || 0, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  const handleRegisterEntry = () => {
    if (!selectedLead) return;

    if (entryType === 'NOTE' && manualNote.trim()) {
      addLeadNote(selectedLead.id, manualNote);
      setManualNote('');
      setTimeout(() => setActiveDetailTab('history'), 100);
    } else if (entryType === 'SALE' && manualValue) {
      const value = parseFloat(manualValue.replace(',', '.'));
      if (!isNaN(value) && value > 0) {
        addLeadSale(selectedLead.id, value, manualNote);
        setManualValue('');
        setManualNote('');
        setTimeout(() => setActiveDetailTab('history'), 100);
      }
    }
  };

  const availableOrigins = useMemo(() => {
    const set = new Set(leads.map(l => l.origin).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  const availableChannels = useMemo(() => {
    const set = new Set(leads.map(l => l.channel).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pós-venda e Retenção</h2>
            <p className="text-fortis-mid text-sm">Base de clientes convertidos e GESTÃO LTV.</p>
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
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
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
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value as LeadStatus | 'ALL' })}
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

            {/* Tags (Multi-select custom) */}
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
                    {tags.length === 0 && <p className="text-[10px] text-fortis-mid p-2">Nenhuma tag cadastrada</p>}
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
                {availableOrigins.map(o => <option key={o} value={o}>{o}</option>)}
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
                {availableChannels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const total = stats.reduce((acc, s) => acc + s.count, 0);
            const percentage = total > 0 ? ((stat.count / total) * 100).toFixed(1) : '0.0';

            return (
              <div key={idx} className="bg-fortis-panel border border-fortis-surface rounded-3xl p-6 flex items-center gap-5 shadow-lg">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <p className="text-3xl font-black text-white">{stat.count}</p>
                    <p className="text-xs font-bold text-fortis-mid mb-1">({percentage}%)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-auto shadow-xl custom-scrollbar min-h-0">
          <table className="w-full text-left min-w-[1100px]">
            <thead className="bg-fortis-dark/50">
              <tr>
                <SortableTableHeader label="Cliente" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="Status" sortKey="afterSalesStatus" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                <SortableTableHeader label="Responsável" sortKey="responsibleId" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="Última Compra" sortKey="lastPurchaseAt" sortConfig={sortConfig} requestSort={requestSort} />
                <th className="px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest">Tag's</th>
                <SortableTableHeader label="Origem" sortKey="origin" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableTableHeader label="Canal" sortKey="channel" sortConfig={sortConfig} requestSort={requestSort} />
                <th className="px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fortis-surface">
              {paginatedAfterSales.map(client => (
                <tr
                  key={client.id}
                  className="hover:bg-fortis-surface/20 cursor-pointer transition-colors group"
                  onClick={() => { setSelectedLeadId(client.id); setActiveDetailTab('info'); }}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold group-hover:text-fortis-brand transition-colors">{client.name}</span>
                      <span className="text-[10px] text-fortis-mid mt-0.5">{client.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className="text-[9px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider"
                      style={{
                        color: AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.color,
                        borderColor: AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.color,
                        backgroundColor: (AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.color || '#000') + '15'
                      }}
                    >
                      {AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {users.find(u => u.id === client.responsibleId)?.avatar ? (
                        <img src={users.find(u => u.id === client.responsibleId)?.avatar} className="w-5 h-5 rounded-full border border-fortis-surface" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-fortis-surface flex items-center justify-center text-[8px] font-bold text-fortis-mid">?</div>
                      )}
                      <span className="text-xs font-bold text-white/90">{(users.find(u => u.id === client.responsibleId)?.name || 'Sistema').split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/90">
                        {client.lastPurchaseAt ? new Date(client.lastPurchaseAt).toLocaleDateString('pt-BR') : '-'}
                      </span>
                      {client.lastPurchaseAt && <span className="text-[9px] text-fortis-mid font-semibold">
                        {new Date(client.lastPurchaseAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 relative">
                    <div
                      className="flex flex-wrap gap-1 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors min-h-[32px] items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTagsId(editingTagsId === client.id ? null : client.id);
                      }}
                    >
                      {(client.tags || []).length > 0 ? (
                        <>
                          {(client.tags || []).slice(0, 2).map(t => (
                            <span key={t} className="text-[8px] px-1.5 py-0.5 bg-fortis-surface rounded text-white font-bold uppercase whitespace-nowrap">{t}</span>
                          ))}
                          {(client.tags || []).length > 2 && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-fortis-surface/50 rounded text-fortis-mid font-bold">+{(client.tags || []).length - 2}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[8px] text-fortis-mid font-black uppercase opacity-50">Sem Tags</span>
                      )}
                      <ChevronDown size={10} className="ml-auto text-fortis-mid" />
                    </div>

                    {editingTagsId === client.id && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setEditingTagsId(null); }} />
                        <div
                          className="absolute top-full left-6 mt-1 w-56 bg-fortis-panel border border-fortis-surface rounded-xl shadow-2xl z-[101] p-2 animate-in fade-in zoom-in-95 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-[9px] font-black text-fortis-mid uppercase tracking-widest px-2 py-1 mb-1 border-b border-fortis-surface/50">
                            Selecionar Tags
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                            {tags.map(tag => {
                              const isSelected = (client.tags || []).includes(tag.label);
                              return (
                                <div
                                  key={tag.id}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const newTags = isSelected
                                      ? (client.tags || []).filter(t => t !== tag.label)
                                      : [...(client.tags || []), tag.label];
                                    await updateLead(client.id, { tags: newTags });
                                  }}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-fortis-brand/20 text-fortis-brand' : 'hover:bg-fortis-surface text-fortis-mid'}`}
                                >
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                  <span className="text-[10px] font-black uppercase tracking-wider">{tag.label}</span>
                                  {isSelected && <Check size={12} className="ml-auto" />}
                                </div>
                              );
                            })}
                            {tags.length === 0 && (
                              <div className="p-3 text-center">
                                <p className="text-[10px] text-fortis-mid font-black uppercase">Nenhuma tag encontrada</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-white/80">{client.origin}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-white/80">{client.channel}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-fortis-surface rounded-xl transition-all"><MoreVertical size={18} className="text-fortis-mid" /></button>
                  </td>
                </tr>
              ))}
              {paginatedAfterSales.length === 0 && !isLoadingMore && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-fortis-mid">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart size={32} className="opacity-20" />
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
          totalItems={sortedAfterSales.length}
        />
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[3001] flex justify-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setSelectedLeadId(null)} />
          <div className="relative w-full max-w-2xl bg-fortis-dark border-l border-fortis-surface shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">

            <div className="p-8 border-b border-fortis-surface bg-fortis-panel/40">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-white">{selectedLead.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditModalOpen(true)} className="p-2 hover:bg-fortis-surface rounded-full text-white/50 hover:text-fortis-brand transition-all">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => setSelectedLeadId(null)} className="p-2 hover:bg-fortis-surface rounded-full text-white/50 hover:text-white transition-all">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {[
                  { id: 'info', icon: FileText, label: 'Perfil' },
                  { id: 'history', icon: History, label: 'Histórico' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === tab.id ? 'bg-fortis-brand text-white shadow-lg' : 'text-fortis-mid hover:text-white'}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 bg-black">
              {activeDetailTab === 'info' && (
                <div className="space-y-10 animate-in fade-in duration-300">
                  <section>
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-widest mb-4 opacity-50">Informações de Contato</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface flex items-center gap-4">
                        <div className="p-2.5 bg-fortis-dark rounded-xl text-blue-400"><AtSign size={18} /></div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">E-mail</p>
                          <p className="text-sm font-black text-white mt-0.5 truncate">{selectedLead.email}</p>
                        </div>
                      </div>
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface flex items-center gap-4">
                        <div className="p-2.5 bg-fortis-dark rounded-xl text-emerald-400"><Phone size={18} /></div>
                        <div>
                          <p className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">Telefone</p>
                          <p className="text-sm font-black text-white mt-0.5 truncate">{selectedLead.phone}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-widest opacity-50">Gestão e Segmentação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface">
                        <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest block mb-3">Canal / Origem</label>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-fortis-dark rounded-lg text-amber-500"><Compass size={20} /></div>
                          <div>
                            <p className="text-sm font-black text-white">{selectedLead.channel}</p>
                            <p className="text-[9px] font-black text-fortis-brand uppercase tracking-wider">{selectedLead.origin}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface">
                        <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest block mb-3">UF</label>
                        <p className="text-xl font-black text-white">{selectedLead.uf}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-fortis-surface/30">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-fortis-brand uppercase tracking-widest">Registrar Atividade</h4>
                    </div>

                    <div className="bg-fortis-panel border border-fortis-surface rounded-3xl p-6 space-y-4">

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">Descrição da Atividade</label>
                        <textarea
                          value={manualNote} onChange={(e) => setManualNote(e.target.value)}
                          className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-fortis-brand resize-none h-24"
                          placeholder="Descreva a interação com o lead..."
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleRegisterEntry}
                          disabled={!manualNote.trim()}
                          className="bg-fortis-brand px-8 py-3 rounded-2xl text-[10px] font-black text-white shadow-xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Salvar Nota
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeDetailTab === 'history' && (
                <div className="animate-in fade-in duration-300">
                  {loadingHistory ? (
                    <div className="text-center py-32 flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-fortis-brand border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-fortis-mid text-[10px] font-black uppercase tracking-widest">Buscando histórico...</p>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                      <div className="p-5 bg-fortis-panel/20 rounded-full mb-6">
                        <History size={40} className="text-fortis-surface/40" />
                      </div>
                      <p className="text-fortis-mid text-sm font-black uppercase tracking-widest">Sem registros recentes</p>
                    </div>
                  ) : (
                    <div className="relative pl-10 space-y-12">
                      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-fortis-surface z-0" />

                      {history.map((item) => {
                        let statusColor = '#FFFFFF';

                        if (item.field === 'status' && item.newValue) {
                          const statusKey = Object.keys(LEAD_STATUS_MAP).find(
                            k => LEAD_STATUS_MAP[k as LeadStatus].label === item.newValue
                          ) as LeadStatus;
                          if (statusKey) statusColor = LEAD_STATUS_MAP[statusKey].color;
                        } else if (item.field === 'afterSalesStatus' && item.newValue) {
                          const asKey = Object.keys(AFTER_SALES_STATUS_MAP).find(
                            k => AFTER_SALES_STATUS_MAP[k as AfterSalesStatus].label === item.newValue
                          ) as AfterSalesStatus;
                          if (asKey) statusColor = AFTER_SALES_STATUS_MAP[asKey].color;
                        }

                        return (
                          <div key={item.id} className="relative group">
                            <div
                              className={`absolute -left-[27px] top-[4px] w-3.5 h-3.5 rounded-full ring-[4px] ring-black z-20 transition-transform group-hover:scale-125 ${item.type === 'SALE' ? 'bg-fortis-brand shadow-[0_0_15px_rgba(88,133,117,0.8)]' : 'bg-white'
                                }`}
                            />

                            <div className="flex flex-col gap-4">
                              <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-5 shadow-2xl group-hover:border-fortis-brand/40 transition-all">
                                {item.type === 'EDIT' && item.oldValue !== undefined && item.newValue !== undefined ? (
                                  <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-white/40 line-through truncate max-w-[150px]">{item.oldValue}</span>
                                    <ArrowRight size={16} className="text-fortis-brand shrink-0" />
                                    <span
                                      className="text-xs font-black px-3 py-1 rounded-xl uppercase tracking-widest border shadow-sm"
                                      style={{
                                        color: statusColor,
                                        borderColor: `${statusColor}40`,
                                        backgroundColor: `${statusColor}15`
                                      }}
                                    >
                                      {item.newValue}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm text-white font-bold leading-relaxed opacity-90">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2.5 text-[10px] font-black text-white/80 uppercase tracking-[0.15em] bg-fortis-surface px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                                  <Calendar size={13} className="text-blue-400" />
                                  {new Date(item.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}
                                </div>
                                <div className="flex items-center gap-2.5 text-[10px] font-black text-white/80 uppercase tracking-[0.15em] bg-fortis-surface px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                                  <User size={13} className="text-emerald-400" />
                                  {item.type === 'SALE' ? 'Sistema' : (users.find(u => u.id === item.userId)?.name || 'Sistema').split(' ')[0]}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        leadId={selectedLeadId}
      />
    </>
  );
};
