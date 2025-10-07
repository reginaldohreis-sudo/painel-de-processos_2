import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Trash2, ChevronDown, Edit, UserPlus } from "lucide-react";
import { Badge } from '@/components/ui/Badge';
import type { Employee, Batch, AdjustmentBatch } from '@/types';
import { getInitials } from '@/lib/utils';
import { EmployeeFormModal } from '@/components/EmployeeFormModal';

type AssignedTask = {
    id: string;
    name: string;
    productNames: string;
    deliveryDate: Date;
    status: 'Planejado' | 'Em Produção' | 'Concluído' | 'Atrasado';
    type: 'Asperção' | 'Ajustagem';
};

const dayMap: { [key: number]: string } = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };
const formatWorkingDays = (days: number[]) => {
    if (!days || days.length === 0) return 'Nenhum dia definido';
    if (days.length === 7) return 'Todos os dias';
    if (days.length === 5 && days.every(d => [1,2,3,4,5].includes(d))) return 'Seg-Sex';
    return days.sort().map(d => dayMap[d]).join(', ');
};

export function EmployeesPage() {
    const { employees, batches, adjustmentBatches, products, saveEmployee, deleteEmployee, updateBatchStatus } = useData();
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

    const handleAddNew = () => {
        setEditingEmployee(null);
        setFormModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormModalOpen(true);
    };

    const handleDeleteClick = (employee: Employee) => {
        setDeletingEmployee(employee);
        setDeleteAlertOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingEmployee) return;
        deleteEmployee(deletingEmployee.id);
        setDeleteAlertOpen(false);
        setDeletingEmployee(null);
    };

    const handleSave = (employeeData: Employee) => {
        saveEmployee(employeeData);
        setFormModalOpen(false);
        setEditingEmployee(null);
    };

    const getAssignedTasks = (employeeId: string): AssignedTask[] => {
        const aspercaoTasks: AssignedTask[] = batches
            .filter(batch => batch.products.some(p => p.assignments.some(a => a.employeeId === employeeId)))
            .map(batch => ({
                id: batch.id,
                name: batch.name,
                productNames: batch.products
                    .map(bp => products.find(p => p.id === bp.productId)?.name)
                    .filter(Boolean)
                    .join(', '),
                deliveryDate: batch.deliveryDate,
                status: batch.status,
                type: 'Asperção' as const,
            }));

        const ajustagemTasks: AssignedTask[] = adjustmentBatches
            .filter(batch => batch.assignments.some(a => a.employeeId === employeeId))
            .map(batch => ({
                id: batch.id,
                name: batch.name,
                productNames: products.find(p => p.id === batch.productId)?.name || 'N/A',
                deliveryDate: batch.deliveryDate,
                status: batch.status,
                type: 'Ajustagem' as const,
            }));
        
        return [...aspercaoTasks, ...ajustagemTasks].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
    };


    const getStatusVariant = (status: Batch['status']): string => {
        switch (status) {
            case 'Concluído': return 'bg-green-600/20 text-green-400';
            case 'Em Produção': return 'bg-yellow-500/20 text-yellow-400';
            case 'Atrasado': return 'bg-red-600/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-foreground">Gerenciar Funcionários</h2>
                     <Button onClick={handleAddNew}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Funcionário
                    </Button>
                </div>

                <div className="space-y-4">
                    {employees.map((employee) => (
                        <Collapsible key={employee.id} className="border rounded-lg">
                            <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <span className="font-medium">{employee.name}</span>
                                        <div className="text-xs text-muted-foreground">
                                            {employee.hoursPerDay}h/dia • {formatWorkingDays(employee.workingDays)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button onClick={() => handleEdit(employee)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={() => handleDeleteClick(employee)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                                            <ChevronDown className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-180" />
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                            </div>
                            <CollapsibleContent className="border-t">
                                <EmployeeTaskList 
                                    employeeId={employee.id} 
                                    getAssignedTasks={getAssignedTasks}
                                    handleStatusChange={updateBatchStatus}
                                    getStatusVariant={getStatusVariant}
                                />
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </div>
            
            {isFormModalOpen && (
                <EmployeeFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSave}
                    employee={editingEmployee}
                />
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o funcionário <span className="font-bold">"{deletingEmployee?.name}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingEmployee(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

interface EmployeeTaskListProps {
    employeeId: string;
    getAssignedTasks: (employeeId: string) => AssignedTask[];
    handleStatusChange: (batchId: string, newStatus: Batch['status']) => void;
    getStatusVariant: (status: Batch['status']) => string;
}

function EmployeeTaskList({ employeeId, getAssignedTasks, handleStatusChange, getStatusVariant }: EmployeeTaskListProps) {
    const assignedTasks = useMemo(() => getAssignedTasks(employeeId), [employeeId, getAssignedTasks]);

    if (assignedTasks.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhuma atividade atribuída a este funcionário.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                        <th className="p-4 font-medium">Atividade</th>
                        <th className="p-4 font-medium">Tipo</th>
                        <th className="p-4 font-medium">Produto(s)</th>
                        <th className="p-4 font-medium">Entrega</th>
                        <th className="p-4 font-medium text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {assignedTasks.map(task => (
                        <tr key={task.id} className="border-b last:border-none hover:bg-accent/50">
                            <td className="p-4">
                                <div className="font-medium capitalize">{task.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">#{task.id}</div>
                            </td>
                            <td className="p-4">
                                <Badge variant={task.type === 'Asperção' ? 'info' : 'special'}>{task.type}</Badge>
                            </td>
                            <td className="p-4 capitalize">{task.productNames}</td>
                            <td className="p-4">{new Date(task.deliveryDate).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4">
                                <Select value={task.status} onValueChange={(newStatus: Batch['status']) => handleStatusChange(task.id, newStatus)}>
                                    <SelectTrigger className={`h-8 text-xs w-36 mx-auto ${getStatusVariant(task.status)} border-0 focus:ring-0`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Planejado">Planejado</SelectItem>
                                        <SelectItem value="Em Produção">Em Produção</SelectItem>
                                        <SelectItem value="Concluído">Concluído</SelectItem>
                                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
