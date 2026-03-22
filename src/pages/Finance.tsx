import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, LabelList, Legend
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Target, Activity, Calendar as CalendarIcon, Filter, Search, Loader2 } from 'lucide-react';
import { useApp } from '../store';

const parseISO = (str: string) => {
    if (!str) return new Date();
    const datePart = str.trim().split('T')[0].split(' ')[0];
    if (datePart.includes('-')) {
        const [y, m, d] = datePart.split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    return new Date(str.trim().replace(' ', 'T'));
};
const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
const subMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setDate(1);
    d.setMonth(d.getMonth() - months);
    return d;
};
const startOfDay = (d: Date) => {
    const newD = new Date(d);
    newD.setHours(0, 0, 0, 0);
    return newD;
};
const isBefore = (d1: Date, d2: Date) => d1.getTime() < d2.getTime();
const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const formatMonthYear = (d: Date) => `${MONTHS_PT[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
const formatDayMonthYear = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
};
const formatMonthYearFull = (d: Date) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
};
const formatDayMonthYearFull = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const periods = [
    { id: 'hoje', label: 'Hoje' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: 'este_mes', label: 'Este mês' },
    { id: 'ultimo_mes', label: 'Último mês' },
    { id: 'este_ano', label: 'Este ano' },
    { id: 'ultimo_ano', label: 'Último ano' },
    { id: 'CUSTOM', label: 'Personalizado' },
];


interface CashFlow {
    id?: string;
    data: string;
    mes: string;
    ano: string;
    valor: number;
    canal: string;
    tipo: 'ENTRADA' | 'SAÍDA';
    categoria: string;
    banco: string;
    previsto: number;
    realizado: number;
    desc?: string;
    rawType?: string;
}

interface AccountPayable {
    id?: string;
    fornecedor: string;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: 'PAGO' | 'PENDENTE' | 'EM ABERTO';
    categoria: string;
    banco: string;
    empresa: string;
    tipo: 'FIXA' | 'VARIÁVEL';
}

const COLORS = ['#60A5FA', '#FBBF24', '#A78BFA', '#34D399', '#F87171', '#818CF8', '#F472B6', '#38BDF8'];

export const Finance: React.FC = () => {
    const { filters, setFilters } = useApp();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
    const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);

    // Filtros das tabelas
    const [payableFilterStatus, setPayableFilterStatus] = useState<string>('TODOS');
    const [payableSearch, setPayableSearch] = useState('');

    const [statementFilterType, setStatementFilterType] = useState<string>('TODOS');
    const [statementFilterCat, setStatementFilterCat] = useState<string>('TODAS');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cashFlowRes, payableRes] = await Promise.all([
                supabase.from('cash_flow').select('*').order('created_at', { ascending: false }).limit(5000),
                supabase.from('accounts_payable').select('*').order('created_at', { ascending: false }).limit(5000)
            ]);

            if (cashFlowRes.error) console.error('Error fetching cash flow:', cashFlowRes.error);
            if (payableRes.error) console.error('Error fetching accounts payable:', payableRes.error);

            const rawCashFlows = cashFlowRes.data || [];
            const mappedCashFlows: CashFlow[] = rawCashFlows.map((item: any) => {
                const rawType = item.type?.toString().trim().toUpperCase() || '';
                return {
                    id: item.id?.toString(),
                    data: item.created_at,
                    mes: '',
                    ano: '',
                    valor: Number(item.value || 0),
                    canal: item.client || 'Outros',
                    tipo: ['C', 'S'].includes(rawType) ? 'ENTRADA' : 'SAÍDA',
                    categoria: item.category || 'Não categorizada',
                    banco: item.bank || '',
                    previsto: Number(item.value || 0),
                    realizado: Number(item.value || 0),
                    desc: item.description || '',
                    rawType
                };
            });

            const rawPayables = payableRes.data || [];
            const mappedPayables: AccountPayable[] = rawPayables.map((item: any) => ({
                id: item.id?.toString(),
                fornecedor: item.contact || 'Desconhecido',
                valor: Number(item.value || 0),
                data_vencimento: item.created_at,
                data_pagamento: item.created_at,
                status: (item.status || 'PENDENTE').toString().trim().toUpperCase() === 'RECEBIDO' ? 'PAGO' : (item.status || 'PENDENTE').toString().toUpperCase() as 'PAGO' | 'PENDENTE' | 'EM ABERTO',
                categoria: item.category || 'Não categorizada',
                banco: item.payment_method || '',
                empresa: 'Fortis',
                tipo: 'FIXA'
            }));

            setCashFlows(mappedCashFlows);
            setAccountsPayable(mappedPayables);
        } catch (error) {
            console.error('Error in fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const isRealTransaction = (cf: CashFlow) => cf.categoria !== 'Ajuste de saldo' && cf.desc !== 'Saldo Atual';

    const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
        const period = filters.period;
        const customRange = filters.customRange;
        const now = new Date();
        let sDate = new Date();
        let eDate = new Date();

        if (period === 'CUSTOM' && customRange.start && customRange.end) {
            const [sy, sm, sd] = customRange.start.split('-').map(Number);
            const [ey, em, ed] = customRange.end.split('-').map(Number);
            sDate = new Date(sy, sm - 1, sd);
            eDate = new Date(ey, em - 1, ed, 23, 59, 59);
        } else {
            switch (period) {
                case 'hoje':
                    sDate.setHours(0, 0, 0, 0);
                    break;
                case '7d':
                    sDate.setDate(now.getDate() - 7);
                    break;
                case 'este_mes':
                    sDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    eDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                    break;
                case 'ultimo_mes':
                    sDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    eDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                    break;
                case 'este_ano':
                    sDate = new Date(now.getFullYear(), 0, 1);
                    eDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                    break;
                case 'ultimo_ano':
                    sDate = new Date(now.getFullYear() - 1, 0, 1);
                    eDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                    break;
                default: 
                    sDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    eDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }
        }

        const psDate = new Date(sDate);
        const peDate = new Date(eDate);
        const duration = eDate.getTime() - sDate.getTime();

        if (period === 'hoje') {
            psDate.setDate(psDate.getDate() - 1);
            peDate.setDate(peDate.getDate() - 1);
        } else if (period === '7d') {
            psDate.setDate(psDate.getDate() - 7);
            peDate.setDate(peDate.getDate() - 7);
        } else if (period === 'este_mes' || period === 'ultimo_mes') {
            psDate.setMonth(psDate.getMonth() - 1);
            peDate.setMonth(peDate.getMonth() - 1);
        } else if (period === 'este_ano' || period === 'ultimo_ano') {
            psDate.setFullYear(psDate.getFullYear() - 1);
            peDate.setFullYear(peDate.getFullYear() - 1);
        } else {
            psDate.setTime(psDate.getTime() - duration - 1000);
            peDate.setTime(peDate.getTime() - duration - 1000);
        }

        return { startDate: sDate, endDate: eDate, prevStartDate: psDate, prevEndDate: peDate };
    }, [filters]);

    const isWithinPeriod = (d: Date, start: Date, end: Date) => {
        return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    };

    const periodCashFlows = useMemo(() => {
        return cashFlows.filter(cf => {
            const d = parseISO(cf.data);
            return isWithinPeriod(d, startDate, endDate);
        });
    }, [cashFlows, startDate, endDate]);

    const periodPayables = useMemo(() => {
        return accountsPayable.filter(ap => {
            const d = parseISO(ap.data_vencimento);
            return isWithinPeriod(d, startDate, endDate);
        });
    }, [accountsPayable, startDate, endDate]);

    const { totalBalance, balancesByBank } = useMemo(() => {
        let total = 0;
        const banks: Record<string, number> = {};

        cashFlows.forEach(cf => {
            // A partir de 29/01/2026
            if (cf.data >= '2026-01-29') {
                const bank = cf.banco && cf.banco.trim() !== '' ? cf.banco : 'Outros';
                if (!banks[bank]) banks[bank] = 0;

                const val = Number(cf.realizado || cf.valor || 0);

                if (cf.rawType === 'C' || cf.rawType === 'S') {
                    total += val;
                    banks[bank] += val;
                } else if (cf.rawType === 'D') {
                    total -= val;
                    banks[bank] -= val;
                }
            }
        });

        const sortedBanks = Object.fromEntries(
            Object.entries(banks)
                .filter(([, b]) => b !== 0)
                .sort(([, a], [, b]) => b - a)
        );

        return { totalBalance: total, balancesByBank: sortedBanks };
    }, [cashFlows]);

    const monthlyRevenueRealized = periodCashFlows
        .filter(cf => cf.tipo === 'ENTRADA' && isRealTransaction(cf))
        .reduce((acc, curr) => acc + Number(curr.realizado || curr.valor || 0), 0);

    const monthlyExpenses = periodPayables
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const prevMonthlyExpenses = accountsPayable
        .filter(ap => isWithinPeriod(parseISO(ap.data_vencimento), prevStartDate, prevEndDate))
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const expensesMoM = prevMonthlyExpenses > 0
        ? ((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100
        : 0;

    const isOperationalRevenue = (cf: CashFlow) => cf.rawType === 'C' && !['Transferências de entrada', 'Entrada Não Operacional', 'Saída Não Operacional'].includes(cf.categoria);
    const isOperationalExpense = (cf: CashFlow) => cf.rawType === 'D' && !['Transferências de saída', 'Entrada Não Operacional', 'Saída Não Operacional'].includes(cf.categoria);

    const opResultEntradas = periodCashFlows
        .filter(isOperationalRevenue)
        .reduce((acc, curr) => acc + Number(curr.realizado || curr.valor || 0), 0);

    const opResultSaidas = periodCashFlows
        .filter(isOperationalExpense)
        .reduce((acc, curr) => acc + Number(curr.realizado || curr.valor || 0), 0);

    const opResult = opResultEntradas - opResultSaidas;

    const pagasValue = periodCashFlows
        .filter(cf => cf.rawType === 'D' && cf.categoria !== 'Transferências de saída')
        .reduce((acc, curr) => acc + Number(curr.realizado || curr.valor || 0), 0);

    const todayStart = startOfDay(new Date());

    const atrasadasValue = accountsPayable
        .filter(ap => (ap.status === 'EM ABERTO' || ap.status === 'PENDENTE') && isBefore(startOfDay(parseISO(ap.data_vencimento)), todayStart))
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const sixMonthsFromNow = new Date(todayStart);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const aVencerValue = accountsPayable
        .filter(ap => (ap.status === 'EM ABERTO' || ap.status === 'PENDENTE') && 
            !isBefore(startOfDay(parseISO(ap.data_vencimento)), todayStart) &&
            isBefore(startOfDay(parseISO(ap.data_vencimento)), sixMonthsFromNow))
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const totalExpensesGlobal = periodPayables.reduce((acc, curr) => acc + Number(curr.valor), 0);

    // Chart: Revenue x Expenses x Op Result
    const lineChartData = useMemo(() => {
        const data = [];
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        const current = new Date(start);

        while (current <= end) {
            const targetDate = new Date(current);
            const rev = periodCashFlows
                .filter(cf => isOperationalRevenue(cf) && isSameMonth(parseISO(cf.data), targetDate))
                .reduce((acc, curr) => acc + Number(curr.realizado || curr.valor || 0), 0);

            const exp = periodCashFlows
                .filter(cf => isOperationalExpense(cf) && isSameMonth(parseISO(cf.data), targetDate))
                .reduce((acc, curr) => acc + Number(curr.realizado || curr.valor || 0), 0);

            data.push({
                name: formatMonthYear(targetDate).toUpperCase(),
                Receita: rev,
                Despesas: exp,
                Resultado: rev - exp
            });

            current.setMonth(current.getMonth() + 1);
        }
        return data;
    }, [periodCashFlows, periodPayables, startDate, endDate]);

    // Chart: Stacked Bar (Fixed vs Var Expenses)
    const expenseChartData = useMemo(() => {
        const data = [];
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        const current = new Date(start);

        while (current <= end) {
            const targetDate = new Date(current);
            const monthAp = periodPayables.filter(ap => isSameMonth(parseISO(ap.data_vencimento), targetDate));

            const fixa = monthAp.filter(a => a.tipo === 'FIXA').reduce((s, a) => s + Number(a.valor), 0);
            const var_ = monthAp.filter(a => a.tipo === 'VARIÁVEL').reduce((s, a) => s + Number(a.valor), 0);

            data.push({
                name: MONTHS_PT[targetDate.getMonth()].toUpperCase(),
                Fixa: fixa,
                Variável: var_
            });

            current.setMonth(current.getMonth() + 1);
        }
        return data;
    }, [periodPayables, startDate, endDate]);

    // Chart: Donut (Revenue vs Expenses)
    const statsDonutData = useMemo(() => [
        { name: 'Receita', value: opResultEntradas, color: '#34D399' },
        { name: 'Despesas', value: opResultSaidas, color: '#F87171' }
    ], [opResultEntradas, opResultSaidas]);

    // Chart: Expenses by category (from Cash Flow)
    const topExpensesData = useMemo(() => {
        const cats: Record<string, number> = {};
        periodCashFlows.filter(isOperationalExpense).forEach(cf => {
            const c = cf.categoria || 'Não categorizada';
            if (!cats[c]) cats[c] = 0;
            cats[c] += Number(cf.realizado || cf.valor || 0);
        });

        return Object.entries(cats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [periodCashFlows]);

    // Chart: Faturamento Diário (Line Chart)
    const dailyRevenueData = useMemo(() => {
        const days = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        // Reset to start of day for comparison
        current.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        while (current <= end) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const dStr = String(current.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dStr}`;
            const dailyLabel = String(current.getDate()).padStart(2, '0');

            const val = cashFlows
                .filter(c => c.rawType === 'C' && c.categoria !== 'Transferências de entrada' && c.data.startsWith(dateStr))
                .reduce((sum, curr) => sum + Number(curr.realizado || curr.valor || 0), 0);

            if (val > 0) {
                days.push({
                    date: dateStr,
                    label: `${current.getDate()} ${MONTHS_PT[current.getMonth()]}`,
                    valor: val
                });
            }

            current.setDate(current.getDate() + 1);
        }

        return days;
    }, [cashFlows, startDate, endDate]);

    // Chart: Projeção 6 meses Contas a Pagar (Ignora filtro de período)
    const futurePayablesData = useMemo(() => {
        const data = [];
        const today = new Date();
        
        for (let i = 1; i <= 6; i++) {
            const targetMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthLabel = MONTHS_PT[targetMonth.getMonth()].toUpperCase();
            const yearLabel = targetMonth.getFullYear().toString().slice(-2);
            const key = `${monthLabel}/${yearLabel}`;

            const total = accountsPayable
                .filter(ap => {
                    const d = parseISO(ap.data_vencimento);
                    return isSameMonth(d, targetMonth) && (ap.status === 'EM ABERTO' || ap.status === 'PENDENTE');
                })
                .reduce((sum, curr) => sum + Number(curr.valor), 0);

            data.push({
                name: key,
                valor: total
            });
        }
        return data;
    }, [accountsPayable]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Extrato de Lançamentos
    const extratoList = useMemo(() => {
        let list = cashFlows.map(cf => ({
            data: cf.data,
            desc: cf.desc || 'Registro',
            cat: cf.categoria,
            canal: cf.canal || '',
            banco: cf.banco,
            valor: Number(cf.realizado || cf.valor || 0),
            tipo: cf.tipo,
            id: cf.id || Math.random().toString()
        }));

        if (statementFilterType !== 'TODOS') list = list.filter(l => l.tipo === statementFilterType);
        if (statementFilterCat !== 'TODAS') list = list.filter(l => l.cat === statementFilterCat);

        return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 50); // limit for UI
    }, [cashFlows, statementFilterType, statementFilterCat]);

    const catOptions = Array.from(new Set(cashFlows.map(c => c.categoria).filter(Boolean)));

    // Contas a pagar view
    const payableView = useMemo(() => {
        let list = periodPayables.map(ap => {
            const due = startOfDay(parseISO(ap.data_vencimento));
            const today = startOfDay(new Date());
            let st: string = ap.status;
            if ((st === 'PENDENTE' || st === 'EM ABERTO') && isBefore(due, today)) {
                st = 'VENCIDO';
            }
            return { ...ap, computedStatus: st };
        });

        if (payableFilterStatus !== 'TODOS') list = list.filter(l => l.computedStatus === payableFilterStatus);
        if (payableSearch) {
            list = list.filter(l => l.fornecedor.toLowerCase().includes(payableSearch.toLowerCase()));
        }

        return list.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
    }, [periodPayables, payableFilterStatus, payableSearch]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAGO': return <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[10px] font-bold">PAGO</span>;
            case 'PENDENTE': return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-[10px] font-bold">PENDENTE</span>;
            case 'EM ABERTO': return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-[10px] font-bold">EM ABERTO</span>;
            case 'VENCIDO': return <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">VENCIDO</span>;
            default: return <span className="bg-gray-500/10 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold">{status}</span>;
        }
    };

    const getIntensityColor = (intensity: number) => {
        if (intensity === 0) return 'bg-fortis-surface';
        if (intensity < 0.25) return 'bg-[#c6e4d6] text-[#c6e4d6]';
        if (intensity < 0.5) return 'bg-[#8ecbb2] text-[#8ecbb2]';
        if (intensity < 0.75) return 'bg-[#588575] text-[#588575]';
        return 'bg-[#2a4539] text-[#2a4539]';
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-fortis-brand" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Financeiro</h2>
                    <p className="text-fortis-mid text-sm">Controle de fluxo de caixa, DRE e contas a pagar.</p>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 bg-fortis-panel border border-fortis-surface px-4 py-2 rounded-xl text-xs font-bold hover:border-fortis-brand/50 transition-all"
                    >
                        <CalendarIcon size={14} className="text-fortis-brand" />
                        {periods.find(p => p.id === filters.period)?.label}
                    </button>

                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-fortis-panel border border-fortis-surface rounded-2xl shadow-2xl z-[100] p-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="grid grid-cols-1 gap-1">
                                {periods.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setFilters({ period: p.id });
                                            if (p.id !== 'CUSTOM') setIsFilterOpen(false);
                                        }}
                                        className={`text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${filters.period === p.id ? 'bg-fortis-brand/10 text-fortis-brand' : 'text-fortis-mid hover:bg-fortis-surface hover:text-white'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {filters.period === 'CUSTOM' && (
                                <div className="mt-2 p-3 border-t border-fortis-surface space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-fortis-mid uppercase">Início</label>
                                        <input
                                            type="date"
                                            value={filters.customRange.start}
                                            onChange={(e) => setFilters({ customRange: { ...filters.customRange, start: e.target.value } })}
                                            className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs focus:border-fortis-brand outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-fortis-mid uppercase">Fim</label>
                                        <input
                                            type="date"
                                            value={filters.customRange.end}
                                            onChange={(e) => setFilters({ customRange: { ...filters.customRange, end: e.target.value } })}
                                            className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs focus:border-fortis-brand outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        disabled={!filters.customRange.start || !filters.customRange.end}
                                        className="w-full bg-fortis-brand text-white py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all"
                                    >
                                        Aplicar Range
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-6 hover:border-fortis-brand/40 transition-all group flex flex-col justify-start">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl bg-fortis-dark text-blue-400 group-hover:scale-110 transition-transform`}>
                                <Wallet size={20} />
                            </div>
                        </div>
                        <p className="text-fortis-mid text-[10px] font-bold uppercase tracking-[0.2em]">Saldo bancário</p>
                        <p className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(totalBalance)}</p>
                    </div>

                    {Object.keys(balancesByBank).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-fortis-surface space-y-2">
                            {Object.entries(balancesByBank).map(([bank, balance]) => (
                                <div key={bank} className="flex items-center justify-between">
                                    <span className="text-xs text-fortis-mid truncate max-w-[120px]" title={bank}>{bank}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {formatCurrency(balance)}
                                        </span>
                                        <span className="text-[10px] text-fortis-mid font-bold">
                                            ({totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(1).replace('.', ',') : '0,0'}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-6 hover:border-fortis-brand/40 transition-all group flex flex-col justify-start">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl bg-fortis-dark text-red-400 group-hover:scale-110 transition-transform`}>
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <p className="text-fortis-mid text-[10px] font-bold uppercase tracking-[0.2em]">Total Despesas</p>
                        <p className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(totalExpensesGlobal)}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-fortis-surface space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-fortis-mid truncate max-w-[120px]" title="Pagas">Pagas</span>
                            <span className="text-xs font-bold text-emerald-500">
                                {formatCurrency(pagasValue)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-fortis-mid truncate max-w-[120px]" title="Atrasadas">Atrasadas</span>
                            <span className="text-xs font-bold text-red-500">
                                {formatCurrency(atrasadasValue)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-fortis-mid truncate max-w-[120px]" title="Próximos 6 meses">Próximos 6 meses</span>
                            <span className="text-xs font-bold text-yellow-500">
                                {formatCurrency(aVencerValue)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-6 hover:border-fortis-brand/40 transition-all group flex flex-col justify-start">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl bg-fortis-dark ${opResult >= 0 ? 'text-emerald-400' : 'text-red-400'} group-hover:scale-110 transition-transform`}>
                                <Activity size={20} />
                            </div>
                        </div>
                        <p className="text-fortis-mid text-[10px] font-bold uppercase tracking-[0.2em]">Resultado Operacional</p>
                        <p className={`text-2xl font-bold mt-1 tracking-tight ${opResult >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatCurrency(opResult)}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-fortis-surface space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-fortis-mid truncate max-w-[120px]" title="Receita">Receita</span>
                            <span className="text-xs font-bold text-emerald-500">
                                {formatCurrency(opResultEntradas)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-fortis-mid truncate max-w-[120px]" title="Despesas">Despesas</span>
                            <span className="text-xs font-bold text-red-500">
                                {formatCurrency(opResultSaidas)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Main Chart */}
            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
                <h3 className="font-bold mb-6">Receita x Despesas x Resultado do Período</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lineChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                            <RechartsTooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#141F28', border: '1px solid #2B373E', borderRadius: '12px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                formatter={(val: number) => formatCurrency(val)}
                            />
                            <Legend iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                            <Bar name="Receita" dataKey="Receita" fill="#014D40" radius={[4, 4, 0, 0]} />
                            <Bar name="Despesas" dataKey="Despesas" fill="#990F0E" radius={[4, 4, 0, 0]} />
                            <Bar name="Resultado Operacional" dataKey="Resultado" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2.5: Future Projections */}
            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold">Projeção de Contas a Pagar (Próximos 6 Meses)</h3>
                    <div className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        Apenas em aberto
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={futurePayablesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                            <RechartsTooltip
                                cursor={{ fill: 'rgba(248, 113, 113, 0.05)' }}
                                contentStyle={{ backgroundColor: '#141F28', border: '1px solid #2B373E', borderRadius: '12px' }}
                                itemStyle={{ color: '#F87171', fontWeight: 'bold' }}
                                formatter={(val: number) => formatCurrency(val)}
                            />
                            <Bar name="A PAGAR" dataKey="valor" fill="#F87171" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="valor" position="top" fill="#a1a1aa" fontSize={10} fontWeight="bold" formatter={(v: number) => v > 0 ? formatCurrency(v) : ''} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 3: Category Expenses & Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Despesas por Categoria */}
                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 flex flex-col h-[480px]">
                    <h3 className="font-bold mb-6">Despesas por Categoria (Fluxo de Caixa)</h3>
                    <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-fortis-surface">
                        <div style={{ height: `${Math.max(300, topExpensesData.length * 45)}px` }} className="w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topExpensesData} layout="vertical" margin={{ top: 0, right: 80, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2B373E" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#fff' }} width={120} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(248, 113, 113, 0.1)' }}
                                        contentStyle={{ backgroundColor: '#141F28', border: '1px solid #2B373E', borderRadius: '12px' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Bar dataKey="value" fill="#F87171" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                                        <LabelList
                                            dataKey="value"
                                            position="right"
                                            fill="#a1a1aa"
                                            fontSize={10}
                                            formatter={(v: number) => {
                                                const total = topExpensesData.reduce((sum, item) => sum + item.value, 0);
                                                const pct = total > 0 ? ((v / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                                                return `${formatCurrency(v)} (${pct}%)`;
                                            }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 flex flex-col h-[480px]">
                    <h3 className="font-bold mb-2">Visão Geral: Receita x Despesas</h3>
                    <div className="flex-1 min-h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statsDonutData}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value"
                                    animationDuration={1500}
                                >
                                    {statsDonutData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#141F28', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number, name: string) => {
                                        const total = statsDonutData.reduce((s, c) => s + c.value, 0);
                                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                        return [`${formatCurrency(value)} (${pct}%)`, name];
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                        {statsDonutData.map((c) => (
                            <div key={c.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></div>
                                <span className="text-xs text-fortis-mid">{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4: Faturamento Diário (Full Width) */}
            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 flex flex-col h-[480px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold">Faturamento Diário</h3>
                    <div className="text-xs text-fortis-mid">
                        Média: {formatCurrency(
                            dailyRevenueData.reduce((sum, d) => sum + d.valor, 0) / (dailyRevenueData.length || 1)
                        )} / dia
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyRevenueData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                fontSize={10}
                                tick={{ fill: '#575756' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                fontSize={10}
                                tick={{ fill: '#575756' }}
                                tickFormatter={(val) => `R$ ${val / 1000}k`}
                            />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#141F28', border: '1px solid #2B373E', borderRadius: '12px' }}
                                formatter={(val: number) => formatCurrency(val)}
                                labelFormatter={(label) => `Dia ${label}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="valor"
                                stroke="#34D399"
                                strokeWidth={3}
                                dot={{ fill: '#34D399', strokeWidth: 2, r: 4, stroke: '#141F28' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 5: Tables */}
            <div className="grid grid-cols-1 gap-8">

                {/* Contas a Pagar */}
                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-fortis-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h3 className="font-bold flex items-center gap-2">
                            Contas a Pagar
                            <span className="bg-fortis-surface text-fortis-mid px-2 py-0.5 rounded-full text-xs">{payableView.length}</span>
                        </h3>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fortis-mid" />
                                <input
                                    type="text"
                                    placeholder="Buscar fornecedor..."
                                    value={payableSearch}
                                    onChange={(e) => setPayableSearch(e.target.value)}
                                    className="w-full bg-fortis-dark border border-fortis-surface rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-fortis-brand focus:outline-none transition-colors"
                                />
                            </div>
                            <select
                                value={payableFilterStatus}
                                onChange={(e) => setPayableFilterStatus(e.target.value)}
                                className="bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs font-medium text-white focus:border-fortis-brand focus:outline-none cursor-pointer"
                            >
                                <option value="TODOS">Todos status</option>
                                <option value="PAGO">Pago</option>
                                <option value="PENDENTE">Pendente</option>
                                <option value="EM ABERTO">Em Aberto</option>
                                <option value="VENCIDO">Vencido</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-fortis-surface bg-fortis-dark/50">
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap">Fornecedor</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap">Valor</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap">Vencimento</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Categoria</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Banco</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-fortis-surface">
                                {payableView.map(p => (
                                    <tr key={p.id} className="hover:bg-fortis-surface/30 transition-colors group">
                                        <td className="py-4 px-6 text-sm font-semibold">{p.fornecedor}</td>
                                        <td className="py-4 px-6 text-sm font-bold">{formatCurrency(p.valor)}</td>
                                        <td className="py-4 px-6 text-xs text-fortis-mid">{formatDayMonthYear(parseISO(p.data_vencimento))}</td>
                                        <td className="py-4 px-6">{getStatusBadge(p.computedStatus)}</td>
                                        <td className="py-4 px-6 text-xs text-fortis-mid hidden sm:table-cell">{p.categoria}</td>
                                        <td className="py-4 px-6 text-xs text-fortis-mid hidden md:table-cell">{p.banco}</td>
                                    </tr>
                                ))}
                                {payableView.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-sm text-fortis-mid">Nenhuma conta a pagar encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Extrato de Lançamentos */}
                <div className="bg-fortis-panel border border-fortis-surface rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-fortis-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h3 className="font-bold flex items-center gap-2">
                            Extrato de Lançamentos
                            <span className="bg-fortis-surface text-fortis-mid px-2 py-0.5 rounded-full text-xs">{extratoList.length}</span>
                        </h3>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select
                                value={statementFilterType}
                                onChange={(e) => setStatementFilterType(e.target.value)}
                                className="bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs font-medium text-white focus:border-fortis-brand focus:outline-none cursor-pointer"
                            >
                                <option value="TODOS">Todos os tipos</option>
                                <option value="ENTRADA">Receita</option>
                                <option value="SAÍDA">Despesas</option>
                            </select>
                            <select
                                value={statementFilterCat}
                                onChange={(e) => setStatementFilterCat(e.target.value)}
                                className="bg-fortis-dark border border-fortis-surface rounded-lg px-3 py-2 text-xs font-medium text-white focus:border-fortis-brand focus:outline-none cursor-pointer"
                            >
                                <option value="TODAS">Todas categorias</option>
                                {catOptions.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="w-full text-left border-collapse">
                                <tr className="border-b border-fortis-surface bg-fortis-dark/50">
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-white transition-colors">Data ↓</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Categoria</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap">Histórico</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Cliente/Fornecedor</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Conta</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-fortis-mid uppercase tracking-widest whitespace-nowrap text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-fortis-surface text-left">
                                {extratoList.map(item => (
                                    <tr key={item.id} className="hover:bg-fortis-surface/30 transition-colors group">
                                        <td className="py-4 px-6 text-xs">{formatDayMonthYear(parseISO(item.data))}</td>
                                        <td className="py-4 px-6 text-xs hidden sm:table-cell">{item.cat}</td>
                                        <td className="py-4 px-6 text-xs font-semibold">{item.desc}</td>
                                        <td className="py-4 px-6 text-xs hidden sm:table-cell">{item.canal !== 'Outros' ? item.canal : ''}</td>
                                        <td className="py-4 px-6 text-xs hidden md:table-cell">{item.banco}</td>
                                        <td className={`py-4 px-6 text-sm font-bold text-right whitespace-nowrap ${item.tipo === 'ENTRADA' ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.tipo === 'ENTRADA' ? formatCurrency(item.valor) : `- ${formatCurrency(item.valor)}`}
                                        </td>
                                    </tr>
                                ))}
                                {extratoList.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-sm text-fortis-mid">Nenhum lançamento encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
