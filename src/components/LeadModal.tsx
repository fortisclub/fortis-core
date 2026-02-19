
import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Search, Plus, Check, Trash2 } from 'lucide-react';
import { useApp } from '../store';
import { UFS, LEAD_STATUS_MAP, AFTER_SALES_STATUS_MAP } from '../constants';
import { LeadStatus } from '../types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, leadId }) => {
  const { addLead, updateLead, deleteLead, leads, users, tags: availableTags, channels, origins } = useApp();
  const editLead = leadId ? leads.find(l => l.id === leadId) : null;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  const [tagSearch, setTagSearch] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editLead) {
        reset({
          name: editLead.name,
          email: editLead.email,
          phone: editLead.phone,
          status: editLead.afterSalesStatus || editLead.status,
          responsibleId: editLead.responsibleId,
          tags: editLead.tags,
          channel: editLead.channel,
          origin: editLead.origin,
          uf: editLead.uf,
          notes: editLead.notes,
          cpf: editLead.cpf || '',
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          status: 'NOVO',
          responsibleId: users.length > 0 ? users[0].id : '',
          tags: [],
          channel: channels[0] || '',
          origin: origins[0] || '',
          uf: 'SP',
          notes: '',
          cpf: '',
        });
      }
    }
  }, [isOpen, editLead, reset, users, channels, origins]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    try {
      if (editLead) {
        await updateLead(editLead.id, data);
      } else {
        await addLead({
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status as LeadStatus,
          responsibleId: data.responsibleId,
          tags: data.tags || [],
          channel: data.channel,
          origin: data.origin,
          uf: data.uf,
          notes: data.notes,
          cpf: data.cpf,
        });
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const filteredSuggestions = availableTags.filter(tag =>
    tag.label.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-fortis-dark border border-fortis-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-fortis-surface flex items-center justify-between bg-fortis-panel/50">
          <div>
            <h2 className="text-xl font-bold">{editLead ? 'Editar Lead' : 'Criar Novo Lead'}</h2>
            <p className="text-xs text-fortis-mid mt-1">
              {editLead ? `Atualizando informações de ${editLead.name}` : 'Preencha as informações essenciais da oportunidade.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editLead && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir este lead?')) {
                    deleteLead(editLead.id);
                    onClose();
                  }
                }}
                className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors"
                title="Excluir Lead"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-fortis-surface rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <input type="hidden" {...register('cpf')} />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Nome Completo *</label>
              <input
                {...register('name', { required: true })}
                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none"
              />
              {errors.name && <span className="text-red-500 text-[10px]">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">E-mail *</label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none"
              />
              {errors.email && <span className="text-red-500 text-[10px]">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Telefone *</label>
              <input
                {...register('phone', { required: true })}
                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none"
              />
              {errors.phone && <span className="text-red-500 text-[10px]">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Status {editLead?.afterSalesStatus ? '(Pós-venda)' : '*'}</label>
              <select
                {...register('status', { required: !editLead?.afterSalesStatus })}
                disabled={!!editLead?.afterSalesStatus}
                className={`w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none appearance-none ${editLead?.afterSalesStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {editLead?.afterSalesStatus ? (
                  Object.entries(AFTER_SALES_STATUS_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))
                ) : (
                  Object.entries(LEAD_STATUS_MAP)
                    .filter(([key]) => key !== 'SEM_CLASSIFICACAO')
                    .map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))
                )}
              </select>
              {errors.status && <span className="text-red-500 text-[10px]">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Responsável *</label>
              <select
                {...register('responsibleId', { required: true })}
                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {errors.responsibleId && <span className="text-red-500 text-[10px]">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">UF *</label>
              <select
                {...register('uf', { required: true })}
                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none"
              >
                {UFS.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              {errors.uf && <span className="text-red-500 text-[10px]">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Canal</label>
              <select {...register('channel')} className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none">
                {channels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Origem</label>
              <select {...register('origin')} className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none">
                {origins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Tags</label>

              <Controller
                name="tags"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <div className="relative">
                    <div className="bg-fortis-panel border border-fortis-surface rounded-lg p-2 min-h-[42px] focus-within:border-fortis-brand transition-colors">
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tagLabel: string) => {
                          const tagConfig = availableTags.find(t => t.label === tagLabel);
                          return (
                            <span
                              key={tagLabel}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm"
                              style={{ backgroundColor: tagConfig?.color || '#575756' }}
                            >
                              {tagLabel}
                              <button
                                type="button"
                                onClick={() => field.onChange(field.value.filter((t: string) => t !== tagLabel))}
                                className="hover:bg-black/20 rounded-full p-0.5"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                        <input
                          ref={tagInputRef}
                          type="text"
                          placeholder="Pesquise ou adicione..."
                          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-fortis-mid flex-1 min-w-[100px]"
                          value={tagSearch}
                          onChange={(e) => {
                            setTagSearch(e.target.value);
                            setShowTagSuggestions(true);
                          }}
                          onFocus={() => setShowTagSuggestions(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagSearch.trim()) {
                              e.preventDefault();
                              if (!field.value.includes(tagSearch.trim())) {
                                field.onChange([...field.value, tagSearch.trim()]);
                              }
                              setTagSearch('');
                            }
                          }}
                        />
                      </div>
                    </div>

                    {showTagSuggestions && (tagSearch || filteredSuggestions.length > 0) && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-fortis-panel border border-fortis-surface rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredSuggestions.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-fortis-surface transition-colors"
                            onClick={() => {
                              if (!field.value.includes(tag.label)) {
                                field.onChange([...field.value, tag.label]);
                              }
                              setTagSearch('');
                              setShowTagSuggestions(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                              <span className="font-semibold">{tag.label}</span>
                            </div>
                            {field.value.includes(tag.label) && <Check size={14} className="text-fortis-brand" />}
                          </button>
                        ))}
                        {tagSearch && !availableTags.some(t => t.label.toLowerCase() === tagSearch.toLowerCase()) && (
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs hover:bg-fortis-surface text-fortis-brand transition-colors font-bold"
                            onClick={() => {
                              if (!field.value.includes(tagSearch.trim())) {
                                field.onChange([...field.value, tagSearch.trim()]);
                              }
                              setTagSearch('');
                              setShowTagSuggestions(false);
                            }}
                          >
                            <Plus size={14} />
                            Criar "{tagSearch}"
                          </button>
                        )}
                      </div>
                    )}
                    {showTagSuggestions && (
                      <div className="fixed inset-0 z-[-1]" onClick={() => setShowTagSuggestions(false)} />
                    )}
                  </div>
                )}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Observações</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2 text-sm focus:border-fortis-brand outline-none resize-none"
                placeholder="Notas internas..."
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-fortis-surface">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-sm font-semibold text-fortis-mid hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-fortis-brand hover:bg-opacity-90 text-white px-8 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-fortis-brand/20 active:scale-95"
            >
              {editLead ? 'Salvar Alterações' : 'Salvar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
