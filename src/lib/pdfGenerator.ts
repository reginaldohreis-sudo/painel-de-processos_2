import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import type { Batch, Product, Nozzle, Employee } from '@/types';
import { calculateBatchEstimates, formatTime } from '@/lib/utils';

// Helper to add a footer to each page
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${pageNumber} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
};

export const generateDetailedReport = async (
    batch: Batch,
    allProducts: Product[],
    allNozzles: Nozzle[],
    allEmployees: Employee[]
) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let cursorY = margin;

    // --- 1. DATA CALCULATION ---
    const { 
        totalItems, 
        estimatedTimeHours, 
        estimatedInputKg,
        estimatedOxygenL,
        estimatedAcetyleneL,
        oxygenCylinders: estimatedOxygenCylinders,
        acetyleneCylinders: estimatedAcetyleneCylinders,
    } = calculateBatchEstimates(batch, allProducts, allNozzles);

    const totalProduced = batch.products.reduce((sum, p) => sum + p.assignments.reduce((as, a) => as + (a.realQuantity || 0), 0), 0);
    const realTimeHours = batch.realProductionTime || 0;
    const realInputKg = batch.realInputKg || 0;
    const responsibleEmployees = allEmployees
        .filter(emp => batch.products.some(p => p.assignments.some(a => a.employeeId === emp.id)))
        .map(e => e.name)
        .join(', ');
    const nozzle = allNozzles.find(n => n.id === batch.nozzleId);

    // --- 2. DOCUMENT STYLING & HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text(`Relatório do Lote: ${batch.name}`, margin, cursorY);
    cursorY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, cursorY);
    cursorY += 30;

    // --- 3. TABLES ---
    const tableConfig = {
        theme: 'striped' as const,
        headStyles: { fillColor: [44, 62, 80] as [number, number, number] },
        margin: { left: margin, right: margin },
    };

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Informação', 'Detalhe']],
        body: [
            ['Status', batch.status],
            ['Responsáveis', responsibleEmployees],
            ['Bico Utilizado', `${nozzle?.name.toUpperCase() || 'N/A'} (${nozzle?.flowRate || 0} g/s)`],
            ['Data de Início', format(new Date(batch.startDate), "dd/MM/yyyy")],
            ['Entrega Estimada', format(new Date(batch.deliveryDate), "dd/MM/yyyy")],
        ],
    });
    cursorY = (doc as any).lastAutoTable.finalY + 20;

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Métrica', 'Valor']],
        body: [
            ['Itens (Concluídos / Total)', `${totalProduced} / ${totalItems} un.`],
            ['Tempo Gasto (Real / Previsto)', `${formatTime(realTimeHours)} / ${formatTime(estimatedTimeHours)}`],
            ['Insumo Gasto (Real / Previsto)', `${realInputKg.toFixed(1)} / ${estimatedInputKg.toFixed(1)} kg`],
        ],
    });
    cursorY = (doc as any).lastAutoTable.finalY + 20;

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Consumo de Gás Estimado (Total)', 'Cilindros', 'Litros']],
        body: [
            ['Oxigênio', `${estimatedOxygenCylinders} cil.`, `${estimatedOxygenL.toFixed(2)} L`],
            ['Acetileno', `${estimatedAcetyleneCylinders} cil.`, `${estimatedAcetyleneL.toFixed(2)} L`],
        ],
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 30;

    // --- 3.1. Resumo Geral por Produto ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text('Resumo Geral por Produto', margin, cursorY);
    cursorY += 20;

    const summaryProductBody = batch.products.map(bp => {
        const productInfo = allProducts.find(p => p.id === bp.productId);
        const totalPlanned = bp.assignments.reduce((sum, a) => sum + a.quantity, 0);
        const totalReal = bp.assignments.reduce((sum, a) => sum + (a.realQuantity || 0), 0);
        return [
            productInfo?.name || 'Desconhecido',
            totalPlanned.toString(),
            totalReal.toString(),
        ];
    });

    autoTable(doc, {
        ...tableConfig,
        startY: cursorY,
        head: [['Produto', 'Qtde. Planejada', 'Qtde. Concluída']],
        body: summaryProductBody,
    });
    cursorY = (doc as any).lastAutoTable.finalY + 30;

    // --- 3.2. Desempenho por Funcionário ---
    if (cursorY > pageHeight - 200) { // Check space before starting the new section
        doc.addPage();
        cursorY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text('Desempenho por Funcionário', margin, cursorY);
    cursorY += 20;

    const responsibleEmployeeObjects = allEmployees.filter(emp => 
        batch.products.some(p => 
            p.assignments.some(a => a.employeeId === emp.id)
        )
    );

    for (const employee of responsibleEmployeeObjects) {
        const employeeAssignments = batch.products.map(bp => {
            const assignment = bp.assignments.find(a => a.employeeId === employee.id);
            if (!assignment) return null;
            const productInfo = allProducts.find(p => p.id === bp.productId);
            return [
                productInfo?.name || 'Desconhecido',
                assignment.quantity.toString(),
                (assignment.realQuantity || 0).toString()
            ];
        }).filter((row): row is string[] => row !== null);

        if (employeeAssignments.length > 0) {
            const estimatedTableHeight = 40 + (employeeAssignments.length * 20);
            if (cursorY + estimatedTableHeight > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(80);
            doc.text(employee.name, margin, cursorY);
            cursorY += 18;

            autoTable(doc, {
                ...tableConfig,
                startY: cursorY,
                head: [['Produto', 'Qtde. Planejada', 'Qtde. Concluída']],
                body: employeeAssignments,
            });

            cursorY = (doc as any).lastAutoTable.finalY + 25;
        }
    }

    // --- 4. GRAPHS ---
    const graphElementId = `report-graphs-${batch.id}`;
    const graphContainer = document.getElementById(graphElementId);
    if (graphContainer) {
        if (cursorY > pageHeight / 2.5) { // Add a page break if not enough space
            doc.addPage();
            cursorY = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        doc.text('Gráficos de Desempenho', margin, cursorY);
        cursorY += 20;

        const canvas = await html2canvas(graphContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            windowWidth: graphContainer.scrollWidth,
            windowHeight: graphContainer.scrollHeight,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (cursorY + imgHeight > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        doc.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
    }

    // --- 5. FOOTER & SAVE ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }

    doc.save(`relatorio-lote-${batch.name.replace(/\s/g, '_')}-${batch.id}.pdf`);
};
