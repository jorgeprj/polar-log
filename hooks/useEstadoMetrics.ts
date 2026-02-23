'use client'
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export interface CarregamentoDetail {
    carregamento_id: string;
    modal: string;
    qtd_pdvs: number;
    cubagem_total: number;
    fat_bruto_total: number;
    custo_liq_vs_fat_liq: number;
    real_m3_fat: number;
}

export interface EstadoMetrics {
    resumo: {
        estado: string;
        qtd_pdvs: number;
        cubagem_total: number;
        fat_bruto_total: number;
        fat_liq_total: number;
        custo_liquido_total: number;
        drop_size: number;
        real_m3_fat: number;
        custo_liq_vs_fat_liq: number;
    } | null;
    carregamentos: CarregamentoDetail[];
}

export function useEstadoMetrics(uf: string | null) {
    const [data, setData] = useState<EstadoMetrics>({ resumo: null, carregamentos: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!uf) {
            setData({ resumo: null, carregamentos: [] });
            return;
        }

        async function fetchMetrics() {
            setLoading(true);
            setError(null);

            try {
                const { data: results, error: supabaseError } = await supabase
                    .from('view_desempenho_estado_carregamento')
                    .select('*')
                    .eq('estado', uf)
                    .order('carregamento_id', { ascending: false });

                if (supabaseError) throw supabaseError;

                if (results && results.length > 0) {
                    const acumulado = results.reduce((acc, curr) => ({
                        qtd_pdvs: acc.qtd_pdvs + (curr.qtd_pdvs || 0),
                        cubagem_total: acc.cubagem_total + (curr.cubagem_total || 0),
                        fat_bruto_total: acc.fat_bruto_total + (curr.fat_bruto_total || 0),
                        fat_liq_total: acc.fat_liq_total + (curr.fat_liq_total || 0),
                        custo_liquido_total: acc.custo_liquido_total + (curr.custo_liquido_total || 0),
                    }), {
                        qtd_pdvs: 0, cubagem_total: 0, fat_bruto_total: 0, 
                        fat_liq_total: 0, custo_liquido_total: 0
                    });

                    setData({
                        resumo: {
                            estado: uf,
                            ...acumulado,
                            drop_size: acumulado.qtd_pdvs > 0 ? acumulado.cubagem_total / acumulado.qtd_pdvs : 0,
                            real_m3_fat: acumulado.cubagem_total > 0 ? acumulado.fat_bruto_total / acumulado.cubagem_total : 0,
                            custo_liq_vs_fat_liq: acumulado.fat_liq_total > 0 ? acumulado.custo_liquido_total / acumulado.fat_liq_total : 0,
                        },
                        carregamentos: results // Lista completa para a tabela
                    });
                } else {
                    setData({ resumo: null, carregamentos: [] });
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
    }, [uf]);

    return { data, loading, error };
}