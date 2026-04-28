import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, List, KanbanSquare as KanbanIcon, Calendar as CalendarIcon,
    ChevronDown, ChevronRight, Workflow, Plus, Search, Filter, Check, Clock, X, Trash2, Edit2, ChevronLeft,
    FileText, History, ArrowRight, User
} from 'lucide-react';
import { useApp } from '../store';
import { Lead, AfterSalesStatus, CadenceTask, LeadStatus } from '../types';
import { AFTER_SALES_STATUS_MAP, LEAD_STATUS_MAP } from '../constants';
import { supabase } from '../lib/supabase';

type PeriodOption = 'today' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all';

const PERIOD_LABELS: Record<PeriodOption, string> = {
    today: 'Hoje',
    last7: 'Últimos 7 dias',
    thisMonth: 'Este mês',
    lastMonth: 'Último mês',
    thisYear: 'Este ano',
    lastYear: 'Último ano',
    all: 'Todos'
};

type ViewMode = 'LIST' | 'KANBAN' | 'CALENDAR';

export const FlowDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cadenceFlows, updateCadenceFlow, leads, users, currentUser, tags: availableTags, updateLead, addTag, fetchLeadHistory, addLeadNote, editLeadNote, deleteLeadNote } = useApp();
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');

    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [editingStageName, setEditingStageName] = useState('');

    const flow = cadenceFlows.find(f => f.id === id);
    const flowName = flow?.name || 'Fluxo Inexistente';

    const [tasks, setTasks] = useState<CadenceTask[]>([]);

    // ─── Filter state ───────────────────────────────────────────
    const [filterPeriod, setFilterPeriod] = useState<PeriodOption>('all');
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterResponsible, setFilterResponsible] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [tagSearch, setTagSearch] = useState('');
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteContent, setEditingNoteContent] = useState('');

    // close period dropdown on outside click - removed (using panel pattern now)

    // Compute the date range for the selected period
    const getPeriodRange = (): { start: string | null; end: string | null } => {
        const now = new Date();
        const fmt = (d: Date) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
        if (filterPeriod === 'today') {
            const s = fmt(now);
            return { start: s, end: s };
        }
        if (filterPeriod === 'last7') {
            const s = new Date(now); s.setDate(now.getDate() - 6);
            return { start: fmt(s), end: fmt(now) };
        }
        if (filterPeriod === 'thisMonth') {
            const s = new Date(now.getFullYear(), now.getMonth(), 1);
            const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { start: fmt(s), end: fmt(e) };
        }
        if (filterPeriod === 'lastMonth') {
            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const e = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: fmt(s), end: fmt(e) };
        }
        if (filterPeriod === 'thisYear') {
            return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
        }
        if (filterPeriod === 'lastYear') {
            const y = now.getFullYear() - 1;
            return { start: `${y}-01-01`, end: `${y}-12-31` };
        }
        return { start: null, end: null };
    };

    // Master filtered tasks list (applied to all views)
    const filteredTasks = tasks.filter(t => {
        // Name filter
        if (filterName && !t.lead?.name.toLowerCase().includes(filterName.toLowerCase())) return false;
        // Status filter (Pós-Venda only)
        if (filterStatus) {
            if (t.lead?.afterSalesStatus !== filterStatus) return false;
        }
        // Responsible filter
        if (filterResponsible && t.lead?.responsibleId !== filterResponsible) return false;
        // Period filter on dueDate
        if (filterPeriod !== 'all') {
            const { start, end } = getPeriodRange();
            const d = t.dueDate ? t.dueDate.split('T')[0] : null;
            if (!d) return false;
            if (start && d < start) return false;
            if (end && d > end) return false;
        }
        return true;
    });

    const hasActiveFilters = filterPeriod !== 'all' || filterName !== '' || filterStatus !== '' || filterResponsible !== '';
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [selectedDueDate, setSelectedDueDate] = useState('');

    const [selectedTask, setSelectedTask] = useState<CadenceTask | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskInstructions, setTaskInstructions] = useState('');
    const [commercialActions, setCommercialActions] = useState<{id: string; name: string; start_date: string; end_date: string, color?: string}[]>([]);
    const [actionSearch, setActionSearch] = useState('');
    const [showActionSuggestions, setShowActionSuggestions] = useState(false);

    const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'history'>('info');
    const [manualNote, setManualNote] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isTaskModalOpen && selectedTask?.lead?.id && activeDetailTab === 'history') {
            setLoadingHistory(true);
            fetchLeadHistory(selectedTask.lead.id).then(data => {
                setHistory(data);
                setLoadingHistory(false);
            });
        }
    }, [isTaskModalOpen, selectedTask?.lead?.id, activeDetailTab, fetchLeadHistory]);

    const handleRegisterEntry = async () => {
        if (!selectedTask?.lead) return;
        if (manualNote.trim()) {
            await addLeadNote(selectedTask.lead.id, manualNote);
            setManualNote('');
            
            const updatedHistory = await fetchLeadHistory(selectedTask.lead.id);
            setHistory(updatedHistory);
            
            setTimeout(() => setActiveDetailTab('history'), 100);
        }
    };

    const handleSaveEditNote = async (noteId: string) => {
        if (!editingNoteContent.trim() || !selectedTask?.lead) return;
        await editLeadNote(noteId, editingNoteContent);
        setEditingNoteId(null);
        setEditingNoteContent('');
        const updatedHistory = await fetchLeadHistory(selectedTask.lead.id);
        setHistory(updatedHistory);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta observação?') || !selectedTask?.lead) return;
        await deleteLeadNote(noteId);
        const updatedHistory = await fetchLeadHistory(selectedTask.lead.id);
        setHistory(updatedHistory);
    };

    useEffect(() => {
        const fetchCommercialActions = async () => {
            const { data } = await supabase.from('commercial_actions').select('id, name, start_date, end_date, color').order('name');
            if (data) setCommercialActions(data);
        };
        fetchCommercialActions();
    }, []);

    // Advance-stage modal
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [taskToAdvance, setTaskToAdvance] = useState<string | null>(null);
    const [advanceDueDate, setAdvanceDueDate] = useState('');

    // Calendar state for advance modal
    const [calendarDate, setCalendarDate] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [targetStageToAdvance, setTargetStageToAdvance] = useState<string | null>(null);

    const calendarMonthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const goCalendarPrev = () => setCalendarDate(prev => {
        if (prev.month === 0) return { year: prev.year - 1, month: 11 };
        return { year: prev.year, month: prev.month - 1 };
    });
    const goCalendarNext = () => setCalendarDate(prev => {
        if (prev.month === 11) return { year: prev.year + 1, month: 0 };
        return { year: prev.year, month: prev.month + 1 };
    });

    const formatCalendarDay = (year: number, month: number, day: number) => {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    };

    // Calendar view states
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTasks();
        }
    }, [id]);

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from('cadence_tasks')
            .select(`
                *,
                lead:leads(
                    id, name, email, phone, status, after_sales_status, responsible_id, tags, uf, cpf, address, address_number, district, city, commercial_action_ids
                )
            `)
            .eq('flow_id', id)
            .eq('completed', false);

        if (!error && data) {
            const mappedTasks: CadenceTask[] = data.map((t: any) => ({
                id: t.id,
                flowId: t.flow_id,
                stageId: t.stage_id,
                leadId: String(t.lead_id),
                dueDate: t.due_date,
                completed: t.completed,
                lead: t.lead ? {
                    id: String(t.lead.id),
                    name: t.lead.name,
                    email: t.lead.email,
                    phone: t.lead.phone,
                    status: t.lead.status,
                    afterSalesStatus: t.lead.after_sales_status,
                    responsibleId: t.lead.responsible_id,
                    tags: t.lead.tags,
                    uf: t.lead.uf,
                    cpf: t.lead.cpf,
                    address: t.lead.address,
                    addressNumber: t.lead.address_number,
                    district: t.lead.district,
                    city: t.lead.city,
                    commercialActionIds: t.lead.commercial_action_ids || []
                } as Lead : undefined
            }));
            setTasks(mappedTasks);
        }
    };

    // Opens modal to pick due date before advancing; completes directly if last stage
    const handleAdvanceStage = (taskId: string, fromModal = false, targetStageId?: string) => {
        if (!flow) return;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let finalTargetId = targetStageId;
        if (!finalTargetId) {
            const currentIndex = flow.stages.findIndex(s => s.id === task.stageId);
            if (currentIndex >= 0 && currentIndex < flow.stages.length - 1) {
                finalTargetId = flow.stages[currentIndex + 1].id;
            }
        }

        const isLastStage = !finalTargetId;

        if (isLastStage) {
            // Just complete the task — no next stage
            completeTask(taskId, null);
            if (fromModal) setIsTaskModalOpen(false);
        } else {
            // Show date picker modal
            setTaskToAdvance(taskId);
            setTargetStageToAdvance(finalTargetId || null);
            setAdvanceDueDate('');
            setCalendarDate({ year: new Date().getFullYear(), month: new Date().getMonth() });
            setIsAdvanceModalOpen(true);
            if (fromModal) setIsTaskModalOpen(false);
        }
    };

    const confirmAdvanceStage = async () => {
        if (!taskToAdvance || !flow) return;
        const isoDate = advanceDueDate ? new Date(advanceDueDate).toISOString() : null;
        await completeTask(taskToAdvance, isoDate, targetStageToAdvance || undefined);
        setIsAdvanceModalOpen(false);
        setTaskToAdvance(null);
        setTargetStageToAdvance(null);
        setAdvanceDueDate('');
    };

    const completeTask = async (taskId: string, dueDate: string | null, explicitTargetStageId?: string) => {
        if (!flow) return;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let nextStageId = explicitTargetStageId;
        if (!nextStageId) {
            const currentIndex = flow.stages.findIndex(s => s.id === task.stageId);
            if (currentIndex >= 0 && currentIndex < flow.stages.length - 1) {
                nextStageId = flow.stages[currentIndex + 1].id;
            }
        }

        if (nextStageId) {
            const { error } = await supabase
                .from('cadence_tasks')
                .update({
                    stage_id: nextStageId,
                    due_date: dueDate
                })
                .eq('id', taskId);

            if (!error) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, stageId: nextStageId, dueDate } : t));
            }
        } else {
            const { error } = await supabase
                .from('cadence_tasks')
                .update({ completed: true })
                .eq('id', taskId);

            if (!error) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
            }
        }
    };

    const openTaskModal = (task: CadenceTask) => {
        setSelectedTask(task);
        setTaskInstructions(task.instructions || '');
        setIsTaskModalOpen(true);
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa do fluxo?')) return;
        const { error } = await supabase
            .from('cadence_tasks')
            .delete()
            .eq('id', taskId);
        if (!error) {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setIsTaskModalOpen(false);
        }
    };

    const handleSaveTaskInstructions = async () => {
        if (!selectedTask) return;

        const { error } = await supabase
            .from('cadence_tasks')
            .update({ instructions: taskInstructions })
            .eq('id', selectedTask.id);

        if (!error) {
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, instructions: taskInstructions } : t));
            setIsTaskModalOpen(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flow || !flow.stages.length || !selectedLeadId) return;

        const stageId = flow.stages[0].id;
        const isoDate = selectedDueDate ? new Date(selectedDueDate).toISOString() : null;

        const { data, error } = await supabase
            .from('cadence_tasks')
            .insert({
                flow_id: id,
                stage_id: stageId,
                lead_id: Number(selectedLeadId),
                due_date: isoDate
            })
            .select(`
                *,
                lead:leads(
                    id, name, email, phone, status, after_sales_status, responsible_id, tags, uf, cpf, address, address_number, district, city
                )
            `)
            .single();

        if (!error && data) {
            const newTask: CadenceTask = {
                id: data.id,
                flowId: data.flow_id,
                stageId: data.stage_id,
                leadId: String(data.lead_id),
                dueDate: data.due_date,
                completed: data.completed,
                lead: data.lead ? {
                    id: String(data.lead.id),
                    name: data.lead.name,
                    email: data.lead.email,
                    phone: data.lead.phone,
                    status: data.lead.status,
                    afterSalesStatus: data.lead.after_sales_status,
                    responsibleId: data.lead.responsible_id,
                    tags: data.lead.tags,
                    uf: data.lead.uf,
                    cpf: data.lead.cpf,
                    address: data.lead.address,
                    addressNumber: data.lead.address_number,
                    district: data.lead.district,
                    city: data.lead.city
                } as Lead : undefined
            };
            setTasks(prev => [...prev, newTask]);
            setIsAddModalOpen(false);
            setSelectedLeadId('');
            setSelectedDueDate('');
        }
    };

    // State for collapsible sections in List view
    const [expandedSections, setExpandedSections] = useState({
        atrasadas: true,
        hoje: true,
        vencer: true
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderViewToggle = () => (
        <div className="flex bg-fortis-dark border border-fortis-surface rounded-xl p-1">
            <button
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:text-white'
                    }`}
            >
                <List size={16} /> Lista
            </button>
            <button
                onClick={() => setViewMode('KANBAN')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'KANBAN' ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:text-white'
                    }`}
            >
                <KanbanIcon size={16} /> Kanban
            </button>
            <button
                onClick={() => setViewMode('CALENDAR')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-fortis-brand/20 text-fortis-brand' : 'text-fortis-mid hover:text-white'
                    }`}
            >
                <CalendarIcon size={16} /> Calendário
            </button>
        </div>
    );

    const renderTaskListItem = (task: CadenceTask) => {
        const lead = task.lead;
        if (!lead) return null;

        return (
            <div key={task.id}
                onClick={() => openTaskModal(task)}
                className="flex items-center gap-4 p-3 bg-[#141F28] border border-fortis-surface/5 rounded-xl hover:bg-[#1e2d3a] transition-all group cursor-pointer mb-2 last:mb-0"
            >
                {/* Nome do Cliente */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-fortis-mid/30" />
                    <div className="truncate px-1">
                        <p className="font-bold text-white text-sm truncate">{lead.name}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black px-1 py-0.5 rounded shadow-sm border uppercase tracking-wider bg-fortis-dark text-fortis-mid border-fortis-surface">
                                {flow?.stages?.find(s => s.id === task.stageId)?.name || 'Etapa'}
                            </span>
                            {lead.tags && lead.tags.map(tagLabel => {
                                const tagConfig = availableTags.find(t => t.label === tagLabel);
                                return (
                                    <span key={tagLabel} className="text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white" style={{ backgroundColor: tagConfig?.color || '#575756' }}>
                                        {tagLabel}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Responsável */}
                <div className="w-32 flex justify-center shrink-0">
                    <img
                        src={users.find(u => u.id === lead.responsibleId)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=588575&color=fff`}
                        className="w-6 h-6 rounded-full shadow-sm border border-fortis-surface"
                        alt="Avatar"
                        title={users.find(u => u.id === lead.responsibleId)?.name}
                    />
                </div>

                {/* Data e Ação */}
                <div className="w-48 flex items-center justify-end gap-3 shrink-0 pr-2">
                    <div className="text-[11px] text-white/50 font-bold uppercase tracking-tight mr-1">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleAdvanceStage(task.id); }}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0"
                        title="Concluir Etapa"
                    >
                        <Check size={14} className="stroke-[3]" />
                    </button>
                </div>
            </div>
        );
    };

    const renderListView = () => {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const tasksAtrasadas = filteredTasks.filter(t => t.dueDate && t.dueDate.split('T')[0] < today);
        const tasksHoje = filteredTasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === today);
        const tasksAVencer = filteredTasks.filter(t => !t.dueDate || t.dueDate.split('T')[0] > today);

        return (
            <div className="bg-[#040608] min-h-full rounded-2xl p-4 space-y-6 animate-in fade-in duration-300">
                {/* Seção: Atrasadas */}
                <div className="pb-4">
                    <div className="flex items-center gap-3 px-2 mb-4 group cursor-pointer" onClick={() => toggleSection('atrasadas')}>
                        <ChevronRight size={14} className={`text-fortis-mid transition-transform ${expandedSections.atrasadas ? 'rotate-90' : ''}`} />
                        <div className="flex items-center gap-2 py-1 px-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Atrasadas</h3>
                        </div>
                        <span className="text-[10px] font-bold text-fortis-mid/50 bg-white/5 w-5 h-5 flex items-center justify-center rounded-full ml-1">{tasksAtrasadas.length}</span>
                    </div>

                    {expandedSections.atrasadas && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* Column Headers */}
                            <div className="flex items-center gap-4 px-3 py-2 text-[9px] font-bold text-fortis-mid/40 uppercase tracking-widest border-b border-fortis-surface/5 mb-3">
                                <span className="flex-1 ml-5">Nome</span>
                                <span className="w-32 text-center">Responsável</span>
                                <span className="w-48 text-right pr-12">Data de vencimento</span>
                            </div>

                            {tasksAtrasadas.length > 0 ? (
                                <div className="flex flex-col">
                                    {tasksAtrasadas.map(renderTaskListItem)}
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="flex items-center gap-2 p-2 text-[10px] text-fortis-mid font-bold hover:text-white/80 transition-colors group/add ml-5"
                                    >
                                        <Plus size={14} className="group-hover/add:scale-110 transition-transform" /> Adicionar Tarefa
                                    </button>
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-fortis-surface/20 mx-3 mt-2">
                                    <p className="text-[11px] text-fortis-mid font-bold uppercase tracking-widest">Tudo em dia nesta seção</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Seção: Vence Hoje */}
                <div className="pb-4">
                    <div className="flex items-center gap-3 px-2 mb-4 group cursor-pointer" onClick={() => toggleSection('hoje')}>
                        <ChevronRight size={14} className={`text-fortis-mid transition-transform ${expandedSections.hoje ? 'rotate-90' : ''}`} />
                        <div className="flex items-center gap-2 py-1 px-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Vence Hoje</h3>
                        </div>
                        <span className="text-[10px] font-bold text-fortis-mid/50 bg-white/5 w-5 h-5 flex items-center justify-center rounded-full ml-1">{tasksHoje.length}</span>
                    </div>

                    {expandedSections.hoje && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* Column Headers */}
                            <div className="flex items-center gap-4 px-3 py-2 text-[9px] font-bold text-fortis-mid/40 uppercase tracking-widest border-b border-fortis-surface/5 mb-3">
                                <span className="flex-1 ml-5">Nome</span>
                                <span className="w-32 text-center">Responsável</span>
                                <span className="w-48 text-right pr-12">Data de vencimento</span>
                            </div>

                            {tasksHoje.length > 0 ? (
                                <div className="flex flex-col">
                                    {tasksHoje.map(renderTaskListItem)}
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="flex items-center gap-2 p-2 text-[10px] text-fortis-mid font-bold hover:text-white/80 transition-colors group/add ml-5"
                                    >
                                        <Plus size={14} className="group-hover/add:scale-110 transition-transform" /> Adicionar Tarefa
                                    </button>
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-fortis-surface/20 mx-3 mt-2">
                                    <p className="text-[11px] text-fortis-mid font-bold uppercase tracking-widest">Nada vencendo hoje</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Seção: A Vencer */}
                <div className="pb-4">
                    <div className="flex items-center gap-3 px-2 mb-4 group cursor-pointer" onClick={() => toggleSection('vencer')}>
                        <ChevronRight size={14} className={`text-fortis-mid transition-transform ${expandedSections.vencer ? 'rotate-90' : ''}`} />
                        <div className="flex items-center gap-2 py-1 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-wider">A Vencer</h3>
                        </div>
                        <span className="text-[10px] font-bold text-fortis-mid/50 bg-white/5 w-5 h-5 flex items-center justify-center rounded-full ml-1">{tasksAVencer.length}</span>
                    </div>

                    {expandedSections.vencer && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* Column Headers */}
                            <div className="flex items-center gap-4 px-3 py-2 text-[9px] font-bold text-fortis-mid/40 uppercase tracking-widest border-b border-fortis-surface/5 mb-3">
                                <span className="flex-1 ml-5">Nome</span>
                                <span className="w-32 text-center">Responsável</span>
                                <span className="w-48 text-right pr-12">Data de vencimento</span>
                            </div>

                            {tasksAVencer.length > 0 ? (
                                <div className="flex flex-col">
                                    {tasksAVencer.map(renderTaskListItem)}
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="flex items-center gap-2 p-3 text-[11px] text-fortis-mid font-bold hover:text-white transition-colors group/add ml-5"
                                    >
                                        <Plus size={14} className="group-hover/add:scale-110 transition-transform" /> Adicionar Tarefa
                                    </button>
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-fortis-surface/20 mx-3 mt-2">
                                    <p className="text-[11px] text-fortis-mid font-bold uppercase tracking-widest">Nenhum plano futuro</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderKanbanView = () => (
        <div className="absolute inset-0 flex gap-4 overflow-x-auto overflow-y-hidden custom-scrollbar pb-4 animate-in fade-in duration-300">
            {/* Colunas do Fluxo */}
            {flow?.stages?.map((stage, index) => {
                const colors = [
                    'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
                    'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]',
                    'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
                    'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
                    'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]',
                    'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]'
                ];
                const colorClass = colors[index % colors.length];

                return (
                    <div key={stage.id} 
                         className="flex-shrink-0 w-80 bg-[#040608] border border-fortis-surface/30 rounded-2xl flex flex-col h-full animate-in slide-in-from-bottom-2 duration-300"
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => {
                             e.preventDefault();
                             const taskId = e.dataTransfer.getData('taskId');
                             if (taskId) {
                                 const task = tasks.find(t => t.id === taskId);
                                 if (task && task.stageId !== stage.id) {
                                     handleAdvanceStage(taskId, false, stage.id);
                                 }
                             }
                         }}
                    >
                        <div className="p-4 border-b border-fortis-surface/50 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2 flex-1">
                                <div className={`w-2 h-2 rounded-full ${colorClass} flex-shrink-0`} />
                                {editingStageId === stage.id ? (
                                    <input
                                        type="text"
                                        autoFocus
                                        className="bg-fortis-dark border border-fortis-surface rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-cyan-500 w-full"
                                        value={editingStageName}
                                        onChange={e => setEditingStageName(e.target.value)}
                                        onBlur={() => {
                                            if (flow && editingStageName.trim() !== '') {
                                                const newStages = flow.stages.map(s => s.id === stage.id ? { ...s, name: editingStageName } : s);
                                                updateCadenceFlow(flow.id, { stages: newStages });
                                            }
                                            setEditingStageId(null);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                if (flow && editingStageName.trim() !== '') {
                                                    const newStages = flow.stages.map(s => s.id === stage.id ? { ...s, name: editingStageName } : s);
                                                    updateCadenceFlow(flow.id, { stages: newStages });
                                                }
                                                setEditingStageId(null);
                                            } else if (e.key === 'Escape') {
                                                setEditingStageId(null);
                                            }
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="cursor-pointer hover:text-cyan-400 transition-colors truncate"
                                        onClick={() => {
                                            setEditingStageId(stage.id);
                                            setEditingStageName(stage.name);
                                        }}
                                        title="Clique para editar"
                                    >
                                        {stage.name}
                                    </span>
                                )}
                            </h3>
                            <span className="text-xs font-bold bg-fortis-dark text-fortis-mid px-2 py-1 rounded-lg">{filteredTasks.filter(t => t.stageId === stage.id).length}</span>
                        </div>
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                            {filteredTasks.filter(t => t.stageId === stage.id).length > 0 ? (
                                filteredTasks.filter(t => t.stageId === stage.id).map(task => {
                                    const lead = task.lead;
                                    if (!lead) return null;
                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('taskId', task.id);
                                            }}
                                            onClick={() => openTaskModal(task)}
                                            className="bg-[#141F28] border border-fortis-surface/40 rounded-xl p-4 shadow-sm hover:border-fortis-brand/40 transition-all flex flex-col gap-3 cursor-pointer group active:cursor-grabbing"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-sm text-white truncate pr-2 tracking-tight">{lead.name}</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAdvanceStage(task.id); }}
                                                    className="p-1.5 -mt-1 -mr-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm shrink-0"
                                                    title="Concluir Etapa"
                                                >
                                                    <Check size={14} className="stroke-[3]" />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {lead.tags && lead.tags.map(tagLabel => {
                                                    const tagConfig = availableTags.find(t => t.label === tagLabel);
                                                    return (
                                                        <span key={tagLabel} className="text-[9px] font-bold px-2 py-0.5 rounded shadow-sm text-white truncate max-w-[80px]" style={{
                                                            backgroundColor: tagConfig?.color || '#575756'
                                                        }}>
                                                            {tagLabel}
                                                        </span>
                                                    );
                                                })}
                                                {(() => {
                                                    const statusInfo = lead.status && LEAD_STATUS_MAP[lead.status as LeadStatus]
                                                        ? LEAD_STATUS_MAP[lead.status as LeadStatus]
                                                        : AFTER_SALES_STATUS_MAP[lead.afterSalesStatus as AfterSalesStatus];

                                                    const label = statusInfo?.label || 'SEM CLASSIFICAÇÃO';
                                                    const color = statusInfo?.color || '#575756';

                                                    return (
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded shadow-sm border uppercase tracking-wider" style={{
                                                            backgroundColor: `${color}15`,
                                                            color: color,
                                                            borderColor: `${color}40`
                                                        }}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            <div className="flex justify-between items-center mt-1">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-fortis-mid font-black uppercase tracking-widest">{lead.uf || '-'}</span>
                                                    {task.dueDate && (() => {
                                                        const taskDateStr = task.dueDate.split('T')[0];
                                                        const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local
                                                        const isOverdue = taskDateStr < todayStr;
                                                        return (
                                                            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-fortis-mid'}`}>
                                                                <Clock size={10} className="stroke-[3]" />
                                                                <span className="text-[9px] font-black tracking-wider uppercase">
                                                                    {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <img
                                                    src={users.find(u => u.id === lead.responsibleId)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=588575&color=fff`}
                                                    className="w-5 h-5 rounded-full shadow-sm border border-fortis-surface/50"
                                                    alt="Avatar"
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-full opacity-50 pt-8 pb-12">
                                    <Workflow size={32} className="text-fortis-surface mb-3" />
                                    <p className="text-fortis-mid text-sm font-medium">Nenhum card.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {!flow?.stages?.length && (
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-fortis-surface rounded-2xl">
                    <p className="text-fortis-mid font-bold text-lg">Nenhuma etapa configurada.</p>
                    <button onClick={() => navigate('/fluxos')} className="mt-4 px-6 py-2 bg-fortis-surface text-white rounded-xl hover:bg-fortis-surface/80 transition-colors font-bold">
                        Configurar Fluxo
                    </button>
                </div>
            )}


        </div>
    );

    const renderCalendarView = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = getFirstDayOfMonth(year, month);
        const daysInMonth = getDaysInMonth(year, month);

        const handleDayClick = (dayNum: number) => {
            const date = new Date();
            date.setDate(dayNum);
            setSelectedDate(date);
            setIsDayModalOpen(true);
        };

        return (
            <div className="absolute inset-0 bg-fortis-panel border border-fortis-surface/50 rounded-2xl flex flex-col animate-in fade-in duration-300 overflow-hidden">
                <div className="p-4 border-b border-fortis-surface/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white capitalize">{now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button className="px-3 py-1.5 text-sm font-bold bg-fortis-dark text-white rounded-lg hover:bg-fortis-surface transition-colors flex items-center gap-1">
                            Hoje
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-fortis-surface/50 bg-fortis-dark/50">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-bold text-fortis-mid uppercase tracking-wider border-r border-fortis-surface/50 last:border-0">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                    {Array.from({ length: 42 }).map((_, i) => {
                        const day = i - firstDay + 1;
                        const isCurrentMonth = day > 0 && day <= daysInMonth;

                        if (!isCurrentMonth) {
                            return <div key={i} className={`border-r border-b border-fortis-surface/20 p-2 ${i % 7 === 6 ? 'border-r-0' : ''} ${i >= 35 ? 'border-b-0' : ''}`} />;
                        }

                        const tempDate = new Date(year, month, day);
                        const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
                        const dayTasks = filteredTasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === dateStr);

                        return (
                            <div
                                key={i}
                                onClick={() => handleDayClick(day)}
                                className={`border-r border-b border-fortis-surface/20 p-2 relative group hover:bg-fortis-surface/10 transition-colors cursor-pointer ${i % 7 === 6 ? 'border-r-0' : ''} ${i >= 35 ? 'border-b-0' : ''}`}
                            >
                                <span className={`text-sm font-bold ${day === now.getDate() ? 'bg-fortis-brand text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-fortis-mid'} group-hover:text-white transition-colors`}>
                                    {day}
                                </span>
                                {dayTasks.length > 0 && (
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-1.5 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                                        <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                                        <span className="text-[9px] font-black text-cyan-400 tracking-tighter leading-none">{dayTasks.length}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Modal de Tarefas do Dia */}
                {isDayModalOpen && selectedDate && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-fortis-panel border border-fortis-surface w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-white">Tarefas do Dia</h2>
                                    <p className="text-xs text-fortis-mid font-bold uppercase tracking-widest mt-1">
                                        {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setIsDayModalOpen(false)} className="text-fortis-mid hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {filteredTasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`).map(task => (
                                    <div key={task.id}
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setIsTaskModalOpen(true);
                                            setIsDayModalOpen(false);
                                        }}
                                        className="p-3 bg-fortis-dark/50 border border-fortis-surface rounded-xl hover:bg-fortis-surface/20 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm truncate">{task.lead?.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] text-fortis-mid uppercase font-black tracking-widest truncate">
                                                        {flow?.stages?.find(s => s.id === task.stageId)?.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {task.lead?.tags && task.lead.tags.slice(0, 2).map(tagLabel => {
                                                            const tagConfig = availableTags.find(t => t.label === tagLabel);
                                                            return (
                                                                <span key={tagLabel} className="text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white max-w-[60px] truncate" style={{ backgroundColor: tagConfig?.color || '#575756' }}>
                                                                    {tagLabel}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-fortis-mid group-hover:translate-x-1 transition-transform shrink-0" />
                                        </div>
                                    </div>
                                ))}
                                {filteredTasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`).length === 0 && (
                                    <div className="py-12 text-center opacity-50">
                                        <CalendarIcon size={32} className="mx-auto text-fortis-mid mb-3" />
                                        <p className="text-sm font-medium text-fortis-mid">Nenhuma tarefa para este dia.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <header className="flex flex-col gap-4 mb-6">
                <div>
                    <button
                        onClick={() => navigate('/fluxos')}
                        className="flex items-center gap-2 text-fortis-mid hover:text-white font-semibold transition-colors w-fit mb-2"
                    >
                        <ArrowLeft size={16} />
                        Voltar para fluxos
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                                <Workflow size={28} className="text-cyan-400" />
                            </div>
                            {flowName}
                        </h1>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${showFilters ? 'bg-fortis-brand border-fortis-brand text-white' : 'bg-fortis-panel border-fortis-surface text-fortis-mid hover:text-white'
                                    }`}
                            >
                                <Filter size={16} /> Filtros {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white ml-1" />}
                            </button>
                        </div>
                    </div>

                    {/* ─── Painel de filtros colapsável ─────────────────────────── */}
                    {showFilters && (
                        <div className="bg-fortis-panel/50 border border-fortis-surface p-6 rounded-2xl grid grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300 mt-4">
                            {/* Período */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Período</label>
                                <select
                                    value={filterPeriod}
                                    onChange={e => setFilterPeriod(e.target.value as PeriodOption)}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                                >
                                    {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map(opt => (
                                        <option key={opt} value={opt}>{PERIOD_LABELS[opt]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nome */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Nome</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fortis-mid" />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar..."
                                        value={filterName}
                                        onChange={e => setFilterName(e.target.value)}
                                        className="w-full bg-fortis-dark border border-fortis-surface rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                                >
                                    <option value="">Todos os Status</option>
                                    {Object.entries(AFTER_SALES_STATUS_MAP).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Responsável */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Responsável</label>
                                <select
                                    value={filterResponsible}
                                    onChange={e => setFilterResponsible(e.target.value)}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs outline-none focus:border-fortis-brand text-white font-bold cursor-pointer"
                                >
                                    <option value="">Todos os Responsáveis</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between py-2 border-b border-fortis-surface/50">
                    {renderViewToggle()}
                </div>
            </header>

            <div className="flex-1 min-h-0 relative">
                {viewMode === 'LIST' && renderListView()}
                {viewMode === 'KANBAN' && renderKanbanView()}
                {viewMode === 'CALENDAR' && renderCalendarView()}
            </div>

            {/* Modal para Adicionar Tarefa */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleAddTask} className="bg-fortis-panel border border-fortis-surface w-full max-w-sm rounded-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Adicionar ao Fluxo</h2>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-fortis-mid hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-fortis-mid mb-2">Vincular Lead</label>
                                <select
                                    required
                                    value={selectedLeadId}
                                    onChange={e => setSelectedLeadId(e.target.value)}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="" disabled>Selecione um cliente...</option>
                                    {leads.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.email || l.phone})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-fortis-mid mb-2">Data de Conclusão / Abordagem</label>
                                <input
                                    type="date"
                                    value={selectedDueDate}
                                    onChange={e => setSelectedDueDate(e.target.value)}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-2.5 bg-fortis-surface text-white font-bold rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20"
                            >
                                Adicionar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de Detalhes e Instruções da Tarefa */}
            {isTaskModalOpen && selectedTask && selectedTask.lead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-fortis-panel border border-fortis-surface w-full max-w-2xl h-[700px] max-h-[85vh] flex flex-col rounded-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                                    <Workflow size={20} className="text-cyan-500" /> Detalhes do lead
                                </h2>
                                <div className="flex gap-4">
                                    {[
                                        { id: 'info', icon: FileText, label: 'Perfil' },
                                        { id: 'history', icon: History, label: 'Histórico' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveDetailTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-white/10' : 'text-fortis-mid hover:text-white hover:bg-fortis-surface'}`}
                                        >
                                            <tab.icon size={14} /> {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="text-fortis-mid hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            {activeDetailTab === 'info' && (
                                <div className="animate-in fade-in duration-300 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full">
                                    {/* Lead Info (Read Only) */}
                                    <div className="bg-fortis-dark/50 border border-fortis-surface p-4 rounded-xl space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-fortis-mid uppercase tracking-wider mb-3">Dados Pessoais</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-fortis-mid">Nome</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">CPF</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.cpf || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">E-mail</p>
                                            <p className="font-bold text-white break-all">{selectedTask.lead.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">Telefone</p>
                                            <p className="font-bold text-white">{selectedTask.lead.phone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-fortis-surface/50 pt-3">
                                    <h3 className="text-sm font-bold text-fortis-mid uppercase tracking-wider mb-3">Endereço</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-fortis-mid">Endereço</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.address || '-'}</p>
                                        </div>
                                        <div className="col-span-1">
                                            <p className="text-xs text-fortis-mid">Número</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.addressNumber || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">Bairro</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.district || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">Cidade</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.city || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">UF</p>
                                            <p className="font-bold text-white truncate">{selectedTask.lead.uf || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-fortis-surface/50 pt-3">
                                    <h3 className="text-sm font-bold text-fortis-mid uppercase tracking-wider mb-3">Status e Previsão</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-fortis-mid">Etapa atual do fluxo</p>
                                            <p className="font-bold text-cyan-400">{flow?.stages?.find(s => s.id === selectedTask.stageId)?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-fortis-mid">Data de Conclusão / Abordagem</p>
                                            <p className="font-bold text-white">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-fortis-mid mb-1">Ações Comerciais Vinculadas</p>
                                            <div className="relative">
                                                <div className="bg-fortis-panel border border-fortis-surface rounded-lg p-2 min-h-[42px] focus-within:border-fortis-brand transition-colors">
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedTask.lead.commercialActionIds?.map((actionId: string) => {
                                                            const actionConfig = commercialActions.find(a => a.id === actionId);
                                                            if (!actionConfig) return null;
                                                            return (
                                                                <span
                                                                    key={actionId}
                                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm"
                                                                    style={{ 
                                                                        backgroundColor: actionConfig.color ? `${actionConfig.color}33` : 'rgba(6, 182, 212, 0.2)',
                                                                        color: actionConfig.color || '#06b6d4',
                                                                        border: `1px solid ${actionConfig.color ? `${actionConfig.color}4d` : 'rgba(6, 182, 212, 0.3)'}`
                                                                    }}
                                                                >
                                                                    <span>
                                                                        {actionConfig.name}
                                                                        <span className="font-normal opacity-70 ml-1 text-[10px]" style={{ color: actionConfig.color || '#06b6d4' }}>
                                                                            ({new Date(actionConfig.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(actionConfig.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})
                                                                        </span>
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            const newActions = (selectedTask.lead!.commercialActionIds || []).filter(id => id !== actionId);
                                                                            const updatedLead = { ...selectedTask.lead!, commercialActionIds: newActions };
                                                                            setSelectedTask(prev => prev ? { ...prev, lead: updatedLead } : null);
                                                                            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, lead: updatedLead } : t));
                                                                            await updateLead(selectedTask.lead!.id, { commercialActionIds: newActions });
                                                                        }}
                                                                        className="hover:bg-cyan-500/30 rounded-full p-0.5 ml-1 transition-colors"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                        <input
                                                            type="text"
                                                            placeholder="Pesquise ou adicione..."
                                                            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-fortis-mid flex-1 min-w-[100px]"
                                                            value={actionSearch}
                                                            onChange={(e) => {
                                                                setActionSearch(e.target.value);
                                                                setShowActionSuggestions(true);
                                                            }}
                                                            onFocus={() => setShowActionSuggestions(true)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {showActionSuggestions && commercialActions.filter(a => a.name.toLowerCase().includes(actionSearch.toLowerCase()) && !selectedTask.lead!.commercialActionIds?.includes(a.id)).length > 0 && (
                                                    <div className="absolute z-[60] left-0 right-0 mt-2 bg-fortis-panel border border-fortis-surface rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {commercialActions.filter(a => a.name.toLowerCase().includes(actionSearch.toLowerCase()) && !selectedTask.lead!.commercialActionIds?.includes(a.id)).map(action => (
                                                            <button
                                                                key={action.id}
                                                                type="button"
                                                                className="w-full flex flex-col justify-center px-4 py-2.5 text-left text-xs hover:bg-fortis-surface transition-colors border-b border-fortis-surface/50 last:border-0"
                                                                onClick={async () => {
                                                                    const newActions = [...(selectedTask.lead!.commercialActionIds || []), action.id];
                                                                    const updatedLead = { ...selectedTask.lead!, commercialActionIds: newActions };
                                                                    setSelectedTask(prev => prev ? { ...prev, lead: updatedLead } : null);
                                                                    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, lead: updatedLead } : t));
                                                                    await updateLead(selectedTask.lead!.id, { commercialActionIds: newActions });
                                                                    setActionSearch('');
                                                                    setShowActionSuggestions(false);
                                                                }}
                                                            >
                                                                <span className="font-bold text-white">{action.name}</span>
                                                                <span className="text-fortis-mid mt-0.5 text-[10px]">
                                                                    {new Date(action.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a {new Date(action.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-fortis-surface/50 pt-3">
                                    <h3 className="text-sm font-bold text-fortis-mid uppercase tracking-wider mb-3">Tags</h3>
                                    <div className="relative">
                                        <div className="bg-fortis-panel border border-fortis-surface rounded-lg p-2 min-h-[42px] focus-within:border-fortis-brand transition-colors">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTask.lead.tags?.map((tagLabel: string) => {
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
                                                                onClick={async () => {
                                                                    const newTags = (selectedTask.lead!.tags || []).filter(t => t !== tagLabel);
                                                                    const updatedLead = { ...selectedTask.lead!, tags: newTags };
                                                                    setSelectedTask(prev => prev ? { ...prev, lead: updatedLead } : null);
                                                                    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, lead: updatedLead } : t));
                                                                    await updateLead(selectedTask.lead!.id, { tags: newTags });
                                                                }}
                                                                className="hover:bg-black/20 rounded-full p-0.5"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                                <input
                                                    type="text"
                                                    placeholder="Pesquise ou adicione..."
                                                    className="bg-transparent border-none outline-none text-xs text-white placeholder:text-fortis-mid flex-1 min-w-[100px]"
                                                    value={tagSearch}
                                                    onChange={(e) => {
                                                        setTagSearch(e.target.value);
                                                        setShowTagSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowTagSuggestions(true)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && tagSearch.trim()) {
                                                            e.preventDefault();
                                                            const newTag = tagSearch.trim();
                                                            if (!selectedTask.lead!.tags?.includes(newTag)) {
                                                                const newTags = [...(selectedTask.lead!.tags || []), newTag];
                                                                const updatedLead = { ...selectedTask.lead!, tags: newTags };
                                                                setSelectedTask(prev => prev ? { ...prev, lead: updatedLead } : null);
                                                                setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, lead: updatedLead } : t));
                                                                await updateLead(selectedTask.lead!.id, { tags: newTags });
                                                                if (!availableTags.some(t => t.label.toLowerCase() === newTag.toLowerCase())) {
                                                                    await addTag(newTag);
                                                                }
                                                            }
                                                            setTagSearch('');
                                                            setShowTagSuggestions(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {showTagSuggestions && (tagSearch || availableTags.filter(t => t.label.toLowerCase().includes(tagSearch.toLowerCase())).length > 0) && (
                                            <div className="absolute z-[60] left-0 right-0 mt-2 bg-fortis-panel border border-fortis-surface rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {availableTags.filter(t => t.label.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-fortis-surface transition-colors"
                                                        onClick={async () => {
                                                            if (!selectedTask.lead!.tags?.includes(tag.label)) {
                                                                const newTags = [...(selectedTask.lead!.tags || []), tag.label];
                                                                const updatedLead = { ...selectedTask.lead!, tags: newTags };
                                                                setSelectedTask(prev => prev ? { ...prev, lead: updatedLead } : null);
                                                                setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, lead: updatedLead } : t));
                                                                await updateLead(selectedTask.lead!.id, { tags: newTags });
                                                            }
                                                            setTagSearch('');
                                                            setShowTagSuggestions(false);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                            <span className="font-semibold">{tag.label}</span>
                                                        </div>
                                                        {selectedTask.lead!.tags?.includes(tag.label) && <Check size={14} className="text-fortis-brand" />}
                                                    </button>
                                                ))}
                                                {tagSearch && !availableTags.some(t => t.label.toLowerCase() === tagSearch.toLowerCase()) && (
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs hover:bg-fortis-surface text-fortis-brand transition-colors font-bold"
                                                        onClick={async () => {
                                                            const newTagLabel = tagSearch.trim();
                                                            if (!selectedTask.lead!.tags?.includes(newTagLabel)) {
                                                                const newTags = [...(selectedTask.lead!.tags || []), newTagLabel];
                                                                const updatedLead = { ...selectedTask.lead!, tags: newTags };
                                                                setSelectedTask(prev => prev ? { ...prev, lead: updatedLead } : null);
                                                                setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, lead: updatedLead } : t));
                                                                await updateLead(selectedTask.lead!.id, { tags: newTags });
                                                                if (!availableTags.some(t => t.label.toLowerCase() === newTagLabel.toLowerCase())) {
                                                                    await addTag(newTagLabel);
                                                                }
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
                                            <div className="fixed inset-0 z-[55]" onClick={() => setShowTagSuggestions(false)} />
                                        )}
                                    </div>
                                </div>

                                {flow?.stages?.find(s => s.id === selectedTask.stageId)?.instructions && (
                                    <div className="border-t border-fortis-surface/50 pt-4">
                                        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 animate-pulse-subtle">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={14} className="text-cyan-400" />
                                                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Instruções desta Etapa</h3>
                                            </div>
                                            <p className="text-sm text-white/90 leading-relaxed italic">
                                                "{flow.stages.find(s => s.id === selectedTask.stageId)?.instructions}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                                </div>
                            )}
                            {activeDetailTab === 'history' && (
                                <div className="animate-in fade-in duration-300 flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                                    {loadingHistory ? (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="text-fortis-mid text-[10px] font-black uppercase tracking-widest">Buscando histórico...</p>
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <div className="p-5 bg-fortis-panel/20 rounded-full mb-6">
                                                <History size={40} className="text-fortis-surface/40" />
                                            </div>
                                            <p className="text-fortis-mid text-sm font-black uppercase tracking-widest">Sem registros recentes</p>
                                        </div>
                                    ) : (
                                        <div className="relative pl-10">
                                            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-fortis-surface z-0" />

                                            <div className="space-y-12 pt-2">
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
                                                            className={`absolute -left-[27px] top-[4px] w-3.5 h-3.5 rounded-full ring-[4px] ring-black z-20 transition-transform group-hover:scale-125 ${item.type === 'SALE' ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]' : 'bg-white'
                                                                }`}
                                                        />

                                                        <div className="flex flex-col gap-4">
                                                            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-5 shadow-2xl group-hover:border-cyan-500/40 transition-all">
                                                                {item.type === 'EDIT' && item.oldValue !== undefined && item.newValue !== undefined ? (
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xs font-bold text-white/40 line-through truncate max-w-[150px]">{item.oldValue}</span>
                                                                        <ArrowRight size={16} className="text-cyan-500 shrink-0" />
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
                                                                ) : item.type === 'NOTE' ? (
                                                                    editingNoteId === item.id ? (
                                                                        <div className="flex flex-col gap-3">
                                                                            <textarea
                                                                                className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-all resize-none h-24"
                                                                                value={editingNoteContent}
                                                                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                                                            />
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => setEditingNoteId(null)}
                                                                                    className="px-4 py-2 text-xs font-bold text-fortis-mid hover:text-white transition-colors"
                                                                                >
                                                                                    Cancelar
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleSaveEditNote(item.id)}
                                                                                    className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold rounded-lg hover:bg-cyan-600 transition-colors"
                                                                                >
                                                                                    Salvar
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex justify-between items-start gap-4">
                                                                            <p className="text-sm text-white font-bold leading-relaxed opacity-90 break-words whitespace-pre-wrap flex-1">
                                                                                {item.description}
                                                                            </p>
                                                                            {(currentUser?.role === 'ADMIN' || currentUser?.id === item.userId) && (
                                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setEditingNoteId(item.id);
                                                                                            setEditingNoteContent(item.description);
                                                                                        }}
                                                                                        className="p-1.5 rounded-lg hover:bg-fortis-dark text-fortis-mid hover:text-cyan-400 transition-colors"
                                                                                        title="Editar"
                                                                                    >
                                                                                        <Edit2 size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteNote(item.id)}
                                                                                        className="p-1.5 rounded-lg hover:bg-fortis-dark text-fortis-mid hover:text-rose-400 transition-colors"
                                                                                        title="Excluir"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <p className="text-sm text-white font-bold leading-relaxed opacity-90 break-words whitespace-pre-wrap">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2.5 text-[10px] font-black text-white/80 uppercase tracking-[0.15em] bg-fortis-surface px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                                                                    <CalendarIcon size={13} className="text-blue-400" />
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
                                        </div>
                                    )}
                                    </div>
                                    
                                    {/* Registrar Atividade */}
                                    <div className="shrink-0 pt-4 border-t border-fortis-surface/50 mt-2">
                                        <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-5 focus-within:border-cyan-500/50 transition-all shadow-inner space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">REGISTRAR ATIVIDADE</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <textarea
                                                    value={manualNote}
                                                    onChange={(e) => setManualNote(e.target.value)}
                                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-cyan-500 transition-all placeholder:text-fortis-mid/40 resize-none h-20 leading-relaxed shadow-inner"
                                                    placeholder="Descreva a interação com o lead..."
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handleRegisterEntry}
                                                    disabled={!manualNote.trim()}
                                                    className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-20 px-6 py-2.5 rounded-xl text-[10px] font-black text-white shadow-lg shadow-cyan-500/30 transition-all active:scale-95 uppercase tracking-widest"
                                                >
                                                    Salvar Nota
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="flex items-center justify-between shrink-0 mt-6 pt-6 border-t border-fortis-surface/50">
                            {/* Botão excluir — somente ADMIN */}
                            {currentUser?.role === 'ADMIN' ? (
                                <button
                                    type="button"
                                    onClick={() => deleteTask(selectedTask.id)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 font-bold rounded-xl transition-all text-sm"
                                    title="Excluir tarefa do fluxo"
                                >
                                    <Trash2 size={15} /> Excluir
                                </button>
                            ) : <div />}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="px-6 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors"
                                >
                                    Fechar
                                </button>
                                <button
                                    onClick={() => handleAdvanceStage(selectedTask.id, true)}
                                    className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    <Check size={18} className="stroke-[3]" /> Concluir Etapa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Selecionar prazo da próxima etapa */}
            {isAdvanceModalOpen && taskToAdvance && (() => {
                const task = tasks.find(t => t.id === taskToAdvance);
                const currentIndex = flow?.stages.findIndex(s => s.id === task?.stageId) ?? -1;
                const nextStage = flow?.stages[currentIndex + 1];
                return (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-fortis-panel border border-fortis-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-fortis-surface/50">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Check size={18} className="text-emerald-400" />
                                        Avançar Etapa
                                    </h2>
                                    <button
                                        onClick={() => setIsAdvanceModalOpen(false)}
                                        className="text-fortis-mid hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                {nextStage && (
                                    <p className="text-xs text-fortis-mid">
                                        Movendo para: <span className="text-cyan-400 font-bold">{nextStage.name}</span>
                                    </p>
                                )}
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-3">
                                <label className="block text-xs font-bold text-fortis-mid mb-1 uppercase tracking-wider">
                                    Prazo para esta etapa
                                </label>

                                {/* Calendar widget */}
                                <div className="bg-fortis-dark border border-fortis-surface rounded-2xl overflow-hidden">
                                    {/* Calendar header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-fortis-surface/50">
                                        <button
                                            type="button"
                                            onClick={goCalendarPrev}
                                            className="p-1.5 rounded-lg text-fortis-mid hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-sm font-bold text-white">
                                            {calendarMonthNames[calendarDate.month]} {calendarDate.year}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={goCalendarNext}
                                            className="p-1.5 rounded-lg text-fortis-mid hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    {/* Day names */}
                                    <div className="grid grid-cols-7 px-2 pt-2">
                                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                            <div key={i} className="text-center text-[10px] font-black text-fortis-mid/50 uppercase py-1">
                                                {d}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Days grid */}
                                    <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
                                        {/* Empty cells for offset */}
                                        {Array.from({ length: getFirstDayOfMonth(calendarDate.year, calendarDate.month) }).map((_, i) => (
                                            <div key={`empty-${i}`} />
                                        ))}
                                        {Array.from({ length: getDaysInMonth(calendarDate.year, calendarDate.month) }, (_, i) => i + 1).map(day => {
                                            const dateStr = formatCalendarDay(calendarDate.year, calendarDate.month, day);
                                            const todayStr = new Date().toLocaleDateString('sv-SE');
                                            const isToday = dateStr === todayStr;
                                            const isSelected = dateStr === advanceDueDate;
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => setAdvanceDueDate(isSelected ? '' : dateStr)}
                                                    className={`
                                                        w-full aspect-square flex items-center justify-center rounded-lg text-[12px] font-bold transition-all
                                                        ${isSelected
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                            : isToday
                                                                ? 'bg-fortis-brand/20 text-fortis-brand ring-1 ring-fortis-brand/40'
                                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                        }
                                                    `}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Selected date display */}
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-fortis-mid/60">
                                        {advanceDueDate
                                            ? `Selecionado: ${new Date(advanceDueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                            : 'Deixe em branco para definir depois.'}
                                    </p>
                                    {advanceDueDate && (
                                        <button
                                            type="button"
                                            onClick={() => setAdvanceDueDate('')}
                                            className="text-[10px] text-fortis-mid/60 hover:text-red-400 transition-colors font-bold flex items-center gap-1"
                                        >
                                            <X size={10} /> Limpar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 flex gap-3">
                                <button
                                    onClick={() => setIsAdvanceModalOpen(false)}
                                    className="flex-1 py-2.5 bg-fortis-surface text-white font-bold rounded-xl hover:bg-fortis-surface/80 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAdvanceStage}
                                    className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
                                >
                                    <Check size={16} className="stroke-[3]" /> Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
