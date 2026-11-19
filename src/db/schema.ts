import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nif: text('nif'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  plan: text('plan').notNull().default('profissional'),
  subscriptionStatus: text('subscription_status').notNull().default('active'),
  billingCycle: text('billing_cycle').notNull().default('monthly'),
  nextBillingDate: text('next_billing_date'),
  currency: text('currency').notNull().default('AOA'),
  language: text('language').notNull().default('pt'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('admin'),
  avatarUrl: text('avatar_url'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffMembers = pgTable('staff_members', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('funcionario'),
  specialty: text('specialty'),
  paymentMethod: text('payment_method').notNull().default('Multicaixa Express'),
  paymentDetails: text('payment_details'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  nif: text('nif'),
  birthDate: text('birth_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const prescriptions = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  clientId: integer('client_id')
    .references(() => clients.id)
    .notNull(),
  professionalName: text('professional_name').notNull(),
  prescriptionDate: text('prescription_date').notNull(),
  odSph: text('od_sph').notNull(),
  odCyl: text('od_cyl').notNull(),
  odAxis: text('od_axis').notNull(),
  odAdd: text('od_add'),
  oeSph: text('oe_sph').notNull(),
  oeCyl: text('oe_cyl').notNull(),
  oeAxis: text('oe_axis').notNull(),
  oeAdd: text('oe_add'),
  dp: text('dp').notNull(),
  lensType: text('lens_type'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  productsSupplied: text('products_supplied'),
  pendingBalance: numeric('pending_balance', { precision: 14, scale: 2 })
    .notNull()
    .default('0'),
  lastPurchaseDate: text('last_purchase_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  category: text('category').notNull(),
  brand: text('brand').notNull(),
  supplierName: text('supplier_name'),
  imageUrl: text('image_url'),
  purchasePrice: numeric('purchase_price', { precision: 14, scale: 2 }).notNull(),
  salePrice: numeric('sale_price', { precision: 14, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  clientName: text('client_name').notNull(),
  sellerName: text('seller_name').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 14, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 14, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull(),
  pendingAmount: numeric('pending_amount', { precision: 14, scale: 2 })
    .notNull()
    .default('0'),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull(),
  saleDate: text('sale_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  saleId: integer('sale_id')
    .references(() => sales.id)
    .notNull(),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
});

export const financialEntries = pgTable('financial_entries', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  entryDate: text('entry_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull().default('Confirmado'),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone'),
  professionalName: text('professional_name').notNull(),
  appointmentDate: text('appointment_date').notNull(),
  appointmentTime: text('appointment_time').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('Agendada'),
  reminderSent: boolean('reminder_sent').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptionInvoices = pgTable('subscription_invoices', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  plan: text('plan').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  billingDate: text('billing_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull(),
  reference: text('reference').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  module: text('module').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  products: many(products),
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ many }) => ({
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
}));
