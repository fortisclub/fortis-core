
import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, TrendingUp, AlertCircle, ShoppingCart, MoreVertical, X, History, FileText, Phone, AtSign, Compass, BadgeDollarSign, MessageSquareText, ArrowRight, Edit2, Calendar, User, Tags as TagsIcon, Check, ChevronDown, Plus, Workflow } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { AFTER_SALES_STATUS_MAP, LEAD_STATUS_MAP } from '../constants';
import { AfterSalesStatus, LeadStatus, LeadHistory } from '../types';
import { LeadModal } from '../components/LeadModal';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Pagination } from '../components/Pagination';

export const AfterSales: React.FC = () => {
  const { leads, users, tags, addLeadNote, addLeadSale, hasMore, isLoadingMore, loadMore, globalStats, fetchAllClients, updateLead, fetchLeadHistory, cadenceFlows } = useApp();

  // Estado para mapear leads aos seus fluxos de cadência ativos (ID e Nome)
  const [activeFlowsMap, setActiveFlowsMap] = useState<Record<string, { id: string, name: string }>>({});

  // Carregar todos os clientes ao montar a página
  React.useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

  // Carregar fluxos de cadência para os leads
  React.useEffect(() => {
    const fetchActiveFlows = async () => {
      const { data, error } = await supabase
        .from('cadence_tasks')
        .select('lead_id, flow_id')
        .eq('completed', false);

      if (!error && data) {
        const map: Record<string, { id: string, name: string }> = {};
        data.forEach((task: any) => {
          const flow = cadenceFlows.find(f => f.id === task.flow_id);
          if (flow) {
            map[String(task.lead_id)] = { id: flow.id, name: flow.name };
          }
        });
        setActiveFlowsMap(map);
      }
    };
    fetchActiveFlows();
  }, [cadenceFlows, leads]);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: [] as string[],
    responsibleId: [] as string[],
    tags: [] as string[],
    origin: [] as string[],
    channel: [] as string[],
    flowId: [] as string[]
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId) || null, [leads, selectedLeadId]);

  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'history'>('info');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualNote, setManualNote] = useState('');

  const [showTagFilter, setShowTagFilter] = useState(false);

  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const filteredAfterSales = useMemo(() => {
    return leads.filter(l => {
      // Regra: Deve ser cliente
      const isClient = AFTER_SALES_KEYS.includes(l.status) || AFTER_SALES_KEYS.includes(l.afterSalesStatus as any);
      if (!isClient) return false;

      const matchSearch = l.name.toLowerCase().includes(localFilters.search.toLowerCase()) ||
        l.email.toLowerCase().includes(localFilters.search.toLowerCase());

      const matchStatus = localFilters.status.length === 0 || localFilters.status.includes(l.afterSalesStatus || '') || localFilters.status.includes(l.status as string);
      const matchResp = localFilters.responsibleId.length === 0 || (l.responsibleId && localFilters.responsibleId.includes(l.responsibleId));
      const matchOrigin = localFilters.origin.length === 0 || (l.origin && localFilters.origin.includes(l.origin));
      const matchChannel = localFilters.channel.length === 0 || (l.channel && localFilters.channel.includes(l.channel));
      const matchTags = localFilters.tags.length === 0 || localFilters.tags.every(t => (l.tags || []).includes(t));
      const matchFlow = localFilters.flowId.length === 0 || (activeFlowsMap[l.id]?.id && localFilters.flowId.includes(activeFlowsMap[l.id].id));

      return matchSearch && matchStatus && matchResp && matchOrigin && matchChannel && matchTags && matchFlow;
    }).map(client => ({
      ...client,
      afterSalesStatus: client.afterSalesStatus || 'PRIMEIRA_COMPRA' as AfterSalesStatus
    }));
  }, [leads, localFilters, activeFlowsMap]);

  const { sortedData: sortedAfterSales, sortConfig, requestSort } = useTableSort(filteredAfterSales, { key: 'lastPurchaseAt', direction: 'desc' });


  const paginatedAfterSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAfterSales.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAfterSales, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAfterSales.length / itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [localFilters]);

  const handleRegisterEntry = async () => {
    if (!selectedLead || !manualNote.trim()) return;
    await addLeadNote(selectedLead.id, manualNote);
    setManualNote('');

    // Re-busca o histórico imediatamente
    const updatedHistory = await fetchLeadHistory(selectedLead.id);
    setHistory(updatedHistory);
    
    setTimeout(() => setActiveDetailTab('history'), 100);
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
      <div className="space-y-6 h-full flex flex-col relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Pós-venda</h2>
            <p className="text-fortis-mid text-sm font-semibold">Gestão avançada de clientes e retenção.</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '1ª Compra', value: filteredAfterSales.filter(c => c.afterSalesStatus === 'PRIMEIRA_COMPRA').length, icon: ShoppingCart, color: '#60A5FA' },
            { label: 'Recorrente', value: filteredAfterSales.filter(c => c.afterSalesStatus === 'RECORRENTE').length, icon: TrendingUp, color: '#34D399' },
            { label: 'VIP', value: filteredAfterSales.filter(c => c.afterSalesStatus === 'VIP').length, icon: Star, color: '#FBBF24' },
            { label: 'Inativo', value: filteredAfterSales.filter(c => c.afterSalesStatus === 'INATIVO').length, icon: AlertCircle, color: '#EF4444' }
          ].map((kpi, i) => (
            <div key={i} className="bg-fortis-panel border border-fortis-surface p-4 rounded-2xl flex items-center justify-between group hover:border-fortis-brand/50 transition-all shadow-lg hover:shadow-fortis-brand/5">
              <div>
                <p className="text-[10px] font-black text-fortis-mid uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-2xl font-black text-white">{kpi.value}</p>
              </div>
              <div className="p-3 bg-fortis-dark rounded-xl" style={{ color: kpi.color }}>
                <kpi.icon size={24} />
              </div>
            </div>
          ))}
        </div>


        <div className="flex items-center gap-3 bg-fortis-panel border border-fortis-surface p-2 rounded-xl w-full shadow-lg relative min-h-[52px]">
          <Filter size={16} className="text-fortis-mid ml-2" />
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Filter Chips */}
            {localFilters.search !== '' && (
              <div className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Busca:</span> {localFilters.search}
                <button onClick={() => setLocalFilters({ ...localFilters, search: '' })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
            {localFilters.status.length > 0 && localFilters.status.map(s => (
              <div key={s} className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Status:</span> {AFTER_SALES_STATUS_MAP[s as AfterSalesStatus]?.label || s}
                <button onClick={() => setLocalFilters({ ...localFilters, status: localFilters.status.filter(v => v !== s) })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            {localFilters.responsibleId.length > 0 && localFilters.responsibleId.map(rId => (
              <div key={rId} className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Resp:</span> {users.find(u => u.id === rId)?.name || 'Removido'}
                <button onClick={() => setLocalFilters({ ...localFilters, responsibleId: localFilters.responsibleId.filter(v => v !== rId) })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            {localFilters.flowId.length > 0 && localFilters.flowId.map(fId => (
              <div key={fId} className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Fluxo:</span> {cadenceFlows.find(f => f.id === fId)?.name}
                <button onClick={() => setLocalFilters({ ...localFilters, flowId: localFilters.flowId.filter(v => v !== fId) })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            {localFilters.tags.length > 0 && localFilters.tags.map(tag => (
              <div key={tag} className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Tag:</span> {tag}
                <button onClick={() => setLocalFilters({ ...localFilters, tags: localFilters.tags.filter(t => t !== tag) })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            {localFilters.origin.length > 0 && localFilters.origin.map(o => (
              <div key={o} className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Origem:</span> {o}
                <button onClick={() => setLocalFilters({ ...localFilters, origin: localFilters.origin.filter(v => v !== o) })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            {localFilters.channel.length > 0 && localFilters.channel.map(c => (
              <div key={c} className="flex items-center gap-2 bg-fortis-brand/20 border border-fortis-brand/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase text-fortis-brand group slide-in-from-left-2 animate-in duration-200">
                <span className="opacity-60">Canal:</span> {c}
                <button onClick={() => setLocalFilters({ ...localFilters, channel: localFilters.channel.filter(v => v !== c) })} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Filter Button */}
          <div className="relative">
            <button 
              onClick={() => setIsAddingFilter(!isAddingFilter)}
              className="px-3 py-1.5 rounded-lg text-fortis-mid hover:text-white hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ml-2"
            >
              <Plus size={14} className={isAddingFilter ? 'rotate-45' : ''} />
              Adicionar filtro
            </button>

            {isAddingFilter && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-fortis-panel border border-fortis-surface rounded-xl shadow-2xl z-[100] p-1 slide-in-from-top-2 animate-in duration-200">

                {[
                  { id: 'cliente', label: 'Nome do Cliente' },
                  { id: 'status', label: 'Status' },
                  { id: 'resp', label: 'Responsável' },
                  { id: 'fluxo', label: 'Fluxo' },
                  { id: 'tags', label: 'Tag\'s' },
                  { id: 'origem', label: 'Origem' },
                  { id: 'canal', label: 'Canal' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFilterMenuOpen(opt.id);
                      setIsAddingFilter(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-fortis-mid hover:text-white transition-all group"
                  >
                    {opt.label}
                    <ChevronDown size={14} className="-rotate-90 opacity-0 group-hover:opacity-100 transition-all mr-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Specific Popups for each dimension */}
            {filterMenuOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setFilterMenuOpen(null)} />
                <div className="relative bg-fortis-panel border border-fortis-surface rounded-2xl shadow-2xl p-6 w-[320px] pointer-events-auto space-y-4 slide-in-from-bottom-2 animate-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {filterMenuOpen === 'cliente' && 'Buscar Cliente'}
                      {filterMenuOpen === 'status' && 'Filtrar por Status'}
                      {filterMenuOpen === 'resp' && 'Filtrar por Responsável'}
                      {filterMenuOpen === 'fluxo' && 'Filtrar por Fluxo'}
                      {filterMenuOpen === 'tags' && 'Filtrar por Tag\'s'}
                      {filterMenuOpen === 'origem' && 'Filtrar por Origem'}
                      {filterMenuOpen === 'canal' && 'Filtrar por Canal'}
                    </h3>
                    <button onClick={() => setFilterMenuOpen(null)} className="text-fortis-mid hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[300px] overflow-auto custom-scrollbar">
                    {filterMenuOpen === 'cliente' && (
                      <div className="space-y-4 p-1">
                        <input
                          type="text"
                          placeholder="Digite nome ou e-mail..."
                          className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold"
                          autoFocus
                          value={localFilters.search}
                          onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setFilterMenuOpen(null);
                            }
                          }}
                        />
                      </div>
                    )}
                    {filterMenuOpen === 'status' && Object.entries(AFTER_SALES_STATUS_MAP).map(([key, val]) => (
                      <div
                        key={key}
                        onClick={() => {
                          const newList = localFilters.status.includes(key) 
                            ? localFilters.status.filter(v => v !== key)
                            : [...localFilters.status, key];
                          setLocalFilters({ ...localFilters, status: newList });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${localFilters.status.includes(key) ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                          {val.label}
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${localFilters.status.includes(key) ? 'bg-fortis-brand border-fortis-brand' : 'border-fortis-surface'}`}>
                          {localFilters.status.includes(key) && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    ))}
                    {filterMenuOpen === 'resp' && users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          const newList = localFilters.responsibleId.includes(u.id) 
                            ? localFilters.responsibleId.filter(v => v !== u.id)
                            : [...localFilters.responsibleId, u.id];
                          setLocalFilters({ ...localFilters, responsibleId: newList });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${localFilters.responsibleId.includes(u.id) ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-5 h-5 rounded-full" alt="" />
                          {u.name}
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${localFilters.responsibleId.includes(u.id) ? 'bg-fortis-brand border-fortis-brand' : 'border-fortis-surface'}`}>
                          {localFilters.responsibleId.includes(u.id) && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    ))}
                    {filterMenuOpen === 'fluxo' && cadenceFlows.map(f => (
                      <div
                        key={f.id}
                        onClick={() => {
                          const newList = localFilters.flowId.includes(f.id) 
                            ? localFilters.flowId.filter(v => v !== f.id)
                            : [...localFilters.flowId, f.id];
                          setLocalFilters({ ...localFilters, flowId: newList });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${localFilters.flowId.includes(f.id) ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Workflow size={14} />
                          {f.name}
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${localFilters.flowId.includes(f.id) ? 'bg-fortis-brand border-fortis-brand' : 'border-fortis-surface'}`}>
                          {localFilters.flowId.includes(f.id) && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    ))}
                    {filterMenuOpen === 'tags' && tags.map(tag => (
                       <div
                         key={tag.id}
                         onClick={() => {
                           if (localFilters.tags.includes(tag.label)) {
                             setLocalFilters({ ...localFilters, tags: localFilters.tags.filter(t => t !== tag.label) });
                           } else {
                             setLocalFilters({ ...localFilters, tags: [...localFilters.tags, tag.label] });
                           }
                         }}
                         className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${localFilters.tags.includes(tag.label) ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
                       >
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                           {tag.label}
                         </div>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${localFilters.tags.includes(tag.label) ? 'bg-fortis-brand border-fortis-brand' : 'border-fortis-surface'}`}>
                           {localFilters.tags.includes(tag.label) && <Check size={12} className="text-white" />}
                         </div>
                       </div>
                    ))}
                    {filterMenuOpen === 'origem' && availableOrigins.map(o => (
                      <div
                        key={o}
                        onClick={() => {
                          const newList = localFilters.origin.includes(o) 
                            ? localFilters.origin.filter(v => v !== o)
                            : [...localFilters.origin, o];
                          setLocalFilters({ ...localFilters, origin: newList });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${localFilters.origin.includes(o) ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
                      >
                        {o}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${localFilters.origin.includes(o) ? 'bg-fortis-brand border-fortis-brand' : 'border-fortis-surface'}`}>
                          {localFilters.origin.includes(o) && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    ))}
                    {filterMenuOpen === 'canal' && availableChannels.map(c => (
                      <div
                        key={c}
                        onClick={() => {
                          const newList = localFilters.channel.includes(c) 
                            ? localFilters.channel.filter(v => v !== c)
                            : [...localFilters.channel, c];
                          setLocalFilters({ ...localFilters, channel: newList });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${localFilters.channel.includes(c) ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
                      >
                        {c}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${localFilters.channel.includes(c) ? 'bg-fortis-brand border-fortis-brand' : 'border-fortis-surface'}`}>
                          {localFilters.channel.includes(c) && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-fortis-surface mt-2 mr-0">
                     {( (filterMenuOpen === 'tags' && localFilters.tags.length > 0) || 
                        (filterMenuOpen === 'status' && localFilters.status.length > 0) || 
                        (filterMenuOpen === 'resp' && localFilters.responsibleId.length > 0) || 
                        (filterMenuOpen === 'fluxo' && localFilters.flowId.length > 0) ||
                        (filterMenuOpen === 'origem' && localFilters.origin.length > 0) ||
                        (filterMenuOpen === 'canal' && localFilters.channel.length > 0) ||
                        (filterMenuOpen === 'cliente' && localFilters.search !== '')
                      ) && (
                        <button 
                          onClick={() => {
                            if (filterMenuOpen === 'tags') setLocalFilters({ ...localFilters, tags: [] });
                            else if (filterMenuOpen === 'status') setLocalFilters({ ...localFilters, status: [] });
                            else if (filterMenuOpen === 'resp') setLocalFilters({ ...localFilters, responsibleId: [] });
                            else if (filterMenuOpen === 'fluxo') setLocalFilters({ ...localFilters, flowId: [] });
                            else if (filterMenuOpen === 'origem') setLocalFilters({ ...localFilters, origin: [] });
                            else if (filterMenuOpen === 'canal') setLocalFilters({ ...localFilters, channel: [] });
                            else if (filterMenuOpen === 'cliente') setLocalFilters({ ...localFilters, search: '' });
                          }}
                          className="text-[10px] font-black text-fortis-mid hover:text-red-400 uppercase tracking-widest transition-all mr-0"
                        >
                          Limpar
                        </button>
                     )}
                     <button 
                       onClick={() => setFilterMenuOpen(null)}
                       className="px-6 py-2 bg-fortis-brand text-white rounded-xl text-[11px] font-black uppercase tracking-widest ml-auto"
                     >
                       Aplicar
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


          <div className="flex-1 bg-fortis-panel border border-fortis-surface rounded-2xl overflow-auto shadow-xl custom-scrollbar min-h-0">
            <table className="w-full text-left table-fixed min-w-[1100px]">
              <thead className="bg-fortis-dark/50 sticky top-0 z-10">
                <tr>
                  <SortableTableHeader label="Cliente" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} className="w-[220px]" />
                  <SortableTableHeader label="Status" sortKey="afterSalesStatus" sortConfig={sortConfig} requestSort={requestSort} className="w-[110px]" />
                  <th className="px-4 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest w-[180px]">
                    Fluxo
                  </th>
                  <SortableTableHeader label="Responsável" sortKey="responsibleId" sortConfig={sortConfig} requestSort={requestSort} className="w-[120px]" />
                  <SortableTableHeader label="Último Contato" sortKey="lastContactAt" sortConfig={sortConfig} requestSort={requestSort} className="w-[110px]" />
                  <th className="px-4 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest w-[140px]">Tag's</th>
                  <SortableTableHeader label="Origem/Canal" sortKey="origin" sortConfig={sortConfig} requestSort={requestSort} className="w-[130px]" />
                  <th className="px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest w-[80px] text-center">Pedidos</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-fortis-surface">
                  {paginatedAfterSales.map(client => (
                    <tr
                      key={client.id}
                      className="hover:bg-fortis-surface/20 cursor-pointer transition-colors group"
                      onClick={() => setSelectedLeadId(client.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{client.name}</span>
                          <span className="text-[10px] text-fortis-mid font-semibold">{client.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] px-2 py-0.5 rounded-full border font-black uppercase" style={{
                          borderColor: AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.color || '#575756',
                          color: AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.color || '#575756'
                        }}>
                          {(AFTER_SALES_STATUS_MAP[client.afterSalesStatus as AfterSalesStatus]?.label || client.afterSalesStatus || 'Sem Status')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {activeFlowsMap[client.id] ? (
                          <div className="flex items-center gap-1.5 bg-fortis-brand/10 border border-fortis-brand/20 rounded-lg px-2 py-1 w-fit">
                            <Workflow size={11} className="text-fortis-brand shrink-0" />
                            <span className="text-[9px] font-black text-fortis-brand uppercase leading-tight">
                              {activeFlowsMap[client.id].name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-fortis-mid/40">Nenhum fluxo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <img src={users.find(u => u.id === client.responsibleId)?.avatar} className="w-5 h-5 rounded-full border border-fortis-surface" alt="" />
                          <span className="text-xs font-bold text-white/90">{(users.find(u => u.id === client.responsibleId)?.name || 'Nenhum').split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white/90">
                          {client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 overflow-hidden">
                        <div className="flex flex-wrap gap-1">
                          {(client.tags || []).map(tagLabel => {
                            const tagConfig = tags.find(t => t.label === tagLabel);
                            return (
                              <span key={tagLabel} title={tagLabel} className="px-1.5 py-0.5 rounded text-[9px] font-black text-white shadow-sm uppercase max-w-full truncate inline-block align-bottom" style={{ backgroundColor: tagConfig?.color || '#575756' }}>
                                {tagLabel}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white/80 truncate">{client.origin}</span>
                          <span className="text-[10px] text-fortis-mid font-medium truncate">{client.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-white/80">
                          {client.purchaseHistory && client.purchaseHistory.length > 0 ? client.purchaseHistory.length : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAfterSales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-fortis-mid">
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
                  <button onClick={() => setIsModalOpen(true)} className="p-2 hover:bg-fortis-surface rounded-full text-white/50 hover:text-fortis-brand transition-all">
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
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-[0.3em] mb-4 opacity-50">Informações de Contato</h4>
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
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-[0.3em] opacity-50">GESTÃO E SEGMENTAÇÃO</h4>
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
                    <h4 className="text-[11px] font-black text-fortis-mid uppercase tracking-[0.3em] opacity-50">OUTRAS INFORMAÇÕES</h4>
                    <div className="p-5 bg-fortis-panel rounded-2xl border border-fortis-surface">
                      <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest block mb-3">UF</label>
                      <p className="text-xl font-black text-white">{selectedLead.uf}</p>
                    </div>
                  </section>

                  <section className="space-y-6 pt-10 border-t border-fortis-surface/30">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-fortis-brand uppercase tracking-[0.3em]">REGISTRAR ATIVIDADE</h4>
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
                                  {(users.find(u => u.id === item.userId)?.name || 'Sistema').split(' ')[0]}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadId={selectedLeadId}
      />
    </>
  );
};
