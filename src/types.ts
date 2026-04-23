
export type UserRole = 'ADMIN' | 'VENDEDOR';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  lastActivity: string;
  approved?: boolean | null;
}

export interface PendingApproval {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CadenceStage {
  id: string;
  name: string;
  instructions?: string;
  delayDays?: number;
}

export interface CadenceFlow {
  id: string;
  name: string;
  description: string;
  stages: CadenceStage[];
  createdAt: string;
}

export interface CadenceTask {
  id: string;
  flowId: string;
  stageId: string;
  leadId: string;
  dueDate: string | null;
  completed: boolean;
  instructions?: string;
  lead?: import('./types').Lead;
}

export type LeadStatus = 'NOVO' | 'CONTATO' | 'FOLLOW_UP' | 'QUALIFICADO' | 'AGUARDANDO_PAGAMENTO' | 'GANHO' | 'PERDIDO' | 'PRIMEIRA_COMPRA' | 'RECORRENTE' | 'VIP' | 'INATIVO' | 'SEM_CLASSIFICACAO' | 'FINALIZADO';

export type AfterSalesStatus = 'PRIMEIRA_COMPRA' | 'RECORRENTE' | 'VIP' | 'INATIVO';


export interface LeadHistory {
  id: string;
  type: 'STATUS_CHANGE' | 'NOTE' | 'EDIT' | 'EMAIL_SENT' | 'SALE';
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  userId: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;

  status: LeadStatus;
  afterSalesStatus?: AfterSalesStatus;
  responsibleId: string;
  tags: string[];
  channel: string;
  origin: string;
  uf: string;
  notes: string;
  cpf?: string;
  address?: string;
  addressNumber?: string;
  district?: string;
  city?: string;
  createdAt: string;
  lastContactAt: string;
  lastPurchaseAt?: string;
  purchaseHistory?: { id: string; date: string; value: number; status: string }[];
  history: LeadHistory[];
  commercialActionIds?: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  leadId?: string;
  leadName?: string;
  timestamp: string;
}

export interface ConfigTag {
  id: string;
  label: string;
  color: string;
}

export interface TrafficInvestment {
  id: string;
  name: string;
  date: string;
  platform: string;
  amountSpent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  checkoutsInitiated: number;
  purchases: number;
  purchaseConversionValue: number;
  contacts: number;
  registrations: number;
  messageConversationsStarted: number;
  objective?: string;
  campaignName?: string;
  campaignId?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
  timestamp: string;
  read: boolean;
}
