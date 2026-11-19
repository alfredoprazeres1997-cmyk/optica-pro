import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  activityLogs,
  appointments,
  clients,
  financialEntries,
  prescriptions,
  products,
  saleItems,
  sales,
  staffMembers,
  subscriptionInvoices,
  suppliers,
  tenants,
  users,
} from './schema.ts';

export async function logActivity(params: {
  tenantId: number;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  details: string;
}) {
  try {
    await db.insert(activityLogs).values(params);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

export async function getTenantWorkspace(tenantId: number) {
  try {
    const [
      tenantRows,
      clientRows,
      prescriptionRows,
      productRows,
      supplierRows,
      saleRows,
      saleItemRows,
      financeRows,
      appointmentRows,
      staffRows,
      invoiceRows,
      logRows,
    ] = await Promise.all([
      db.select().from(tenants).where(eq(tenants.id, tenantId)),
      db.select().from(clients).where(eq(clients.tenantId, tenantId)).orderBy(desc(clients.id)),
      db.select().from(prescriptions).where(eq(prescriptions.tenantId, tenantId)).orderBy(desc(prescriptions.id)),
      db.select().from(products).where(eq(products.tenantId, tenantId)).orderBy(desc(products.id)),
      db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId)).orderBy(desc(suppliers.id)),
      db.select().from(sales).where(eq(sales.tenantId, tenantId)).orderBy(desc(sales.id)),
      db.select().from(saleItems).where(eq(saleItems.tenantId, tenantId)),
      db.select().from(financialEntries).where(eq(financialEntries.tenantId, tenantId)).orderBy(desc(financialEntries.id)),
      db.select().from(appointments).where(eq(appointments.tenantId, tenantId)).orderBy(desc(appointments.id)),
      db.select().from(staffMembers).where(eq(staffMembers.tenantId, tenantId)).orderBy(desc(staffMembers.id)),
      db.select().from(subscriptionInvoices).where(eq(subscriptionInvoices.tenantId, tenantId)).orderBy(desc(subscriptionInvoices.id)),
      db.select().from(activityLogs).where(eq(activityLogs.tenantId, tenantId)).orderBy(desc(activityLogs.id)).limit(40),
    ]);

    return {
      tenant: tenantRows[0] || null,
      clients: clientRows,
      prescriptions: prescriptionRows,
      products: productRows,
      suppliers: supplierRows,
      sales: saleRows,
      saleItems: saleItemRows,
      financialEntries: financeRows,
      appointments: appointmentRows,
      staff: staffRows,
      subscriptionInvoices: invoiceRows,
      activityLogs: logRows,
    };
  } catch (error) {
    console.error('Database query failed in getTenantWorkspace:', error);
    throw new Error('Falha ao carregar os dados da óptica. Tente novamente.', {
      cause: error,
    });
  }
}

export async function createClientRecord(
  tenantId: number,
  data: {
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
    nif?: string;
    birthDate?: string;
    notes?: string;
  }
) {
  try {
    const [created] = await db
      .insert(clients)
      .values({ ...data, tenantId })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating client:', error);
    throw new Error('Não foi possível registar o cliente.', { cause: error });
  }
}

export async function updateClientRecord(
  tenantId: number,
  clientId: number,
  data: Partial<{
    fullName: string;
    phone: string;
    email: string;
    address: string;
    nif: string;
    birthDate: string;
    notes: string;
  }>
) {
  try {
    const [updated] = await db
      .update(clients)
      .set(data)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error updating client:', error);
    throw new Error('Não foi possível actualizar o cliente.', { cause: error });
  }
}

export async function createPrescriptionRecord(
  tenantId: number,
  data: {
    clientId: number;
    professionalName: string;
    prescriptionDate: string;
    odSph: string;
    odCyl: string;
    odAxis: string;
    odAdd?: string;
    oeSph: string;
    oeCyl: string;
    oeAxis: string;
    oeAdd?: string;
    dp: string;
    lensType?: string;
    notes?: string;
  }
) {
  try {
    const clientCheck = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, data.clientId), eq(clients.tenantId, tenantId)));
    if (!clientCheck[0]) {
      throw new Error('Cliente não pertence a esta óptica.');
    }
    const [created] = await db
      .insert(prescriptions)
      .values({ ...data, tenantId })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating prescription:', error);
    throw new Error('Não foi possível registar a receita oftalmológica.', {
      cause: error,
    });
  }
}

export async function createProductRecord(
  tenantId: number,
  data: {
    supplierId?: number | null;
    name: string;
    code: string;
    category: string;
    brand: string;
    supplierName?: string;
    imageUrl?: string;
    purchasePrice: string;
    salePrice: string;
    quantity: number;
    minStock: number;
  }
) {
  try {
    const [created] = await db
      .insert(products)
      .values({ ...data, tenantId })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating product:', error);
    throw new Error('Não foi possível registar o produto.', { cause: error });
  }
}

