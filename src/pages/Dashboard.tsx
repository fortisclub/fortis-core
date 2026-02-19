
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, Target, Activity, MoreHorizontal, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Wallet, ShoppingCart } from 'lucide-react';
import { useApp } from '../store';
import { LEAD_STATUS_MAP, PAID_PURCHASE_STATUSES } from '../constants';

const COLORS = ['#60A5FA', '#FBBF24', '#A78BFA', '#34D399', '#F87171'];

export const Dashboard: React.FC = () => {
  const { leads, globalStats, trafficInvestments, fetchGlobalStats, fetchTrafficInvestments, filters, setFilters } = useApp();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const pieData = useMemo(() => {
    return Object.entries(globalStats.ufCounts || {})
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({
        name: key,
        value
      }));
  }, [globalStats.ufCounts]);

  const totalLeadsPie = pieData.reduce((acc, curr) => acc + curr.value, 0);

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
    { label: 'Faturamento de mídia paga', value: globalStats.paidSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: 'text-emerald-400', diff: getDiffDisplay(globalStats.paidSalesValue, globalStats.prev.paidSalesValue) },
    { label: 'CAC', value: cacVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Activity, color: 'text-purple-400' },
    { label: 'Média de compras', value: mediaCompras, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'ROAS', value: roas, icon: Target, color: 'text-yellow-400', diff: getDiffDisplay(roasVal, prevRoasVal) },
    { label: 'Compras', value: globalStats.totalSalesCount, icon: ShoppingCart, color: 'text-rose-400', diff: getDiffDisplay(globalStats.totalSalesCount, globalStats.prev.totalSalesCount) },
    { label: 'LTV', value: ltvVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Wallet, color: 'text-cyan-400' },
    { label: 'ARPU', value: arpu, icon: Users, color: 'text-indigo-400' },
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

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-fortis-panel border border-fortis-surface rounded-2xl p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              Vendas por Período <span className="text-[10px] bg-fortis-brand/10 text-fortis-brand px-2 py-0.5 rounded-full uppercase">Todo período</span>
            </h3>
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalStats.salesBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B373E" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#575756' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(88, 133, 117, 0.1)' }}
                  contentStyle={{ backgroundColor: '#141F28', border: '1px solid #2B373E', borderRadius: '12px' }}
                  itemStyle={{ color: '#588575', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#588575" radius={[6, 6, 0, 0]} animationDuration={2000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8">
          <h3 className="font-bold mb-8">Leads por UF</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value"
                  animationDuration={1500}
                >
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#141F28', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value} (${((value / totalLeadsPie) * 100).toFixed(1)}%)`, 'Quantidade']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-fortis-mid">{d.name}</span>
                </div>
                <span className="font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
