import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/Button';
import { AdjustmentCard } from '@/components/AdjustmentCard';
import { AdjustmentDetailsModal } from '@/components/AdjustmentDetailsModal';
import { AdjustmentFormModal } from '@/components/AdjustmentFormModal';
import { Plus } from 'lucide-react';
import type { AdjustmentBatch } from '@/types';

export function AdjustmentPage() {
    const { adjustmentBatches, products, employees, saveAdjustmentBatch, updateAdjustmentBatchRealData } = useData();
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<AdjustmentBatch | null>(null);

    const handleViewBatch = (batch: AdjustmentBatch) => {
        setSelectedBatch(batch);
        setDetailsModalOpen(true);
    };

    const handleEditBatch = (batch: AdjustmentBatch) => {
        setSelectedBatch(batch);
        setFormModalOpen(true);
    };

    const handleCreateBatch = () => {
        setSelectedBatch(null);
        setFormModalOpen(true);
    };

    const handleSave = (data: AdjustmentBatch) => {
        saveAdjustmentBatch(data);
        setFormModalOpen(false);
        setSelectedBatch(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-foreground">Visão Geral de Ajustagem</h2>
                <Button onClick={handleCreateBatch}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Nova Ajustagem
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {adjustmentBatches.map(batch => (
                    <AdjustmentCard 
                        key={batch.id} 
                        batch={batch} 
                        product={products.find(p => p.id === batch.productId)}
                        allEmployees={employees}
                        onView={handleViewBatch}
                        onEdit={handleEditBatch}
                    />
                ))}
            </div>

            {isDetailsModalOpen && selectedBatch && (
                <AdjustmentDetailsModal
                    batch={selectedBatch}
                    isOpen={isDetailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    onUpdateRealData={updateAdjustmentBatchRealData}
                    product={products.find(p => p.id === selectedBatch.productId)}
                    allEmployees={employees}
                />
            )}

            {isFormModalOpen && (
                 <AdjustmentFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => { setFormModalOpen(false); setSelectedBatch(null); }}
                    onSave={handleSave}
                    batch={selectedBatch}
                    products={products}
                    employees={employees}
                />
            )}
        </div>
    );
}
