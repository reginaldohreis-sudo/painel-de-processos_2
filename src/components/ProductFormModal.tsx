import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { Product } from '@/types';

const formSchema = z.object({
    name: z.string().min(1, 'O nome do produto é obrigatório.'),
    productionTime: z.coerce.number().min(0.1, 'O tempo de produção deve ser maior que zero.'),
    type: z.enum(['aspercao', 'ajustagem'], { required_error: 'O tipo do produto é obrigatório.'}),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Product) => void;
    product?: Product | null;
}

export function ProductFormModal({ isOpen, onClose, onSave, product }: ProductFormModalProps) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            productionTime: 0,
            type: 'aspercao',
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (product) {
                reset({
                    name: product.name,
                    productionTime: product.productionTime,
                    type: product.type,
                });
            } else {
                reset({
                    name: '',
                    productionTime: 0,
                    type: 'aspercao',
                });
            }
        }
    }, [product, reset, isOpen]);

    const onSubmit = (data: FormValues) => {
        const finalData: Product = {
            id: product?.id || `prod-${Date.now()}`,
            ...data,
        };
        onSave(finalData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input id="name" {...register('name')} className="capitalize" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="type">Tipo do Produto</Label>
                             <Controller name="type" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aspercao">Asperção</SelectItem>
                                        <SelectItem value="ajustagem">Ajustagem</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}/>
                            {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="productionTime">Tempo de Produção (minutos)</Label>
                            <Input id="productionTime" type="number" step="0.01" {...register('productionTime')} />
                            {errors.productionTime && <p className="text-xs text-red-500">{errors.productionTime.message}</p>}
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
