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
import { cn, calculateBatchEstimates, calculateDeliveryDate } from "@/lib/utils"

import type { Batch, Product, Employee, Nozzle } from '@/types';

const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Obrigatório"),
  quantity: z.number().min(1, "Inválido"),
});

const productSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  assignments: z.array(assignmentSchema).min(1, "Adicione um responsável."),
});

const formSchema = z.object({
    id: z.string().min(1, 'O ID do lote é obrigatório.'),
    name: z.string().min(1, 'O nome do lote é obrigatório.'),
    nozzleId: z.string().min(1, 'Selecione um bico.'),
    startDate: z.date({ required_error: "A data de início é obrigatória."}),
    products: z.array(productSchema).min(1, "Adicione pelo menos um produto ao lote."),
});

type FormValues = z.infer<typeof formSchema>;

interface BatchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    batch?: Batch | null;
    products: Product[];
    employees: Employee[];
    nozzles: Nozzle[];
}

export function BatchFormModal({ isOpen, onClose, onSave, batch, products, employees, nozzles }: BatchFormModalProps) {
    const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: '',
            name: '',
            nozzleId: '',
            startDate: new Date(),
            products: []
        }
    });

    const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
        control,
        name: "products"
    });

    const aspercaoProducts = useMemo(() => 
        products.filter(p => p.type === 'aspercao'), 
    [products]);

    useEffect(() => {
        if (isOpen) {
            if (batch) {
                reset({
                    id: batch.id,
                    name: batch.name,
                    nozzleId: batch.nozzleId,
                    startDate: new Date(batch.startDate),
                    products: batch.products.map(p => ({
                        productId: p.productId,
                        assignments: p.assignments.map(a => ({
                            employeeId: a.employeeId,
                            quantity: a.quantity,
                        }))
                    }))
                });
            } else {
                reset({
                    id: '',
                    name: '',
                    nozzleId: '',
                    startDate: new Date(),
                    products: [{ productId: '', assignments: [{ employeeId: '', quantity: 100 }] }]
                });
            }
        }
    }, [batch, reset, isOpen]);

    const onSubmit = (data: FormValues) => {
        const { estimatedTimeHours } = calculateBatchEstimates({ products: data.products, nozzleId: data.nozzleId }, products, nozzles);
        const allAssignments = data.products.flatMap(p => p.assignments);
        
        const deliveryDate = calculateDeliveryDate(data.startDate, estimatedTimeHours, allAssignments, employees);

        const finalData = {
            ...batch,
            id: data.id,
            name: data.name,
            products: data.products.map(p => ({
                ...p,
                assignments: p.assignments.map(a => ({...a, realQuantity: 0}))
            })),
            nozzleId: data.nozzleId,
            startDate: data.startDate,
            deliveryDate: deliveryDate,
            status: batch?.status || 'Planejado',
            progress: batch?.progress || 0,
        };
        onSave(finalData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{batch ? 'Editar Lote' : 'Criar Novo Lote'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-6 py-4 max-h-[65vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="grid gap-2">
                                <Label htmlFor="id">ID do Lote</Label>
                                <Input id="id" {...register('id')} />
                                {errors.id && <p className="text-xs text-red-500">{errors.id.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome do Lote</Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nozzleId">Bico</Label>
                                <Controller name="nozzleId" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>{nozzles.map(n => <SelectItem key={n.id} value={n.id} className="capitalize">{n.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                )}/>
                                {errors.nozzleId && <p className="text-xs text-red-500">{errors.nozzleId.message}</p>}
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
                                        <PopoverContent className="w-auto p-0 bg-white">
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

                        <div className="space-y-4">
                            <Label>Produtos e Responsáveis</Label>
                            {productFields.map((productItem, productIndex) => (
                                <ProductAssignmentField key={productItem.id} productIndex={productIndex} control={control} errors={errors} products={aspercaoProducts} employees={employees} removeProduct={removeProduct} />
                            ))}
                             <Button type="button" variant="outline" size="sm" onClick={() => appendProduct({ productId: '', assignments: [{ employeeId: '', quantity: 100 }] })}>
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                            </Button>
                            {errors.products?.root && <p className="text-xs text-red-500">{errors.products.root.message}</p>}
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

function ProductAssignmentField({ productIndex, control, errors, products, employees, removeProduct }: any) {
    const { fields: assignmentFields, append: appendAssignment, remove: removeAssignment } = useFieldArray({
        control,
        name: `products.${productIndex}.assignments`
    });

    const sortedProducts = useMemo(() => 
        [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })), 
    [products]);

    return (
        <div className="p-4 border rounded-md bg-muted/50 space-y-4 relative">
             <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeProduct(productIndex)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            
            <div className="grid gap-2">
                <Label>Produto</Label>
                <Controller
                    name={`products.${productIndex}.productId`}
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="w-full capitalize">
                                <SelectValue placeholder="Selecione um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedProducts.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="capitalize">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.products?.[productIndex]?.productId && <p className="text-xs text-red-500 mt-1">{errors.products?.[productIndex]?.productId.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Responsáveis</Label>
                {assignmentFields.map((assignmentItem, assignmentIndex) => (
                    <div key={assignmentItem.id} className="flex items-start gap-2">
                        <div className="grid gap-1 flex-grow">
                            <Controller name={`products.${productIndex}.assignments.${assignmentIndex}.employeeId`} control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Funcionário..." /></SelectTrigger>
                                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                </Select>
                            )}/>
                             {errors.products?.[productIndex]?.assignments?.[assignmentIndex]?.employeeId && <p className="text-xs text-red-500 mt-1">{errors.products?.[productIndex]?.assignments?.[assignmentIndex]?.employeeId.message}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Controller
                                name={`products.${productIndex}.assignments.${assignmentIndex}.quantity`}
                                control={control}
                                render={({ field }) => <Input type="number" placeholder="Qtd." className="h-9 w-24" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />}
                            />
                            {errors.products?.[productIndex]?.assignments?.[assignmentIndex]?.quantity && <p className="text-xs text-red-500 mt-1">{errors.products?.[productIndex]?.assignments?.[assignmentIndex]?.quantity.message}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeAssignment(assignmentIndex)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendAssignment({ employeeId: '', quantity: 50 })}>
                    <Plus className="mr-2 h-4 w-4" /> Atribuir
                </Button>
                {errors.products?.[productIndex]?.assignments?.root && <p className="text-xs text-red-500">{errors.products?.[productIndex]?.assignments?.root.message}</p>}
            </div>
        </div>
    );
}
