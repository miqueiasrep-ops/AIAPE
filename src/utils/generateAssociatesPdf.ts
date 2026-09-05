import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Associate, AssociationConfig } from '../types';
import { getAiapeLogoPngDataUrl } from './aiapeLogoSvg';

export interface AssociatesPdfOptions {
  orientation?: 'landscape' | 'portrait';
  title?: string;
  statusFilterLabel?: string;
  categoryFilterLabel?: string;
  searchTerm?: string;
  includeSignatures?: boolean;
  fileNamePrefix?: string;
}

export interface GeneratePdfResult {
  doc: jsPDF;
  blobUrl: string;
  fileName: string;
  totalAssociates: number;
}

/**
 * Formata moeda BRL para exibição em relatórios
 */
function formatBrl(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

/**
 * Gera um relatório oficial em PDF dos associados com cabeçalho institucional,
 * logo oficial da AIAPE, quadro de métricas, tabela completa e assinaturas.
 */
export async function generateAssociatesPdf(
  associates: Associate[],
  config: AssociationConfig,
  options: AssociatesPdfOptions = {}
): Promise<GeneratePdfResult> {
  const {
    orientation = 'landscape',
    title = 'RELATÓRIO OFICIAL DE QUADRO DE ASSOCIADOS E INSTRUTORES',
    statusFilterLabel = 'Todos',
    categoryFilterLabel = 'Todas',
    searchTerm = '',
    includeSignatures = true,
    fileNamePrefix = 'Relatorio_Associados_AIAPE'
  } = options;

  // Cria o documento PDF (A4 Landscape ou Portrait)
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // 1. Obter a logo da AIAPE (customizada ou emblema oficial em PNG)
  let logoDataUrl = '';
  try {
    logoDataUrl = await getAiapeLogoPngDataUrl(config.logoUrl);
  } catch (err) {
    console.warn('Não foi possível carregar a logo vetorial para o PDF:', err);
  }

  // 2. Desenhar cabeçalho institucional oficial
  let currentY = 10;

  // Logo da AIAPE no canto esquerdo
  const logoSize = 24; // 24mm x 24mm
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', marginX, currentY, logoSize, logoSize);
    } catch {
      // Se falhar adicionar imagem, segue com fallback de texto
    }
  }

  // Textos do cabeçalho institucional
  const headerLeftX = logoDataUrl ? marginX + logoSize + 4 : marginX;
  const headerMaxWidth = pageWidth - headerLeftX - marginX - 45;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // Navy blue #1e3a8a
  doc.text(
    config.name || 'ASSOCIAÇÃO DOS INSTRUTORES DE TRÂNSITO AUTÔNOMOS DE PERNAMBUCO - AIAPE',
    headerLeftX,
    currentY + 5,
    { maxWidth: headerMaxWidth }
  );

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(title, headerLeftX, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate 600
  
  const statusJuridico = config.cnpj ? `CNPJ: ${config.cnpj}` : 'Status: Em processo de formalização e abertura institucional';
  const endereco = config.address ? `Sede: ${config.address}` : 'Recife - Pernambuco';
  const contatos = [
    config.email ? `E-mail: ${config.email}` : null,
    config.phone ? `WhatsApp: ${config.phone}` : null
  ].filter(Boolean).join('  |  ');

  doc.text(`${statusJuridico}  •  ${endereco}`, headerLeftX, currentY + 16);
  if (contatos) {
    doc.text(contatos, headerLeftX, currentY + 20);
  }

  // Caixa de informações de emissão (canto superior direito)
  const infoBoxWidth = 52;
  const infoBoxX = pageWidth - marginX - infoBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(infoBoxX, currentY, infoBoxWidth, 23, 2, 2, 'FD');

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('EMISSÃO ELETRÔNICA', infoBoxX + 3, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${dateFormatted} às ${timeFormatted}`, infoBoxX + 3, currentY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Filtro Status: ${statusFilterLabel}`, infoBoxX + 3, currentY + 14);
  doc.text(`Total listado: ${associates.length} associado(s)`, infoBoxX + 3, currentY + 18);
  if (searchTerm) {
    doc.text(`Busca: "${searchTerm.slice(0, 15)}"`, infoBoxX + 3, currentY + 21.5);
  }

  currentY += 27;

  // Linha decorativa tricolor de Pernambuco (Azul, Vermelho, Ouro, Verde)
  const barWidth = pageWidth - marginX * 2;
  const segmentW = barWidth / 4;
  doc.setFillColor(37, 99, 235); // Azul
  doc.rect(marginX, currentY, segmentW, 1.5, 'F');
  doc.setFillColor(220, 38, 38); // Vermelho
  doc.rect(marginX + segmentW, currentY, segmentW, 1.5, 'F');
  doc.setFillColor(234, 179, 8); // Amarelo/Ouro
  doc.rect(marginX + segmentW * 2, currentY, segmentW, 1.5, 'F');
  doc.setFillColor(22, 163, 74); // Verde
  doc.rect(marginX + segmentW * 3, currentY, segmentW, 1.5, 'F');

  currentY += 4;

  // 3. Quadro Resumo de Métricas (KPI Cards)
  const totalCount = associates.length;
  const activeCount = associates.filter(a => a.status === 'ativo' && !a.isExempt).length;
  const exemptCount = associates.filter(a => a.isExempt).length;
  const overdueCount = associates.filter(a => a.status === 'inadimplente').length;
  const pendingCount = associates.filter(a => a.status === 'pendente').length;
  const expectedMonthlyIncome = associates
    .filter(a => a.status === 'ativo' && !a.isExempt)
    .reduce((sum, a) => sum + (a.monthlyFee || 0), 0);

  const kpis = [
    { label: 'Total Listado', val: `${totalCount}`, color: [30, 58, 138], bg: [239, 246, 255], border: [191, 219, 254] },
    { label: 'Ativos Pagantes', val: `${activeCount}`, color: [22, 101, 52], bg: [240, 253, 244], border: [187, 247, 208] },
    { label: 'Isentos (Diretoria)', val: `${exemptCount}`, color: [107, 33, 168], bg: [250, 245, 255], border: [233, 213, 255] },
    { label: 'Inadimplentes / Pend.', val: `${overdueCount + pendingCount}`, color: [153, 27, 27], bg: [254, 242, 242], border: [254, 202, 202] },
    { label: 'Arrecadação Mensal', val: formatBrl(expectedMonthlyIncome), color: [13, 148, 136], bg: [240, 253, 250], border: [153, 246, 228] }
  ];

  const kpiCount = kpis.length;
  const gap = 3;
  const kpiWidth = (pageWidth - marginX * 2 - gap * (kpiCount - 1)) / kpiCount;
  const kpiHeight = 11;

  kpis.forEach((kpi, idx) => {
    const kpiX = marginX + idx * (kpiWidth + gap);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.label, kpiX + 3, currentY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kpiX + 3, currentY + 8.5);
  });

  currentY += kpiHeight + 4;

  // 4. Montar dados da tabela de associados
  const tableHead = orientation === 'landscape'
    ? [['N°', 'MATRÍCULA', 'NOME COMPLETO DO ASSOCIADO', 'CPF', 'SENATRAN', 'CNH', 'CATEGORIA', 'STATUS', 'MENSALIDADE', 'ÚLT. PAGAMENTO', 'CONTATO']]
    : [['MATRÍCULA', 'NOME DO ASSOCIADO', 'CPF', 'SENATRAN', 'STATUS', 'VALOR', 'CONTATO']];

  const tableBody = associates.map((assoc, index) => {
    const matricula = assoc.registrationNumber || `AIAPE-${assoc.id.slice(-4).toUpperCase()}`;
    const senatran = assoc.senatranCredential || '-';
    const cnh = assoc.cnhCategory || 'AB';
    const categoria = assoc.category || 'Membro Efetivo';

    let statusText = 'Ativo';
    if (assoc.isExempt) {
      statusText = 'Isento (Diretoria)';
    } else if (assoc.status === 'inadimplente') {
      statusText = 'Inadimplente';
    } else if (assoc.status === 'pendente') {
      statusText = 'Pendente';
    } else if (assoc.status === 'inativo') {
      statusText = 'Inativo';
    }

    const valorMensalidade = assoc.isExempt
      ? 'R$ 0,00 (Isento)'
      : formatBrl(assoc.monthlyFee || config.defaultMonthlyFee || 70);

    const ultPagamento = assoc.lastPaymentMonth
      ? `${assoc.lastPaymentMonth} ${assoc.lastPaymentDate ? `(${assoc.lastPaymentDate.split('-')[0]})` : ''}`
      : '-';

    const contato = assoc.phone || assoc.email || '-';

    if (orientation === 'landscape') {
      return [
        `${index + 1}`,
        matricula,
        assoc.name.toUpperCase(),
        assoc.document || '-',
        senatran,
        cnh,
        categoria,
        statusText,
        valorMensalidade,
        ultPagamento,
        contato
      ];
    }

    return [
      matricula,
      assoc.name.toUpperCase(),
      assoc.document || '-',
      senatran,
      statusText,
      valorMensalidade,
      contato
    ];
  });

  // Estilo e colunas ajustadas dinamicamente
  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 20 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: orientation === 'landscape' ? 7.5 : 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy blue #1e3a8a
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: orientation === 'landscape' ? 7.5 : 7,
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    columnStyles: orientation === 'landscape' ? {
      0: { halign: 'center', cellWidth: 8 }, // N°
      1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }, // Matrícula
      2: { cellWidth: 50, fontStyle: 'bold' }, // Nome
      3: { halign: 'center', cellWidth: 24 }, // CPF
      4: { halign: 'center', cellWidth: 22 }, // SENATRAN
      5: { halign: 'center', cellWidth: 10 }, // CNH
      6: { cellWidth: 28 }, // Categoria
      7: { halign: 'center', cellWidth: 24, fontStyle: 'bold' }, // Status
      8: { halign: 'right', cellWidth: 24 }, // Mensalidade
      9: { halign: 'center', cellWidth: 26 }, // Últ. Pagamento
      10: { cellWidth: 33 } // Contato
    } : {
      0: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      5: { halign: 'right', cellWidth: 22 },
      6: { cellWidth: 28 }
    },
    didParseCell: (data) => {
      // Colorir o status de acordo com a situação
      const statusColIndex = orientation === 'landscape' ? 7 : 4;
      if (data.section === 'body' && data.column.index === statusColIndex) {
        const text = String(data.cell.raw);
        if (text.includes('Isento')) {
          data.cell.styles.textColor = [126, 34, 206]; // Purple
          data.cell.styles.fillColor = [250, 245, 255];
        } else if (text === 'Ativo') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (text === 'Inadimplente') {
          data.cell.styles.textColor = [185, 28, 28]; // Red
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (text === 'Pendente') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
          data.cell.styles.fillColor = [254, 243, 199];
        }
      }
    },
    didDrawPage: (data) => {
      // Rodapé em todas as páginas
      const footerY = pageHeight - 10;

      // Barra de cores inferior de Pernambuco
      doc.setFillColor(37, 99, 235);
      doc.rect(marginX, footerY - 3, segmentW, 1, 'F');
      doc.setFillColor(220, 38, 38);
      doc.rect(marginX + segmentW, footerY - 3, segmentW, 1, 'F');
      doc.setFillColor(234, 179, 8);
      doc.rect(marginX + segmentW * 2, footerY - 3, segmentW, 1, 'F');
      doc.setFillColor(22, 163, 74);
      doc.rect(marginX + segmentW * 3, footerY - 3, segmentW, 1, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'AIAPE • Associação dos Instrutores de Trânsito Autônomos de Pernambuco  —  Educação • Responsabilidade • Segurança no Trânsito',
        marginX,
        footerY + 2
      );

      const pageNumber = `Página ${data.pageNumber}`;
      doc.text(pageNumber, pageWidth - marginX, footerY + 2, { align: 'right' });
    }
  });

  // 5. Bloco de Assinaturas da Diretoria no final do relatório
  if (includeSignatures) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;

    // Se não couber na página atual, adiciona uma nova
    if (finalY + 30 > pageHeight - 20) {
      doc.addPage();
      const newPageY = 30;
      drawSignatures(doc, newPageY, marginX, pageWidth, config);
    } else {
      drawSignatures(doc, finalY, marginX, pageWidth, config);
    }
  }

  // Nome do arquivo com timestamp
  const dateStamp = now.toISOString().slice(0, 10);
  const cleanPrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanPrefix}_${dateStamp}.pdf`;

  // Gera Blob URL para pré-visualização ou download
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    doc,
    blobUrl,
    fileName,
    totalAssociates: associates.length
  };
}

function drawSignatures(
  doc: jsPDF,
  startY: number,
  marginX: number,
  pageWidth: number,
  config: AssociationConfig
) {
  const sigWidth = 80;
  const col1X = marginX + 20;
  const col2X = pageWidth - marginX - sigWidth - 20;

  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.setLineWidth(0.4);

  // Linha 1: Presidente
  doc.line(col1X, startY + 12, col1X + sigWidth, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(config.president || 'Presidente do Conselho Diretor', col1X + sigWidth / 2, startY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Diretoria Executiva AIAPE', col1X + sigWidth / 2, startY + 20, { align: 'center' });

  // Linha 2: Tesoureiro
  doc.line(col2X, startY + 12, col2X + sigWidth, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(config.treasurer || 'Tesoureiro Geral / Conselho Fiscal', col2X + sigWidth / 2, startY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Departamento Financeiro AIAPE', col2X + sigWidth / 2, startY + 20, { align: 'center' });
}
