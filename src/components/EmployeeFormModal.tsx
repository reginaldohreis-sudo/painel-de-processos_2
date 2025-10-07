import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { Employee } from '@/types';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    hoursPerDay: z.coerce.number().min(1, 'Deve ser no mínimo 1 hora.').max(24, 'Inválido.'),
    workingDays: z.array(z.number()).min(1, "Selecione pelo menos um dia de trabalho."),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Employee) => void;
    employee?: Employee | null;
}

const daysOfWeek = [
    { id: 1, label: 'S' }, { id: 2, label: 'T' }, { id: 3, label: 'Q' },
    { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }
];

export function EmployeeFormModal({ isOpen, onClose, onSave, employee }: EmployeeFormModalProps) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            hoursPerDay: 8,
            workingDays: [1, 2, 3, 4, 5],
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (employee) {
                reset({
                    name: employee.name,
                    hoursPerDay: employee.hoursPerDay,
                    workingDays: employee.workingDays,
                });
            } else {
                reset({
                    name: '',
                    hoursPerDay: 8,
                    workingDays: [1, 2, 3, 4, 5],
                });
            }
        }
    }, [employee, reset, isOpen]);

    const onSubmit = (data: FormValues) => {
        const finalData: Employee = {
            id: employee?.id || `emp-${Date.now()}`,
            ...data,
        };
        onSave(finalData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{employee ? 'Editar Funcionário' : 'Adicionar Funcionário'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Funcionário</Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hoursPerDay">Horas por Dia</Label>
                            <Input id="hoursPerDay" type="number" {...register('hoursPerDay')} />
                            {errors.hoursPerDay && <p className="text-xs text-red-500">{errors.hoursPerDay.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Dias de Trabalho</Label>
                            <Controller
                                name="workingDays"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex justify-between gap-1">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => {
                                                    const currentDays = field.value || [];
                                                    const newDays = currentDays.includes(day.id)
                                                        ? currentDays.filter(d => d !== day.id)
                                                        : [...currentDays, day.id];
                                                    field.onChange(newDays.sort());
                                                }}
                                                className={cn(
                                                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                                                    (field.value || []).includes(day.id)
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-transparent hover:bg-accent"
                                                )}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            />
                            {errors.workingDays && <p className="text-xs text-red-500">{errors.workingDays.message}</p>}
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
