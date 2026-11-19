import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type {
  ClientRecord,
  CurrencyCode,
  FinancialEntryRecord,
  PrescriptionRecord,
  SaleItemRecord,
  SaleRecord,
  TenantInfo,
} from '../types/optica.ts';
import { formatMoney, formatShortDate } from './format.ts';

export function exportPrescriptionPDF(
  prescription: PrescriptionRecord,
  client: ClientRecord | undefined,
  tenant: TenantInfo
) {
  const doc = new jsPDF();

  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('ÓPTICA PRO', 14, 15);
  doc.setFontSize(10);
  doc.text(`${tenant.name} · NIF: ${tenant.nif || '—'}`, 14, 22);
  doc.text(`${tenant.address || ''} · ${tenant.phone || ''}`, 14, 28);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.text('RECEITA OFTALMOLÓGICA', 14, 48);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Paciente: ${client?.fullName || 'Cliente'}`, 14, 58);
  doc.text(`Telefone: ${client?.phone || '—'}`, 14, 64);
  doc.text(`Data da Prescrição: ${formatShortDate(prescription.prescriptionDate)}`, 125, 58);
  doc.text(`Optometrista: ${prescription.professionalName}`, 125, 64);

  autoTable(doc, {
    startY: 74,
    head: [['Olho', 'Esfera (SPH)', 'Cilindro (CYL)', 'Eixo (AXIS)', 'Adição (ADD)']],
    body: [
      [
        'Olho Direito (OD)',
        prescription.odSph,
        prescription.odCyl,
        `${prescription.odAxis}°`,
        prescription.odAdd || '—',
      ],
      [
        'Olho Esquerdo (OE)',
        prescription.oeSph,
        prescription.oeCyl,
        `${prescription.oeAxis}°`,
        prescription.oeAdd || '—',
      ],
    ],
    headStyles: { fillColor: [11, 31, 58], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Distância Pupilar (DP): ${prescription.dp}`, 14, finalY);
  doc.text(`Tipo de Lente Recomendada: ${prescription.lensType || 'Standard'}`, 14, finalY + 7);

  if (prescription.notes) {
    doc.text('Observações Clínicas:', 14, finalY + 17);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(prescription.notes, 180), 14, finalY + 23);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 255, 95, 255);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(prescription.professionalName, 14, 261);
  doc.text('Assinatura e Carimbo Profissional', 14, 266);

  doc.save(`receita-${(client?.fullName || 'paciente').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportReceiptPDF(
  sale: SaleRecord,
  items: SaleItemRecord[],
  tenant: TenantInfo,
  currency: CurrencyCode
) {
  const doc = new jsPDF();

  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text(tenant.name.toUpperCase(), 14, 14);
  doc.setFontSize(9);
  doc.text(`NIF: ${tenant.nif || '—'} · ${tenant.phone || ''} · ${tenant.address || ''}`, 14, 22);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(`RECIBO / FACTURA ${sale.invoiceNumber}`, 14, 45);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cliente: ${sale.clientName}`, 14, 54);
  doc.text(`Vendedor: ${sale.sellerName}`, 14, 60);
  doc.text(`Data: ${formatShortDate(sale.saleDate)}`, 130, 54);
  doc.text(`Pagamento: ${sale.paymentMethod} (${sale.status})`, 130, 60);

  autoTable(doc, {
    startY: 68,
    head: [['Produto / Serviço', 'Qtd', 'Preço Unitário', 'Total']],
    body: items.map((i) => [
      i.productName,
      String(i.quantity),
      formatMoney(i.unitPrice, currency),
      formatMoney(i.lineTotal, currency),
    ]),
    headStyles: { fillColor: [11, 31, 58], textColor: 255 },
  });

  const y = (doc as any).lastAutoTable.finalY + 12;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(`Subtotal: ${formatMoney(sale.subtotal, currency)}`, 130, y);
  doc.text(`Desconto: ${formatMoney(sale.discount, currency)}`, 130, y + 6);
  doc.setFontSize(12);
  doc.text(`Total: ${formatMoney(sale.total, currency)}`, 130, y + 14);
  doc.setFontSize(10);
  doc.text(`Pago: ${formatMoney(sale.paidAmount, currency)}`, 130, y + 21);
  doc.text(`Em Dívida: ${formatMoney(sale.pendingAmount, currency)}`, 130, y + 27);

  doc.save(`recibo-${sale.invoiceNumber}.pdf`);
}

export function exportFinancePDF(
  entries: FinancialEntryRecord[],
  tenant: TenantInfo,
  currency: CurrencyCode,
  periodLabel: string
) {
  const doc = new jsPDF();
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`${tenant.name} — Relatório Financeiro`, 14, 14);
  doc.setFontSize(10);
  doc.text(`Período: ${periodLabel} · Emitido em ${formatShortDate(new Date().toISOString().slice(0, 10))}`, 14, 22);

  const totalRev = entries
    .filter((e) => e.type === 'receita')
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalExp = entries
    .filter((e) => e.type === 'despesa')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Total Receitas: ${formatMoney(totalRev, currency)}`, 14, 42);
  doc.text(`Total Despesas: ${formatMoney(totalExp, currency)}`, 85, 42);
  doc.text(`Resultado Líquido: ${formatMoney(totalRev - totalExp, currency)}`, 148, 42);

  autoTable(doc, {
    startY: 50,
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Método', 'Valor']],
    body: entries.map((e) => [
      formatShortDate(e.entryDate),
      e.type === 'receita' ? 'Receita' : 'Despesa',
      e.category,
      e.description,
      e.paymentMethod,
      formatMoney(e.amount, currency),
    ]),
    headStyles: { fillColor: [11, 31, 58], textColor: 255 },
    styles: { fontSize: 8.5 },
  });

  doc.save(`relatorio-financeiro-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportFinanceExcel(
  entries: FinancialEntryRecord[],
  currency: CurrencyCode,
  periodLabel: string
) {
  const rows = entries.map((e) => ({
    Data: formatShortDate(e.entryDate),
    Tipo: e.type === 'receita' ? 'Receita' : 'Despesa',
    Categoria: e.category,
    Descricao: e.description,
    Metodo: e.paymentMethod,
    Estado: e.status,
    Referencia: e.referenceId || '',
    Valor: Number(e.amount),
    Moeda: currency,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financeiro');
  XLSX.writeFile(
    workbook,
    `optica-pro-financeiro-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.xlsx`
  );
}
