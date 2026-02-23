'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface DashboardData {
    carregamentos: any[];
    cargasPendentes: any[];
    modais: any[];
    desempenhoReal: any[];
    mediasCustos: any[];
}

export function useDashboardData(currentDate: Date | null) {
    const [loading, setLoading] = useState(!!currentDate);
    const [data, setData] = useState<DashboardData>({
        carregamentos: [],
        cargasPendentes: [],
        modais: [],
        desempenhoReal: [],
        mediasCustos: []
    });

    const supabase = createClient();

    const fetchAllData = useCallback(async () => {
        if (!currentDate) return setLoading(false);

        const start = startOfWeek(startOfMonth(currentDate)).toISOString();
        const end = endOfWeek(endOfMonth(currentDate)).toISOString();

        try {
            const [carregamentosRes, cargasRes, modaisRes, desempenhoRes, mediasRes] = await Promise.all([
                supabase.from('carregamentos').select('*')
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
            console.error("Erro ao carregar dashboard:", error.message || error);
        } finally {
            setLoading(false);
        }
    }, [currentDate, supabase]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const ocupacaoProcessada = useMemo(() => {
        if (!data.carregamentos.length) return {};

        const ordenados = [...data.carregamentos].sort((a, b) => 
            new Date(a.data_carregamento).getTime() - new Date(b.data_carregamento).getTime()
        );

        const saldoUF: Record<string, number> = {};
        data.cargasPendentes.forEach(c => {
            if (c.uf) saldoUF[c.uf.toUpperCase()] = (saldoUF[c.uf.toUpperCase()] || 0) + (Number(c.cubagem) || 0);
        });

        const distribuicao: Record<string, number> = {};

        ordenados.forEach(curr => {
            if (['coletado', 'cancelado'].includes(curr.status)) return;

            const modal = data.modais.find(m => m.codigo === curr.perfil);
            const capacidade = modal?.capacidade_m3 || 0;
            let volumeAlocado = 0;

            (curr.estados_atendidos || []).forEach((uf: string) => {
                const ufUpper = uf.toUpperCase();
                const disponivel = saldoUF[ufUpper] || 0;

                if (disponivel > 0 && volumeAlocado < capacidade) {
                    const consumo = Math.min(disponivel, capacidade - volumeAlocado);
                    volumeAlocado += consumo;
                    saldoUF[ufUpper] -= consumo;
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

        let res = { cubagem: 0, fatLiq: 0, custoLiq: 0 };

        if (carregamento.status === 'coletado') {
            const detalhe = data.desempenhoReal.find(d => d.carregamento_id === carregamento.id);
            if (detalhe) {
                res = {
                    cubagem: detalhe.cubagem_total || 0,
                    fatLiq: detalhe.fat_liq_total || 0,
                    custoLiq: detalhe.custo_liquido_total || 0
                };
            }
        } else {
            res.cubagem = ocupacaoProcessada[carregamento.id] || 0;
        }

        return { ...res, capacidade, percentual: (res.cubagem / capacidade) * 100 };
    }, [data.modais, data.desempenhoReal, ocupacaoProcessada]);

    return { ...data, loading, getOcupacaoInfo, refresh: fetchAllData };
}