'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCarregamentoDetails } from "@/hooks/useCarregamentoDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Database, Truck, Box, Info, AlertCircle } from "lucide-react";
import { useMemo } from "react";

interface ModalDetalhesProps {
    id: string | null;
    status: string | null;
    estadosAtendidos: string[];
    isOpen: boolean;
    onClose: () => void;
    cargasPendentes: any[];
    capacidadeVeiculo?: number;
    transitPointId?: number;
    perfil?: string;
}

export function ModalDetalhes({
    id,
    status,
    estadosAtendidos,
    isOpen,
    onClose,
    cargasPendentes,
    capacidadeVeiculo = 100,
    transitPointId,
    perfil
}: ModalDetalhesProps) {
    const { data: dataReal, statsPrevistas, loading } = useCarregamentoDetails(id, transitPointId, perfil);

    const fPercent = (v: number) => (v * 100).toFixed(1) + '%';
    const fCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const isPlanejamento = status === 'previsto' || status === 'confirmado' || status === 'aguardando confirmação';

    const dataPrevista = useMemo(() => {
        const base = (estadosAtendidos || []).map(uf => {
            const cargasDoEstado = (cargasPendentes || []).filter(c => c.uf === uf);
            const cubagemTotal = cargasDoEstado.reduce((acc, curr) => acc + (Number(curr.cubagem) || 0), 0);
            const fatTotal = cargasDoEstado.reduce((acc, curr) => acc + (Number(curr.faturamento) || 0), 0);

            return {
                estado: uf,
                modal: perfil || "N/A",
                fat_bruto: fatTotal,
                cubagem_total: cubagemTotal,
                qtd_pdvs: cargasDoEstado.length
            };
        }).filter(item => item.qtd_pdvs > 0);

        const cubagemTotalGeral = base.reduce((acc, curr) => acc + curr.cubagem_total, 0);
        const fatorCapacidadeGeral = cubagemTotalGeral > capacidadeVeiculo ? (capacidadeVeiculo / cubagemTotalGeral) : 1;

        return base.map(item => {
            const mediaCustoHistorico = statsPrevistas?.media_custo_liq || 0;
            const faturamentoUtil = item.fat_bruto * fatorCapacidadeGeral;
            const proporcaoCustoEstado = cubagemTotalGeral > 0
                ? (item.cubagem_total / cubagemTotalGeral) * mediaCustoHistorico
                : 0;

            return {
                ...item,
                fat_liq_total: item.fat_bruto,
                fat_util: faturamentoUtil,
                custo_atribuido: proporcaoCustoEstado,
                custo_liq_vs_fat_liq: faturamentoUtil > 0 ? (proporcaoCustoEstado / faturamentoUtil) : 0,
                excesso: fatorCapacidadeGeral < 1
            };
        });
    }, [estadosAtendidos, cargasPendentes, statsPrevistas, perfil, capacidadeVeiculo]);

    const displayData = isPlanejamento ? dataPrevista : (dataReal || []);

    const totais = useMemo(() => {
        const cubagem = displayData.reduce((acc: number, curr: any) => acc + (curr.cubagem_total || 0), 0);
        const faturamentoTotalBruto = displayData.reduce((acc: number, curr: any) => acc + (curr.fat_liq_total || 0), 0);
        const ocupacaoPercent = capacidadeVeiculo > 0 ? (cubagem / capacidadeVeiculo) * 100 : 0;

        let percentualCustoFat = 0;
        let faturamentoExibicao = 0;
        let custoConsiderado = 0;

        if (isPlanejamento) {
            const fatorCapacidade = cubagem > capacidadeVeiculo ? (capacidadeVeiculo / cubagem) : 1;
            faturamentoExibicao = faturamentoTotalBruto * fatorCapacidade;
            custoConsiderado = statsPrevistas?.media_custo_liq || 0;
            percentualCustoFat = faturamentoExibicao > 0 ? (custoConsiderado / faturamentoExibicao) * 100 : 0;
        } else {
            custoConsiderado = displayData.reduce((acc: number, curr: any) => acc + (curr.custo_liquido_total || 0), 0);
            faturamentoExibicao = faturamentoTotalBruto;
            percentualCustoFat = faturamentoExibicao > 0 ? (custoConsiderado / faturamentoExibicao) * 100 : 0;
        }

        return { cubagem, percentualOcupacao: ocupacaoPercent, percentualCustoFat, faturamentoExibicao, custoConsiderado };
    }, [displayData, isPlanejamento, statsPrevistas, capacidadeVeiculo]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px] p-0 border-none bg-[#F6F6F6] shadow-2xl overflow-hidden font-sans">
                {/* Header Estilo Uber: Limpo e Directo */}
                <DialogHeader className="p-8 bg-black text-white">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-white/10 rounded">
                                    {isPlanejamento ? <Calculator size={16} /> : <Database size={16} />}
                                </div>
                                <span className="text-[11px] font-medium uppercase tracking-[1px] opacity-70">
                                    {isPlanejamento ? 'Simulador de Viabilidade' : 'Performance Operacional'}
                                </span>
                            </div>
                            <DialogTitle className="text-3xl font-semibold tracking-tight leading-none">
                                {isPlanejamento ? 'Projeção por Estado' : 'Resultado Real'}
                            </DialogTitle>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[12px] font-medium mb-3">
                                <div className={`w-2 h-2 rounded-full mr-2 ${isPlanejamento ? 'bg-blue-400' : 'bg-green-400'}`} />
                                {status?.toUpperCase()}
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <Truck size={14} />
                                    {perfil}
                                </div>
                                <div className="w-[1px] h-3 bg-white/20" />
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <Box size={14} />
                                    {capacidadeVeiculo}m³
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Cards: Mais espaço, bordas finas */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Custo Projetado"
                            value={fCurrency(totais.custoConsiderado)}
                            visible={isPlanejamento}
                        />
                        <SummaryCard
                            label="Faturamento Útil"
                            value={fCurrency(totais.faturamentoExibicao)}
                            highlight="text-white"
                        />
                        <SummaryCard
                            label="Eficiência (C/F)"
                            value={`${totais.percentualCustoFat.toFixed(1)}%`}
                        />
                        <div className="bg-white/10 p-5 rounded-sm border border-white/10 flex flex-col justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Ocupação Atual</span>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xl font-medium">
                                        {isPlanejamento ? Math.min(totais.cubagem, capacidadeVeiculo).toFixed(2) : totais.cubagem.toFixed(2)}m³
                                    </span>
                                    <span className={`text-xs font-bold ${totais.percentualOcupacao > 100 ? 'text-red-400' : 'text-white/60'}`}>
                                        {Math.min(totais.percentualOcupacao, 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${totais.percentualOcupacao > 100 ? 'bg-red-500' : 'bg-white'}`}
                                        style={{ width: `${Math.min(totais.percentualOcupacao, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body: Tabela com tipografia Uber-like */}
                <div className="px-6 py-2 bg-white">
                    <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="py-10 space-y-4 px-4">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-none" />)}
                            </div>
                        ) : (
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 bg-white z-20">
                                    <tr className="text-left border-b border-zinc-100">
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b">Estado / PDVs</th>
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-center">Faturamento</th>
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-center">Eficiência</th>
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-right">Carga m³</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {displayData.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <Info size={40} />
                                                    <p className="mt-2 font-medium">Sem dados para esta operação</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        displayData.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-zinc-50 transition-colors group">
                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-semibold text-black">{item.estado}</span>
                                                        <div className="text-[11px] font-medium py-0.5 px-2 bg-zinc-100 text-zinc-600 rounded">
                                                            {item.qtd_pdvs} PDVS
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center font-medium text-zinc-900">
                                                    {fCurrency(isPlanejamento ? item.fat_util : item.fat_liq_total)}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className={`text-sm font-semibold ${isPlanejamento && item.excesso ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {fPercent(item.custo_liq_vs_fat_liq)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-right font-medium text-black">
                                                    {item.cubagem_total.toFixed(2)}m³
                                                </td>
                                            </tr>
                                        ))

                                    )}
                                    {isPlanejamento && (
                                        <tr className="bg-zinc-50/50 font-bold border-t-2 border-zinc-200">
                                            <td className="px-4 py-6">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm uppercase tracking-wider text-zinc-500">Total Atual</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6 text-center text-black">
                                                {fCurrency(totais.faturamentoExibicao)}
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className="text-sm text-black">
                                                    -
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-right text-black">
                                                {totais.cubagem.toFixed(2)}m³
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Footer: Informativo e focado em ação */}
                <div className="p-8 bg-white border-t flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-start gap-3 text-zinc-500">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs leading-relaxed max-w-md">
                                {isPlanejamento
                                    ? "Projeção limitada ao teto de capacidade física. O faturamento foi recalculado proporcionalmente para refletir o carregamento máximo permitido."
                                    : "Valores consolidados em base real. A eficiência reflete o custo logístico direto sobre o faturamento líquido faturado."}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto bg-black text-white px-12 py-4 text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98]"
                    >
                        Concluir e fechar
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Componente auxiliar para manter o código limpo
function SummaryCard({ label, value, visible = true, highlight = "text-white/90" }: { label: string, value: string, visible?: boolean, highlight?: string }) {
    if (!visible) return null;
    return (
        <div className="bg-white/10 p-5 rounded-sm border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{label}</span>
            <p className={`text-2xl font-semibold mt-2 ${highlight}`}>{value}</p>
        </div>
    );
}