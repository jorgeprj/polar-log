'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRole() {
    const [role, setRole] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true) 
    const supabase = createClient()

    useEffect(() => {
        async function getProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()
                    setRole(data?.role || 'padrao')
                }
            } catch (error) {
                console.error("Erro ao buscar role:", error)
            } finally {
                setIsLoading(false) // Finaliza o loading independente de erro ou sucesso
            }
        }
        getProfile()
    }, [supabase])

    return { role, isLoading } 
}