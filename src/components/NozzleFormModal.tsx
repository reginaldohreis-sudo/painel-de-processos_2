import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { Nozzle } from '@/types';

const formSchema = z.object({
    name: z.string().min(1, 'O nome do bico é obrigatório.'),
    flowRate: z.coerce.number().min(0.1, 'A vazão deve ser maior que zero.'),
});

type FormValues = z.infer<typeof formSchema>;

interface NozzleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Nozzle) => void;
    nozzle?: Nozzle | null;
}

export function NozzleFormModal({ isOpen, onClose, onSave, nozzle }: NozzleFormModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            flowRate: 0,
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (nozzle) {
                reset({
                    name: nozzle.name,
                    flowRate: nozzle.flowRate,
                });
            } else {
                reset({
                    name: '',
                    flowRate: 0,
                });
            }
        }
    }, [nozzle, reset, isOpen]);

    const onSubmit = (data: FormValues) => {
        const finalData: Nozzle = {
            id: nozzle?.id || `nozzle-${Date.now()}`,
            ...data,
        };
        onSave(finalData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{nozzle ? 'Editar Bico' : 'Adicionar Bico'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Bico</Label>
                            <Input id="name" {...register('name')} className="capitalize" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="flowRate">Vazão (gramas por segundo)</Label>
                            <Input id="flowRate" type="number" step="0.1" {...register('flowRate')} />
                            {errors.flowRate && <p className="text-xs text-red-500">{errors.flowRate.message}</p>}
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar Bico</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
