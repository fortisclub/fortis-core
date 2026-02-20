
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Lead, User, ActivityLog, LeadStatus, UserRole, ConfigTag, AppNotification, LeadHistory, AfterSalesStatus, TrafficInvestment } from './types';
import { LEAD_STATUS_MAP, AFTER_SALES_STATUS_MAP, CHANNELS as INITIAL_CHANNELS, ORIGINS as INITIAL_ORIGINS, PAID_PURCHASE_STATUSES, UNPAID_PURCHASE_STATUSES } from './constants';

export interface CompanySettings {
  company_name: string;
  contact_email: string;
  address: string;
  logo_url: string;
}

import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  leads: Lead[];
  logs: ActivityLog[];
  tags: ConfigTag[];
  channels: string[];
  origins: string[];
  notifications: AppNotification[];
  activeModal: 'LEAD' | 'USER' | null;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  openModal: (modal: 'LEAD' | 'USER') => void;
  closeModal: () => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt' | 'history'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (id: string, status: LeadStatus) => Promise<void>;
  updateUser: (id: string, updates: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addNotification: (title: string, message: string, type: AppNotification['type']) => void;
  clearNotification: (id: string) => void;
  addLeadNote: (leadId: string, note: string) => Promise<void>;
  addLeadSale: (leadId: string, value: number, note?: string) => Promise<void>;
  addTag: (label: string, color?: string) => Promise<void>;
  updateTag: (id: string, label: string, color: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  addChannel: (name: string) => Promise<void>;
  updateChannel: (oldName: string, newName: string) => Promise<void>;
  removeChannel: (name: string) => Promise<void>;
  addOrigin: (name: string) => Promise<void>;
  updateOrigin: (oldName: string, newName: string) => Promise<void>;
  removeOrigin: (name: string) => Promise<void>;
  fetchLeads: (isExpanding?: boolean) => Promise<void>;
  fetchLeadHistory: (leadId: string) => Promise<LeadHistory[]>;
  fetchUsers: () => Promise<void>;
  fetchGlobalStats: (period?: string, customRange?: { start: string; end: string }) => Promise<void>;
  fetchTrafficInvestments: (period?: string, customRange?: { start: string; end: string }) => Promise<void>;
  trafficInvestments: TrafficInvestment[];
  globalStats: {
    totalLeads: number;
    totalCustomers: number;
    totalSalesValue: number;
    statusCounts: Record<string, number>;
    ufCounts: Record<string, number>;
    afterSalesCounts: Record<string, number>;
    totalInvestment: number;
    totalLandingPageViews: number;
    totalAdsPurchases: number;
    salesInvestment: number;
    paidLeadsCount: number;
    totalSalesCount: number;
    paidSalesValue: number;
    acquisitionTrend: { month: string; value: number }[];
    salesBuckets: { range: string; count: number }[];
    prev: {
      totalLeads: number;
      totalCustomers: number;
      totalSalesValue: number;
      totalInvestment: number;
      totalAdsPurchases: number;
      salesInvestment: number;
      paidLeadsCount: number;
      totalSalesCount: number;
      paidSalesValue: number;
    };
  };
  filters: {
    period: string;
    customRange: { start: string; end: string };
  };
  setFilters: (filters: Partial<AppContextType['filters']>) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  fetchAllClients: () => Promise<void>;
  companySettings: CompanySettings;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<void>;
  fetchSettings: () => Promise<void>;

}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone',

  status: 'Status',
  afterSalesStatus: 'Status de Pós-venda',
  responsibleId: 'Responsável',
  channel: 'Canal',
  origin: 'Origem',
  uf: 'UF',
  notes: 'Observações',
  cpf: 'CPF',
  address: 'Endereço',
  addressNumber: 'Número',
  district: 'Bairro',
  city: 'Cidade'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, loading } = useAuth();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeModal, setActiveModal] = useState<'LEAD' | 'USER' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [tags, setTags] = useState<ConfigTag[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [trafficInvestments, setTrafficInvestments] = useState<TrafficInvestment[]>([]);
  const [logs] = useState<ActivityLog[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: 'Fortis Clothing S.A.',
    contact_email: 'contato@fortis.clothing',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    logo_url: 'https://picsum.photos/seed/fortis/150'
  });

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (!error && data) {
      setCompanySettings({
        company_name: data.company_name,
        contact_email: data.contact_email,
        address: data.address,
        logo_url: data.logo_url
      });
    }
  }, []);

  const updateSettings = async (updates: Partial<CompanySettings>) => {
    const { error } = await supabase.from('settings').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', 1);

    if (error) {
      addNotification('Erro', 'Não foi possível salvar as configurações.', 'ERROR');
      return;
    }

    setCompanySettings(prev => ({ ...prev, ...updates }));
    addNotification('Sucesso', 'Configurações salvas com sucesso!', 'SUCCESS');
  };

  const [filters, setFiltersState] = useState({
    period: 'este_mes',
    customRange: { start: '', end: '' }
  });

  const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const leadsRef = useRef<Lead[]>([]);

  // Sincroniza o Ref com o State para uso em callbacks sem recriação
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);


  const [globalStats, setGlobalStats] = useState({
    totalLeads: 0,
    totalCustomers: 0,
    totalSalesValue: 0,
    statusCounts: {} as Record<string, number>,
    ufCounts: {} as Record<string, number>,
    afterSalesCounts: {} as Record<string, number>,
    totalInvestment: 0,
    totalLandingPageViews: 0,
    totalAdsPurchases: 0,
    salesInvestment: 0,
    paidLeadsCount: 0,
    totalSalesCount: 0,
    paidSalesValue: 0,
    acquisitionTrend: [],
    salesBuckets: [] as { range: string; count: number }[],
    prev: {
      totalLeads: 0,
      totalCustomers: 0,
      totalSalesValue: 0,
      totalInvestment: 0,
      totalAdsPurchases: 0,
      salesInvestment: 0,
      paidLeadsCount: 0,
      totalSalesCount: 0,
      paidSalesValue: 0,
    }
  });


  const fetchGlobalStats = useCallback(async (periodArg?: string, customRangeArg?: { start: string; end: string }) => {
    const period = periodArg || filters.period;
    const customRange = customRangeArg || filters.customRange;
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'CUSTOM' && customRange.start && customRange.end) {
      startDate = new Date(customRange.start);
      endDate = new Date(customRange.end);
    } else {
      switch (period) {
        case 'hoje':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'este_mes':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'ultimo_mes':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'este_ano':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        case 'ultimo_ano':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        default: startDate.setMonth(now.getMonth() - 6);
      }
    }

    // Calcular Período Anterior para Comparativo
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(endDate);
    const duration = endDate.getTime() - startDate.getTime();

    if (period === 'hoje') {
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
    } else if (period === '7d') {
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate.setDate(prevEndDate.getDate() - 7);
    } else if (period === 'este_mes' || period === 'ultimo_mes') {
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      prevEndDate.setMonth(prevEndDate.getMonth() - 1);
    } else if (period === 'este_ano' || period === 'ultimo_ano') {
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
    } else {
      prevStartDate.setTime(prevStartDate.getTime() - duration - 1000);
      prevEndDate.setTime(prevEndDate.getTime() - duration - 1000);
    }

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const pStartStr = prevStartDate.toISOString();
    const pEndStr = prevEndDate.toISOString();

    const startDateStr = startStr.split('T')[0];
    const endDateStr = endStr.split('T')[0];
    const pStartDateStr = pStartStr.split('T')[0];
    const pEndDateStr = pEndStr.split('T')[0];

    // Queries em paralelo para atual, anterior e GLOBAL
    const [
      { count: totalLeads },
      { count: prevTotalLeads },
      { data: allStatusRows },
      invRpcRes,
      prevInvRpcRes,
      purchasesPeriodRes,
      prevPurchasesPeriodRes,
      allPurchasesRes,
      allInvRpcRes,
      allPaidLeadsRes,
      periodLeadsRes
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', pStartStr).lte('created_at', pEndStr),
      supabase.from('leads').select('status, after_sales_status, created_at, origin, uf').order('created_at', { ascending: false }).limit(10000),
      supabase.rpc('get_meta_ads_investment', { start_date: startDateStr, end_date: endDateStr }),
      supabase.rpc('get_meta_ads_investment', { start_date: pStartDateStr, end_date: pEndDateStr }),
      supabase.from('lead_purchases').select('*').gte('date', startStr).lte('date', endStr).limit(10000),
      supabase.from('lead_purchases').select('*').gte('date', pStartStr).lte('date', pEndStr).limit(10000),
      supabase.from('lead_purchases').select('lead_id, value, date, lead_origin').limit(100000), // GLOBAL
      supabase.rpc('get_meta_ads_investment'), // GLOBAL
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('origin', 'Tráfego pago'), // GLOBAL
      supabase.from('leads').select('status, last_purchase_at, uf').gte('last_purchase_at', startStr).lte('last_purchase_at', endStr), // PERIOD DATA
    ]);

    // --- Processamento de Dados de Período (Charts) ---
    const sCounts: Record<string, number> = {};
    const ufCounts: Record<string, number> = {};
    const trendMap: Record<string, number> = {};
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const useDailyGrouping = diffDays <= 45;

    const periodLeads = periodLeadsRes.data || [];

    periodLeads.forEach(row => {
      const rowDate = new Date(row.last_purchase_at);

      // Trend Map
      let sortKey = useDailyGrouping ? rowDate.toISOString().split('T')[0] : `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
      trendMap[sortKey] = (trendMap[sortKey] || 0) + 1;

      // Status Counts
      if (!['PRIMEIRA_COMPRA', 'RECORRENTE', 'VIP', 'INATIVO', 'GANHO', 'FINALIZADO'].includes(row.status)) {
        const effectiveStatus = row.status === 'SEM_CLASSIFICACAO' ? 'PERDIDO' : row.status;
        sCounts[effectiveStatus] = (sCounts[effectiveStatus] || 0) + 1;
      } else {
        sCounts['GANHO'] = (sCounts['GANHO'] || 0) + 1;
      }

      // UF Counts
      if (row.uf) {
        ufCounts[row.uf] = (ufCounts[row.uf] || 0) + 1;
      }
    });

    const acquisitionTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        let label;
        if (useDailyGrouping) {
          const date = new Date(key + 'T12:00:00');
          label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
        } else {
          const [year, month] = key.split('-');
          const monthLabel = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
          label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
        }
        return { month: label, value };
      });

    // --- Processamento Global (After Sales) ---
    const asCounts: Record<string, number> = {
      'PRIMEIRA_COMPRA': 0, 'VIP': 0, 'RECORRENTE': 0, 'INATIVO': 0
    };
    const AFTER_SALES_KEYS = ['PRIMEIRA_COMPRA', 'RECORRENTE', 'VIP', 'INATIVO', 'GANHO', 'FINALIZADO'];

    if (allStatusRows) {
      allStatusRows.forEach(row => {
        const isClient = AFTER_SALES_KEYS.includes(row.status);
        if (isClient) {
          const asStatus = row.after_sales_status || (AFTER_SALES_KEYS.includes(row.status) ? row.status : 'PRIMEIRA_COMPRA');
          if (asCounts.hasOwnProperty(asStatus)) {
            asCounts[asStatus] = (asCounts[asStatus] || 0) + 1;
          } else if (row.status === 'GANHO' || row.status === 'FINALIZADO') {
            asCounts['PRIMEIRA_COMPRA'] = (asCounts['PRIMEIRA_COMPRA'] || 0) + 1;
          }
        }
      });
    }

    // === ATUAIS / PERÍODO ===
    const tInv = Number(invRpcRes.data) || 0;
    const purchasesPeriod = purchasesPeriodRes.data || [];
    const pVal = purchasesPeriod.filter(p => p.lead_origin === 'Tráfego pago').reduce((acc, p) => acc + Number(p.value), 0) || 0;
    const totalPurchasesCount = purchasesPeriod.filter(p => p.lead_origin === 'Tráfego pago').length || 0;

    // === ANTERIORES / PERÍODO ===
    const prevTInv = Number(prevInvRpcRes.data) || 0;
    const prevPurchasesPeriodResult = prevPurchasesPeriodRes.data || [];
    const prevPVal = prevPurchasesPeriodResult.filter(p => p.lead_origin === 'Tráfego pago').reduce((acc, p) => acc + Number(p.value), 0) || 0;
    const prevTotalPurchasesCount = prevPurchasesPeriodResult.filter(p => p.lead_origin === 'Tráfego pago').length || 0;

    // === GLOBAIS / ALL-TIME ===
    const allTimePurchases = allPurchasesRes.data || [];
    const allTimeRevenue = allTimePurchases.reduce((acc, p) => acc + Number(p.value), 0) || 0;
    const allTimeDistinctCustomers = new Set(allTimePurchases.map(p => p.lead_id)).size;
    const allTimePurchasesCount = allTimePurchases.length;
    const allTimeInvestment = Number(allInvRpcRes.data) || 0;
    const allTimePaidLeads = allPaidLeadsRes.count || 0;

    const buckets = [
      { range: '1 a 8', count: 0 },
      { range: '9 a 16', count: 0 },
      { range: '17 a 24', count: 0 },
      { range: '25 a 31', count: 0 }
    ];

    allTimePurchases.forEach(p => {
      const day = new Date(p.date).getUTCDate();
      if (day <= 8) buckets[0].count++;
      else if (day <= 16) buckets[1].count++;
      else if (day <= 24) buckets[2].count++;
      else buckets[3].count++;
    });

    setGlobalStats({
      totalLeads: totalLeads || 0,
      totalCustomers: allTimeDistinctCustomers,
      totalSalesValue: allTimeRevenue,
      statusCounts: sCounts,
      ufCounts,
      afterSalesCounts: asCounts,
      totalInvestment: tInv,
      totalLandingPageViews: 0,
      totalAdsPurchases: allTimePurchasesCount,
      salesInvestment: allTimeInvestment,
      paidLeadsCount: allTimePaidLeads,
      totalSalesCount: totalPurchasesCount,
      paidSalesValue: pVal,
      acquisitionTrend,
      salesBuckets: buckets,
      prev: {
        totalLeads: prevTotalLeads || 0,
        totalCustomers: allTimeDistinctCustomers,
        totalSalesValue: allTimeRevenue,
        totalInvestment: prevTInv,
        totalAdsPurchases: allTimePurchasesCount,
        salesInvestment: allTimeInvestment,
        paidLeadsCount: allTimePaidLeads,
        totalSalesCount: prevTotalPurchasesCount,
        paidSalesValue: prevPVal,
      }
    });
  }, [filters]);
  const fetchTrafficInvestments = useCallback(async (periodArg?: string, customRangeArg?: { start: string; end: string }) => {
    const period = periodArg || filters.period;
    const customRange = customRangeArg || filters.customRange;
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'CUSTOM' && customRange.start && customRange.end) {
      startDate = new Date(customRange.start);
      endDate = new Date(customRange.end);
    } else {
      switch (period) {
        case 'hoje':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'este_mes':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'ultimo_mes':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'este_ano':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'ultimo_ano':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        case '1M': startDate.setMonth(now.getMonth() - 1); break;
        case '3M': startDate.setMonth(now.getMonth() - 3); break;
        case '6M': startDate.setMonth(now.getMonth() - 6); break;
        case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
        default: startDate.setMonth(now.getMonth() - 6);
      }
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('meta_ads')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar investimentos de tráfego:', error);
      return;
    }

    if (data) {
      const mapped: TrafficInvestment[] = data.map(item => ({
        id: item.id,
        name: item.account_name || 'Meta Ads',
        date: item.date,
        platform: item.platform,
        amountSpent: Number(item.amount_spent),
        impressions: Number(item.impressions),
        reach: Number(item.reach),
        linkClicks: Number(item.link_clicks),
        landingPageViews: Number(item.landing_page_views),
        addToCart: Number(item.add_to_cart),
        checkoutsInitiated: Number(item.checkouts_initiated),
        purchases: Number(item.purchases),
        purchaseConversionValue: Number(item.purchase_conversion_value),
        contacts: Number(item.contacts),
        registrations: Number(item.registrations),
        messageConversationsStarted: Number(item.message_conversations_started),
        objective: item.objective,
        campaignName: item.campaign_name,
        campaignId: item.campaign_id,
        createdAt: item.created_at
      }));
      setTrafficInvestments(mapped);
    }
  }, [filters]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return;
    }

    if (data) {
      const mapped: User[] = data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=588575&color=fff`,
        lastActivity: u.last_activity
      }));
      setUsers(mapped);

      // Se houver um authUser, define o currentUser
      if (authUser?.email) {
        const current = mapped.find(u => u.email === authUser.email);
        if (current) setCurrentUser(current);
      }
    }
  }, [authUser]);

  const fetchLeads = useCallback(async (isExpanding = false) => {
    setIsLoadingMore(true);
    const PAGE_SIZE = 100;

    const start = isExpanding ? leadsRef.current.length : 0;
    const end = start + PAGE_SIZE - 1;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_purchases (id, value, date, status)
        `)
        .in('status', ['NOVO', 'CONTATO', 'FOLLOW_UP', 'QUALIFICADO', 'AGUARDANDO_PAGAMENTO', 'PERDIDO', 'SEM_CLASSIFICACAO'])
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('Erro ao buscar leads:', error);
        // Tenta buscar sem o join se falhar (pode ser problema de RLS ou relação)
        const { data: simpleData, error: simpleError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .range(start, end);

        if (simpleError) throw simpleError;
        if (simpleData) {
          processLeads(simpleData, isExpanding);
        }
      } else if (data) {
        processLeads(data, isExpanding);
      }
    } catch (err) {
      console.error('Erro fatal ao buscar leads:', err);
      addNotification('Erro', 'Não foi possível carregar os dados dos leads.', 'ERROR');
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  const processLeads = (data: any[], isExpanding: boolean) => {
    const mappedLeads: Lead[] = data.map(l => {
      const pHistory = l.lead_purchases || [];
      const purchaseHistory = pHistory.map((p: any) => ({
        id: String(p.id),
        date: p.date,
        value: Number(p.value),
        status: p.status || 'Pago'
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const paidPurchases = purchaseHistory.filter(p => PAID_PURCHASE_STATUSES.includes(p.status));
      const unpaidPurchases = purchaseHistory.filter(p => UNPAID_PURCHASE_STATUSES.includes(p.status));

      const totalValue = paidPurchases.reduce((acc, p) => acc + p.value, 0);
      const purchaseCount = paidPurchases.length;

      const AFTER_SALES_KEYS = ['PRIMEIRA_COMPRA', 'RECORRENTE', 'VIP', 'INATIVO'];
      let currentStatus = (l.status || 'NOVO') as LeadStatus;
      let currentAfterSalesStatus: AfterSalesStatus | undefined = l.after_sales_status as AfterSalesStatus;

      if (AFTER_SALES_KEYS.includes(l.status)) {
        currentStatus = l.status as LeadStatus;
        if (!currentAfterSalesStatus) currentAfterSalesStatus = l.status as AfterSalesStatus;
      }

      if (purchaseCount > 0) {
        const lastPurchaseDate = new Date(paidPurchases[0].date);
        const diffDays = (new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 3600 * 24);

        if (diffDays > 90) {
          currentAfterSalesStatus = 'INATIVO';
        } else if (totalValue > 1000) {
          currentAfterSalesStatus = 'VIP';
        } else if (purchaseCount > 1) {
          currentAfterSalesStatus = 'RECORRENTE';
        } else {
          currentAfterSalesStatus = 'PRIMEIRA_COMPRA';
        }
        currentStatus = currentAfterSalesStatus as LeadStatus;
      } else if (unpaidPurchases.length > 0) {
        currentStatus = 'AGUARDANDO_PAGAMENTO';
      } else if (currentStatus === 'SEM_CLASSIFICACAO' || currentStatus === 'GANHO') {
        currentStatus = 'PERDIDO';
        currentAfterSalesStatus = undefined;
      }

      return {
        id: String(l.id),
        name: l.name || 'Sem nome',
        email: l.email || '',
        phone: l.phone || '',
        status: currentStatus,
        afterSalesStatus: currentAfterSalesStatus,
        responsibleId: l.responsible_id,
        tags: Array.isArray(l.tags) ? l.tags : [],
        channel: l.channel || 'Não informado',
        origin: l.origin || 'Não informado',
        uf: l.uf || '-',
        notes: l.notes || '',
        cpf: l.cpf || '',
        address: l.address || '',
        addressNumber: l.address_number || '',
        district: l.district || '',
        city: l.city || '',
        createdAt: l.created_at,
        lastContactAt: l.last_contact_at,
        lastPurchaseAt: purchaseHistory.length > 0 ? purchaseHistory[0].date : l.last_purchase_at,
        purchaseHistory,
        history: []
      };
    });

    if (isExpanding) {
      setLeads(prev => [...prev, ...mappedLeads]);
    } else {
      setLeads(mappedLeads);
    }
    setHasMore(data.length === 100);
  };

  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      await fetchLeads(true);
    }
  }, [fetchLeads, isLoadingMore, hasMore]);

  const fetchAllClients = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const CLIENT_STATUSES = ['PRIMEIRA_COMPRA', 'RECORRENTE', 'VIP', 'INATIVO', 'GANHO', 'FINALIZADO'];

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_purchases (id, value, date, status)
        `)
        .in('status', CLIENT_STATUSES)
        .order('created_at', { ascending: false })
        .limit(2000); // Traz uma base maior de uma vez

      if (error) throw error;
      if (data) {
        processLeads(data, false);
      }
    } catch (err) {
      console.error('Erro ao buscar todos os clientes:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  const fetchLeadHistory = async (leadId: string): Promise<LeadHistory[]> => {
    // Busca histórico de atividades
    const { data: historyData, error: historyError } = await supabase
      .from('lead_history')
      .select('*')
      .eq('lead_id', leadId);

    // Busca histórico de compras/vendas
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('lead_purchases')
      .select('*')
      .eq('lead_id', leadId);

    if (historyError || purchasesError) return [];

    // Mapear atividades normais
    const mappedHistory = (historyData || []).map((h: any) => ({
      id: String(h.id),
      type: h.type as any,
      field: h.field,
      oldValue: h.old_value,
      newValue: h.new_value,
      description: h.description,
      userId: h.user_id || 'system',
      timestamp: h.created_at
    }));

    // Mapear compras como itens de histórico
    const mappedPurchases = (purchasesData || []).map((p: any) => ({
      id: `purchase-${p.id}`,
      type: 'SALE' as const,
      description: `Venda realizada no valor de ${p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      userId: 'system',
      timestamp: p.date
    }));

    // Combinar e ordenar por data decrescente
    return [...mappedHistory, ...mappedPurchases].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  useEffect(() => {
    if (loading) return; // Wait for auth to initialize

    const fetchInitialData = async () => {
      await fetchUsers();
      await fetchLeads();
      await fetchGlobalStats();
      await fetchTrafficInvestments();
      await fetchSettings();


      // Tags, Channels, Origins
      const { data: tagsData } = await supabase.from('tags').select('*');
      if (tagsData) setTags(tagsData);

      const { data: channelsData } = await supabase.from('channels').select('*');
      if (channelsData) setChannels(channelsData.map(c => c.name));

      const { data: originsData } = await supabase.from('origins').select('*');
      if (originsData) setOrigins(originsData.map(o => o.name));
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, loading]); // Executa quando o user mudar ou terminar de carregar auth

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const openModal = (modal: 'LEAD' | 'USER') => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setTimeout(() => clearNotification(newNotif.id), 5000);
  }, []);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addLead = async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt' | 'history'>) => {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        name: newLeadData.name,
        email: newLeadData.email,
        phone: newLeadData.phone,
        status: newLeadData.status,
        after_sales_status: newLeadData.afterSalesStatus,
        responsible_id: newLeadData.responsibleId,
        tags: newLeadData.tags,
        channel: newLeadData.channel,
        origin: newLeadData.origin,
        uf: newLeadData.uf,
        notes: newLeadData.notes,
        cpf: newLeadData.cpf,
        address: newLeadData.address,
        address_number: newLeadData.addressNumber,
        district: newLeadData.district,
        city: newLeadData.city
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lead:', error);
      addNotification('Erro', `Não foi possível criar o lead: ${error.message}`, 'ERROR');
      return;
    }

    if (data) {
      await supabase.from('lead_history').insert([{
        lead_id: data.id,
        type: 'NOTE',
        description: 'Lead cadastrado no ecossistema Fortis.',
        user_id: currentUser?.id
      }]);
      await fetchLeads();
      addNotification('Sucesso', 'Lead criado com sucesso!', 'SUCCESS');
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const dataUpdates: any = {};
    if (updates.name !== undefined) dataUpdates.name = updates.name;
    if (updates.email !== undefined) dataUpdates.email = updates.email;
    if (updates.phone !== undefined) dataUpdates.phone = updates.phone;
    if (updates.status !== undefined) dataUpdates.status = updates.status;
    if (updates.afterSalesStatus !== undefined) dataUpdates.after_sales_status = updates.afterSalesStatus;
    if (updates.responsibleId !== undefined) dataUpdates.responsible_id = updates.responsibleId;
    if (updates.tags !== undefined) dataUpdates.tags = updates.tags;
    if (updates.channel !== undefined) dataUpdates.channel = updates.channel;
    if (updates.origin !== undefined) dataUpdates.origin = updates.origin;
    if (updates.uf !== undefined) dataUpdates.uf = updates.uf;
    if (updates.notes !== undefined) dataUpdates.notes = updates.notes;
    if (updates.cpf !== undefined) dataUpdates.cpf = updates.cpf;
    if (updates.address !== undefined) dataUpdates.address = updates.address;
    if (updates.addressNumber !== undefined) dataUpdates.address_number = updates.addressNumber;
    if (updates.district !== undefined) dataUpdates.district = updates.district;
    if (updates.city !== undefined) dataUpdates.city = updates.city;

    const { error } = await supabase.from('leads').update(dataUpdates).eq('id', id);

    if (error) {
      console.error('Erro ao atualizar lead:', error);
      addNotification('Erro', `Não foi possível atualizar o lead: ${error.message}`, 'ERROR');
      return;
    }

    const historyEntries: any[] = [];
    Object.keys(updates).forEach(key => {
      const k = key as keyof Lead;
      const ignored = ['history', 'purchaseHistory', 'tags', 'lastContactAt', 'lastPurchaseAt'];
      if (!ignored.includes(k) && updates[k] !== (lead as any)[k]) {
        historyEntries.push({
          lead_id: id,
          type: 'EDIT',
          field: k,
          old_value: String((lead as any)[k] || 'Nenhum'),
          new_value: String(updates[k]),
          description: `Alterou ${FIELD_LABELS[k] || k}`,
          user_id: currentUser?.id
        });
      }
    });

    if (historyEntries.length > 0) {
      await supabase.from('lead_history').insert(historyEntries);
    }
    await fetchLeads();
  };

  const moveLead = async (id: string, status: LeadStatus) => {
    await updateLead(id, { status });
    addNotification('Movimentação', `Lead movido para ${LEAD_STATUS_MAP[status].label}`, 'INFO');
  };

  const addLeadNote = async (leadId: string, note: string) => {
    const { error } = await supabase.from('lead_history').insert([{
      lead_id: leadId,
      type: 'NOTE',
      description: note,
      user_id: currentUser?.id
    }]);
    if (!error) await fetchLeads();
  };

  const addLeadSale = async (leadId: string, value: number, note?: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const now = new Date().toISOString();
    const newTotalValue = (lead.purchaseHistory || []).reduce((acc, p) => acc + p.value, 0) + value;
    const newPurchaseCount = (lead.purchaseHistory?.length || 0) + 1;

    await supabase.from('lead_purchases').insert([{ lead_id: leadId, value, date: now, status: 'Pago' }]);
    await supabase.from('leads').update({ status: 'GANHO', last_purchase_at: now }).eq('id', leadId);
    await supabase.from('lead_history').insert([{
      lead_id: leadId,
      type: 'SALE',
      description: `Venda realizada no valor de ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      user_id: currentUser?.id
    }]);

    await fetchLeads();
    addNotification('Venda', 'Venda registrada e status de pós-venda atualizado.', 'SUCCESS');
  };

  const addTag = async (label: string, color: string = '#588575') => {
    const { data, error } = await supabase.from('tags').insert([{ label, color }]).select();
    if (!error && data) setTags(prev => [...prev, data[0]]);
  };

  const updateTag = async (id: string, label: string, color: string) => {
    const { error } = await supabase.from('tags').update({ label, color }).eq('id', id);
    if (!error) setTags(prev => prev.map(t => t.id === id ? { ...t, label, color } : t));
  };

  const removeTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (!error) setTags(prev => prev.filter(t => t.id !== id));
  };

  const addChannel = async (name: string) => {
    if (!channels.includes(name)) {
      const { error } = await supabase.from('channels').insert([{ name }]);
      if (!error) setChannels(prev => [...prev, name]);
    }
  };

  const updateChannel = async (oldName: string, newName: string) => {
    const { error } = await supabase.from('channels').update({ name: newName }).eq('name', oldName);
    if (!error) setChannels(prev => prev.map(c => c === oldName ? newName : c));
  };

  const removeChannel = async (name: string) => {
    const { error } = await supabase.from('channels').delete().eq('name', name);
    if (!error) setChannels(prev => prev.filter(c => c !== name));
  };

  const addOrigin = async (name: string) => {
    if (!origins.includes(name)) {
      const { error } = await supabase.from('origins').insert([{ name }]);
      if (!error) setOrigins(prev => [...prev, name]);
    }
  };

  const updateOrigin = async (oldName: string, newName: string) => {
    const { error } = await supabase.from('origins').update({ name: newName }).eq('name', oldName);
    if (!error) setOrigins(prev => prev.map(o => o === oldName ? newName : o));
  };

  const removeOrigin = async (name: string) => {
    const { error } = await supabase.from('origins').delete().eq('name', name);
    if (!error) setOrigins(prev => prev.filter(o => o !== name));
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id));
      addNotification('Removido', 'Lead excluído com sucesso.', 'INFO');
    }
  };

  const updateUser = async (id: string, updates: any) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);

    if (error) {
      addNotification('Erro', 'Não foi possível atualizar o usuário.', 'ERROR');
      return;
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addNotification('Atualizado', 'Usuário atualizado com sucesso.', 'SUCCESS');
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      addNotification('Erro', 'Não foi possível excluir o usuário.', 'ERROR');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    addNotification('Removido', 'Usuário excluído com sucesso.', 'INFO');
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, leads, logs, tags, channels, origins, notifications,
      activeModal, isSidebarCollapsed, toggleSidebar, openModal, closeModal,
      addLead, updateLead, deleteLead, moveLead, updateUser, deleteUser, addNotification, clearNotification, addLeadNote, addLeadSale,
      addTag, updateTag, removeTag, addChannel, updateChannel, removeChannel, addOrigin, updateOrigin, removeOrigin, fetchLeads, fetchUsers, fetchLeadHistory, fetchGlobalStats, fetchTrafficInvestments,
      globalStats, hasMore, isLoadingMore, loadMore, fetchAllClients, trafficInvestments,
      filters, setFilters,
      companySettings, updateSettings, fetchSettings
    }}>

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