export async function updateProductRecord(
  tenantId: number,
  productId: number,
  data: Partial<{
    name: string;
    code: string;
    category: string;
    brand: string;
    supplierName: string;
    imageUrl: string;
    purchasePrice: string;
    salePrice: string;
    quantity: number;
    minStock: number;
  }>
) {
  try {
    const [updated] = await db
      .update(products)
      .set(data)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error updating product:', error);
    throw new Error('Não foi possível actualizar o produto.', { cause: error });
  }
}

export async function deleteProductRecord(tenantId: number, productId: number) {
  try {
    await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
  } catch (error) {
    console.error('Database error deleting product:', error);
    throw new Error('Não foi possível remover o produto.', { cause: error });
  }
}

export async function createSaleTransaction(
  tenantId: number,
  data: {
    clientId?: number | null;
    clientName: string;
    sellerName: string;
    discount: number;
    paidAmount: number;
    paymentMethod: string;
    saleDate: string;
    notes?: string;
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }
) {
  try {
    return await db.transaction(async (tx) => {
      const subtotal = data.items.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0
      );
      const total = Math.max(0, subtotal - data.discount);
      const paid = Math.min(total, Math.max(0, data.paidAmount));
      const pending = Math.max(0, total - paid);
      const status = pending <= 0 ? 'Pago' : paid > 0 ? 'Parcial' : 'Pendente';
      const invoiceNumber = `FT-${new Date().getFullYear()}-${String(
        Math.floor(1000 + Math.random() * 9000)
      )}`;

      const [sale] = await tx
        .insert(sales)
        .values({
          tenantId,
          clientId: data.clientId ?? null,
          clientName: data.clientName,
          sellerName: data.sellerName,
          invoiceNumber,
          subtotal: subtotal.toFixed(2),
          discount: data.discount.toFixed(2),
          total: total.toFixed(2),
          paidAmount: paid.toFixed(2),
          pendingAmount: pending.toFixed(2),
          paymentMethod: data.paymentMethod,
          status,
          saleDate: data.saleDate,
          notes: data.notes,
        })
        .returning();

      for (const item of data.items) {
        await tx.insert(saleItems).values({
          tenantId,
          saleId: sale.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: (item.quantity * item.unitPrice).toFixed(2),
        });

        const existingProduct = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.tenantId, tenantId)));

        if (existingProduct[0]) {
          const newQty = Math.max(0, existingProduct[0].quantity - item.quantity);
          await tx
            .update(products)
            .set({ quantity: newQty })
            .where(and(eq(products.id, item.productId), eq(products.tenantId, tenantId)));
        }
      }

      if (paid > 0) {
        await tx.insert(financialEntries).values({
          tenantId,
          type: 'receita',
          category: 'Vendas Ópticas',
          description: `Recebimento ${invoiceNumber} (${data.clientName})`,
          amount: paid.toFixed(2),
          entryDate: data.saleDate,
          paymentMethod: data.paymentMethod,
          status: 'Confirmado',
          referenceId: invoiceNumber,
        });
      }

      return sale;
    });
  } catch (error) {
    console.error('Database error creating sale:', error);
    throw new Error('Não foi possível concluir a venda.', { cause: error });
  }
}

export async function settleSalePayment(
  tenantId: number,
  saleId: number,
  amountToPay: number,
  paymentMethod: string
) {
  try {
    return await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(sales)
        .where(and(eq(sales.id, saleId), eq(sales.tenantId, tenantId)));
      const sale = rows[0];
      if (!sale) throw new Error('Venda não encontrada.');

      const total = Number(sale.total);
      const currentPaid = Number(sale.paidAmount);
      const newPaid = Math.min(total, currentPaid + amountToPay);
      const newPending = Math.max(0, total - newPaid);
      const newStatus = newPending <= 0 ? 'Pago' : 'Parcial';

      const [updated] = await tx
        .update(sales)
        .set({
          paidAmount: newPaid.toFixed(2),
          pendingAmount: newPending.toFixed(2),
          status: newStatus,
        })
        .where(and(eq(sales.id, saleId), eq(sales.tenantId, tenantId)))
        .returning();

      await tx.insert(financialEntries).values({
        tenantId,
        type: 'receita',
        category: 'Liquidação de Venda',
        description: `Liquidação ${sale.invoiceNumber} (${sale.clientName})`,
        amount: amountToPay.toFixed(2),
        entryDate: new Date().toISOString().slice(0, 10),
        paymentMethod,
        status: 'Confirmado',
        referenceId: sale.invoiceNumber,
      });

      return updated;
    });
  } catch (error) {
    console.error('Database error settling sale:', error);
    throw new Error('Não foi possível registar o pagamento.', { cause: error });
  }
}

