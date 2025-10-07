import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button, buttonVariants } from "@/components/ui/Button";
import { Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { NozzleFormModal } from '@/components/NozzleFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import type { Nozzle } from '@/types';

export function NozzlesPage() {
    const { nozzles, saveNozzle, deleteNozzle } = useData();
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [editingNozzle, setEditingNozzle] = useState<Nozzle | null>(null);
    const [deletingNozzle, setDeletingNozzle] = useState<Nozzle | null>(null);

    const sortedNozzles = useMemo(() => 
        [...nozzles].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })), 
    [nozzles]);

    const handleAddNew = () => {
        setEditingNozzle(null);
        setFormModalOpen(true);
    };

    const handleEdit = (nozzle: Nozzle) => {
        setEditingNozzle(nozzle);
        setFormModalOpen(true);
    };

    const handleDeleteClick = (nozzle: Nozzle) => {
        setDeletingNozzle(nozzle);
        setDeleteAlertOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingNozzle) return;
        deleteNozzle(deletingNozzle.id);
        setDeleteAlertOpen(false);
        setDeletingNozzle(null);
    };

    const handleSave = (nozzleData: Nozzle) => {
        saveNozzle(nozzleData);
        setFormModalOpen(false);
        setEditingNozzle(null);
    };

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-foreground">Bicos</h2>
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Bico
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6">
                            <div className="col-span-1">Nome do Bico</div>
                            <div className="col-span-1">Vazão (g/s)</div>
                            <div className="col-span-1 text-right">Ações</div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {sortedNozzles.map((nozzle) => (
                                <div key={nozzle.id} className="grid grid-cols-3 gap-4 items-center px-6 py-4 hover:bg-accent transition-colors">
                                    <div className="col-span-1 text-sm font-medium text-foreground capitalize">{nozzle.name}</div>
                                    <div className="col-span-1 text-sm text-muted-foreground">{nozzle.flowRate} g/s</div>
                                    <div className="col-span-1 flex justify-end items-center space-x-2">
                                        <Button onClick={() => handleEdit(nozzle)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button onClick={() => handleDeleteClick(nozzle)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isFormModalOpen && (
                <NozzleFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSave}
                    nozzle={editingNozzle}
                />
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o bico <span className="font-bold capitalize">"{deletingNozzle?.name}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingNozzle(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
