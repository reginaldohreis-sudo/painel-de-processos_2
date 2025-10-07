import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserPlus, Edit, Loader2 } from "lucide-react";
import type { UserProfile } from '@/types';
import { UserFormModal } from '@/components/UserFormModal';

export function AdminPage() {
    const { adminGetAllUsers, adminAddUser, adminUpdateUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUserFormModalOpen, setUserFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const userList = await adminGetAllUsers();
            setUsers(userList);
            setLoading(false);
        };
        fetchUsers();
    }, [adminGetAllUsers]);

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setUserFormModalOpen(true);
    };

    const handleOpenEditModal = (user: UserProfile) => {
        setEditingUser(user);
        setUserFormModalOpen(true);
    };

    const handleSaveUser = async (data: any) => {
        let error = null;
        if (editingUser) {
            // Editando usuário existente
            const result = await adminUpdateUser(editingUser.id, {
                fullName: data.name,
                username: data.username,
                role: data.role,
            });
            error = result.error;
        } else {
            // Criando novo usuário
            const result = await adminAddUser({
                email: data.email,
                password: data.password,
                fullName: data.name,
                username: data.username,
                role: data.role,
            });
            error = result.error;
        }

        if (error) {
            alert(`Falha: ${error.message}`);
        } else {
            setUserFormModalOpen(false);
            const userList = await adminGetAllUsers(); // Re-fetch users
            setUsers(userList);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-foreground">Administração</h2>
                    <Button onClick={handleOpenAddModal}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Usuário
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciamento de Usuários</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {users.map((user) => (
                                <div key={user.id} className="grid grid-cols-3 gap-4 items-center px-6 py-4">
                                    <div className="col-span-1">
                                        <p className="font-medium">{user.full_name}</p>
                                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <span className="text-xs font-semibold uppercase">{user.role}</span>
                                    </div>
                                    <div className="col-span-1 flex justify-end items-center space-x-2">
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenEditModal(user)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <UserFormModal
                isOpen={isUserFormModalOpen}
                onClose={() => setUserFormModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
            />
        </>
    );
}
