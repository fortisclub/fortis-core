import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../store';
import { Bold, Italic, List, Save, Megaphone, Tag, Calendar, AlignLeft, Plus, Settings2, Trash2, X, Clock, Loader2, Palette } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ACTION_OPTIONS = [
  { value: 'cupom_desconto', label: 'Cupom Desconto', color: 'bg-green-500/20 text-green-500' },
  { value: 'desconto_progressivo', label: 'Desconto Progressivo', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'frete_fixo', label: 'Frete Fixo', color: 'bg-red-500/20 text-red-500' },
  { value: 'frete_gratis', label: 'Frete Grátis', color: 'bg-orange-500/20 text-orange-500' },
  { value: 'liveshop', label: 'LiveShop', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'compre_1_leve_2', label: 'Compre 1 Leve 2', color: 'bg-blue-500/20 text-blue-500' },
  { value: 'sale', label: 'Sale', color: 'bg-sky-500/20 text-sky-500' },
  { value: 'saldao', label: 'Saldão', color: 'bg-purple-500/20 text-purple-500' },
  { value: 'compre_e_ganhe', label: 'Compre e Ganhe', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'pre_venda', label: 'Pré Venda', color: 'bg-red-500/20 text-red-500' },
  { value: 'upsell', label: 'Upsell', color: 'bg-orange-500/20 text-orange-500' },
  { value: 'frete_rapido', label: 'Frete Rápido', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'combos', label: 'combos', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'preco_unico', label: 'PREÇO ÚNICO', color: 'bg-red-500/20 text-red-500' },
];

const ACTION_COLORS = [
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#eab308', // Yellow
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
];

interface CommercialAction {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  selectedAction: string;
  description: string;
  color: string;
  createdAt: string;
}

