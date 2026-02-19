'use client'

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export function useCarregamentoDetails(carregamentoId: string | null, transitPointId?: number, modal?: string) {
    const [data, setData] = useState<any[]>([]);
    const [statsPrevistas, setStatsPrevistas] = useState<{ media_custo_liq: number } | null>(null);
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        async function fetchAll() {
            // Se não temos o ID do carregamento (para Real) E não temos dados de TP/Modal (para Projeção), paramos aqui.
            if (!carregamentoId && (!transitPointId || !modal)) return;

            setLoading(true);
            try {
                // 1. BUSCA DADOS REAIS (View por Estado)
                if (carregamentoId) {
                    const { data: viewData, error: errorReal } = await supabase
                        .from('view_desempenho_estado_carregamento')
                        .select('*')
                        .eq('carregamento_id', carregamentoId);
                    
                    if (!errorReal) setData(viewData || []);
                }

                // 2. BUSCA MÉDIA PARA PROJEÇÃO (Usando o ID agora!)
                if (transitPointId && modal) {
                    const { data: custoData, error: errorCusto } = await supabase
                        .from('view_custos_por_tp')
                        .select('media_custo_liq')
                        .eq('transit_point_id', transitPointId) // Busca direta pelo ID
                        .eq('modal', modal)
                        .maybeSingle();

                    if (!errorCusto && custoData) {
                        setStatsPrevistas(custoData);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar detalhes:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
    }, [carregamentoId, transitPointId, modal]);

    console.log("Dados do carregamento:", data);

    return { data, statsPrevistas, loading };
}