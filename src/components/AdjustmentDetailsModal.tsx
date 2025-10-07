import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import type { AdjustmentBatch, Product, Employee, Assignment } from '@/types';
import { formatTime } from '@/lib/utils';

interface AdjustmentDetailsModalProps {
    batch: AdjustmentBatch;
    isOpen: boolean;
    onClose: () => void;
    onUpdateRealData: (batchId: string, updates: { assignments: Assignment[]; realTime: number }) => void;
    product?: Product;
    allEmployees: Employee[];
}

const ComparisonItem = ({ title, real, estimated }: { title: string, real: string, estimated: string }) => (
    <div className="bg-muted/50 p-3 rounded-md">
        <h5 className="text-sm font-medium text-muted-foreground mb-2">{title}</h5>
        <div className="flex justify-around items-baseline">
            <div className="text-center">
                <p className="text-lg font-bold text-primary">{real}</p>
                <p className="text-xs text-primary/80">Real</p>
            </div>
            <div className="text-center">
                <p className="text-lg font-bold text-muted-foreground">{estimated}</p>
                <p className="text-xs text-muted-foreground/80">Previsto</p>
            </div>
        </div>
    </div>
);

export function AdjustmentDetailsModal({ batch, isOpen, onClose, onUpdateRealData, product, allEmployees }: AdjustmentDetailsModalProps) {
    const [updatedAssignments, setUpdatedAssignments] = useState<Assignment[]>(JSON.parse(JSON.stringify(batch.assignments)));
    const [realTime, setRealTime] = useState(batch.realTime);

    useEffect(() => {
        setUpdatedAssignments(JSON.parse(JSON.stringify(batch.assignments)));
        setRealTime(batch.realTime);
    }, [batch]);

    const handleSave = () => {
        onUpdateRealData(batch.id, {
            assignments: updatedAssignments,
            realTime: Number(realTime)
        });
        onClose();
    };

    const handleRealQuantityChange = (assignmentIndex: number, value: number) => {
        const newAssignments = [...updatedAssignments];
        const assignment = newAssignments[assignmentIndex];
        const validatedValue = Math.max(0, Math.min(value, assignment.quantity));
        assignment.realQuantity = validatedValue;
        setUpdatedAssignments(newAssignments);
    };

    const totalPlanned = useMemo(() => batch.assignments.reduce((sum, a) => sum + a.quantity, 0), [batch.assignments]);
    const totalReal = useMemo(() => batch.assignments.reduce((sum, a) => sum + (a.realQuantity || 0), 0), [batch.assignments]);

    const responsibleEmployees = useMemo(() => {
        const employeeIds = new Set<string>(batch.assignments.map(a => a.employeeId));
        return allEmployees.filter(emp => employeeIds.has(emp.id)).map(e => e.name).join(', ');
    }, [batch, allEmployees]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalhes da Ajustagem: {batch.name}</DialogTitle>
                    <DialogDescription>
                        ID: #{batch.id} | Produto: {product?.name || 'N/A'} | Responsáveis: {responsibleEmployees}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-3 gap-4">
                        <ComparisonItem 
                            title="Tempo Gasto" 
                            real={formatTime(batch.realTime)} 
                            estimated={formatTime(batch.plannedTime)} 
                        />
                        <ComparisonItem 
                            title="Peças Produzidas" 
                            real={`${totalReal}`} 
                            estimated={`${totalPlanned}`} 
                        />
                        <div className="bg-muted/50 p-3 rounded-md flex flex-col items-center justify-center">
                            <h5 className="text-sm font-medium text-muted-foreground mb-1">Progresso Real</h5>
                            <p className="text-2xl font-bold text-primary">{`${batch.progress}%`}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold text-foreground">Lançar Produção Real</h4>
                         <div className="space-y-3">
                            {updatedAssignments.map((a, aIndex) => {
                                const employee = allEmployees.find(emp => emp.id === a.employeeId);
                                return (
                                    <div key={aIndex} className="grid grid-cols-3 items-center gap-4">
                                        <div className="col-span-2">
                                            <Label className="text-sm font-normal text-muted-foreground">
                                                {employee?.name || 'Desconhecido'}
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                value={a.realQuantity || ''}
                                                onChange={(e) => handleRealQuantityChange(aIndex, Number(e.target.value))}
                                                className="w-24 h-9 text-center"
                                                max={a.quantity}
                                                min={0}
                                            />
                                            <span className="text-sm text-muted-foreground">/ {a.quantity}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="grid grid-cols-1 gap-4 pt-4">
                            <div>
                                <Label htmlFor="realTime">Tempo Real Total (h)</Label>
                                <Input id="realTime" type="number" value={realTime} onChange={(e) => setRealTime(Number(e.target.value))} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
