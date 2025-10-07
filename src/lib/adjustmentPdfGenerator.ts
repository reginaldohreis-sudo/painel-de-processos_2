import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AdjustmentBatch, Product, Employee } from '@/types';
import { formatTime } from '@/lib/utils';

// Helper to add a footer to each page
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${pageNumber} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
};

export const generateAdjustmentReport = async (
    batch: AdjustmentBatch,
    product: Product,
    allEmployees: Employee[]
) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 40;
    let cursorY = margin;

    const totalPlanned = batch.assignments.reduce((sum, a) => sum + a.quantity, 0);
    const totalReal = batch.assignments.reduce((sum, a) => sum + (a.realQuantity || 0), 0);
    const responsibleEmployees = allEmployees
        .filter(emp => batch.assignments.some(a => a.employeeId === emp.id))
        .map(e => e.name)
        .join(', ');

    // --- DOCUMENT STYLING & HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text(`Relatório de Ajustagem`, margin, cursorY);
    cursorY += 25;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, cursorY);
    cursorY += 30;

    // --- TABLES ---
    const tableConfig = {
        theme: 'striped' as const,
        headStyles: { fillColor: [44, 62, 80] as [number, number, number] },
        margin: { left: margin, right: margin },
    };

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Informação Geral', 'Detalhe']],
        body: [
            ['Atividade', batch.name],
            ['ID da Atividade', `#${batch.id}`],
            ['Produto', product.name],
            ['Responsáveis', responsibleEmployees],
            ['Data de Início', format(new Date(batch.startDate), "dd/MM/yyyy")],
            ['Entrega Estimada', format(new Date(batch.deliveryDate), "dd/MM/yyyy")],
        ],
    });
    cursorY = (doc as any).lastAutoTable.finalY + 25;

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Métrica de Desempenho', 'Planejado', 'Realizado', 'Progresso']],
        body: [
            ['Quantidade de Peças', `${totalPlanned} un.`, `${totalReal} un.`, `${batch.progress}%`],
            ['Tempo de Produção', formatTime(batch.plannedTime), formatTime(batch.realTime), ''],
        ],
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 30;

    // --- Desempenho por Funcionário ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text('Desempenho por Funcionário', margin, cursorY);
    cursorY += 20;

    const employeePerformanceBody = batch.assignments.map(assignment => {
        const employee = allEmployees.find(e => e.id === assignment.employeeId);
        return [
            employee?.name || 'Desconhecido',
            assignment.quantity.toString(),
            (assignment.realQuantity || 0).toString(),
        ];
    });

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Funcionário', 'Qtde. Planejada', 'Qtde. Concluída']],
        body: employeePerformanceBody,
    });
    cursorY = (doc as any).lastAutoTable.finalY + 25;


    // --- FOOTER & SAVE ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }

    doc.save(`relatorio-ajustagem-${batch.name.replace(/\s/g, '_')}-${batch.id}.pdf`);
};
