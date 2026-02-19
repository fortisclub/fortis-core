
import React, { useState, useMemo } from 'react';
import { LayoutGrid, List, Filter, Search, MoreVertical, Calendar, User, MapPin, X, History, FileText, Phone, AtSign, Building2, Compass, BadgeDollarSign, MessageSquareText, ArrowRight, Edit2, Tags as TagsIcon } from 'lucide-react';
import { useApp } from '../store';
import { LEAD_STATUS_MAP, UFS } from '../constants';
import { LeadStatus } from '../types';
import { LeadModal } from '../components/LeadModal';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const Leads: React.FC = () => {
  const { leads, users, tags, moveLead, addLeadNote, addLeadSale, hasMore, isLoadingMore, loadMore, fetchLeads } = useApp();

  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'ALL' as LeadStatus | 'ALL',
    responsibleId: 'ALL',
    tags: [] as string[],
    origin: 'ALL',
    channel: 'ALL'
  });
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId) || null, [leads, selectedLeadId]);

  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'history'>('info');
  const [showFilters, setShowFilters] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'NOTE' | 'SALE'>('NOTE');
  const [manualNote, setManualNote] = useState('');
  const [manualValue, setManualValue] = useState('');

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { fetchLeadHistory } = useApp();

  // Reset e fetch inicial
  React.useEffect(() => {
    fetchLeads(false);
  }, [fetchLeads]);

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

  const [showTagFilter, setShowTagFilter] = useState(false);

  const availableOrigins = useMemo(() => {
    const set = new Set(leads.map(l => l.origin).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  const availableChannels = useMemo(() => {
    const set = new Set(leads.map(l => l.channel).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    // Statuses that belong in the Leads pipeline/kanban
    const KANBAN_STATUSES = ['NOVO', 'CONTATO', 'FOLLOW_UP', 'QUALIFICADO', 'AGUARDANDO_PAGAMENTO', 'PERDIDO'];

    return leads.filter(l => {
      // Regra: Somente leads que estão no pipeline de vendas
      const isLeadStatus = KANBAN_STATUSES.includes(l.status);
      const isNotWon = l.status !== 'GANHO';

      const matchSearch = l.name.toLowerCase().includes(localFilters.search.toLowerCase()) ||
        l.email.toLowerCase().includes(localFilters.search.toLowerCase());

      const matchStatus = localFilters.status === 'ALL' || l.status === localFilters.status;
      const matchResp = localFilters.responsibleId === 'ALL' || l.responsibleId === localFilters.responsibleId;
      const matchOrigin = localFilters.origin === 'ALL' || l.origin === localFilters.origin;
      const matchChannel = localFilters.channel === 'ALL' || l.channel === localFilters.channel;
      const matchTags = (localFilters.tags || []).length === 0 || localFilters.tags.every(t => (l.tags || []).includes(t));

      return isLeadStatus && isNotWon && matchSearch && matchStatus && matchResp && matchOrigin && matchChannel && matchTags;
    });
  }, [leads, localFilters]);

  const { sortedData: sortedLeads, sortConfig, requestSort } = useTableSort(filteredLeads);

  const paginatedLeads = useMemo(() => {
    if (view === 'kanban') return sortedLeads;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLeads, currentPage, itemsPerPage, view]);

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [localFilters, view]);

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
        setSelectedLeadId(null); // Fecha o detalhamento pois o lead saiu do pipeline
      }
    }
  };

  const columns: LeadStatus[] = ['NOVO', 'CONTATO', 'FOLLOW_UP', 'QUALIFICADO', 'AGUARDANDO_PAGAMENTO', 'PERDIDO'];

  return (
    <>
      <div className="space-y-6 h-full flex flex-col relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Leads</h2>
            <p className="text-fortis-mid text-sm font-semibold">Gestão avançada de prospecção e vendas.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${showFilters ? 'bg-fortis-brand border-fortis-brand text-white' : 'bg-fortis-panel border-fortis-surface text-fortis-mid hover:text-white'}`}
            >
              <Filter size={16} /> Filtros {(localFilters.status !== 'ALL' || localFilters.responsibleId !== 'ALL' || localFilters.tags.length > 0 || localFilters.origin !== 'ALL' || localFilters.channel !== 'ALL' || localFilters.search !== '') && <span className="w-2 h-2 rounded-full bg-white ml-1" />}
            </button>
            <div className="flex items-center gap-1 bg-fortis-panel border border-fortis-surface p-1 rounded-xl">
              <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-fortis-surface text-fortis-brand shadow-sm' : 'text-fortis-mid hover:text-white'}`}>
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setView('table')} className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-fortis-surface text-fortis-brand shadow-sm' : 'text-fortis-mid hover:text-white'}`}>
                <List size={18} />
              </button>
            </div>
          </div>
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
                {columns.map(status => (
                  <option key={status} value={status}>{LEAD_STATUS_MAP[status].label}</option>
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

        {view === 'kanban' ? (
          <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
            <div className="flex gap-4 h-full min-w-max">
              {columns.map(status => (
                <div
                  key={status}
                  className="w-72 flex flex-col h-full bg-fortis-panel/20 rounded-2xl border border-fortis-surface/40 overflow-hidden"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData('leadId');
                    moveLead(id, status);
                  }}
                >
                  <div className="p-4 flex items-center justify-between shrink-0 bg-fortis-panel/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEAD_STATUS_MAP[status].color }} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{LEAD_STATUS_MAP[status].label}</h3>
                    </div>
                  </div>

                  <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {filteredLeads.filter(l => l.status === status).map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => { setSelectedLeadId(lead.id); setActiveDetailTab('info'); }}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                        className="bg-fortis-panel border border-fortis-surface/80 rounded-xl p-4 hover:border-fortis-brand/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                      >
                        <p className="font-bold text-sm truncate text-white">{lead.name}</p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {lead.tags.map(tagLabel => {
                            const tagConfig = tags.find(t => t.label === tagLabel);
                            return (
                              <span
                                key={tagLabel}
                                className="px-1.5 py-0.5 rounded text-[8px] font-black text-white shadow-sm uppercase tracking-wider"
                                style={{ backgroundColor: tagConfig?.color || '#575756' }}
                              >
                                {tagLabel}
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center border-t border-fortis-surface/50 pt-3">
                          <span className="text-[9px] text-fortis-mid font-black uppercase">{lead.uf}</span>
                          <img src={users.find(u => u.id === lead.responsibleId)?.avatar} className="w-6 h-6 rounded-full border border-fortis-surface shadow-sm" alt="" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-auto shadow-xl custom-scrollbar min-h-0">
              <table className="w-full text-left min-w-[1100px]">
                <thead className="bg-fortis-dark/50">
                  <tr>
                    <SortableTableHeader label="Cliente" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                    <SortableTableHeader label="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                    <SortableTableHeader label="Responsável" sortKey="responsibleId" sortConfig={sortConfig} requestSort={requestSort} />
                    <SortableTableHeader label="Último Contato" sortKey="lastContactAt" sortConfig={sortConfig} requestSort={requestSort} />
                    <th className="px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest">Tag's</th>
                    <SortableTableHeader label="Origem" sortKey="origin" sortConfig={sortConfig} requestSort={requestSort} />
                    <SortableTableHeader label="Canal" sortKey="channel" sortConfig={sortConfig} requestSort={requestSort} />
                    <th className="px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fortis-surface">
                  {paginatedLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-fortis-surface/20 cursor-pointer transition-colors group"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{lead.name}</span>
                          <span className="text-[10px] text-fortis-mid font-semibold">{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] px-2 py-0.5 rounded-full border font-black uppercase" style={{
                          borderColor: LEAD_STATUS_MAP[lead.status]?.color || '#575756',
                          color: LEAD_STATUS_MAP[lead.status]?.color || '#575756'
                        }}>
                          {(LEAD_STATUS_MAP[lead.status as keyof typeof LEAD_STATUS_MAP]?.label || lead.status || 'Sem Status')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <img src={users.find(u => u.id === lead.responsibleId)?.avatar} className="w-5 h-5 rounded-full border border-fortis-surface" alt="" />
                          <span className="text-xs font-bold text-white/90">{(users.find(u => u.id === lead.responsibleId)?.name || 'Nenhum').split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white/90">
                          {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(lead.tags || []).map(tagLabel => {
                            const tagConfig = tags.find(t => t.label === tagLabel);
                            return (
                              <span key={tagLabel} className="px-1.5 py-0.5 rounded text-[9px] font-black text-white shadow-sm uppercase" style={{ backgroundColor: tagConfig?.color || '#575756' }}>
                                {tagLabel}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white/80">{lead.origin}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white/80">{lead.channel}</span>
                      </td>
                      <td className="px-6 py-4 text-right"><MoreVertical size={16} className="ml-auto text-fortis-mid" /></td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-fortis-mid">
                        <div className="flex flex-col items-center gap-3">
                          <Search size={32} className="opacity-20" />
                          <p className="text-sm font-bold opacity-50">Nenhum lead encontrado</p>
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
                      <span className="text-[10px] font-black uppercase tracking-widest ml-2">Buscando mais leads...</span>
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
              totalItems={sortedLeads.length}
            />
          </>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[3001] flex justify-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setSelectedLeadId(null)} />
          <div className="relative w-full max-w-2xl bg-fortis-dark border-l border-fortis-surface shadow-2xl animate-in slide-in-from-right-full duration-300 overflow-hidden flex flex-col">

            <div className="p-8 border-b border-fortis-surface bg-fortis-panel/40">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-white">{selectedLead.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 hover:bg-fortis-surface rounded-full transition-all text-white/50 hover:text-fortis-brand"
                    title="Editar Lead"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => setSelectedLeadId(null)} className="p-2 hover:bg-fortis-surface rounded-full transition-all text-white/50 hover:text-white">
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
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === tab.id ? 'bg-fortis-brand text-white shadow-lg shadow-fortis-brand/30 ring-1 ring-white/10' : 'text-fortis-mid hover:text-white hover:bg-fortis-surface'}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 bg-black">
              {activeDetailTab === 'info' && (
                <div className="animate-in fade-in duration-300 space-y-10">
                  <section>
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-[0.3em] mb-4">Informações de Contato</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface flex items-center gap-4 group hover:border-fortis-brand/30 transition-colors">
                        <div className="p-2.5 bg-fortis-dark rounded-xl text-blue-400">
                          <AtSign size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">E-mail</p>
                          <p className="text-sm font-black text-white mt-0.5 truncate">{selectedLead.email}</p>
                        </div>
                      </div>
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface flex items-center gap-4 group hover:border-fortis-brand/30 transition-colors">
                        <div className="p-2.5 bg-fortis-dark rounded-xl text-emerald-400">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">Telefone</p>
                          <p className="text-sm font-black text-white mt-0.5 truncate">{selectedLead.phone}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-[0.3em]">GESTÃO E SEGMENTAÇÃO</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface">
                        <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest block mb-3">Responsável</label>
                        <div className="flex items-center gap-3">
                          <img src={users.find(u => u.id === selectedLead.responsibleId)?.avatar} className="w-10 h-10 rounded-full border border-fortis-surface shadow-lg" alt="" />
                          <div>
                            <p className="text-sm font-black text-white">{users.find(u => u.id === selectedLead.responsibleId)?.name || 'Nenhum'}</p>
                            <p className="text-[9px] font-black text-fortis-brand uppercase tracking-wider">Responsável</p>
                          </div>
                        </div>
                      </div>
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
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-[0.3em]">TAGS E CATEGORIAS</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.tags.length > 0 ? (
                        selectedLead.tags.map(tagLabel => {
                          const tagConfig = tags.find(t => t.label === tagLabel);
                          return (
                            <span
                              key={tagLabel}
                              className="px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-lg uppercase tracking-wider border border-white/5"
                              style={{ backgroundColor: tagConfig?.color || '#575756' }}
                            >
                              {tagLabel}
                            </span>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-2 p-4 bg-fortis-panel/30 border border-dashed border-fortis-surface rounded-2xl w-full">
                          <TagsIcon size={14} className="text-fortis-mid" />
                          <p className="text-[10px] text-fortis-mid font-black uppercase tracking-widest italic">Nenhuma tag atribuída</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-fortis-surface/30">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-fortis-brand uppercase tracking-[0.3em]">REGISTRAR ATIVIDADE</h4>
                    </div>

                    <div className="bg-fortis-panel border border-fortis-surface rounded-3xl p-6 focus-within:border-fortis-brand/50 transition-all shadow-inner space-y-4">

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">Descrição da Atividade</label>
                        <textarea
                          value={manualNote}
                          onChange={(e) => setManualNote(e.target.value)}
                          className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-fortis-brand transition-all placeholder:text-fortis-mid/40 resize-none h-24 leading-relaxed shadow-inner"
                          placeholder="Descreva a interação com o lead..."
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleRegisterEntry}
                          disabled={!manualNote.trim()}
                          className="bg-fortis-brand hover:bg-opacity-90 disabled:opacity-20 px-8 py-3 rounded-2xl text-[10px] font-black text-white shadow-xl shadow-fortis-brand/30 transition-all active:scale-95 uppercase tracking-widest"
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

                      {history.map((item: any) => {
                        let statusColor = '#FFFFFF';
                        if (item.field === 'status' && item.newValue) {
                          const statusKey = Object.keys(LEAD_STATUS_MAP).find(
                            k => LEAD_STATUS_MAP[k as LeadStatus].label === item.newValue
                          ) as LeadStatus;
                          if (statusKey) statusColor = LEAD_STATUS_MAP[statusKey].color;
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
      )
      }

      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        leadId={selectedLeadId}
      />
    </>
  );
};
