
import { LeadStatus, AfterSalesStatus, UserRole } from './types';

export const COLORS = {
  brand: '#588575',
  dark: '#000000',
  surface: '#2B373E',
  panel: '#141F28',
  text: '#FFFFFF',
  textMuted: '#575756'
};

export const LEAD_STATUS_MAP: Record<LeadStatus, { label: string; color: string }> = {
  NOVO: { label: 'Lead Novo', color: '#60A5FA' },
  CONTATO: { label: 'Contato Realizado', color: '#FBBF24' },
  FOLLOW_UP: { label: 'Follow Up', color: '#A78BFA' },
  QUALIFICADO: { label: 'Qualificado', color: '#2DD4BF' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', color: '#F97316' },
  GANHO: { label: 'Ganho', color: '#34D399' },
  PERDIDO: { label: 'Perdido', color: '#F87171' },
  PRIMEIRA_COMPRA: { label: '1ª Compra', color: '#60A5FA' },
  RECORRENTE: { label: 'Recorrente', color: '#34D399' },
  VIP: { label: 'VIP', color: '#FBBF24' },
  INATIVO: { label: 'Inativo', color: '#EF4444' },
  SEM_CLASSIFICACAO: { label: 'Sem Classificação', color: '#94A3B8' }
};

export const AFTER_SALES_STATUS_MAP: Record<AfterSalesStatus, { label: string; color: string }> = {
  PRIMEIRA_COMPRA: { label: '1ª Compra', color: '#60A5FA' },
  RECORRENTE: { label: 'Recorrente', color: '#34D399' },
  VIP: { label: 'VIP', color: '#FBBF24' },
  INATIVO: { label: 'Inativo', color: '#EF4444' }
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  POS_VENDA: 'Pós-Venda'
};

export const CHANNELS = ['WhatsApp', 'Instagram', 'Site', 'Indicação', 'Telefone'];
export const ORIGINS = ['Tráfego Pago', 'Orgânico', 'Evento', 'Direto'];
export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];


export const PAID_PURCHASE_STATUSES = [
  'Pago',
  'AGUARDANDO ENVIO',
  'A ENVIAR',
  'PROBLEMAS NA ENTREGA',
  'FINALIZADO',
  'ENVIADO'
];

export const UNPAID_PURCHASE_STATUSES = [
  'AGUARDANDO PAGAMENTO',
  'PENDENTE',
  'AGUARDANDO YAPAY',
  'EM MONITORAMENTO',
  'AGUARDANDO VINDI'
];
