import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { UserProfile } from '@/types';

const baseSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    username: z.string().min(3, 'O usuário deve ter pelo menos 3 caracteres.'),
    role: z.enum(['admin', 'user']),
});

const createSchema = baseSchema.extend({
    email: z.string().email('Email inválido.'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

const editSchema = baseSchema;

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type FormValues = CreateFormValues | EditFormValues;

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormValues) => Promise<void>;
    user?: UserProfile | null;
}

export function UserFormModal({ isOpen, onClose, onSave, user }: UserFormModalProps) {
    const isEditing = !!user;

    const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(isEditing ? editSchema : createSchema),
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing && user) {
                reset({
                    name: user.full_name,
                    username: user.username,
                    role: user.role,
                });
            } else {
                reset({
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    role: 'user',
                });
            }
        }
    }, [isOpen, user, isEditing, reset]);

    const onSubmit = async (data: FormValues) => {
        await onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="username">Nome de Usuário</Label>
                            <Input id="username" {...register('username')} />
                            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                        </div>
                        {!isEditing && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...register('email' as keyof FormValues)} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input id="password" type="password" {...register('password' as keyof FormValues)} />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                            </>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="role">Perfil de Acesso</Label>
                             <Controller name="role" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o perfil..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Usuário</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}/>
                            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
