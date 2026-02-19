'use client'
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export interface EstadoMetrics {
    estado: string;
    qtd_pdvs: number;
    cubagem_total: number;
    fat_bruto_total: number;
    fat_liq_total: number;
    custo_bruto_total: number;
    custo_liquido_total: number;
    // Métricas calculadas (médias)
    drop_size: number;
    real_m3_fat: number;
    custo_liq_vs_fat_liq: number;
}

export function useEstadoMetrics(uf: string | null) {
    const [data, setData] = useState<EstadoMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!uf) {
            setData(null);
            return;
        }

        async function fetchMetrics() {
            setLoading(true);
            setError(null);

            try {
                // 1. Buscamos TODOS os registros do estado, não apenas o último
                const { data: results, error: supabaseError } = await supabase
                    .from('view_desempenho_estado_carregamento')
                    .select('*')
                    .eq('estado', uf);

                if (supabaseError) throw supabaseError;

                if (results && results.length > 0) {
                    // 2. Acumulamos os valores
                    const acumulado = results.reduce((acc, curr) => ({
                        estado: uf as string,
                        qtd_pdvs: acc.qtd_pdvs + (curr.qtd_pdvs || 0),
                        cubagem_total: acc.cubagem_total + (curr.cubagem_total || 0),
                        fat_bruto_total: acc.fat_bruto_total + (curr.fat_bruto_total || 0),
                        fat_liq_total: acc.fat_liq_total + (curr.fat_liq_total || 0),
                        custo_bruto_total: acc.custo_bruto_total + (curr.custo_bruto_total || 0),
                        custo_liquido_total: acc.custo_liquido_total + (curr.custo_liquido_total || 0),
                    }), {
                        qtd_pdvs: 0, cubagem_total: 0, fat_bruto_total: 0, 
                        fat_liq_total: 0, custo_bruto_total: 0, custo_liquido_total: 0
                    });

                    // 3. Recalculamos as médias/percentuais baseados no acumulado
                    const finalData: EstadoMetrics = {
                        ...acumulado,
                        drop_size: acumulado.qtd_pdvs > 0 ? acumulado.cubagem_total / acumulado.qtd_pdvs : 0,
                        real_m3_fat: acumulado.cubagem_total > 0 ? acumulado.fat_bruto_total / acumulado.cubagem_total : 0,
                        custo_liq_vs_fat_liq: acumulado.fat_liq_total > 0 ? acumulado.custo_liquido_total / acumulado.fat_liq_total : 0,
                    };

                    setData(finalData);
                } else {
                    setData(null);
                }
            } catch (err: any) {
                console.error('Erro ao buscar métricas acumuladas:', err);
                setError(err.message);
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
    }, [uf]);

    return { data, loading, error };
}