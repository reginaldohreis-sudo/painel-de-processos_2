import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Eye, Edit, Download, Loader2 } from "lucide-react";
import type { AdjustmentBatch, Product, Employee } from "@/types";
import { formatTime, getInitials } from "@/lib/utils";
import { generateAdjustmentReport } from '@/lib/adjustmentPdfGenerator';

interface AdjustmentCardProps {
    batch: AdjustmentBatch;
    product?: Product;
    allEmployees: Employee[];
    onView: (batch: AdjustmentBatch) => void;
    onEdit: (batch: AdjustmentBatch) => void;
}

const AvatarStack = ({ employees }: { employees: Employee[] }) => {
    const visibleEmployees = employees.slice(0, 3);
    const hiddenCount = employees.length - visibleEmployees.length;

    return (
        <div className="flex -space-x-2 overflow-hidden">
            {visibleEmployees.map(emp => (
                <Avatar key={emp.id} className="h-8 w-8 ring-2 ring-background">
                    <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                </Avatar>
            ))}
            {hiddenCount > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-muted text-muted-foreground text-xs font-medium">
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};

export function AdjustmentCard({ batch, product, allEmployees, onView, onEdit }: AdjustmentCardProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const responsibleEmployees = useMemo(() => {
        const employeeIds = new Set<string>(batch.assignments.map(a => a.employeeId));
        return allEmployees.filter(emp => employeeIds.has(emp.id));
    }, [batch, allEmployees]);

    const totalPlanned = useMemo(() => batch.assignments.reduce((sum, a) => sum + a.quantity, 0), [batch.assignments]);
    const totalReal = useMemo(() => batch.assignments.reduce((sum, a) => sum + (a.realQuantity || 0), 0), [batch.assignments]);

    const getStatusVariant = (status: AdjustmentBatch['status']): "success" | "warning" | "default" | "destructive" => {
        switch (status) {
            case 'Concluído': return 'success';
            case 'Em Produção': return 'warning';
            case 'Atrasado': return 'destructive';
            default: return 'default';
        }
    };

    const handleGeneratePdf = async () => {
        if (!product) {
            alert("Dados do relatório incompletos.");
            return;
        }
        setIsGeneratingPdf(true);
        try {
            await generateAdjustmentReport(batch, product, responsibleEmployees);
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("Ocorreu um erro ao gerar o relatório em PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <h3 className="text-lg font-bold text-foreground capitalize" title={batch.name}>{batch.name}</h3>
                        <span className="text-[10px] font-mono text-muted-foreground/60">ID: #{batch.id}</span>
                    </div>
                    <Badge variant={getStatusVariant(batch.status)} className="flex-shrink-0">{batch.status}</Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <AvatarStack employees={responsibleEmployees} />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Início:</span>
                        <span className="font-medium">{new Date(batch.startDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrega (Prev.):</span>
                        <span className="font-medium">{new Date(batch.deliveryDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div>
                    <Progress value={batch.progress} />
                    <div className="flex justify-end text-xs text-muted-foreground mt-1">
                        <span>{batch.progress}%</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center border-t border-b border-border py-3">
                    <StatItem value={`${totalReal}/${totalPlanned}`} label="Peças" />
                    <StatItem value={formatTime(batch.realTime)} label="Tempo Gasto" />
                </div>
            </CardContent>
            <CardFooter className="border-t border-border p-2">
                <div className="flex w-full justify-end space-x-1">
                    <Button onClick={() => onView(batch)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => onEdit(batch)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleGeneratePdf} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

const StatItem = ({ value, label }: { value: string | number, label: string }) => (
    <div>
        <div className="text-lg font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);
