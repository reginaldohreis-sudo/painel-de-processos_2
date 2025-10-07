import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Calendar } from "@/components/ui/Calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { cn, calculateDeliveryDate } from "@/lib/utils"

import type { AdjustmentBatch, Product, Employee } from '@/types';

const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Obrigatório"),
  quantity: z.number().min(1, "Inválido"),
});

const formSchema = z.object({
    id: z.string().min(1, 'O ID da atividade é obrigatório.'),
    name: z.string().min(1, 'O nome é obrigatório.'),
    productId: z.string().min(1, 'Selecione um produto.'),
    startDate: z.date({ required_error: "A data de início é obrigatória."}),
    assignments: z.array(assignmentSchema).min(1, "Adicione um responsável."),
});

type FormValues = z.infer<typeof formSchema>;

interface AdjustmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    batch?: AdjustmentBatch | null;
    products: Product[];
    employees: Employee[];
}

export function AdjustmentFormModal({ isOpen, onClose, onSave, batch, products, employees }: AdjustmentFormModalProps) {
    const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: '',
            name: '',
            productId: '',
            startDate: new Date(),
            assignments: [],
        }
    });

    const { fields: assignmentFields, append: appendAssignment, remove: removeAssignment } = useFieldArray({
        control,
        name: "assignments"
    });

    const ajustagemProducts = useMemo(() => 
        products.filter(p => p.type === 'ajustagem'), 
    [products]);

    useEffect(() => {
        if (isOpen) {
            if (batch) {
                reset({
                    id: batch.id,
                    name: batch.name,
                    productId: batch.productId,
                    startDate: new Date(batch.startDate),
                    assignments: batch.assignments.map(a => ({ employeeId: a.employeeId, quantity: a.quantity })),
                });
            } else {
                reset({
                    id: '',
                    name: '',
                    productId: '',
                    startDate: new Date(),
                    assignments: [{ employeeId: '', quantity: 100 }],
                });
            }
        }
    }, [batch, reset, isOpen]);

    const onSubmit = (data: FormValues) => {
        const product = products.find(p => p.id === data.productId);
        const totalPlanned = data.assignments.reduce((sum, a) => sum + a.quantity, 0);
        const plannedTime = product ? (product.productionTime * totalPlanned) / 60 : 0;

        const deliveryDate = calculateDeliveryDate(data.startDate, plannedTime, data.assignments, employees);

        const finalData = {
            ...batch,
            id: data.id,
            name: data.name,
            productId: data.productId,
            assignments: data.assignments.map(a => ({ ...a, realQuantity: 0 })),
            plannedTime,
            realTime: batch?.realTime || 0,
            startDate: data.startDate,
            deliveryDate: deliveryDate,
            status: batch?.status || 'Planejado',
            progress: batch?.progress || 0,
        };
        onSave(finalData);
    };

    const sortedProducts = useMemo(() => 
        [...ajustagemProducts].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })), 
    [ajustagemProducts]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{batch ? 'Editar Ajustagem' : 'Criar Nova Ajustagem'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="id">ID da Atividade</Label>
                                <Input id="id" {...register('id')} />
                                {errors.id && <p className="text-xs text-red-500">{errors.id.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome da Atividade</Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Produto</Label>
                                <Controller name="productId" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>{sortedProducts.map(p => <SelectItem key={p.id} value={p.id} className="capitalize">{p.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                )}/>
                                {errors.productId && <p className="text-xs text-red-500">{errors.productId.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label>Data de Início</Label>
                                <Controller name="startDate" control={control} render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                                            <Calendar 
                                                mode="single" 
                                                selected={field.value} 
                                                onSelect={field.onChange} 
                                                initialFocus 
                                                locale={ptBR}
                                                captionLayout="dropdown-buttons"
                                                fromYear={2020}
                                                toYear={2030}
                                                onClear={() => setValue('startDate', new Date())}
                                                onToday={() => setValue('startDate', new Date())}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}/>
                                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                            <Label>Responsáveis</Label>
                            {assignmentFields.map((item, index) => (
                                <div key={item.id} className="flex items-start gap-2">
                                    <div className="grid gap-1 flex-grow">
                                        <Controller name={`assignments.${index}.employeeId`} control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="h-9"><SelectValue placeholder="Funcionário..." /></SelectTrigger>
                                                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        )}/>
                                        {errors.assignments?.[index]?.employeeId && <p className="text-xs text-red-500 mt-1">{errors.assignments?.[index]?.employeeId?.message}</p>}
                                    </div>
                                    <div className="grid gap-1">
                                        <Controller
                                            name={`assignments.${index}.quantity`}
                                            control={control}
                                            render={({ field }) => <Input type="number" placeholder="Qtd." className="h-9 w-24" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />}
                                        />
                                        {errors.assignments?.[index]?.quantity && <p className="text-xs text-red-500 mt-1">{errors.assignments?.[index]?.quantity?.message}</p>}
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeAssignment(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendAssignment({ employeeId: '', quantity: 50 })}>
                                <Plus className="mr-2 h-4 w-4" /> Atribuir
                            </Button>
                            {errors.assignments?.root && <p className="text-xs text-red-500">{errors.assignments.root.message}</p>}
                        </div>
                    </div>
                    <DialogFooter className="pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
