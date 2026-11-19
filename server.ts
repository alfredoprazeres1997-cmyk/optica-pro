import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  attachTenantUser,
  requireAuth,
  requireRoles,
  type AuthRequest,
} from './src/middleware/auth.ts';
import { bootstrapUserTenant } from './src/db/seed.ts';
import {
  createAppointmentRecord,
  createClientRecord,
  createFinancialEntryRecord,
  createPrescriptionRecord,
  createProductRecord,
  createSaleTransaction,
  createStaffRecord,
  createSupplierRecord,
  deleteProductRecord,
  getTenantWorkspace,
  logActivity,
  recordSubscriptionPayment,
  settleSalePayment,
  updateAppointmentRecord,
  updateClientRecord,
  updateProductRecord,
  updateStaffRecord,
  updateSupplierBalance,
  updateTenantSettings,
  updateUserRoleForSession,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'OPTICA PRO' });
  });

  // Bootstrap / First-login provisioning for isolated tenant
  app.post('/api/bootstrap', requireAuth, async (req: AuthRequest, res) => {
    try {
      const fbUser = req.firebaseUser!;
      const result = await bootstrapUserTenant({
        uid: fbUser.uid,
        email: fbUser.email || 'utilizador@opticapro.ao',
        name: fbUser.name || fbUser.email?.split('@')[0] || 'Administrador',
        avatarUrl: fbUser.picture || null,
      });
      res.json(result);
    } catch (error: any) {
      console.error('Bootstrap failed:', error);
      res.status(500).json({ error: error.message || 'Erro ao inicializar óptica.' });
    }
  });

  // Fetch entire tenant-isolated workspace
  app.get('/api/workspace', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const data = await getTenantWorkspace(appUser.tenantId);
      res.json({ currentUser: appUser, ...data });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao carregar dados.' });
    }
  });

  // Clients
  app.post('/api/clients', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const created = await createClientRecord(appUser.tenantId, req.body);
      await logActivity({
        tenantId: appUser.tenantId,
        actorName: appUser.name,
        actorRole: appUser.role,
        action: 'Registo de Cliente',
        module: 'Gestão de Clientes',
        details: `Cliente ${created.fullName} registado com sucesso.`,
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/clients/:id', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const updated = await updateClientRecord(
        appUser.tenantId,
        Number(req.params.id),
        req.body
      );
      if (!updated) return res.status(404).json({ error: 'Cliente não encontrado.' });
      await logActivity({
        tenantId: appUser.tenantId,
        actorName: appUser.name,
        actorRole: appUser.role,
        action: 'Edição de Cliente',
        module: 'Gestão de Clientes',
        details: `Ficha de ${updated.fullName} actualizada.`,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Prescriptions
  app.post(
    '/api/prescriptions',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente', 'optometrista']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const created = await createPrescriptionRecord(appUser.tenantId, req.body);
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Nova Receita Oftalmológica',
          module: 'Receitas Oftalmológicas',
          details: `Prescrição emitida por ${created.professionalName} (DP ${created.dp}).`,
        });
        res.status(201).json(created);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Products
  app.post(
    '/api/products',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const created = await createProductRecord(appUser.tenantId, req.body);
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Novo Produto',
          module: 'Gestão de Produtos',
          details: `Produto ${created.code} — ${created.name} adicionado ao stock.`,
        });
        res.status(201).json(created);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.patch(
    '/api/products/:id',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const updated = await updateProductRecord(
          appUser.tenantId,
          Number(req.params.id),
          req.body
        );
        if (!updated) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json(updated);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.delete(
    '/api/products/:id',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        await deleteProductRecord(appUser.tenantId, Number(req.params.id));
        res.json({ ok: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Sales & Billing
  app.post('/api/sales', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const created = await createSaleTransaction(appUser.tenantId, req.body);
      await logActivity({
        tenantId: appUser.tenantId,
        actorName: appUser.name,
        actorRole: appUser.role,
        action: 'Venda Registada',
        module: 'Vendas & Facturação',
        details: `Factura ${created.invoiceNumber} (${created.clientName}) — ${created.total} Kz (${created.paymentMethod}).`,
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    '/api/sales/:id/settle',
    requireAuth,
    attachTenantUser,
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const updated = await settleSalePayment(
          appUser.tenantId,
          Number(req.params.id),
          Number(req.body.amount),
          req.body.paymentMethod || 'Multicaixa Express'
        );
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Liquidação de Saldo',
          module: 'Vendas & Facturação',
          details: `Pagamento de ${req.body.amount} Kz na factura ${updated.invoiceNumber}.`,
        });
        res.json(updated);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Financial Management
  app.post(
    '/api/finance',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const created = await createFinancialEntryRecord(appUser.tenantId, req.body);
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: `Registo de ${created.type === 'receita' ? 'Receita' : 'Despesa'}`,
          module: 'Gestão Financeira',
          details: `${created.description} — ${created.amount} Kz`,
        });
        res.status(201).json(created);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Appointments
  app.post('/api/appointments', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const created = await createAppointmentRecord(appUser.tenantId, req.body);
      await logActivity({
        tenantId: appUser.tenantId,
        actorName: appUser.name,
        actorRole: appUser.role,
        action: 'Agendamento de Consulta',
        module: 'Marcação de Consultas',
        details: `Consulta para ${created.clientName} em ${created.appointmentDate} às ${created.appointmentTime}.`,
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch(
    '/api/appointments/:id',
    requireAuth,
    attachTenantUser,
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const updated = await updateAppointmentRecord(
          appUser.tenantId,
          Number(req.params.id),
          req.body
        );
        if (!updated) return res.status(404).json({ error: 'Consulta não encontrada.' });
        res.json(updated);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Suppliers
  app.post(
    '/api/suppliers',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const created = await createSupplierRecord(appUser.tenantId, req.body);
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Cadastro de Fornecedor',
          module: 'Fornecedores',
          details: `Fornecedor ${created.name} adicionado.`,
        });
        res.status(201).json(created);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.patch(
    '/api/suppliers/:id',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const updated = await updateSupplierBalance(
          appUser.tenantId,
          Number(req.params.id),
          String(req.body.pendingBalance)
        );
        res.json(updated);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Staff & RBAC
  app.post(
    '/api/staff',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const created = await createStaffRecord(appUser.tenantId, req.body);
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Novo Colaborador',
          module: 'Painel Administrativo',
          details: `${created.name} adicionado com perfil ${created.role}.`,
        });
        res.status(201).json(created);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.patch(
    '/api/staff/:id',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const updated = await updateStaffRecord(
          appUser.tenantId,
          Number(req.params.id),
          req.body
        );
        res.json(updated);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Switch role for RBAC validation & testing
  app.post('/api/role-preview', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const role = req.body.role;
      if (!['admin', 'gerente', 'funcionario', 'optometrista'].includes(role)) {
        return res.status(400).json({ error: 'Perfil inválido.' });
      }
      const updated = await updateUserRoleForSession(appUser.uid, role);
      await logActivity({
        tenantId: appUser.tenantId,
        actorName: appUser.name,
        actorRole: role,
        action: 'Alteração de Nível de Acesso',
        module: 'Controlo RBAC',
        details: `Sessão alterada para o perfil ${role}.`,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tenant Settings (Currency, Language, Profile)
  app.patch('/api/tenant', requireAuth, attachTenantUser, async (req: AuthRequest, res) => {
    try {
      const appUser = req.appUser!;
      const updated = await updateTenantSettings(appUser.tenantId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SaaS Plan & Billing
  app.post(
    '/api/subscription',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const result = await recordSubscriptionPayment(
          appUser.tenantId,
          req.body.plan,
          String(req.body.amount),
          req.body.paymentMethod || 'Multicaixa Express'
        );
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Actualização de Plano SaaS',
          module: 'Assinatura & Planos',
          details: `Plano actualizado para ${req.body.plan.toUpperCase()} (${req.body.amount} Kz).`,
        });
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Full Tenant Backup Export
  app.get(
    '/api/backup',
    requireAuth,
    attachTenantUser,
    requireRoles(['admin', 'gerente']),
    async (req: AuthRequest, res) => {
      try {
        const appUser = req.appUser!;
        const workspace = await getTenantWorkspace(appUser.tenantId);
        await logActivity({
          tenantId: appUser.tenantId,
          actorName: appUser.name,
          actorRole: appUser.role,
          action: 'Cópia de Segurança Gerada',
          module: 'Segurança & Backup',
          details: 'Exportação completa da base de dados da óptica em formato JSON.',
        });
        res.json({
          exportedAt: new Date().toISOString(),
          tenantId: appUser.tenantId,
          ...workspace,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ÓPTICA PRO server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
