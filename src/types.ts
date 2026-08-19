export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pago' | 'pendente';

export interface Transaction {
  id: string;
  date: string;       // YYYY-MM-DD
  month: string;      // E.g., 'Janeiro', 'Fevereiro', etc.
  payer: string;      // Payer or Payee / Associado / Fornecedor
  bank: string;       // Bank name
  value: number;      // Amount in R$
  type: TransactionType;
  category: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentUrl?: string; // Data URL ou imagem do comprovante para visualização e conferência
  associateId?: string; // Vinculo com associado se houver
  eventId?: string;     // Vinculo com evento/projeto se houver
}

export interface ExtractionResult {
  pagador: string;
  banco: string;
  valor: number;
  data: string;
  mes: string;
  tipo: TransactionType;
  categoria: string;
  descricao: string;
}

export type AssociateStatus = 'ativo' | 'inativo' | 'inadimplente' | 'pendente';
export type AssociateCategory = 'Membro Efetivo' | 'Membro Doador' | 'Membro Honorário' | 'Estudante / Especial' | 'Voluntário';

export type ExemptionType = 'temporaria' | 'permanente' | 'premiacao' | 'ajuda_social' | 'diretoria' | 'outro';

export interface ExemptionInfo {
  isExempt: boolean;
  type: ExemptionType;
  monthsTotal?: number;         // Duração em meses (ex: 3, 6, 12)
  monthsRemaining?: number;      // Meses restantes
  startDate?: string;           // Data inicial
  endDate?: string;             // Data final ou mês limite (ex: "2026-12-31" ou "DEZ/2026")
  reason: string;               // Motivo (ex: "Premiação de Destaque", "Ajuda Social / Apoio Emergencial", "Cargo de Diretoria")
  grantedBy?: string;           // Concedido por (ex: "Diretoria Executiva AIAPE")
  grantedAt?: string;           // Data da concessão (YYYY-MM-DD)
  notes?: string;               // Observações adicionais
}

export interface AssociateDocuments {
  cnhName?: string;
  cnhUrl?: string;
  crlvName?: string;
  crlvUrl?: string;
  senatranName?: string;
  senatranUrl?: string;
}

export interface Associate {
  id: string;
  name: string;
  document: string;      // CPF or CNPJ
  email: string;
  phone: string;
  address?: string;
  category: AssociateCategory;
  status: AssociateStatus;
  monthlyFee: number;     // Valor da mensalidade em R$
  dueDay: number;        // Dia de vencimento (ex: 10)
  membershipDate: string; // YYYY-MM-DD
  birthDate?: string;    // YYYY-MM-DD or MM-DD for birthday tracking
  password?: string;     // Password for Portal do Associado login
  photoUrl?: string;     // Foto 3x4 do Associado para Carteirinha
  senatranCredential?: string; // Número da Credencial de Instrutor SENATRAN / DETRAN
  cnhCategory?: string;  // Categoria CNH (ex: AB, AD, AE, B, etc.)
  registrationNumber?: string; // Matrícula Oficial AIAPE
  validityDate?: string; // Validade da Carteira
  isExempt?: boolean;    // Flag indicando se o associado está isento de pagar taxa
  exemptionInfo?: ExemptionInfo; // Detalhes completos da isenção concedida pela diretoria
  notes?: string;
  documents?: AssociateDocuments;
  lastPaymentDate?: string;
  lastPaymentMonth?: string;
}

export type RequestType = 
  | 'emprestimo' 
  | 'declaracao' 
  | 'juridico' 
  | 'carteirinha' 
  | 'duvida_sugestao' 
  | 'outros';

export type RequestStatus = 'pendente' | 'em_analise' | 'aprovado' | 'concluido' | 'recusado';

export interface AssociateRequest {
  id: string;
  associateId: string;
  associateName: string;
  associateDocument?: string;
  associatePhone?: string;
  type: RequestType | string;
  title: string;
  description: string;
  amountRequested?: number;
  status: RequestStatus;
  createdAt?: string;
  date?: string;
  responseNote?: string;
}

export interface BenefitPartner {
  id: string;
  name: string;
  category: 'emprestimo' | 'saude' | 'veicular' | 'juridico' | 'educacao' | 'combustivel';
  discountText: string;
  description: string;
  iconName: string;
  contactUrl?: string;
  badge?: string;
}

export interface AssociationEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  targetAmount: number;
  status: 'planejado' | 'em_andamento' | 'concluido' | 'cancelado';
}

export interface AssociationConfig {
  name: string;
  cnpj?: string;
  president: string;
  treasurer: string;
  email: string;
  phone: string;
  address: string;
  defaultMonthlyFee: number;
  defaultDueDay: number;
  primaryBank: string;
  pixKey?: string;
  pixCopiaCola?: string;
  pixQrCodeImageUrl?: string;
  financePin?: string;
  logoUrl?: string;
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const;

export const CATEGORIES = [
  'Mensalidades de Associados',
  'Doações e Patrocínios',
  'Eventos e Arrecadação',
  'Subvenções e Parcerias',
  'Aluguel e Sede Social',
  'Serviços e Utilidades',
  'Projetos e Ações Sociais',
  'Contabilidade e Jurídico',
  'Impostos e Taxas',
  'Suprimentos de Escritório',
  'Outros'
] as const;

export const BANKS = [
  'Nubank',
  'Itaú',
  'Bradesco',
  'Banco do Brasil',
  'Caixa Econômica',
  'Santander',
  'Inter',
  'C6 Bank',
  'Sicoob',
  'Sicredi',
  'Outros'
] as const;
