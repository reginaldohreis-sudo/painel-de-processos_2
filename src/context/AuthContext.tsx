import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, UserProfile } from '@/types';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    // Funções de Admin
    adminGetAllUsers: () => Promise<UserProfile[]>;
    adminAddUser: (data: { email: string; password: string; fullName: string; username: string; role: 'admin' | 'user' }) => Promise<{ error: any }>;
    adminUpdateUser: (userId: string, data: { fullName: string; username: string; role: 'admin' | 'user' }) => Promise<{ error: any }>;
    sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await handleAuthStateChange('INITIAL_SESSION', session);
            setLoading(false);
        };

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                setUser(null);
            } else if (profile) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: profile.full_name,
                    username: profile.username,
                    role: profile.role,
                });
            }
        } else {
            setUser(null);
        }
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const sendPasswordResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
        });
        return { error };
    };

    // --- Funções de Admin ---

    const adminGetAllUsers = async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error("Error fetching users:", error);
            return [];
        }
        return data as UserProfile[];
    };
    
    const adminAddUser = async (data: { email: string; password: string; fullName: string; username: string; role: 'admin' | 'user' }) => {
        // Esta função requer privilégios de admin no Supabase para ser executada com segurança.
        // A criação de usuário é feita via signUp, que não requer privilégios especiais.
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.fullName,
                    username: data.username,
                    role: data.role,
                }
            }
        });
        return { error };
    };

    const adminUpdateUser = async (userId: string, data: { fullName: string; username: string; role: 'admin' | 'user' }) => {
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: data.fullName, username: data.username, role: data.role })
            .eq('id', userId);
        return { error };
    };

    const value = {
        user,
        loading,
        login,
        logout,
        sendPasswordResetEmail,
        adminGetAllUsers,
        adminAddUser,
        adminUpdateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
