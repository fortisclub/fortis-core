
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, LabelList, ReferenceLine, Label } from 'recharts';
import { TrendingUp, Users, Target, Activity, MoreHorizontal, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Wallet, ShoppingCart } from 'lucide-react';
import { useApp } from '../store';
import { LEAD_STATUS_MAP, PAID_PURCHASE_STATUSES } from '../constants';
import { supabase } from '../lib/supabase';

const COLORS = ['#60A5FA', '#FBBF24', '#A78BFA', '#34D399', '#F87171'];

export const Dashboard: React.FC = () => {
  const { leads, globalStats, trafficInvestments, fetchGlobalStats, fetchTrafficInvestments, filters, setFilters } = useApp();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vendas' | 'cac-ltv'>('vendas');
  const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>([]);

  const avgCac = monthlyMetrics.length ? monthlyMetrics.reduce((acc, m) => acc + m.cac, 0) / monthlyMetrics.length : 0;
  const avgTicket = monthlyMetrics.length ? monthlyMetrics.reduce((acc, m) => acc + m.ticketMedio, 0) / monthlyMetrics.length : 0;
  const avgLtv = monthlyMetrics.length ? monthlyMetrics.reduce((acc, m) => acc + m.ltv, 0) / monthlyMetrics.length : 0;
  useEffect(() => {
    async function fetch12Months() {
      const now = new Date();
      // Início do 11º mês atrás (para compor 12 com o mês atual)
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const startStr = start.toISOString().split('T')[0];

      const [adsRes, leadsRes, purchasesRes] = await Promise.all([
        supabase.from('meta_ads').select('date, amount_spent').gte('date', startStr).limit(100000),
        supabase.from('leads').select('created_at').eq('origin', 'Tráfego pago').gte('created_at', startStr).limit(100000),
        supabase.from('lead_purchases').select('lead_id, value, date, status').in('status', PAID_PURCHASE_STATUSES).limit(100000)
      ]);

      const ads = adsRes.data || [];
      const paidLeads = leadsRes.data || [];
      const purchases = purchasesRes.data || [];

      const metrics = [];
      const fixTz = (s: any) => typeof s === 'string' ? s.replace(/Z$|\+00:00$|\+00$/, '') : s;

      for (let i = 11; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();

        // Month boundaries
        const mStart = new Date(y, m, 1);
        const mEnd = new Date(y, m + 1, 0, 23, 59, 59);

        // Name
        const monthLabel = mStart.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const label = `${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}/${String(y).slice(-2)}`;

        // CAC
        const spentInMonth = ads
          .filter(a => new Date(fixTz(a.date)) >= mStart && new Date(fixTz(a.date)) <= mEnd)
          .reduce((sum, a) => sum + Number(a.amount_spent), 0);

        const leadsInMonth = paidLeads
          .filter(l => new Date(fixTz(l.created_at)) >= mStart && new Date(fixTz(l.created_at)) <= mEnd)
          .length;

        const cac = leadsInMonth > 0 ? spentInMonth / leadsInMonth : 0;

        // Ticket Médio
        const monthPurchases = purchases
          .filter(p => new Date(fixTz(p.date)) >= mStart && new Date(fixTz(p.date)) <= mEnd);

        const revInMonth = monthPurchases.reduce((sum, p) => sum + Number(p.value), 0);
        const uniqueCustomersInMonth = new Set(monthPurchases.map(p => p.lead_id)).size;

        const ticketMedio = uniqueCustomersInMonth > 0 ? revInMonth / uniqueCustomersInMonth : 0;

        // LTV Acumulado
        const purchasesTillMonth = purchases
          .filter(p => new Date(fixTz(p.date)) <= mEnd);

        const totalRevTillMonth = purchasesTillMonth.reduce((sum, p) => sum + Number(p.value), 0);
        const totalPurchasesTillMonth = purchasesTillMonth.length;
        const uniqueCustomersTillMonth = new Set(purchasesTillMonth.map(p => p.lead_id)).size;

        const arpuTillMonth = uniqueCustomersTillMonth > 0 ? totalRevTillMonth / uniqueCustomersTillMonth : 0;
        const mediaComprasTillMonth = uniqueCustomersTillMonth > 0 ? totalPurchasesTillMonth / uniqueCustomersTillMonth : 0;
        const ltv = arpuTillMonth * mediaComprasTillMonth;

        metrics.push({ month: label, cac, ticketMedio, ltv });
      }
      setMonthlyMetrics(metrics);
    }

    if (activeTab === 'cac-ltv' && monthlyMetrics.length === 0) {
      fetch12Months();
    }
  }, [activeTab]);

  // Usa refs para estabilizar as funções de fetch e evitar re-fetches ao trocar de janela
  const fetchGlobalStatsRef = useRef(fetchGlobalStats);
  const fetchTrafficInvestmentsRef = useRef(fetchTrafficInvestments);
  useEffect(() => { fetchGlobalStatsRef.current = fetchGlobalStats; }, [fetchGlobalStats]);
  useEffect(() => { fetchTrafficInvestmentsRef.current = fetchTrafficInvestments; }, [fetchTrafficInvestments]);

  useEffect(() => {
    fetchGlobalStatsRef.current();
    fetchTrafficInvestmentsRef.current();
  }, [filters.period, filters.customRange]);

  const handleApplyCustom = () => {
    if (filters.customRange.start && filters.customRange.end) {
      fetchGlobalStatsRef.current();
      fetchTrafficInvestmentsRef.current();
      setIsFilterOpen(false);
    }
  };

  const totalSalesDailyCount = useMemo(() => {
    return (globalStats.salesDaily || []).reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);
  }, [globalStats.salesDaily]);

  const salesUfData = useMemo(() => {
    return Object.entries(globalStats.ufCounts || {})
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({ name: key, value }));
  }, [globalStats.ufCounts]);

  const salesChannelData = useMemo(() => {
    return Object.entries(globalStats.channelCounts || {})
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({ name: key, value }));
  }, [globalStats.channelCounts]);

  const leadsStatusData = useMemo(() => {
    return Object.entries(globalStats.leadsStatusCounts || {})
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({ name: key, value }));
  }, [globalStats.leadsStatusCounts]);

  const totalSalesUf = salesUfData.reduce((acc, curr) => acc + curr.value, 0);
  const totalSalesChannel = salesChannelData.reduce((acc, curr) => acc + curr.value, 0);
  const totalLeadsStatus = leadsStatusData.reduce((acc, curr) => acc + curr.value, 0);

  // Helpers para comparativo
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getDiffDisplay = (current: number, previous: number, inverse = false) => {
    if (previous === 0) return null;
    const change = calculateChange(current, previous);
    const isPositive = change >= 0;
    const isGood = inverse ? !isPositive : isPositive;
    const color = isGood ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
        <Icon size={10} className="mr-0.5" />
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  // ROAS: Faturamento de mídia paga / Investimento (ambos respondem ao filtro de período)
  const roasVal = globalStats.totalInvestment > 0 ? (globalStats.paidSalesValue / globalStats.totalInvestment) : 0;
  const prevRoasVal = globalStats.prev.totalInvestment > 0 ? (globalStats.prev.paidSalesValue / globalStats.prev.totalInvestment) : 0;
  const roas = roasVal.toFixed(2).replace('.', ',');

  // Média de compras: Global (All-time)
  const mediaComprasVal = globalStats.totalCustomers > 0 ? (globalStats.totalAdsPurchases / globalStats.totalCustomers) : 0;
  const mediaCompras = mediaComprasVal.toFixed(2).replace('.', ',');

  // ARPU global: Faturamento bruto pago / Total de clientes
  const arpuVal = globalStats.totalCustomers > 0 ? (globalStats.totalSalesValue / globalStats.totalCustomers) : 0;
  const arpu = arpuVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // LTV: ARPU * Média de compras
  const ltvVal = arpuVal * mediaComprasVal;

  const cacVal = globalStats.paidLeadsCount > 0 ? (globalStats.salesInvestment / globalStats.paidLeadsCount) : 0;

  const kpis = [
    { label: 'Investimento', value: globalStats.totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Activity, color: 'text-blue-400', diff: getDiffDisplay(globalStats.totalInvestment, globalStats.prev.totalInvestment) },
    { label: 'Faturamento total', value: globalStats.totalPeriodSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: 'text-emerald-400', diff: getDiffDisplay(globalStats.totalPeriodSalesValue, globalStats.prev.totalPeriodSalesValue) },
    { label: 'CAC', value: cacVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Activity, color: 'text-purple-400' },
    { label: 'Média de compras', value: mediaCompras, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'ROAS', value: roas, icon: Target, color: 'text-yellow-400', diff: getDiffDisplay(roasVal, prevRoasVal) },
    { label: 'Compras', value: globalStats.totalSalesCount, icon: ShoppingCart, color: 'text-rose-400', diff: getDiffDisplay(globalStats.totalSalesCount, globalStats.prev.totalSalesCount) },
    { label: 'LTV', value: ltvVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Wallet, color: 'text-cyan-400' },
    { label: 'Ticket médio', value: arpu, icon: Users, color: 'text-indigo-400' },
  ];

  const periods = [
    { id: 'hoje', label: 'Hoje' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: 'este_mes', label: 'Este mês' },
    { id: 'ultimo_mes', label: 'Último mês' },
    { id: 'este_ano', label: 'Este ano' },
    { id: 'ultimo_ano', label: 'Último ano' },
    { id: 'CUSTOM', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painel de Decisão</h2>
          <p className="text-fortis-mid text-sm">Inteligência comercial e métricas de Fase 2.</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 bg-fortis-panel border border-fortis-surface px-4 py-2 rounded-xl text-xs font-bold hover:border-fortis-brand/50 transition-all"
          >
            <Calendar size={14} className="text-fortis-brand" />
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
                    onClick={handleApplyCustom}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-fortis-panel border border-fortis-surface rounded-2xl p-6 hover:border-fortis-brand/40 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-fortis-dark ${kpi.color} group-hover:scale-110 transition-transform`}>
                <kpi.icon size={20} />
              </div>
              {kpi.diff}
            </div>
            <p className="text-fortis-mid text-[10px] font-bold uppercase tracking-[0.2em]">{kpi.label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-fortis-surface mt-4 mb-4 gap-4">
        <button
          className={`pb-3 px-2 font-bold text-sm transition-all relative ${activeTab === 'vendas' ? 'text-white' : 'text-fortis-mid hover:text-white'}`}
          onClick={() => setActiveTab('vendas')}
        >
          Vendas
          {activeTab === 'vendas' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-fortis-brand shadow-[0_0_10px_rgba(88,133,117,1)]" />}
        </button>
        <button
          className={`pb-3 px-2 font-bold text-sm transition-all relative ${activeTab === 'cac-ltv' ? 'text-white' : 'text-fortis-mid hover:text-white'}`}
          onClick={() => setActiveTab('cac-ltv')}
        >
          Retenção
          {activeTab === 'cac-ltv' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-fortis-brand shadow-[0_0_10px_rgba(88,133,117,1)]" />}
        </button>
      </div>

      {activeTab === 'vendas' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
          <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold flex items-center gap-2">
                Vendas por Período
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#588575]" />
                  <span className="text-[10px] font-black text-fortis-mid uppercase tracking-widest">Vendas</span>
                </div>
                <Calendar size={18} className="text-blue-400" />
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalStats.salesDaily} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(88, 133, 117, 0.1)' }}
                    contentStyle={{ backgroundColor: '#141F28', border: '1px solid #2B373E', borderRadius: '12px' }}
                    itemStyle={{ color: '#588575', fontWeight: 'bold' }}
                    labelStyle={{ color: '#fff', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#588575" radius={[6, 6, 0, 0]} animationDuration={2000}>
                    <LabelList
                      dataKey="count"
                      position="top"
                      fill="#a1a1aa"
                      fontSize={11}
                      fontWeight="bold"
                      formatter={(value: number) => value || ''}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Compras por UF */}
            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8">
              <h3 className="font-bold mb-8 text-sm uppercase tracking-widest text-fortis-mid">Compras por UF</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesUfData}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value"
                      animationDuration={1500}
                    >
                      {salesUfData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141F28', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value} (${((value / (totalSalesUf || 1)) * 100).toFixed(1)}%)`, 'Vendas']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {salesUfData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-fortis-mid">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compras por Origem */}
            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8">
              <h3 className="font-bold mb-8 text-sm uppercase tracking-widest text-fortis-mid">Compras por Canal</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesChannelData}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value"
                      animationDuration={1500}
                    >
                      {salesChannelData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141F28', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value} (${((value / (totalSalesChannel || 1)) * 100).toFixed(1)}%)`, 'Vendas']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {salesChannelData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-fortis-mid">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads por Status */}
            <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8">
              <h3 className="font-bold mb-8 text-sm uppercase tracking-widest text-fortis-mid">Leads por Status</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsStatusData}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value"
                      animationDuration={1500}
                    >
                      {leadsStatusData.map((d, index) => {
                        const statusColor = LEAD_STATUS_MAP[d.name as any]?.color || COLORS[index % COLORS.length];
                        return <Cell key={index} fill={statusColor} stroke="none" />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141F28', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value} (${((value / (totalLeadsStatus || 1)) * 100).toFixed(1)}%)`, 'Leads']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {leadsStatusData.map((d, i) => {
                  const statusLabel = LEAD_STATUS_MAP[d.name as any]?.label || d.name;
                  const statusColor = LEAD_STATUS_MAP[d.name as any]?.color || COLORS[i % COLORS.length];
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                        <span className="text-fortis-mid">{statusLabel}</span>
                      </div>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cac-ltv' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
          <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
            <h3 className="font-bold flex items-center gap-2 mb-8">
              CAC
              <span className="text-[10px] bg-fortis-surface px-2 py-1 rounded text-fortis-mid tracking-widest uppercase">Últimos 12 Meses</span>
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMetrics} margin={{ right: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} tickFormatter={(value) => `R$ ${value.toFixed(0)}`} width={60} />
                  <Tooltip cursor={{ fill: 'rgba(88, 133, 117, 0.1)' }} contentStyle={{ backgroundColor: '#141F28', borderColor: '#2B373E', borderRadius: '12px' }} formatter={(v: number) => [v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'CAC']} />
                  <ReferenceLine y={avgCac} stroke="#575756" strokeDasharray="3 3">
                    <Label value={`Média: R$ ${avgCac.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} position="right" fill="#F3F4F6" fontSize={11} offset={8} />
                  </ReferenceLine>
                  <Bar dataKey="cac" fill="#A78BFA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
            <h3 className="font-bold flex items-center gap-2 mb-8">
              Ticket Médio
              <span className="text-[10px] bg-fortis-surface px-2 py-1 rounded text-fortis-mid tracking-widest uppercase">Últimos 12 Meses</span>
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMetrics} margin={{ right: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} tickFormatter={(value) => `R$ ${value.toFixed(0)}`} width={60} />
                  <Tooltip cursor={{ fill: 'rgba(88, 133, 117, 0.1)' }} contentStyle={{ backgroundColor: '#141F28', borderColor: '#2B373E', borderRadius: '12px' }} formatter={(v: number) => [v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Ticket Médio']} />
                  <ReferenceLine y={avgTicket} stroke="#575756" strokeDasharray="3 3">
                    <Label value={`Média: R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} position="right" fill="#F3F4F6" fontSize={11} offset={8} />
                  </ReferenceLine>
                  <Bar dataKey="ticketMedio" fill="#34D399" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
            <h3 className="font-bold flex items-center gap-2 mb-8">
              LTV Acumulado
              <span className="text-[10px] bg-fortis-surface px-2 py-1 rounded text-fortis-mid tracking-widest uppercase">Últimos 12 Meses</span>
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMetrics} margin={{ right: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} tickFormatter={(value) => `R$ ${value.toFixed(0)}`} width={60} />
                  <Tooltip cursor={{ fill: 'rgba(88, 133, 117, 0.1)' }} contentStyle={{ backgroundColor: '#141F28', borderColor: '#2B373E', borderRadius: '12px' }} formatter={(v: number) => [v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'LTV Acumulado']} />
                  <ReferenceLine y={avgLtv} stroke="#575756" strokeDasharray="3 3">
                    <Label value={`Média: R$ ${avgLtv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} position="right" fill="#F3F4F6" fontSize={11} offset={8} />
                  </ReferenceLine>
                  <Bar dataKey="ltv" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
