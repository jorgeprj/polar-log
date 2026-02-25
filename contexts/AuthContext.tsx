'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
    role: string | null;
    isLoading: boolean;
    user: any | null;
}

const AuthContext = createContext<AuthContextType>({ role: null, isLoading: true, user: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<AuthContextType>({ role: null, isLoading: true, user: null });
    const supabase = createClient();

    useEffect(() => {
        async function getUserData() {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Busca a role no seu banco (ex: tabela profiles)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setData({ role: profile?.role || 'user', user, isLoading: false });
            } else {
                setData({ role: null, user: null, isLoading: false });
            }
        }
        getUserData();
    }, []);

    return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);