import type { LanguageCode } from '../types/optica.ts';

export const TRANSLATIONS: Record<
  LanguageCode,
  {
    nav: {
      dashboard: string;
      clients: string;
      prescriptions: string;
      products: string;
      sales: string;
      finance: string;
      appointments: string;
      suppliers: string;
      reports: string;
      admin: string;
      saas: string;
    };
    kpis: {
      salesToday: string;
      salesMonth: string;
      estimatedProfit: string;
      totalClients: string;
      productsInStock: string;
      lowStock: string;
      scheduledAppointments: string;
      pendingAccounts: string;
    };
    common: {
      search: string;
      save: string;
      cancel: string;
      newItem: string;
      exportPdf: string;
      exportExcel: string;
      print: string;
      signOut: string;
    };
  }
> = {
  pt: {
    nav: {
      dashboard: 'Painel Principal',
      clients: 'Clientes',
      prescriptions: 'Receitas',
      products: 'Produtos & Stock',
      sales: 'Vendas & POS',
      finance: 'Financeiro',
      appointments: 'Consultas',
      suppliers: 'Fornecedores',
      reports: 'Relatórios',
      admin: 'Administração',
      saas: 'Planos SaaS',
    },
    kpis: {
      salesToday: 'Vendas do Dia',
      salesMonth: 'Vendas do Mês',
      estimatedProfit: 'Lucro Estimado',
      totalClients: 'Total de Clientes',
      productsInStock: 'Produtos em Stock',
      lowStock: 'Stock Baixo',
      scheduledAppointments: 'Consultas Agendadas',
      pendingAccounts: 'Contas Pendentes',
    },
    common: {
      search: 'Pesquisar...',
      save: 'Guardar',
      cancel: 'Cancelar',
      newItem: 'Novo Registo',
      exportPdf: 'Exportar PDF',
      exportExcel: 'Exportar Excel',
      print: 'Imprimir',
      signOut: 'Terminar Sessão',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      clients: 'Clients',
      prescriptions: 'Prescriptions',
      products: 'Inventory',
      sales: 'Sales & POS',
      finance: 'Finance',
      appointments: 'Appointments',
      suppliers: 'Suppliers',
      reports: 'Reports',
      admin: 'Administration',
      saas: 'SaaS Plans',
    },
    kpis: {
      salesToday: "Today's Sales",
      salesMonth: 'Monthly Sales',
      estimatedProfit: 'Estimated Profit',
      totalClients: 'Total Clients',
      productsInStock: 'Stock Units',
      lowStock: 'Low Stock Alerts',
      scheduledAppointments: 'Scheduled Visits',
      pendingAccounts: 'Pending Balances',
    },
    common: {
      search: 'Search...',
      save: 'Save',
      cancel: 'Cancel',
      newItem: 'New Entry',
      exportPdf: 'Export PDF',
      exportExcel: 'Export Excel',
      print: 'Print',
      signOut: 'Sign Out',
    },
  },
  fr: {
    nav: {
      dashboard: 'Tableau de Bord',
      clients: 'Clients',
      prescriptions: 'Ordonnances',
      products: 'Produits & Stock',
      sales: 'Ventes & Caisse',
      finance: 'Finances',
      appointments: 'Rendez-vous',
      suppliers: 'Fournisseurs',
      reports: 'Rapports',
      admin: 'Administration',
      saas: 'Plans SaaS',
    },
    kpis: {
      salesToday: 'Ventes du Jour',
      salesMonth: 'Ventes du Mois',
      estimatedProfit: 'Bénéfice Estimé',
      totalClients: 'Total Clients',
      productsInStock: 'Unités en Stock',
      lowStock: 'Stock Faible',
      scheduledAppointments: 'Consultations Prévues',
      pendingAccounts: 'Comptes en Attente',
    },
    common: {
      search: 'Rechercher...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      newItem: 'Nouveau',
      exportPdf: 'Exporter PDF',
      exportExcel: 'Exporter Excel',
      print: 'Imprimer',
      signOut: 'Déconnexion',
    },
  },
  es: {
    nav: {
      dashboard: 'Panel Principal',
      clients: 'Clientes',
      prescriptions: 'Recetas',
      products: 'Productos y Stock',
      sales: 'Ventas y TPV',
      finance: 'Finanzas',
      appointments: 'Citas',
      suppliers: 'Proveedores',
      reports: 'Informes',
      admin: 'Administración',
      saas: 'Planes SaaS',
    },
    kpis: {
      salesToday: 'Ventas del Día',
      salesMonth: 'Ventas del Mes',
      estimatedProfit: 'Beneficio Estimado',
      totalClients: 'Total de Clientes',
      productsInStock: 'Unidades en Stock',
      lowStock: 'Stock Bajo',
      scheduledAppointments: 'Citas Programadas',
      pendingAccounts: 'Cuentas Pendientes',
    },
    common: {
      search: 'Buscar...',
      save: 'Guardar',
      cancel: 'Cancelar',
      newItem: 'Nuevo Registro',
      exportPdf: 'Exportar PDF',
      exportExcel: 'Exportar Excel',
      print: 'Imprimir',
      signOut: 'Cerrar Sesión',
    },
  },
};
