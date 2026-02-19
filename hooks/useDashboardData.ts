'use client'

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export function useDashboardData(currentDate: Date | null) {
    // O loading começa como true se houver uma data, caso contrário false para não travar a UI
    const [loading, setLoading] = useState(!!currentDate);
    const [data, setData] = useState({
        carregamentos: [] as any[],
        cargasPendentes: [] as any[],
        modais: [] as any[],
        desempenhoReal: [] as any[],
        mediasCustos: [] as any[] // <--- Novo estado
    });

    const supabase = createClient();

    const fetchAllData = useCallback(async () => {
        // Se não houver data definida (comum no primeiro render do Next.js), aborta a busca
        if (!currentDate) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Define o intervalo de visualização (geralmente o que aparece no grid do calendário)
        const start = startOfWeek(startOfMonth(currentDate)).toISOString();
        const end = endOfWeek(endOfMonth(currentDate)).toISOString();

        try {
            // Promise.all para buscar tudo em paralelo e ganhar performance
            const [carregamentosRes, cargasRes, modaisRes, desempenhoRes, mediasRes] = await Promise.all([
                supabase.from('carregamentos').select('*').gte('data_carregamento', start).lte('data_carregamento', end),
                supabase.from('cargas').select('*'),
                supabase.from('modais').select('*'),
                supabase.from('view_detalhe_carregamentos').select('*'),
                supabase.from('view_custos_por_tp').select('*')
            ]);

            // Verificação de erros básica para cada request
            if (carregamentosRes.error) throw carregamentosRes.error;

            setData({
                carregamentos: carregamentosRes.data || [],
                cargasPendentes: cargasRes.data || [],
                modais: modaisRes.data || [],
                desempenhoReal: desempenhoRes.data || [],
                mediasCustos: mediasRes.data || []
            });
        } catch (error) {
            console.error("Erro ao buscar dados do dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate, supabase]); // supabase incluído como dependência estável

    // Efeito para buscar dados sempre que a data de referência mudar
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    /**
     * Calcula a ocupação e métricas financeiras de um carregamento específico
     */
    const getOcupacaoInfo = useCallback((carregamento: any) => {
        if (!carregamento) {
            return { cubagem: 0, capacidade: 1, percentual: 0, fatLiq: 0, custoLiq: 0 };
        }

        // Busca o modal correspondente para saber a capacidade total
        const modal = data.modais.find(m => m.codigo === carregamento.perfil);
        const capacidade = modal?.capacidade_m3 || 1; // Evita divisão por zero

        let cubagemCalculada = 0;
        let fatLiq = 0;
        let custoLiq = 0;

        // Se já foi coletado, pegamos os dados reais da View de desempenho
        if (carregamento.status === 'coletado') {
            const detalhe = data.desempenhoReal.find(d => d.carregamento_id === carregamento.id);
            if (detalhe) {
                cubagemCalculada = detalhe.cubagem_total || 0;
                fatLiq = detalhe.fat_liq_total || 0;
                custoLiq = detalhe.custo_liquido_total || 0;
            }
        } else {
            // Se for previsto/agendado, calculamos a soma das cargas pendentes 
            // que batem com os estados atendidos pelo carregamento
            cubagemCalculada = data.cargasPendentes
                .filter(carga =>
                    carregamento.estados_atendidos?.includes(carga.uf)
                )
                .reduce((acc, curr) => acc + (Number(curr.cubagem) || 0), 0);
        }

        return {
            cubagem: cubagemCalculada,
            capacidade,
            percentual: (cubagemCalculada / capacidade) * 100,
            fatLiq,
            custoLiq
        };
    }, [data.modais, data.desempenhoReal, data.cargasPendentes]);

    return {
        ...data,
        loading,
        getOcupacaoInfo,
        refresh: fetchAllData
    };
}