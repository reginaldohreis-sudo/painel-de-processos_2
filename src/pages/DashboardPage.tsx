import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/Button';
import { BatchCard } from '@/components/BatchCard';
import { BatchDetailsModal } from '@/components/BatchDetailsModal';
import { BatchFormModal } from '@/components/BatchFormModal';
import { Plus } from 'lucide-react';
import type { Batch } from '@/types';

export function DashboardPage() {
    const { batches, products, nozzles, employees, saveBatch, updateBatchRealData } = useData();
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

    const handleViewBatch = (batch: Batch) => {
        setSelectedBatch(batch);
        setDetailsModalOpen(true);
    };

    const handleEditBatch = (batch: Batch) => {
        setSelectedBatch(batch);
        setFormModalOpen(true);
    };

    const handleCreateBatch = () => {
        setSelectedBatch(null);
        setFormModalOpen(true);
    };

    const handleSave = (data: Batch) => {
        saveBatch(data);
        setFormModalOpen(false);
        setSelectedBatch(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-foreground">Visão Geral dos Lotes</h2>
                <Button onClick={handleCreateBatch}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Lote
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {batches.map(batch => (
                    <BatchCard 
                        key={batch.id} 
                        batch={batch} 
                        allProducts={products} 
                        allNozzles={nozzles}
                        allEmployees={employees}
                        onView={handleViewBatch}
                        onEdit={handleEditBatch}
                    />
                ))}
            </div>

            {isDetailsModalOpen && selectedBatch && (
                <BatchDetailsModal
                    batch={selectedBatch}
                    isOpen={isDetailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    onUpdateRealData={updateBatchRealData}
                    allProducts={products}
                    allNozzles={nozzles}
                    allEmployees={employees}
                />
            )}

            {isFormModalOpen && (
                 <BatchFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => { setFormModalOpen(false); setSelectedBatch(null); }}
                    onSave={handleSave}
                    batch={selectedBatch}
                    products={products}
                    employees={employees}
                    nozzles={nozzles}
                />
            )}
        </div>
    );
}
