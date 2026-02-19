'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export function useDashboardData(currentDate: Date | null) {
    const [loading, setLoading] = useState(!!currentDate);
    const [data, setData] = useState({
        carregamentos: [] as any[],
        cargasPendentes: [] as any[],
        modais: [] as any[],
        desempenhoReal: [] as any[],
        mediasCustos: [] as any[]
    });

    const supabase = createClient();

const fetchAllData = useCallback(async () => {
    if (!currentDate) {
        setLoading(false);
        return;
    }

    setLoading(false);

    const start = startOfWeek(startOfMonth(currentDate)).toISOString();
    const end = endOfWeek(endOfMonth(currentDate)).toISOString();

    try {
        // Mudamos para uma sintaxe mais limpa e robusta
        const [carregamentosRes, cargasRes, modaisRes, desempenhoRes, mediasRes] = await Promise.all([
            supabase
                .from('carregamentos')
                .select('*')
                // Filtro: (Status é previsto/confirmado) OU (Data está no intervalo do calendário)
                .or(`status.in.("previsto","confirmado"),and(data_carregamento.gte.${start},data_carregamento.lte.${end})`),
            
            supabase.from('cargas').select('*'),
            supabase.from('modais').select('*'),
            supabase.from('view_detalhe_carregamentos').select('*'),
            supabase.from('view_custos_por_tp').select('*')
        ]);

        if (carregamentosRes.error) throw carregamentosRes.error;

        setData({
            carregamentos: carregamentosRes.data || [],
            cargasPendentes: cargasRes.data || [],
            modais: modaisRes.data || [],
            desempenhoReal: desempenhoRes.data || [],
            mediasCustos: mediasRes.data || []
        });
    } catch (error: any) {
        // Melhoria no log para ver o que realmente está vindo do Supabase
        console.error("Erro detalhado:", error.message || error);
    } finally {
        setLoading(false);
    }
}, [currentDate, supabase]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    /**
     * CÁLCULO DE OCUPAÇÃO COM SALDO GLOBAL
     */
    const ocupacaoProcessada = useMemo(() => {
        if (data.carregamentos.length === 0) return {};

        // 1. Ordenar TODOS os carregamentos por data (do mais antigo para o mais novo)
        const todosCarregamentosOrdenados = [...data.carregamentos].sort((a, b) => 
            new Date(a.data_carregamento).getTime() - new Date(b.data_carregamento).getTime()
        );

        // 2. Saldo inicial de cargas (o que temos hoje no pátio)
        const saldoCargasPorUF: Record<string, number> = {};
        data.cargasPendentes.forEach(carga => {
            const uf = carga.uf?.toUpperCase();
            if (uf) {
                saldoCargasPorUF[uf] = (saldoCargasPorUF[uf] || 0) + (Number(carga.cubagem) || 0);
            }
        });

        const distribuicao: Record<string, number> = {};

        // 3. Abatimento sequencial
        todosCarregamentosOrdenados.forEach(curr => {
            // Se já foi realizado, ele não consome mais o "saldo pendente" (já virou dado real)
            if (curr.status === 'coletado' || curr.status === 'cancelado') return;

            const modal = data.modais.find(m => m.codigo === curr.perfil);
            const capacidadeCaminhao = modal?.capacidade_m3 || 0;
            const estadosAtendidos = curr.estados_atendidos || [];
            
            let volumeAlocado = 0;

            estadosAtendidos.forEach((uf: string) => {
                const ufUpper = uf.toUpperCase();
                const disponivelNaUF = saldoCargasPorUF[ufUpper] || 0;

                if (disponivelNaUF > 0 && volumeAlocado < capacidadeCaminhao) {
                    const espacoLivre = capacidadeCaminhao - volumeAlocado;
                    const consumo = Math.min(disponivelNaUF, espacoLivre);

                    volumeAlocado += consumo;
                    saldoCargasPorUF[ufUpper] -= consumo;
                }
            });

            distribuicao[curr.id] = volumeAlocado;
        });

        return distribuicao;
    }, [data.carregamentos, data.cargasPendentes, data.modais]);

    const getOcupacaoInfo = useCallback((carregamento: any) => {
        if (!carregamento) return { cubagem: 0, capacidade: 1, percentual: 0, fatLiq: 0, custoLiq: 0 };

        const modal = data.modais.find(m => m.codigo === carregamento.perfil);
        const capacidade = modal?.capacidade_m3 || 1;

        let cubagemCalculada = 0;
        let fatLiq = 0;
        let custoLiq = 0;

        if (carregamento.status === 'coletado') {
            const detalhe = data.desempenhoReal.find(d => d.carregamento_id === carregamento.id);
            if (detalhe) {
                cubagemCalculada = detalhe.cubagem_total || 0;
                fatLiq = detalhe.fat_liq_total || 0;
                custoLiq = detalhe.custo_liquido_total || 0;
            }
        } else {
            cubagemCalculada = ocupacaoProcessada[carregamento.id] || 0;
        }

        return {
            cubagem: cubagemCalculada,
            capacidade,
            percentual: (cubagemCalculada / capacidade) * 100,
            fatLiq,
            custoLiq
        };
    }, [data.modais, data.desempenhoReal, ocupacaoProcessada]);

    return {
        ...data,
        loading,
        getOcupacaoInfo,
        refresh: fetchAllData
    };
}