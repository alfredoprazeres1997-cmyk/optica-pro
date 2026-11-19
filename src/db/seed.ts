import { eq } from 'drizzle-orm';
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

function isoDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

export async function bootstrapUserTenant(params: {
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.uid, params.uid));

  if (existing[0] && existing[0].tenantId) {
    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, existing[0].tenantId));
    return {
      user: existing[0],
      tenant: tenantRows[0],
      isNew: false,
    };
  }

  const today = isoDateOffset(0);
  const yesterday = isoDateOffset(-1);
  const twoDaysAgo = isoDateOffset(-2);
  const fiveDaysAgo = isoDateOffset(-5);
  const tenDaysAgo = isoDateOffset(-10);
  const tomorrow = isoDateOffset(1);
  const inTwoDays = isoDateOffset(2);
  const nextMonth = isoDateOffset(30);

  // Create isolated tenant for this user
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Óptica Visão Clara — Luanda',
      nif: '5417290381',
      email: params.email,
      phone: '+244 923 410 850',
      address: 'Av. Comandante Valódia, Nº 148, Maculusso',
      city: 'Luanda',
      plan: 'profissional',
      subscriptionStatus: 'active',
      billingCycle: 'monthly',
      nextBillingDate: nextMonth,
      currency: 'AOA',
      language: 'pt',
    })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      uid: params.uid,
      tenantId: tenant.id,
      name: params.name || 'Administrador Óptica',
      email: params.email,
      phone: '+244 923 410 850',
      role: 'admin',
      avatarUrl:
        params.avatarUrl || '/src/assets/images/avatar_optometrist_1795086401526.jpg',
      active: true,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: params.email,
        name: params.name || 'Administrador Óptica',
        tenantId: tenant.id,
      },
    })
    .returning();

  // Seed staff team
  await db.insert(staffMembers).values([
    {
      tenantId: tenant.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: '+244 923 410 850',
      role: 'admin',
      specialty: 'Direcção Geral',
      active: true,
    },
    {
      tenantId: tenant.id,
      name: 'Dra. Helena Mendonça',
      email: 'helena.optometria@opticavisaoclara.ao',
      phone: '+244 924 881 200',
      role: 'optometrista',
      specialty: 'Optometria Clínica & Contactologia',
      active: true,
    },
    {
      tenantId: tenant.id,
      name: 'Carlos Domingos',
      email: 'carlos.gerencia@opticavisaoclara.ao',
      phone: '+244 931 540 112',
      role: 'gerente',
      specialty: 'Gestão Comercial e Stock',
      active: true,
    },
    {
      tenantId: tenant.id,
      name: 'Beatriz Mateus',
      email: 'beatriz.vendas@opticavisaoclara.ao',
      phone: '+244 912 770 430',
      role: 'funcionario',
      specialty: 'Atendimento & Aconselhamento Óptico',
      active: true,
    },
  ]);

  // Seed suppliers
  const insertedSuppliers = await db
    .insert(suppliers)
    .values([
      {
        tenantId: tenant.id,
        name: 'Luxottica Distribuição Atlântico',
        contactPerson: 'André Ferreira',
        phone: '+244 222 394 110',
        email: 'encomendas@luxottica-ao.com',
        address: 'Zona Económica Especial, Viana, Luanda',
        productsSupplied: 'Armações titânio, óculos de sol polarizados',
        pendingBalance: '420000.00',
        lastPurchaseDate: fiveDaysAgo,
        notes: 'Prazo de pagamento 30 dias via transferência bancária.',
      },
      {
        tenantId: tenant.id,
        name: 'Zeiss & Essilor Lentes África',
        contactPerson: 'Mariana Costa',
        phone: '+244 928 119 450',
        email: 'laboratorio@lens-africa.ao',
        address: 'Talatona Business Park, Bloco B',
        productsSupplied: 'Lentes oftálmicas progressivas, anti-reflexo, filtros luz azul',
        pendingBalance: '185000.00',
        lastPurchaseDate: twoDaysAgo,
        notes: 'Entrega expressa de receitas em 48h.',
      },
      {
        tenantId: tenant.id,
        name: 'Alcon & BioCare Angola',
        contactPerson: 'João Tavares',
        phone: '+244 925 603 812',
        email: 'comercial@biocare.ao',
        address: 'Rua Rei Katyavala, Ingombota',
        productsSupplied: 'Lentes de contacto diárias, soluções estéreis, acessórios',
        pendingBalance: '0.00',
        lastPurchaseDate: tenDaysAgo,
        notes: 'Conta regularizada.',
      },
    ])
    .returning();

  // Seed products
  const insertedProducts = await db
    .insert(products)
    .values([
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[0].id,
        name: 'Armação Titânio Executivo Navy',
        code: 'ARM-TI-001',
        category: 'Armações',
        brand: 'Silhouette Pro',
        supplierName: insertedSuppliers[0].name,
        imageUrl: '/src/assets/images/eyewear_titanium_frame_1795086400951.jpg',
        purchasePrice: '48000.00',
        salePrice: '115000.00',
        quantity: 18,
        minStock: 5,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[0].id,
        name: 'Armação Acetato Tartaruga Clássica',
        code: 'ARM-AC-014',
        category: 'Armações',
        brand: 'Masunaga Studio',
        supplierName: insertedSuppliers[0].name,
        imageUrl: '/src/assets/images/eyewear_acetate_frame_1795086401024.jpg',
        purchasePrice: '36000.00',
        salePrice: '89000.00',
        quantity: 3,
        minStock: 5,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[0].id,
        name: 'Óculos de Sol Polarizados Aura Navy',
        code: 'SOL-PL-022',
        category: 'Óculos de sol',
        brand: 'Aura Eyewear',
        supplierName: insertedSuppliers[0].name,
        imageUrl: '/src/assets/images/eyewear_polarized_sunglasses_1795086401259.jpg',
        purchasePrice: '42000.00',
        salePrice: '98000.00',
        quantity: 12,
        minStock: 4,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[1].id,
        name: 'Lentes Progressivas 1.67 Anti-Reflexo BlueCut',
        code: 'LEN-PR-105',
        category: 'Lentes oftálmicas',
        brand: 'Essilor Varilux',
        supplierName: insertedSuppliers[1].name,
        imageUrl: '/src/assets/images/eyewear_titanium_frame_1795086400951.jpg',
        purchasePrice: '55000.00',
        salePrice: '145000.00',
        quantity: 22,
        minStock: 6,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[1].id,
        name: 'Lentes Monofocais Asféricas 1.56 UV400',
        code: 'LEN-MF-088',
        category: 'Lentes oftálmicas',
        brand: 'Zeiss ClearView',
        supplierName: insertedSuppliers[1].name,
        imageUrl: '/src/assets/images/eyewear_acetate_frame_1795086401024.jpg',
        purchasePrice: '18000.00',
        salePrice: '48000.00',
        quantity: 4,
        minStock: 8,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[2].id,
        name: 'Lentes de Contacto Hidrogel Diárias (Caixa 30)',
        code: 'CNT-HY-300',
        category: 'Lentes de contacto',
        brand: 'AquaClea Daily',
        supplierName: insertedSuppliers[2].name,
        imageUrl: '/src/assets/images/optical_lens_care_1795086401905.jpg',
        purchasePrice: '14000.00',
        salePrice: '32000.00',
        quantity: 26,
        minStock: 8,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[2].id,
        name: 'Spray Limpador Óptico Estéril 100ml + Pano',
        code: 'LMP-SP-050',
        category: 'Produtos de limpeza',
        brand: 'Opticlear',
        supplierName: insertedSuppliers[2].name,
        imageUrl: '/src/assets/images/optical_lens_care_1795086401905.jpg',
        purchasePrice: '2800.00',
        salePrice: '7500.00',
        quantity: 2,
        minStock: 10,
      },
      {
        tenantId: tenant.id,
        supplierId: insertedSuppliers[2].id,
        name: 'Estojo Rígido Couro Sintético Azul-Marinho',
        code: 'ACS-ET-019',
        category: 'Acessórios',
        brand: 'Óptica Pro Line',
        supplierName: insertedSuppliers[2].name,
        imageUrl: '/src/assets/images/eyewear_polarized_sunglasses_1795086401259.jpg',
        purchasePrice: '4500.00',
        salePrice: '12500.00',
        quantity: 35,
        minStock: 8,
      },
    ])
    .returning();

  // Seed clients
  const insertedClients = await db
    .insert(clients)
    .values([
      {
        tenantId: tenant.id,
        fullName: 'Manuel António Sebastião',
        phone: '+244 923 512 900',
        email: 'manuel.sebastiao@email.ao',
        address: 'Rua Rainha Ginga, Nº 84, Maianga, Luanda',
        nif: '004829103LA041',
        birthDate: '1979-04-12',
        notes: 'Preferência por armações leves em titânio e lentes progressivas.',
      },
      {
        tenantId: tenant.id,
        fullName: 'Sofia Isabel Nzinga',
        phone: '+244 924 701 334',
        email: 'sofia.nzinga@email.ao',
        address: 'Condomínio Jardim de Rosas, Talatona',
        nif: '009182311LA045',
        birthDate: '1992-09-23',
        notes: 'Usuária regular de lentes de contacto diárias.',
      },
      {
        tenantId: tenant.id,
        fullName: 'Pedro Miguel Kiala',
        phone: '+244 932 104 821',
        email: 'pedro.kiala@email.ao',
        address: 'Bairro Alvalade, Rua 7, Casa 19',
        nif: '002749182LA033',
        birthDate: '1985-11-05',
        notes: 'Trabalho prolongado em ecrãs, necessita filtro luz azul.',
      },
      {
        tenantId: tenant.id,
        fullName: 'Ana Paula Fernandes',
        phone: '+244 912 664 118',
        email: 'ana.fernandes@email.ao',
        address: 'Miramar, Rua da Samba, Luanda',
        nif: '005528190LA042',
        birthDate: '1968-02-17',
        notes: 'Controlo anual de presbiopia e miopia ligeira.',
      },
    ])
    .returning();

  // Seed prescriptions
  await db.insert(prescriptions).values([
    {
      tenantId: tenant.id,
      clientId: insertedClients[0].id,
      professionalName: 'Dra. Helena Mendonça',
      prescriptionDate: twoDaysAgo,
      odSph: '-1.75',
      odCyl: '-0.50',
      odAxis: '90',
      odAdd: '+2.00',
      oeSph: '-1.50',
      oeCyl: '-0.75',
      oeAxis: '85',
      oeAdd: '+2.00',
      dp: '64 mm',
      lensType: 'Progressiva 1.67 Anti-Reflexo BlueCut',
      notes: 'Adaptação excelente à adição +2.00. Recomendar revisão em 12 meses.',
    },
    {
      tenantId: tenant.id,
      clientId: insertedClients[1].id,
      professionalName: 'Dra. Helena Mendonça',
      prescriptionDate: fiveDaysAgo,
      odSph: '-2.25',
      odCyl: '-0.25',
      odAxis: '180',
      odAdd: '',
      oeSph: '-2.50',
      oeCyl: '0.00',
      oeAxis: '0',
      oeAdd: '',
      dp: '61 mm',
      lensType: 'Lentes de Contacto Hidrogel + Monofocal Reserva',
      notes: 'Hidratação ocular normal. Manter lágrimas artificiais em ambiente com AC.',
    },
    {
      tenantId: tenant.id,
      clientId: insertedClients[2].id,
      professionalName: 'Dra. Helena Mendonça',
      prescriptionDate: tenDaysAgo,
      odSph: '+0.75',
      odCyl: '-1.00',
      odAxis: '175',
      odAdd: '',
      oeSph: '+0.50',
      oeCyl: '-1.25',
      oeAxis: '170',
      oeAdd: '',
      dp: '63 mm',
      lensType: 'Monofocal Asférica Filtro Luz Azul',
      notes: 'Astigmatismo corrigido. Alívio imediato da fadiga visual.',
    },
  ]);

  // Seed sales + saleItems
  const [sale1] = await db
    .insert(sales)
    .values({
      tenantId: tenant.id,
      clientId: insertedClients[0].id,
      clientName: insertedClients[0].fullName,
      sellerName: 'Beatriz Mateus',
      invoiceNumber: 'FT-2026-0101',
      subtotal: '260000.00',
      discount: '10000.00',
      total: '250000.00',
      paidAmount: '250000.00',
      pendingAmount: '0.00',
      paymentMethod: 'Multicaixa Express',
      status: 'Pago',
      saleDate: today,
      notes: 'Entrega completa com estojo e certificado de garantia.',
    })
    .returning();

  await db.insert(saleItems).values([
    {
      tenantId: tenant.id,
      saleId: sale1.id,
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      quantity: 1,
      unitPrice: '115000.00',
      lineTotal: '115000.00',
    },
    {
      tenantId: tenant.id,
      saleId: sale1.id,
      productId: insertedProducts[3].id,
      productName: insertedProducts[3].name,
      quantity: 1,
      unitPrice: '145000.00',
      lineTotal: '145000.00',
    },
  ]);

  const [sale2] = await db
    .insert(sales)
    .values({
      tenantId: tenant.id,
      clientId: insertedClients[1].id,
      clientName: insertedClients[1].fullName,
      sellerName: 'Carlos Domingos',
      invoiceNumber: 'FT-2026-0102',
      subtotal: '130000.00',
      discount: '0.00',
      total: '130000.00',
      paidAmount: '80000.00',
      pendingAmount: '50000.00',
      paymentMethod: 'Pagamento Parcial',
      status: 'Parcial',
      saleDate: today,
      notes: 'Sinal de 80.000 Kz pago via Transferência. Restante na entrega.',
    })
    .returning();

  await db.insert(saleItems).values([
    {
      tenantId: tenant.id,
      saleId: sale2.id,
      productId: insertedProducts[2].id,
      productName: insertedProducts[2].name,
      quantity: 1,
      unitPrice: '98000.00',
      lineTotal: '98000.00',
    },
    {
      tenantId: tenant.id,
      saleId: sale2.id,
      productId: insertedProducts[5].id,
      productName: insertedProducts[5].name,
      quantity: 1,
      unitPrice: '32000.00',
      lineTotal: '32000.00',
    },
  ]);

  const [sale3] = await db
    .insert(sales)
    .values({
      tenantId: tenant.id,
      clientId: insertedClients[2].id,
      clientName: insertedClients[2].fullName,
      sellerName: 'Beatriz Mateus',
      invoiceNumber: 'FT-2026-0099',
      subtotal: '144500.00',
      discount: '4500.00',
      total: '140000.00',
      paidAmount: '140000.00',
      pendingAmount: '0.00',
      paymentMethod: 'Transferência Bancária',
      status: 'Pago',
      saleDate: twoDaysAgo,
      notes: 'Montagem urgente concluída.',
    })
    .returning();

  await db.insert(saleItems).values([
    {
      tenantId: tenant.id,
      saleId: sale3.id,
      productId: insertedProducts[1].id,
      productName: insertedProducts[1].name,
      quantity: 1,
      unitPrice: '89000.00',
      lineTotal: '89000.00',
    },
    {
      tenantId: tenant.id,
      saleId: sale3.id,
      productId: insertedProducts[4].id,
      productName: insertedProducts[4].name,
      quantity: 1,
      unitPrice: '48000.00',
      lineTotal: '48000.00',
    },
    {
      tenantId: tenant.id,
      saleId: sale3.id,
      productId: insertedProducts[6].id,
      productName: insertedProducts[6].name,
      quantity: 1,
      unitPrice: '7500.00',
      lineTotal: '7500.00',
    },
  ]);

  const [sale4] = await db
    .insert(sales)
    .values({
      tenantId: tenant.id,
      clientId: insertedClients[3].id,
      clientName: insertedClients[3].fullName,
      sellerName: 'Carlos Domingos',
      invoiceNumber: 'FT-2026-0095',
      subtotal: '193000.00',
      discount: '0.00',
      total: '193000.00',
      paidAmount: '193000.00',
      pendingAmount: '0.00',
      paymentMethod: 'Dinheiro',
      status: 'Pago',
      saleDate: fiveDaysAgo,
      notes: 'Factura-recibo emitida no balcão.',
    })
    .returning();

  await db.insert(saleItems).values([
    {
      tenantId: tenant.id,
      saleId: sale4.id,
      productId: insertedProducts[3].id,
      productName: insertedProducts[3].name,
      quantity: 1,
      unitPrice: '145000.00',
      lineTotal: '145000.00',
    },
    {
      tenantId: tenant.id,
      saleId: sale4.id,
      productId: insertedProducts[4].id,
      productName: insertedProducts[4].name,
      quantity: 1,
      unitPrice: '48000.00',
      lineTotal: '48000.00',
    },
  ]);

  // Seed financial entries
  await db.insert(financialEntries).values([
    {
      tenantId: tenant.id,
      type: 'receita',
      category: 'Vendas Ópticas',
      description: 'Recebimento Factura FT-2026-0101 (Manuel Sebastião)',
      amount: '250000.00',
      entryDate: today,
      paymentMethod: 'Multicaixa Express',
      status: 'Confirmado',
      referenceId: 'FT-2026-0101',
    },
    {
      tenantId: tenant.id,
      type: 'receita',
      category: 'Vendas Ópticas',
      description: 'Sinal Factura FT-2026-0102 (Sofia Nzinga)',
      amount: '80000.00',
      entryDate: today,
      paymentMethod: 'Transferência Bancária',
      status: 'Confirmado',
      referenceId: 'FT-2026-0102',
    },
    {
      tenantId: tenant.id,
      type: 'receita',
      category: 'Consultas de Optometria',
      description: 'Consultas clínicas de refração do dia',
      amount: '45000.00',
      entryDate: yesterday,
      paymentMethod: 'Multicaixa Express',
      status: 'Confirmado',
      referenceId: 'CONS-041',
    },
    {
      tenantId: tenant.id,
      type: 'receita',
      category: 'Vendas Ópticas',
      description: 'Recebimento Factura FT-2026-0099 (Pedro Kiala)',
      amount: '140000.00',
      entryDate: twoDaysAgo,
      paymentMethod: 'Transferência Bancária',
      status: 'Confirmado',
      referenceId: 'FT-2026-0099',
    },
    {
      tenantId: tenant.id,
      type: 'receita',
      category: 'Vendas Ópticas',
      description: 'Recebimento Factura FT-2026-0095 (Ana Fernandes)',
      amount: '193000.00',
      entryDate: fiveDaysAgo,
      paymentMethod: 'Dinheiro',
      status: 'Confirmado',
      referenceId: 'FT-2026-0095',
    },
    {
      tenantId: tenant.id,
      type: 'despesa',
      category: 'Fornecedores & Lentes',
      description: 'Liquidação parcial Zeiss & Essilor Lentes África',
      amount: '165000.00',
      entryDate: twoDaysAgo,
      paymentMethod: 'Transferência Bancária',
      status: 'Confirmado',
      referenceId: 'FOR-ZE-21',
    },
    {
      tenantId: tenant.id,
      type: 'despesa',
      category: 'Renda & Instalações',
      description: 'Arrendamento Clínica Maculusso — Mês Corrente',
      amount: '190000.00',
      entryDate: tenDaysAgo,
      paymentMethod: 'Transferência Bancária',
      status: 'Confirmado',
      referenceId: 'RENT-11',
    },
    {
      tenantId: tenant.id,
      type: 'despesa',
      category: 'Energia & Telecomunicações',
      description: 'ENDE Energia + Fibra Internet Clínica',
      amount: '42000.00',
      entryDate: yesterday,
      paymentMethod: 'Multicaixa Express',
      status: 'Confirmado',
      referenceId: 'UTIL-09',
    },
  ]);

  // Seed appointments
  await db.insert(appointments).values([
    {
      tenantId: tenant.id,
      clientId: insertedClients[0].id,
      clientName: insertedClients[0].fullName,
      clientPhone: insertedClients[0].phone,
      professionalName: 'Dra. Helena Mendonça',
      appointmentDate: today,
      appointmentTime: '10:30',
      reason: 'Entrega e ajuste de lentes progressivas',
      status: 'Confirmada',
      reminderSent: true,
      notes: 'Verificar altura pupilar na armação titânio.',
    },
    {
      tenantId: tenant.id,
      clientId: insertedClients[3].id,
      clientName: insertedClients[3].fullName,
      clientPhone: insertedClients[3].phone,
      professionalName: 'Dra. Helena Mendonça',
      appointmentDate: today,
      appointmentTime: '14:30',
      reason: 'Exame completo de optometria e tonometria',
      status: 'Agendada',
      reminderSent: false,
      notes: 'Cliente pediu lembrete via WhatsApp 2h antes.',
    },
    {
      tenantId: tenant.id,
      clientId: insertedClients[1].id,
      clientName: insertedClients[1].fullName,
      clientPhone: insertedClients[1].phone,
      professionalName: 'Dra. Helena Mendonça',
      appointmentDate: tomorrow,
      appointmentTime: '09:30',
      reason: 'Adaptação de lentes de contacto multifocais',
      status: 'Confirmada',
      reminderSent: true,
      notes: 'Preparar caixa de teste hidrogel.',
    },
    {
      tenantId: tenant.id,
      clientId: insertedClients[2].id,
      clientName: insertedClients[2].fullName,
      clientPhone: insertedClients[2].phone,
      professionalName: 'Dra. Helena Mendonça',
      appointmentDate: inTwoDays,
      appointmentTime: '16:00',
      reason: 'Revisão de acuidade visual pós-adaptação',
      status: 'Agendada',
      reminderSent: false,
      notes: '',
    },
  ]);

  // Seed SaaS subscription invoices
  await db.insert(subscriptionInvoices).values([
    {
      tenantId: tenant.id,
      plan: 'profissional',
      amount: '45000.00',
      billingDate: tenDaysAgo,
      paymentMethod: 'Multicaixa Express',
      status: 'Pago',
      reference: 'SAAS-OP-202611',
    },
  ]);

  // Seed initial activity logs
  await db.insert(activityLogs).values([
    {
      tenantId: tenant.id,
      actorName: user.name,
      actorRole: 'admin',
      action: 'Provisionamento de Conta SaaS',
      module: 'Segurança & Multi-Tenant',
      details: `Ambiente isolado criado para ${tenant.name} (Plano Profissional).`,
    },
    {
      tenantId: tenant.id,
      actorName: 'Beatriz Mateus',
      actorRole: 'funcionario',
      action: 'Emissão de Factura',
      module: 'Vendas & Facturação',
      details: 'Venda FT-2026-0101 registada no valor de 250.000 Kz via Multicaixa Express.',
    },
    {
      tenantId: tenant.id,
      actorName: 'Dra. Helena Mendonça',
      actorRole: 'optometrista',
      action: 'Nova Receita Oftalmológica',
      module: 'Receitas Oftalmológicas',
      details: 'Prescrição emitida para Manuel António Sebastião (OD -1.75 / OE -1.50).',
    },
  ]);

  return { user, tenant, isNew: true };
}
