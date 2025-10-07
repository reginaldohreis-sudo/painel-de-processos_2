import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import type { Batch, Product, Nozzle, Employee, BatchProductDetail } from '@/types';
import { calculateBatchEstimates, calculateRealGasConsumption, formatTime } from '@/lib/utils';

interface BatchDetailsModalProps {
    batch: Batch;
    isOpen: boolean;
    onClose: () => void;
    onUpdateRealData: (batchId: string, updates: { products: BatchProductDetail[], realProductionTime: number; realInputKg: number }) => void;
    allProducts: Product[];
    allNozzles: Nozzle[];
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

export function BatchDetailsModal({ batch, isOpen, onClose, onUpdateRealData, allProducts, allNozzles, allEmployees }: BatchDetailsModalProps) {
    const { estimatedTimeHours, estimatedInputKg, estimatedOxygenL, estimatedAcetyleneL } = calculateBatchEstimates(batch, allProducts, allNozzles);
    const { realOxygenL, realAcetyleneL } = calculateRealGasConsumption(batch.realProductionTime || 0);
    
    const nozzle = allNozzles.find(n => n.id === batch.nozzleId);

    const [updatedProducts, setUpdatedProducts] = useState<BatchProductDetail[]>(JSON.parse(JSON.stringify(batch.products)));
    const [realTime, setRealTime] = useState(batch.realProductionTime || 0);
    const [realInput, setRealInput] = useState(batch.realInputKg || 0);

    useEffect(() => {
        setUpdatedProducts(JSON.parse(JSON.stringify(batch.products)));
        setRealTime(batch.realProductionTime || 0);
        setRealInput(batch.realInputKg || 0);
    }, [batch]);

    const handleRealQuantityChange = (productIndex: number, assignmentIndex: number, value: number) => {
        const newProducts = [...updatedProducts];
        const assignment = newProducts[productIndex].assignments[assignmentIndex];
        
        // Garante que o valor não seja negativo nem maior que o planejado.
        const validatedValue = Math.max(0, Math.min(value, assignment.quantity));
        
        assignment.realQuantity = validatedValue;
        setUpdatedProducts(newProducts);
    };

    const handleSave = () => {
        onUpdateRealData(batch.id, {
            products: updatedProducts,
            realProductionTime: Number(realTime),
            realInputKg: Number(realInput)
        });
        onClose();
    };

    const responsibleEmployees = useMemo(() => {
        const employeeIds = new Set<string>();
        batch.products.forEach(p => {
            p.assignments.forEach(a => employeeIds.add(a.employeeId));
        });
        return allEmployees.filter(emp => employeeIds.has(emp.id)).map(e => e.name).join(', ');
    }, [batch, allEmployees]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Detalhes do Lote: {batch.name}</DialogTitle>
                    <DialogDescription>
                        ID: #{batch.id} | Bico: {nozzle?.name || 'N/A'} | Responsáveis: {responsibleEmployees}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-3 gap-4">
                        <ComparisonItem 
                            title="Tempo Gasto" 
                            real={formatTime(batch.realProductionTime || 0)} 
                            estimated={formatTime(estimatedTimeHours)} 
                        />
                        <ComparisonItem 
                            title="Insumo Gasto (kg)" 
                            real={`${(batch.realInputKg || 0).toFixed(1)}`} 
                            estimated={`${estimatedInputKg.toFixed(1)}`} 
                        />
                        <div className="bg-muted/50 p-3 rounded-md flex flex-col items-center justify-center">
                            <h5 className="text-sm font-medium text-muted-foreground mb-1">Progresso Real</h5>
                            <p className="text-2xl font-bold text-primary">{`${batch.progress}%`}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <ComparisonItem 
                            title="Oxigênio (L)" 
                            real={realOxygenL.toFixed(2)} 
                            estimated={estimatedOxygenL.toFixed(2)} 
                        />
                        <ComparisonItem 
                            title="Acetileno (L)" 
                            real={realAcetyleneL.toFixed(2)} 
                            estimated={estimatedAcetyleneL.toFixed(2)} 
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold text-foreground">Lançar Produção Real</h4>
                        <div className="space-y-3">
                            {updatedProducts.map((p, pIndex) => {
                                const product = allProducts.find(prod => prod.id === p.productId);
                                return p.assignments.map((a, aIndex) => {
                                    const employee = allEmployees.find(emp => emp.id === a.employeeId);
                                    return (
                                        <div key={`${pIndex}-${aIndex}`} className="grid grid-cols-3 items-center gap-4">
                                            <div className="col-span-2">
                                                <Label className="text-sm font-normal text-muted-foreground">
                                                    {employee?.name || 'Desconhecido'} / <span className="font-medium text-foreground capitalize">{product?.name || 'Produto'}</span>
                                                </Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    type="number" 
                                                    value={a.realQuantity || ''}
                                                    onChange={(e) => handleRealQuantityChange(pIndex, aIndex, Number(e.target.value))}
                                                    className="w-24 h-9 text-center"
                                                    max={a.quantity}
                                                    min={0}
                                                />
                                                <span className="text-sm text-muted-foreground">/ {a.quantity}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            })}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <Label htmlFor="realTime">Tempo Real Total (h)</Label>
                                <Input id="realTime" type="number" value={realTime} onChange={(e) => setRealTime(Number(e.target.value))} />
                            </div>
                            <div>
                                <Label htmlFor="realInput">Insumo Real Total (kg)</Label>
                                <Input id="realInput" type="number" value={realInput} onChange={(e) => setRealInput(Number(e.target.value))} />
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