export async function createFinancialEntryRecord(
  tenantId: number,
  data: {
    type: string;
    category: string;
    description: string;
    amount: string;
    entryDate: string;
    paymentMethod: string;
    status: string;
    referenceId?: string;
  }
) {
  try {
    const [created] = await db
      .insert(financialEntries)
      .values({ ...data, tenantId })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating financial entry:', error);
    throw new Error('Não foi possível registar o lançamento financeiro.', {
      cause: error,
    });
  }
}

export async function createAppointmentRecord(
  tenantId: number,
  data: {
    clientId?: number | null;
    clientName: string;
    clientPhone?: string;
    professionalName: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    status?: string;
    notes?: string;
  }
) {
  try {
    const [created] = await db
      .insert(appointments)
      .values({ ...data, tenantId, status: data.status || 'Agendada' })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating appointment:', error);
    throw new Error('Não foi possível agendar a consulta.', { cause: error });
  }
}

export async function updateAppointmentRecord(
  tenantId: number,
  appointmentId: number,
  data: Partial<{ status: string; reminderSent: boolean; notes: string }>
) {
  try {
    const [updated] = await db
      .update(appointments)
      .set(data)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.tenantId, tenantId)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error updating appointment:', error);
    throw new Error('Não foi possível actualizar a consulta.', { cause: error });
  }
}

export async function createSupplierRecord(
  tenantId: number,
  data: {
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: string;
    productsSupplied?: string;
    pendingBalance?: string;
    lastPurchaseDate?: string;
    notes?: string;
  }
) {
  try {
    const [created] = await db
      .insert(suppliers)
      .values({ ...data, tenantId })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating supplier:', error);
    throw new Error('Não foi possível registar o fornecedor.', { cause: error });
  }
}

export async function updateSupplierBalance(
  tenantId: number,
  supplierId: number,
  pendingBalance: string
) {
  try {
    const [updated] = await db
      .update(suppliers)
      .set({ pendingBalance })
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error updating supplier:', error);
    throw new Error('Não foi possível actualizar o saldo do fornecedor.', {
      cause: error,
    });
  }
}

export async function createStaffRecord(
  tenantId: number,
  data: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    specialty?: string;
    paymentMethod?: string;
    paymentDetails?: string;
  }
) {
  try {
    const [created] = await db
      .insert(staffMembers)
      .values({ ...data, tenantId, active: true })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error creating staff member:', error);
    throw new Error('Não foi possível adicionar o membro da equipa.', {
      cause: error,
    });
  }
}

export async function updateStaffRecord(
  tenantId: number,
  staffId: number,
  data: Partial<{ role: string; active: boolean; specialty: string }>
) {
  try {
    const [updated] = await db
      .update(staffMembers)
      .set(data)
      .where(and(eq(staffMembers.id, staffId), eq(staffMembers.tenantId, tenantId)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error updating staff:', error);
    throw new Error('Não foi possível actualizar o colaborador.', { cause: error });
  }
}

export async function updateTenantSettings(
  tenantId: number,
  data: Partial<{
    name: string;
    nif: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    plan: string;
    billingCycle: string;
    currency: string;
    language: string;
  }>
) {
  try {
    const [updated] = await db
      .update(tenants)
      .set(data)
      .where(eq(tenants.id, tenantId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error updating tenant:', error);
    throw new Error('Não foi possível actualizar as configurações da óptica.', {
      cause: error,
    });
  }
}

export async function recordSubscriptionPayment(
  tenantId: number,
  plan: string,
  amount: string,
  paymentMethod: string
) {
  try {
    return await db.transaction(async (tx) => {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);

      const [updatedTenant] = await tx
        .update(tenants)
        .set({
          plan,
          subscriptionStatus: 'active',
          nextBillingDate: nextDate.toISOString().slice(0, 10),
        })
        .where(eq(tenants.id, tenantId))
        .returning();

      const [invoice] = await tx
        .insert(subscriptionInvoices)
        .values({
          tenantId,
          plan,
          amount,
          billingDate: new Date().toISOString().slice(0, 10),
          paymentMethod,
          status: 'Pago',
          reference: `SAAS-${Date.now().toString().slice(-6)}`,
        })
        .returning();

      return { tenant: updatedTenant, invoice };
    });
  } catch (error) {
    console.error('Database error updating subscription:', error);
    throw new Error('Não foi possível processar a subscrição SaaS.', {
      cause: error,
    });
  }
}

export async function updateUserRoleForSession(uid: string, role: string) {
  try {
    const [updated] = await db
      .update(users)
      .set({ role })
      .where(eq(users.uid, uid))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error switching role:', error);
    throw new Error('Não foi possível alterar o nível de acesso.', {
      cause: error,
    });
  }
}