export const CommercialActions: React.FC = () => {
  const { addNotification, activeModal, closeModal } = useApp();
  
  // Local state for actions to simulate functionality
  const [actions, setActions] = useState<CommercialAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAction, setSelectedAction] = useState(ACTION_OPTIONS[0].value);
  const [color, setColor] = useState('#06b6d4');
  const editorRef = useRef<HTMLDivElement>(null);

  const formatText = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  const fetchActions = async () => {
    try {
      const { data, error } = await supabase
        .from('commercial_actions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setActions(data.map(item => ({
          id: item.id,
          name: item.name,
          startDate: item.start_date,
          endDate: item.end_date,
          selectedAction: item.selected_action,
          description: item.description || '',
          color: item.color || '#06b6d4',
          createdAt: item.created_at
        })));
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
      addNotification('Erro', 'Não foi possível carregar as ações comerciais', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  useEffect(() => {
    if (activeModal === 'COMMERCIAL_ACTION' && !isModalOpen) {
      handleOpenModal();
    }
  }, [activeModal]);

  const handleOpenModal = (action?: CommercialAction) => {
    if (action) {
      setEditingId(action.id);
      setName(action.name);
      setStartDate(action.startDate);
      setEndDate(action.endDate);
      setSelectedAction(action.selectedAction);
      setColor(action.color || '#06b6d4');
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = action.description;
        }
      }, 50);
    } else {
      setEditingId(null);
      setName('');
      setStartDate('');
      setEndDate('');
      setSelectedAction(ACTION_OPTIONS[0].value);
      setColor('#06b6d4');
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }, 50);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    closeModal();
  };

  const handleDeleteAction = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ação comercial?')) return;
    try {
      const { error } = await supabase.from('commercial_actions').delete().eq('id', id);
      if (error) throw error;
      setActions(prev => prev.filter(a => a.id !== id));
      addNotification('Sucesso', 'Ação comercial excluída com sucesso!', 'SUCCESS');
      handleCloseModal();
    } catch (err: any) {
      console.error('Erro ao excluir ação:', err);
      addNotification('Erro', 'Não foi possível excluir a ação comercial.', 'ERROR');
    }
  };

  const handleSave = async () => {
    if (!name || !startDate || !endDate) {
      addNotification('Erro', 'Preencha os campos obrigatórios', 'ERROR');
      return;
    }
    const description = editorRef.current?.innerHTML || '';
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('commercial_actions')
          .update({
            name,
            start_date: startDate,
            end_date: endDate,
            selected_action: selectedAction,
            description,
            color
          })
          .eq('id', editingId);

        if (error) throw error;

        setActions(prev => prev.map(a => a.id === editingId ? {
          ...a, name, startDate, endDate, selectedAction, description, color
        } : a));
        addNotification('Sucesso', 'Ação comercial atualizada com sucesso!', 'SUCCESS');
      } else {
        const { data, error } = await supabase
          .from('commercial_actions')
          .insert([{
            name,
            start_date: startDate,
            end_date: endDate,
            selected_action: selectedAction,
            description,
            color
          }])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newAction: CommercialAction = {
            id: data.id,
            name: data.name,
            startDate: data.start_date,
            endDate: data.end_date,
            selectedAction: data.selected_action,
            description: data.description || '',
            color: data.color || '#06b6d4',
            createdAt: data.created_at
          };
          setActions(prev => [newAction, ...prev]);
        }
        addNotification('Sucesso', 'Ação comercial criada com sucesso!', 'SUCCESS');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving action:', error);
      addNotification('Erro', 'Ocorreu um erro ao salvar a ação comercial', 'ERROR');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta ação comercial?')) {
      try {
        const { error } = await supabase
          .from('commercial_actions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setActions(prev => prev.filter(a => a.id !== id));
        addNotification('Sucesso', 'Ação comercial excluída.', 'SUCCESS');
      } catch (error) {
        console.error('Error deleting action:', error);
        addNotification('Erro', 'Não foi possível excluir a ação comercial', 'ERROR');
      }
    }
  };

  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todaySP = formatter.format(new Date());

  const upcomingActions = actions.filter(a => a.startDate > todaySP).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const nextActionId = upcomingActions.length > 0 ? upcomingActions[0].id : null;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="space-y-6 h-full flex flex-col relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="text-fortis-brand" />
              Ações Comerciais
            </h2>
            <p className="text-fortis-mid text-sm font-semibold">Crie e gerencie ações promocionais e comerciais.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-fortis-brand animate-spin" />
                </div>
            ) : actions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-fortis-surface/30 rounded-full flex items-center justify-center mb-4">
                        <Megaphone size={40} className="text-fortis-mid/50" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma ação comercial cadastrada</h3>
                    <p className="text-fortis-mid max-w-sm">
                        Crie sua primeira ação comercial para planejar descontos, combos e campanhas.
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-6 px-6 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors"
                    >
                        Criar Ação
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {actions.map(action => {
                        const selType = ACTION_OPTIONS.find(a => a.value === action.selectedAction);
                        
                        let statusTag = { label: '', color: '' };
                        if (action.endDate < todaySP) {
                            statusTag = { label: 'Encerrada', color: 'bg-fortis-surface/30 text-fortis-mid border-fortis-surface/50' };
                        } else if (action.startDate <= todaySP && action.endDate >= todaySP) {
                            statusTag = { label: 'Em andamento', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' };
                        } else {
                            if (action.id === nextActionId) {
                                statusTag = { label: 'Próxima Ação', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]' };
                            } else {
                                statusTag = { label: 'Programada', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
                            }
                        }

                        return (
                        <div
                            key={action.id}
                            onClick={() => handleOpenModal(action)}
                            className="bg-fortis-panel border border-fortis-surface/80 rounded-xl p-6 pt-7 hover:border-fortis-brand/50 transition-all cursor-pointer group flex flex-col relative overflow-hidden shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-fortis-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl border-l border-b text-[9px] font-black uppercase tracking-wider transition-colors z-10 ${statusTag.color}`}>
                                {statusTag.label}
                            </div>

                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-base text-white group-hover:text-fortis-brand transition-colors">
                                    {action.name}
                                </h3>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(action); }}
                                        className="p-1.5 text-fortis-mid hover:text-white bg-fortis-surface/50 hover:bg-fortis-surface rounded-lg transition-colors"
                                        title="Editar Ação"
                                    >
                                        <Settings2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(action.id, e)}
                                        className="p-1.5 text-fortis-mid hover:text-red-400 bg-fortis-dark/50 hover:bg-red-500/10 rounded-lg transition-colors border border-fortis-surface/30"
                                        title="Excluir Ação"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {selType && (
                                <div className="mb-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${selType.color}`}>
                                        {selType.label}
                                    </span>
                                </div>
                            )}

                            <p className="text-xs text-fortis-mid mb-5 flex-1 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: action.description || 'Sem descrição cadastrada.' }} />

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-fortis-surface/50">
                                <div className="flex items-center gap-2 text-[10px] text-fortis-mid font-black uppercase tracking-widest bg-fortis-dark/50 px-2 py-1 rounded-lg border border-fortis-surface/30 w-fit">
                                    <Calendar size={12} className="text-fortis-mid/70" />
                                    {new Date(action.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(action.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-fortis-panel border border-fortis-surface w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-fortis-surface flex items-center justify-between bg-fortis-panel shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {editingId ? 'Editar Ação Comercial' : 'Nova Ação Comercial'}
                </h2>
                <button onClick={handleCloseModal} className="text-fortis-mid hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div>
                <label className="block text-xs font-bold text-fortis-mid uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Tag size={14} /> Nome da ação comercial *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Black Friday"
                  className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-fortis-brand transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-fortis-mid uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Data inicial *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-fortis-brand transition-colors appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fortis-mid uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Data final *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-fortis-brand transition-colors appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fortis-mid uppercase tracking-widest mb-2">
                  Ação
                </label>
                <div className="relative">
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-fortis-brand transition-colors appearance-none cursor-pointer"
                  >
                    {ACTION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                    {(() => {
                        const sel = ACTION_OPTIONS.find(a => a.value === selectedAction);
                        return sel ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sel.color}`}>
                            {sel.label}
                          </span>
                        ) : null;
                    })()}
                    <svg className="w-4 h-4 text-fortis-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fortis-mid uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Palette size={14} /> Cor da tag
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {ACTION_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="w-px h-8 bg-fortis-surface mx-2"></div>
                  <div className="relative flex items-center" title="Cor Personalizada">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-dashed border-fortis-mid flex items-center justify-center cursor-pointer hover:border-white transition-colors"
                      style={{ backgroundColor: color }}
                    >
                        {!ACTION_COLORS.includes(color) && <Plus size={12} className="text-white drop-shadow-md" />}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fortis-mid uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlignLeft size={14} /> Descrição
                </label>
                <div className="bg-fortis-dark border border-fortis-surface rounded-lg overflow-hidden focus-within:border-fortis-brand transition-colors">
                  <div className="flex items-center gap-1 border-b border-fortis-surface p-2 bg-fortis-dark/50">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => formatText('bold')}
                      className="p-1.5 hover:bg-fortis-surface rounded text-fortis-mid hover:text-white transition-colors"
                      title="Negrito"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => formatText('italic')}
                      className="p-1.5 hover:bg-fortis-surface rounded text-fortis-mid hover:text-white transition-colors"
                      title="Itálico"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => formatText('insertUnorderedList')}
                      className="p-1.5 hover:bg-fortis-surface rounded text-fortis-mid hover:text-white transition-colors"
                      title="Lista com marcadores"
                    >
                      <List size={16} />
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    className="w-full min-h-[120px] p-4 text-sm text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-fortis-surface flex items-center gap-3 shrink-0">
                {editingId && (
                  <button
                    onClick={() => handleDeleteAction(editingId)}
                    className="flex shrink-0 items-center justify-center gap-2 px-6 py-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold rounded-xl transition-colors mr-auto"
                  >
                    <Trash2 size={18} />
                    Excluir
                  </button>
                )}
                <div className="flex gap-3 flex-1 sm:flex-none sm:w-[400px] ml-auto">
                    <button
                        onClick={handleCloseModal}
                        className="flex-1 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2.5 bg-fortis-brand text-white font-bold rounded-xl hover:bg-fortis-brand/90 transition-colors shadow-lg shadow-fortis-brand/20 flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Ação
                    </button>
                </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
