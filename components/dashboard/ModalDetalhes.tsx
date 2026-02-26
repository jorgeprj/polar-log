'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCarregamentoDetails } from "@/hooks/useCarregamentoDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Database, Truck, Box, Info, AlertCircle, Receipt, LayoutList } from "lucide-react";
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
            const qtdPdvs = cargasDoEstado.length;

            return {
                estado: uf,
                modal: perfil || "N/A",
                fat_bruto: fatTotal,
                cubagem_total: cubagemTotal,
                qtd_pdvs: qtdPdvs,
                drop_size: qtdPdvs > 0 ? cubagemTotal / qtdPdvs : 0
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
                excesso: fatorCapacidadeGeral < 1,
                rs_m3: item.cubagem_total > 0 ? (item.fat_bruto / item.cubagem_total) : 0
            };
        });
    }, [estadosAtendidos, cargasPendentes, statsPrevistas, perfil, capacidadeVeiculo]);

    const dataRealProcessada = useMemo(() => {
        return (dataReal || []).map((item: any) => ({
            ...item,
            rs_m3: item.rs_m3 || (item.cubagem_total > 0 ? (item.fat_liq_total / item.cubagem_total) : 0),
            drop_size: item.drop_size || (item.qtd_pdvs > 0 ? item.cubagem_total / item.qtd_pdvs : 0)
        }));
    }, [dataReal]);

    const displayData = isPlanejamento ? dataPrevista : dataRealProcessada;

    const totais = useMemo(() => {
        const cubagem = displayData.reduce((acc: number, curr: any) => acc + (curr.cubagem_total || 0), 0);
        const faturamentoTotalBruto = displayData.reduce((acc: number, curr: any) => acc + (curr.fat_liq_total || 0), 0);
        const totalPdvs = displayData.reduce((acc: number, curr: any) => acc + (curr.qtd_pdvs || 0), 0);
        
        const ocupacaoPercent = capacidadeVeiculo > 0 ? (cubagem / capacidadeVeiculo) * 100 : 0;
        const dropSizeMedio = totalPdvs > 0 ? cubagem / totalPdvs : 0;

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

        return { cubagem, percentualOcupacao: ocupacaoPercent, percentualCustoFat, faturamentoExibicao, custoConsiderado, dropSizeMedio };
    }, [displayData, isPlanejamento, statsPrevistas, capacidadeVeiculo]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1100px] p-0 border-none bg-[#F6F6F6] shadow-2xl overflow-hidden font-sans max-h-[90vh] overflow-y-auto custom-scrollbar">

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

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SummaryCard
                            label={isPlanejamento ? "Custo Projetado" : "Custo Realizado"}
                            value={fCurrency(totais.custoConsiderado)}
                            icon={<Receipt size={14} className="opacity-40" />}
                        />
                        <SummaryCard
                            label="Faturamento Total"
                            value={fCurrency(totais.faturamentoExibicao)}
                            highlight="text-white"
                        />
                        <SummaryCard
                            label="Eficiência (C/F)"
                            value={`${totais.percentualCustoFat.toFixed(1)}%`}
                        />
                        <div className="bg-white/10 p-5 rounded-sm border border-white/10 flex flex-col justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Ocupação Total</span>
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
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-center">Carga m³</th>
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-center">R$ / m³</th>
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-center">Drop-size (m³)</th>
                                        <th className="px-4 py-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b text-right">Eficiência</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {displayData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
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
                                                <td className="px-4 py-5 text-center font-medium text-black">
                                                    {item.cubagem_total.toFixed(2)}m³
                                                </td>
                                                <td className="px-4 py-5 text-center font-bold text-zinc-700">
                                                    {fCurrency(item.rs_m3)}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-bold text-zinc-700">
                                                            {item.drop_size.toFixed(2)}
                                                        </span>
                                                        <span className="text-[9px] uppercase text-zinc-400 font-bold">m³/pdv</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    <span className={`text-sm font-semibold ${isPlanejamento && item.excesso ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {fPercent(item.custo_liq_vs_fat_liq)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="p-8 bg-white border-t flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-start gap-3 text-zinc-500">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs leading-relaxed max-w-md">
                                {isPlanejamento
                                    ? "Projeção baseada na capacidade física. O drop-size indica o volume médio estimado por ponto de entrega da carteira."
                                    : "Valores consolidados em base real. O drop-size reflete a densidade média efetiva por parada realizada."}
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

function SummaryCard({ label, value, visible = true, highlight = "text-white/90", icon }: { label: string, value: string, visible?: boolean, highlight?: string, icon?: React.ReactNode }) {
    if (!visible) return null;
    return (
        <div className="bg-white/10 p-5 rounded-sm border border-white/10 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{label}</span>
                {icon}
            </div>
            <p className={`text-2xl font-semibold mt-2 ${highlight}`}>{value}</p>
        </div>
    );
}