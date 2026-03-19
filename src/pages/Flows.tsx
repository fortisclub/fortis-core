import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings2, Trash2, Workflow, Clock, ExternalLink, GripVertical, X, ArrowRight, ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import { useApp } from '../store';
import { CadenceFlow, CadenceStage } from '../types';
import { supabase } from '../lib/supabase';

export const Flows: React.FC = () => {
    const navigate = useNavigate();
    const { cadenceFlows: flows, addCadenceFlow, updateCadenceFlow, deleteCadenceFlow, activeModal, closeModal, openModal } = useApp();

    const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingFlow, setEditingFlow] = useState<CadenceFlow | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', stages: [] as CadenceStage[] });

    const [newStageName, setNewStageName] = useState('');
    const [draggedStageIdx, setDraggedStageIdx] = useState<number | null>(null);
    const [todayTasksCounts, setTodayTasksCounts] = useState<Record<string, number>>({});
    const [overdueTasksCounts, setOverdueTasksCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (activeModal === 'CADENCE_FLOW' && !isInternalModalOpen) {
            handleOpenModal();
        }
    }, [activeModal]);

    useEffect(() => {
        fetchTasksStats();
    }, [flows]);

    const fetchTasksStats = async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('cadence_tasks')
            .select('flow_id, due_date')
            .eq('completed', false);

        if (!error && data) {
            const todayCounts: Record<string, number> = {};
            const overdueCounts: Record<string, number> = {};

            data.forEach((task: any) => {
                if (!task.due_date) return;

                const taskDate = task.due_date.split('T')[0];
                if (taskDate === todayStr) {
                    todayCounts[task.flow_id] = (todayCounts[task.flow_id] || 0) + 1;
                } else if (taskDate < todayStr) {
                    overdueCounts[task.flow_id] = (overdueCounts[task.flow_id] || 0) + 1;
                }
            });

            setTodayTasksCounts(todayCounts);
            setOverdueTasksCounts(overdueCounts);
        }
    };

    const handleOpenModal = (flow?: CadenceFlow) => {
        setCurrentStep(1);
        if (flow) {
            setEditingFlow(flow);
            setFormData({
                name: flow.name,
                description: flow.description,
                stages: flow.stages ? [...flow.stages] : []
            });
        } else {
            setEditingFlow(null);
            setFormData({
                name: '',
                description: '',
                stages: [
                    { id: Math.random().toString(36).substr(2, 9), name: 'Nova Etapa 1', instructions: '', delayDays: 0 },
                    { id: Math.random().toString(36).substr(2, 9), name: 'Nova Etapa 2', instructions: '', delayDays: 0 }
                ]
            });
        }
        setIsInternalModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsInternalModalOpen(false);
        setEditingFlow(null);
        setFormData({ name: '', description: '', stages: [] });
        setCurrentStep(1);
        closeModal();
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setCurrentStep(2);
    };

    const handleSaveFlow = async () => {
        if (editingFlow) {
            await updateCadenceFlow(editingFlow.id, formData);
            handleCloseModal();
        } else {
            const newId = await addCadenceFlow({
                name: formData.name,
                description: formData.description,
                stages: formData.stages
            });
            if (newId) {
                navigate(`/fluxos/${newId}`);
            } else {
                handleCloseModal();
            }
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este fluxo?')) {
            deleteCadenceFlow(id);
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedStageIdx(index);
        // Required for Firefox
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedStageIdx === null || draggedStageIdx === index) return;

        const newStages = [...formData.stages];
        const draggedStage = newStages[draggedStageIdx];
        newStages.splice(draggedStageIdx, 1);
        newStages.splice(index, 0, draggedStage);

        setDraggedStageIdx(index);
        setFormData({ ...formData, stages: newStages });
    };

    const handleDragEnd = () => {
        setDraggedStageIdx(null);
    };

    const handleAddStage = () => {
        if (!newStageName.trim()) return;
        setFormData({
            ...formData,
            stages: [...formData.stages, {
                id: Math.random().toString(36).substr(2, 9),
                name: newStageName.trim(),
                instructions: '',
                delayDays: 1
            }]
        });
        setNewStageName('');
    };

    const handleRemoveStage = (id: string) => {
        setFormData({
            ...formData,
            stages: formData.stages.filter(s => s.id !== id)
        });
    };

    const updateStage = (index: number, updates: Partial<CadenceStage>) => {
        const newStages = [...formData.stages];
        newStages[index] = { ...newStages[index], ...updates };
        setFormData({ ...formData, stages: newStages });
    };

    return (
        <>
            <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="space-y-6 h-full flex flex-col relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Fluxos de Cadência</h2>
                            <p className="text-fortis-mid text-sm font-semibold">Gerencie e crie etapas de acompanhamento personalizadas</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {flows.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-fortis-surface/30 rounded-full flex items-center justify-center mb-4">
                                    <Workflow size={40} className="text-fortis-mid/50" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Nenhum fluxo cadastrado</h3>
                                <p className="text-fortis-mid max-w-sm">
                                    Crie seu primeiro fluxo de cadência para começar a automatizar e padronizar o acompanhamento dos seus contatos.
                                </p>
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="mt-6 px-6 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors"
                                >
                                    Criar Fluxo
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {flows.map(flow => (
                                    <div
                                        key={flow.id}
                                        onClick={() => navigate(`/fluxos/${flow.id}`)}
                                        className="bg-fortis-panel border border-fortis-surface/80 rounded-xl p-6 hover:border-fortis-brand/50 transition-all cursor-pointer group flex flex-col relative overflow-hidden shadow-sm hover:shadow-xl"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-fortis-brand opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-base text-white group-hover:text-fortis-brand transition-colors">
                                                {flow.name}
                                            </h3>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(flow); }}
                                                    className="p-1.5 text-fortis-mid hover:text-white bg-fortis-surface/50 hover:bg-fortis-surface rounded-lg transition-colors"
                                                    title="Editar Fluxo"
                                                >
                                                    <Settings2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(flow.id, e)}
                                                    className="p-1.5 text-fortis-mid hover:text-red-400 bg-fortis-dark/50 hover:bg-red-500/10 rounded-lg transition-colors border border-fortis-surface/30"
                                                    title="Excluir Fluxo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-fortis-mid mb-5 flex-1 line-clamp-2 leading-relaxed">
                                            {flow.description || 'Sem descrição cadastrada.'}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-fortis-surface/50">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-[10px] text-fortis-mid font-black uppercase tracking-widest bg-fortis-dark/50 px-2 py-1 rounded-lg border border-fortis-surface/30 w-fit">
                                                    <Clock size={12} className="text-fortis-mid/70" />
                                                    {new Date(flow.createdAt).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {todayTasksCounts[flow.id] > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] text-amber-500 font-black uppercase tracking-wider animate-pulse-subtle">
                                                            <Calendar size={11} />
                                                            {todayTasksCounts[flow.id]} Hoje
                                                        </div>
                                                    )}
                                                    {overdueTasksCounts[flow.id] > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/5 border border-red-500/20 rounded-lg text-[9px] text-red-500 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                                            <AlertTriangle size={11} />
                                                            {overdueTasksCounts[flow.id]} Atrasada{overdueTasksCounts[flow.id] > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-fortis-brand group-hover:translate-x-1 transition-transform">
                                                <span className="uppercase tracking-widest text-[10px]">Abrir</span>
                                                <ExternalLink size={14} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isInternalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-fortis-panel border border-fortis-surface w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="p-6 border-b border-fortis-surface flex items-center justify-between bg-fortis-panel shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {currentStep === 2 && (
                                    <button onClick={() => setCurrentStep(1)} className="p-1 hover:bg-fortis-surface rounded-lg text-fortis-mid hover:text-white transition-colors">
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                {editingFlow ? 'Editar Fluxo' : 'Novo Fluxo'}
                            </h2>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span className={`${currentStep === 1 ? 'text-fortis-brand' : 'text-fortis-mid'}`}>1. Info</span>
                                <span className="text-fortis-surface">/</span>
                                <span className={`${currentStep === 2 ? 'text-fortis-brand' : 'text-fortis-mid'}`}>2. Etapas</span>
                            </div>
                        </div>

                        {currentStep === 1 && (
                            <form onSubmit={handleNextStep} className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-fortis-mid mb-1.5">Nome do Fluxo *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-fortis-brand focus:ring-1 focus:ring-fortis-brand transition-colors"
                                            placeholder="Ex: Fluxo Pós-venda VIP"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-fortis-mid mb-1.5">Descrição (opcional)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-fortis-brand focus:ring-1 focus:ring-fortis-brand transition-colors h-24 resize-none"
                                            placeholder="Descreva o objetivo deste fluxo..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-fortis-brand text-white font-bold rounded-xl hover:bg-fortis-brand/90 transition-colors shadow-lg shadow-fortis-brand/20"
                                    >
                                        Próxima Etapa <ArrowRight size={18} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {currentStep === 2 && (
                            <div className="p-6 flex flex-col flex-1 overflow-hidden min-h-[400px]">
                                <p className="text-fortis-mid text-sm mb-4">
                                    Crie e ordene as etapas personalizadas (colunas do kanban) que farão parte deste fluxo. Arraste para reordenar.
                                </p>

                                <div className="flex gap-2 mb-6 shrink-0">
                                    <input
                                        type="text"
                                        value={newStageName}
                                        onChange={(e) => setNewStageName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddStage();
                                            }
                                        }}
                                        placeholder="Nome da nova etapa..."
                                        className="flex-1 bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-fortis-brand focus:ring-1 focus:ring-fortis-brand transition-colors"
                                    />
                                    <button
                                        onClick={handleAddStage}
                                        disabled={!newStageName.trim()}
                                        className="px-4 py-2 bg-fortis-surface text-white rounded-xl hover:bg-fortis-surface/80 transition-colors disabled:opacity-50 font-bold text-sm flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {formData.stages.length === 0 ? (
                                        <div className="text-center py-8 text-fortis-mid">
                                            Nenhuma etapa adicionada.
                                        </div>
                                    ) : (
                                        formData.stages.map((stage, index) => (
                                            <div
                                                key={stage.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`flex bg-[#0A0F14] border rounded-2xl group transition-all overflow-hidden h-[190px]
                                                  ${draggedStageIdx === index ? 'opacity-50 border-fortis-brand/50 scale-[0.98]' : 'border-fortis-surface/50 hover:border-fortis-brand/30'}
                                                `}
                                            >
                                                {/* Drag Handle Area */}
                                                <div className="w-10 flex items-center justify-center bg-fortis-dark/30 border-r border-fortis-surface/30 cursor-grab active:cursor-grabbing text-fortis-mid group-hover:text-fortis-brand/50 transition-colors">
                                                    <GripVertical size={20} />
                                                </div>

                                                {/* Content Area */}
                                                <div className="flex-1 py-6 px-6 flex flex-col justify-between">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <input
                                                            type="text"
                                                            value={stage.name}
                                                            onChange={(e) => updateStage(index, { name: e.target.value })}
                                                            className="flex-1 bg-transparent border-none font-black text-base text-white focus:outline-none placeholder:text-white/20"
                                                            placeholder="Nome da etapa..."
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveStage(stage.id)}
                                                            className="text-fortis-mid hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                                                            title="Remover Etapa"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 border-t border-fortis-surface/20 pt-3">
                                                        <div className="md:col-span-3">
                                                            <label className="block text-[9px] font-black text-fortis-mid uppercase tracking-[0.2em] mb-1.5 opacity-60">Instruções da Etapa</label>
                                                            <textarea
                                                                value={stage.instructions || ''}
                                                                onChange={(e) => updateStage(index, { instructions: e.target.value })}
                                                                className="w-full bg-fortis-dark/50 border border-fortis-surface/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-fortis-brand/50 resize-none h-[85px] placeholder:text-white/10 transition-all focus:bg-fortis-dark"
                                                                placeholder="Descreva a ação..."
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2 flex flex-col justify-between">
                                                            {index === 0 ? (
                                                                <>
                                                                    <div>
                                                                        <label className="block text-[9px] font-black text-fortis-mid uppercase tracking-[0.2em] mb-1.5 opacity-60">Tempo de Espera</label>
                                                                        <div className="flex p-1 bg-fortis-dark/50 border border-fortis-surface/50 rounded-xl gap-0.5">
                                                                            <button
                                                                                onClick={() => updateStage(index, { delayDays: 0 })}
                                                                                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${stage.delayDays === 0 ? 'bg-fortis-brand text-white shadow-lg shadow-fortis-brand/20' : 'text-fortis-mid hover:text-white'}`}
                                                                            >
                                                                                Imediato
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateStage(index, { delayDays: stage.delayDays || 1 })}
                                                                                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${stage.delayDays !== 0 ? 'bg-fortis-surface text-white' : 'text-fortis-mid hover:text-white'}`}
                                                                            >
                                                                                Agendar
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2 min-h-[50px] flex flex-col justify-end">
                                                                        {stage.delayDays !== 0 && (
                                                                            <div className="relative animate-in slide-in-from-top-1 duration-200">
                                                                                <input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    value={stage.delayDays}
                                                                                    onChange={(e) => updateStage(index, { delayDays: parseInt(e.target.value) || 1 })}
                                                                                    className="w-full bg-fortis-dark border border-fortis-surface/50 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-fortis-brand/50 transition-all"
                                                                                />
                                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-fortis-mid uppercase">dias</span>
                                                                            </div>
                                                                        )}

                                                                        <p className="text-[9px] text-fortis-mid mt-1 px-1 leading-tight">
                                                                            {stage.delayDays === 0
                                                                                ? 'Ação imediata.'
                                                                                : `Aguardará ${stage.delayDays} ${stage.delayDays === 1 ? 'dia' : 'dias'}.`}
                                                                        </p>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col justify-center h-full">
                                                                    <label className="block text-[9px] font-black text-fortis-mid uppercase tracking-[0.2em] mb-1.5 opacity-60">Prazo</label>
                                                                    <p className="text-[9px] text-fortis-mid/60 leading-tight px-1">
                                                                        O prazo será definido manualmente no card do cliente.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6 pt-6 border-t border-fortis-surface shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveFlow}
                                        className="flex-1 py-2.5 bg-fortis-brand text-white font-bold rounded-xl hover:bg-fortis-brand/90 transition-colors shadow-lg shadow-fortis-brand/20"
                                    >
                                        Salvar e {editingFlow ? 'Concluir' : 'Abrir'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
};
