export type UserRole = 'admin' | 'gerente' | 'funcionario' | 'optometrista';
export type CurrencyCode = 'AOA' | 'EUR' | 'USD';
export type LanguageCode = 'pt' | 'en' | 'fr' | 'es';
export type SaasPlanId = 'gratuito' | 'basico' | 'profissional' | 'empresarial';

export interface TenantInfo {
  id: number;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  plan: SaasPlanId;
  subscriptionStatus: string;
  billingCycle: string;
  nextBillingDate: string | null;
  currency: CurrencyCode;
  language: LanguageCode;
}

export interface CurrentUser {
  id: number;
  uid: string;
  tenantId: number;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface ClientRecord {
  id: number;
  tenantId: number;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  nif: string | null;
  birthDate: string | null;
  notes: string | null;
}

export interface PrescriptionRecord {
  id: number;
  tenantId: number;
  clientId: number;
  professionalName: string;
  prescriptionDate: string;
  odSph: string;
  odCyl: string;
  odAxis: string;
  odAdd: string | null;
  oeSph: string;
  oeCyl: string;
  oeAxis: string;
  oeAdd: string | null;
  dp: string;
  lensType: string | null;
  notes: string | null;
}

export interface ProductRecord {
  id: number;
  tenantId: number;
  supplierId: number | null;
  name: string;
  code: string;
  category: string;
  brand: string;
  supplierName: string | null;
  imageUrl: string | null;
  purchasePrice: string;
  salePrice: string;
  quantity: number;
  minStock: number;
}

export interface SupplierRecord {
  id: number;
  tenantId: number;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  productsSupplied: string | null;
  pendingBalance: string;
  lastPurchaseDate: string | null;
  notes: string | null;
}

export interface SaleRecord {
  id: number;
  tenantId: number;
  clientId: number | null;
  clientName: string;
  sellerName: string;
  invoiceNumber: string;
  subtotal: string;
  discount: string;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  paymentMethod: string;
  status: string;
  saleDate: string;
  notes: string | null;
}

export interface SaleItemRecord {
  id: number;
  tenantId: number;
  saleId: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface FinancialEntryRecord {
  id: number;
  tenantId: number;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: string;
  entryDate: string;
  paymentMethod: string;
  status: string;
  referenceId: string | null;
}

export interface AppointmentRecord {
  id: number;
  tenantId: number;
  clientId: number | null;
  clientName: string;
  clientPhone: string | null;
  professionalName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: string;
  reminderSent: boolean;
  notes: string | null;
}

export interface StaffMemberRecord {
  id: number;
  tenantId: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  specialty: string | null;
  paymentMethod?: string | null;
  paymentDetails?: string | null;
  active: boolean;
}

export interface SubscriptionInvoiceRecord {
  id: number;
  tenantId: number;
  plan: string;
  amount: string;
  billingDate: string;
  paymentMethod: string;
  status: string;
  reference: string;
}

export interface ActivityLogRecord {
  id: number;
  tenantId: number;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  details: string;
  createdAt: string;
}

export interface WorkspacePayload {
  currentUser: CurrentUser;
  tenant: TenantInfo;
  clients: ClientRecord[];
  prescriptions: PrescriptionRecord[];
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  sales: SaleRecord[];
  saleItems: SaleItemRecord[];
  financialEntries: FinancialEntryRecord[];
  appointments: AppointmentRecord[];
  staff: StaffMemberRecord[];
  subscriptionInvoices: SubscriptionInvoiceRecord[];
  activityLogs: ActivityLogRecord[];
}
